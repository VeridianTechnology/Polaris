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
  const [lockoutsResult, profileCountResult, managedCountResult] = await Promise.all([
    admin
      .from('agora_admin_ip_access')
      .select('ip_address, locked_at, last_attempt_at')
      .eq('is_enabled', false)
      .order('locked_at', { ascending: false }),
    admin
      .from('agora_public_profiles')
      .select('profile_number', { count: 'exact', head: true }),
    admin
      .from('agora_managed_users')
      .select('id', { count: 'exact', head: true }),
  ])

  if (lockoutsResult.error) throw lockoutsResult.error
  if (profileCountResult.error) throw profileCountResult.error
  if (managedCountResult.error) throw managedCountResult.error

  return {
    lockedIps: lockoutsResult.data || [],
    userCount: profileCountResult.count || 0,
    managedUserCount: managedCountResult.count || 0,
  }
}

async function listUsers(body: Record<string, unknown>, admin: AdminClient) {
  const requestedPage = Number(body.page || 1)
  const requestedPageSize = Number(body.pageSize || 25)
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.trunc(requestedPage)) : 1
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(100, Math.max(10, Math.trunc(requestedPageSize)))
    : 25
  const search = String(body.search || '').trim().slice(0, 100)

  const { data, error } = await admin.rpc('admin_search_agora_users', {
    p_search: search,
    p_page: page,
    p_page_size: pageSize,
  })
  if (error) throw error

  const rows = (data || []) as Array<Record<string, unknown>>
  const totalCount = Number(rows[0]?.total_count || 0)
  const users = rows.map(({ total_count: _totalCount, ...user }) => user)

  return { users, totalCount, page, pageSize, search }
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

    if (!/^[A-Za-z0-9_]{2,32}$/.test(handle)) {
      results.push({ handle, created: false, error: 'Invalid Twitter handle.' })
      continue
    }

    const invitationResult = await admin.rpc('admin_create_agora_invite', { p_handle: handle })
    const invitation = Array.isArray(invitationResult.data)
      ? invitationResult.data[0]
      : invitationResult.data

    if (invitationResult.error || !invitation?.invite_token) {
      results.push({
        handle,
        created: false,
        error: invitationResult.error?.message || 'Invitation was not created.',
      })
      continue
    }

    results.push({
      handle: invitation.twitter_handle,
      profileNumber: invitation.profile_number,
      inviteToken: invitation.invite_token,
      expiresAt: invitation.expires_at,
      created: true,
    })
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

  const userResult = await admin
    .from('agora_managed_users')
    .select('profile_number')
    .eq('id', userId)
    .maybeSingle()
  if (userResult.error || !userResult.data) {
    throw userResult.error || new ApiError('Managed user was not found.', 404)
  }

  const { error } = await admin
    .from('agora_managed_users')
    .update({ status })
    .eq('id', userId)
  if (error) throw error

  const profileNumber = userResult.data.profile_number
  if (status === 'inactive' && profileNumber) {
    const revokedAt = new Date().toISOString()
    const [sessionsResult, invitesResult] = await Promise.all([
      admin
        .from('agora_user_sessions')
        .update({ revoked_at: revokedAt })
        .eq('profile_number', profileNumber)
        .is('revoked_at', null),
      admin
        .from('agora_user_invites')
        .update({ revoked_at: revokedAt })
        .eq('profile_number', profileNumber)
        .is('claimed_at', null),
    ])
    if (sessionsResult.error) throw sessionsResult.error
    if (invitesResult.error) throw invitesResult.error
  }
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
      if (action === 'list-users') return json({ ok: true, ...(await listUsers(body, admin)) })
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
