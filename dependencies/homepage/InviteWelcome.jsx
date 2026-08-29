import { useEffect, useState } from 'react'
import { supabase } from '../academy/supabaseClient'
import './invite-welcome.css'

function normalizedHandle(value) {
  return String(value || '').trim().replace(/^@+/, '')
}

function InviteWelcome({ username, inviteToken, onClaim, onEnterAgora }) {
  const handle = normalizedHandle(username)
  const [invite, setInvite] = useState(null)
  const [status, setStatus] = useState(handle && inviteToken ? 'checking' : 'missing')
  const [credentialKind, setCredentialKind] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!handle || !inviteToken || !supabase) {
      setStatus(handle && inviteToken ? 'error' : 'missing')
      if (handle && inviteToken && !supabase) setNotice('The invitation service is not configured.')
      return undefined
    }

    let cancelled = false
    setStatus('checking')
    setNotice('')

    supabase.rpc('inspect_agora_invite', {
      p_username: handle,
      p_invite_token: inviteToken,
    }).then(({ data, error }) => {
      if (cancelled) return
      const row = Array.isArray(data) ? data[0] : data

      if (error || !row) {
        setStatus('error')
        setNotice(error?.message || 'This invitation is not valid.')
        return
      }

      setInvite(row)
      setStatus(row.invite_state)
      if (row.invite_state === 'claimed') setNotice('This invitation has already been claimed. Log in through Agora with the credential selected during setup.')
      if (row.invite_state === 'expired') setNotice('This invitation has expired. Ask an administrator for a new link.')
      if (row.invite_state === 'revoked') setNotice('This invitation has been revoked. Ask an administrator for a new link.')
    })

    return () => { cancelled = true }
  }, [handle, inviteToken])

  const choosePassword = (value) => {
    setCredentialKind(value ? 'password' : '')
    setPassword(value)
    if (value) setPin('')
  }

  const choosePin = (value) => {
    const nextPin = value.replace(/\D/g, '').slice(0, 6)
    setCredentialKind(nextPin ? 'pin' : '')
    setPin(nextPin)
    if (nextPin) setPassword('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (status !== 'ready' || busy) return

    const secret = credentialKind === 'password' ? password : pin
    if (credentialKind === 'password' && (password.length < 12 || password.length > 128)) {
      setNotice('Choose a password containing 12-128 characters.')
      return
    }
    if (credentialKind === 'pin' && !/^\d{6}$/.test(pin)) {
      setNotice('Choose a PIN containing exactly 6 digits.')
      return
    }
    if (!credentialKind || !secret) {
      setNotice('Select either a password or PIN.')
      return
    }

    setBusy(true)
    setNotice('')
    try {
      await onClaim({
        username: handle,
        inviteToken,
        credentialKind,
        secret,
        profileNumber: invite?.profile_number,
      })
    } catch (error) {
      setNotice(error?.message || 'The invitation could not be claimed.')
    } finally {
      setBusy(false)
    }
  }

  const displayHandle = invite?.display_name || (handle ? `@${handle}` : '')
  const canSubmit = status === 'ready'
    && !busy
    && ((credentialKind === 'password' && password.length >= 12) || (credentialKind === 'pin' && pin.length === 6))

  return (
    <section className="invite-welcome" aria-labelledby="invite-welcome-title">
      <div className="invite-welcome__copy">
        <p>Welcome</p>
        <h1 id="invite-welcome-title">{displayHandle || 'Polaris'}</h1>
        {status === 'checking' && <p className="invite-welcome__status">Opening your invitation…</p>}

        {status === 'ready' && (
          <form className="invite-welcome__form" onSubmit={submit}>
            <p className="invite-welcome__instruction">Please select either a password</p>
            <label className={credentialKind === 'password' ? 'is-selected' : ''}>
              <span>Password</span>
              <span className="invite-welcome__password">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => choosePassword(event.target.value)}
                  autoComplete="new-password"
                  minLength="12"
                  maxLength="128"
                  placeholder="12 characters minimum"
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? 'Hide' : 'Show'}</button>
              </span>
            </label>

            <span className="invite-welcome__or">or</span>

            <label className={credentialKind === 'pin' ? 'is-selected' : ''}>
              <span>PIN</span>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(event) => choosePin(event.target.value)}
                autoComplete="new-password"
                maxLength="6"
                placeholder="6 digits"
              />
            </label>

            {notice && <p className="invite-welcome__notice" role="alert">{notice}</p>}
            <button className="invite-welcome__submit" type="submit" disabled={!canSubmit}>
              {busy ? 'Creating your account…' : 'Enter Polaris'}
            </button>
            <p className="invite-welcome__privacy">Your selection is encrypted before it is stored. This one-time link cannot be used again after setup.</p>
          </form>
        )}

        {status !== 'ready' && status !== 'checking' && (
          <div className="invite-welcome__message" role={status === 'error' ? 'alert' : 'status'}>
            <p>{notice || 'Open the personal invitation link sent to you to create your account.'}</p>
            {(status === 'claimed' || status === 'missing') && <button type="button" onClick={onEnterAgora}>Enter Agora</button>}
          </div>
        )}
      </div>
    </section>
  )
}

export default InviteWelcome
