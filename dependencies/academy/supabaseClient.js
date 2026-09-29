import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

export function agoraReadErrorMessage(error) {
  if (/failed to fetch/i.test(error?.message || '')) {
    return 'Agora could not reach its database. Check that the Supabase project is running and its URL is correct.'
  }
  if (error?.code === 'PGRST202' || error?.code === '42883') {
    return `${error.message} Check that the Agora database migrations have been applied.`
  }
  return error?.message || 'Agora could not load this data.'
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null
