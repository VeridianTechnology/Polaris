// Setup type definitions for built-in Supabase Runtime APIs.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase, type SupabaseContext } from 'jsr:@supabase/server@^1'

type AdminClient = SupabaseContext<any>['supabaseAdmin']

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-agora-session',
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

async function requireAdministrator(request: Request, admin: AdminClient) {
  const sessionToken = request.headers.get('x-agora-session') || ''
  if (!sessionToken) throw new ApiError('Log in with an administrator account.', 401)

  const { data, error } = await admin.rpc('get_agora_user_session', {
    p_session_token: sessionToken,
  })
  const session = Array.isArray(data) ? data[0] : data

  if (error || !session) throw new ApiError('Your Agora session has expired.', 401)
  if (!session.is_admin) throw new ApiError('Administrator access is required.', 403)
  return Number(session.profile_number)
}

async function listSubmissions(body: Record<string, unknown>, admin: AdminClient) {
  const filter = String(body.filter || 'pending')
  let query = admin
    .from('academy_story_submissions')
    .select('*')
    .order(filter === 'pending' ? 'created_at' : 'reviewed_at', { ascending: false })
    .limit(200)

  query = filter === 'reviewed'
    ? query.in('status', ['approved', 'rejected'])
    : query.eq('status', 'pending')

  const [submissionsResult, pendingCountResult] = await Promise.all([
    query,
    admin
      .from('academy_story_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  if (submissionsResult.error) throw submissionsResult.error
  if (pendingCountResult.error) throw pendingCountResult.error

  return {
    submissions: submissionsResult.data || [],
    pendingCount: pendingCountResult.count || 0,
  }
}

async function reviewSubmission(
  body: Record<string, unknown>,
  reviewerProfileNumber: number,
  admin: AdminClient,
) {
  const submissionId = String(body.submissionId || '')
  const status = String(body.status || '')
  if (!/^[0-9a-f-]{36}$/i.test(submissionId)) throw new ApiError('Invalid submission identifier.')
  if (!['approved', 'rejected'].includes(status)) throw new ApiError('Select approved or rejected.')

  const { data, error } = await admin
    .from('academy_story_submissions')
    .update({
      status,
      reviewer_profile_number: reviewerProfileNumber,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new ApiError('This submission was already reviewed or does not exist.', 409)
  return { submission: data }
}

console.info('Academy story moderation started')

export default {
  fetch: withSupabase({ auth: 'publishable', cors: { headers: corsHeaders } }, async (request, ctx) => {
    if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405)

    try {
      const admin = ctx.supabaseAdmin
      const body = await request.json() as Record<string, unknown>
      const action = String(body.action || '')
      const reviewerProfileNumber = await requireAdministrator(request, admin)

      if (action === 'list-submissions') {
        return json({ ok: true, ...(await listSubmissions(body, admin)) })
      }
      if (action === 'review-submission') {
        return json({ ok: true, ...(await reviewSubmission(body, reviewerProfileNumber, admin)) })
      }

      throw new ApiError('Unknown admin action.', 404)
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500
      const message = error instanceof Error ? error.message : 'Unexpected moderation service error.'
      return json({ ok: false, error: message }, status)
    }
  }),
}
