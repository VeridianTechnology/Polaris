// Setup type definitions for built-in Supabase Runtime APIs.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase, type SupabaseContext } from 'jsr:@supabase/server@^1'

type AdminClient = SupabaseContext<any>['supabaseAdmin']

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-session',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

class ApiError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status })
}

function getRequestIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const candidate = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || forwarded?.split(',').at(-1)?.trim()
    || ''

  return candidate.startsWith('::ffff:') ? candidate.slice(7) : candidate
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function secretsMatch(received: string, expected: string) {
  const [receivedHash, expectedHash] = await Promise.all([sha256(received), sha256(expected)])
  let difference = receivedHash.length ^ expectedHash.length

  for (let index = 0; index < Math.max(receivedHash.length, expectedHash.length); index += 1) {
    difference |= (receivedHash.charCodeAt(index) || 0) ^ (expectedHash.charCodeAt(index) || 0)
  }

  return difference === 0
}

function createSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

async function dashboard(admin: AdminClient) {
  const [usersResult, lockoutsResult] = await Promise.all([
    admin
      .from('agora_managed_users')
      .select('id, auth_user_id, twitter_handle, twitter_url, status, created_at')
      .order('created_at', { ascending: false }),
    admin
      .from('agora_admin_ip_access')
      .select('ip_address, locked_at, last_attempt_at')
      .eq('is_enabled', false)
      .order('locked_at', { ascending: false }),
  ])

  if (usersResult.error) throw usersResult.error
  if (lockoutsResult.error) throw lockoutsResult.error

  return {
    users: usersResult.data || [],
    lockedIps: lockoutsResult.data || [],
  }
}

async function requireSession(request: Request, admin: AdminClient, ipAddress: string) {
  const sessionToken = request.headers.get('x-admin-session') || ''
  if (!sessionToken) throw new ApiError('Administrator session required.', 401)

  const tokenHash = await sha256(sessionToken)
  const { data, error } = await admin
    .from('agora_admin_sessions')
    .select('token_hash')
    .eq('token_hash', tokenHash)
    .eq('ip_address', ipAddress)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error || !data) throw new ApiError('Administrator session expired.', 401)
}

async function login(body: Record<string, unknown>, admin: AdminClient, ipAddress: string) {
  const expectedPin = Deno.env.get('ACADEMY_ADMIN_PIN') || ''
  const expectedPassword = Deno.env.get('ACADEMY_ADMIN_PASSWORD') || ''
  if (!expectedPin || !expectedPassword) throw new ApiError('Administrator secrets are not configured.', 503)

  const [pinMatches, passwordMatches] = await Promise.all([
    secretsMatch(String(body.pin || ''), expectedPin),
    secretsMatch(String(body.password || ''), expectedPassword),
  ])
  const credentialsMatch = pinMatches && passwordMatches
  const { data, error } = await admin.rpc('record_agora_admin_attempt', {
    p_ip_address: ipAddress,
    p_succeeded: credentialsMatch,
  })

  if (error) throw error
  const attempt = data?.[0]

  if (!credentialsMatch || !attempt?.allowed) {
    if (attempt?.locked) {
      throw new ApiError('This IP address is locked. Re-enable it in the database.', 423)
    }
    throw new ApiError(`Invalid credentials. ${attempt?.attempts_remaining ?? 0} attempts remain.`, 401)
  }

  const sessionToken = createSessionToken()
  const tokenHash = await sha256(sessionToken)
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  await admin.from('agora_admin_sessions').delete().eq('ip_address', ipAddress)
  const sessionResult = await admin.from('agora_admin_sessions').insert({
    token_hash: tokenHash,
    ip_address: ipAddress,
    expires_at: expiresAt,
  })
  if (sessionResult.error) throw sessionResult.error

  return { sessionToken, ...(await dashboard(admin)) }
}

async function createUsers(body: Record<string, unknown>, admin: AdminClient) {
  const requestedUsers = Array.isArray(body.users) ? body.users : []
  if (!requestedUsers.length || requestedUsers.length > 15) {
    throw new ApiError('Create between 1 and 15 users at a time.')
  }

  const results: Array<Record<string, unknown>> = []

  for (const requested of requestedUsers) {
    const source = requested as Record<string, unknown>
    const handle = String(source.handle || '').trim().replace(/^@+/, '')
    const password = String(source.password || '')

    if (!/^[A-Za-z0-9_]{1,32}$/.test(handle)) {
      results.push({ handle, created: false, error: 'Invalid Twitter handle.' })
      continue
    }
    if (password.length < 12 || password.length > 128) {
      results.push({ handle, created: false, error: 'Password must contain 12–128 characters.' })
      continue
    }

    const syntheticEmail = `${handle.toLowerCase()}.${crypto.randomUUID().slice(0, 8)}@agora.invalid`
    const authResult = await admin.auth.admin.createUser({
      email: syntheticEmail,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: `@${handle}`,
        twitter_handle: handle,
      },
    })

    if (authResult.error || !authResult.data.user) {
      results.push({ handle, created: false, error: authResult.error?.message || 'Auth user was not created.' })
      continue
    }

    const managedResult = await admin.from('agora_managed_users').insert({
      auth_user_id: authResult.data.user.id,
      twitter_handle: handle,
      twitter_url: `https://x.com/${handle}`,
    })

    if (managedResult.error) {
      await admin.auth.admin.deleteUser(authResult.data.user.id)
      results.push({ handle, created: false, error: managedResult.error.message })
      continue
    }

    results.push({ handle, created: true })
  }

  return {
    results,
    createdCount: results.filter((result) => result.created).length,
  }
}

async function setUserStatus(body: Record<string, unknown>, admin: AdminClient) {
  const userId = Number(body.userId)
  const status = String(body.status || '')
  if (!Number.isSafeInteger(userId) || !['active', 'inactive'].includes(status)) {
    throw new ApiError('Invalid user status request.')
  }

  const { error } = await admin
    .from('agora_managed_users')
    .update({ status })
    .eq('id', userId)
  if (error) throw error
}

async function unlockIp(body: Record<string, unknown>, admin: AdminClient) {
  const ipAddress = String(body.ipAddress || '')
  if (!ipAddress) throw new ApiError('IP address is required.')

  const { error } = await admin
    .from('agora_admin_ip_access')
    .update({
      is_enabled: true,
      failed_attempts: 0,
      window_started_at: null,
      locked_at: null,
    })
    .eq('ip_address', ipAddress)
  if (error) throw error
}

console.info('Agora administration started')

export default {
  fetch: withSupabase({ auth: 'publishable', cors: { headers: corsHeaders } }, async (request, ctx) => {
    if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405)

    try {
      const ipAddress = getRequestIp(request)
      if (!ipAddress) throw new ApiError('The request IP could not be determined.', 400)

      // Supabase creates this privileged server-only client from the hosted
      // secret key. It bypasses RLS and must never be sent to the browser.
      const admin = ctx.supabaseAdmin
      const body = await request.json() as Record<string, unknown>
      const action = String(body.action || '')

      if (action === 'login') return json({ ok: true, ...(await login(body, admin, ipAddress)) })

      await requireSession(request, admin, ipAddress)

      if (action === 'dashboard') return json({ ok: true, ...(await dashboard(admin)) })
      if (action === 'create-users') return json({ ok: true, ...(await createUsers(body, admin)) })
      if (action === 'set-user-status') {
        await setUserStatus(body, admin)
        return json({ ok: true })
      }
      if (action === 'unlock-ip') {
        await unlockIp(body, admin)
        return json({ ok: true })
      }

      throw new ApiError('Unknown admin action.', 404)
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500
      const message = error instanceof Error ? error.message : 'Unexpected admin service error.'
      return json({ ok: false, error: message }, status)
    }
  }),
}
