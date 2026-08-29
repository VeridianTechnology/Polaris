import { supabase } from '../supabaseClient'

const SESSION_KEY = 'polaris-academy-admin-session'

export function readAdminSession() {
  return sessionStorage.getItem(SESSION_KEY) || ''
}

export function saveAdminSession(token) {
  if (token) sessionStorage.setItem(SESSION_KEY, token)
  else sessionStorage.removeItem(SESSION_KEY)
}

export async function callAdminApi(action, payload = {}, sessionToken = readAdminSession()) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data, error } = await supabase.functions.invoke('academy-admin', {
    body: { action, ...payload },
    headers: sessionToken ? { 'x-admin-session': sessionToken } : undefined,
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
