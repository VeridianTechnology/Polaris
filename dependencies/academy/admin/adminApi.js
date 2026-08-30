import { supabase } from '../supabaseClient'

export async function callAdminApi(action, payload = {}, sessionToken = '') {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data, error } = await supabase.functions.invoke('academy-admin', {
    body: { action, ...payload },
    headers: sessionToken ? { 'x-agora-session': sessionToken } : undefined,
  })

  if (error) {
    let message = error.message || 'The admin service could not be reached.'

    try {
      const details = await error.context?.json()
      message = details?.error || message
    } catch {
      // The function did not return a JSON error body.
    }

    throw new Error(message)
  }

  if (!data?.ok) throw new Error(data?.error || 'The admin request failed.')
  return data
}
