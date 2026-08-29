import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../supabaseClient'

const AGORA_SESSION_KEY = 'polaris-agora-user-session'

function normalizeSession(row) {
  if (!row) return null
  return {
    session_token: row.session_token,
    profile_number: Number(row.profile_number),
    username: row.username,
    display_name: row.display_name,
    avatar_index: Number(row.avatar_index || 0),
    is_admin: Boolean(row.is_admin),
    expires_at: row.expires_at,
  }
}

function readStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(AGORA_SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

function storeSession(session) {
  if (session) localStorage.setItem(AGORA_SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(AGORA_SESSION_KEY)
}

export function useAgoraAuth() {
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState(isSupabaseConfigured ? 'loading' : 'unconfigured')

  useEffect(() => {
    if (!supabase) return undefined
    let cancelled = false
    const stored = readStoredSession()

    if (!stored?.session_token) {
      setStatus('anonymous')
      return undefined
    }

    supabase.rpc('get_agora_user_session', { p_session_token: stored.session_token }).then(({ data, error }) => {
      if (cancelled) return
      const row = Array.isArray(data) ? data[0] : data
      if (error || !row) {
        storeSession(null)
        setSession(null)
        setStatus('anonymous')
        return
      }

      const restored = normalizeSession({ ...row, session_token: stored.session_token })
      storeSession(restored)
      setSession(restored)
      setStatus('authenticated')
    })

    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (username, password) => {
    if (!supabase) throw new Error('Supabase is not configured for login.')
    const { data, error } = await supabase.rpc('login_agora_user', {
      p_username: username.trim(),
      p_password: password,
    })
    if (error) throw error

    const row = Array.isArray(data) ? data[0] : data
    if (!row?.session_token) throw new Error('Login did not return a valid session.')
    const nextSession = normalizeSession(row)
    storeSession(nextSession)
    setSession(nextSession)
    setStatus('authenticated')
    return nextSession
  }, [])

  const claimInvite = useCallback(async ({ username, inviteToken, credentialKind, secret }) => {
    if (!supabase) throw new Error('Supabase is not configured for invitations.')
    const { data, error } = await supabase.rpc('claim_agora_invite', {
      p_username: username.trim().replace(/^@+/, ''),
      p_invite_token: inviteToken,
      p_credential_kind: credentialKind,
      p_secret: secret,
    })
    if (error) throw error

    const row = Array.isArray(data) ? data[0] : data
    if (!row?.session_token) throw new Error('The invitation did not return a valid session.')
    const nextSession = normalizeSession(row)
    storeSession(nextSession)
    setSession(nextSession)
    setStatus('authenticated')
    return nextSession
  }, [])

  const logout = useCallback(async () => {
    const sessionToken = session?.session_token
    storeSession(null)
    setSession(null)
    setStatus(isSupabaseConfigured ? 'anonymous' : 'unconfigured')
    if (supabase && sessionToken) {
      await supabase.rpc('logout_agora_user', { p_session_token: sessionToken })
    }
  }, [session])

  return { session, status, login, claimInvite, logout }
}
