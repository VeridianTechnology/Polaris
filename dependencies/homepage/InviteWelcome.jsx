import { useEffect, useState } from 'react'
import { supabase } from '../academy/supabaseClient'
import './invite-welcome.css'

function normalizedHandle(value) {
  return String(value || '').trim().replace(/^@+/, '')
}

function InviteWelcome({ username, inviteToken, onClaim, onEnterAgora, preview = false }) {
  const handle = normalizedHandle(username)
  const [invite, setInvite] = useState(preview ? { display_name: `@${handle || 'New'}` } : null)
  const [status, setStatus] = useState(preview ? 'ready' : (handle && inviteToken ? 'checking' : 'missing'))
  const [credentialKind, setCredentialKind] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (preview) {
      setInvite({ display_name: `@${handle || 'New'}` })
      setStatus('ready')
      setNotice('')
      return undefined
    }

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
  }, [handle, inviteToken, preview])

  const choosePassword = (value) => {
    setCredentialKind(value ? 'password' : '')
    setPassword(value)
    if (value) setPin('')
  }

  const choosePin = (value) => {
    const nextPin = value.replace(/\D/g, '').slice(0, 4)
    setCredentialKind(nextPin ? 'pin' : '')
    setPin(nextPin)
    if (nextPin) setPassword('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (status !== 'ready' || busy) return

    const secret = credentialKind === 'password' ? password : pin
    if (credentialKind === 'password' && (password.length < 8 || password.length > 128 || !/[^A-Za-z0-9\s]/.test(password))) {
      setNotice('Choose an 8-128 character password containing at least one symbol.')
      return
    }
    if (credentialKind === 'pin' && !/^\d{4}$/.test(pin)) {
      setNotice('Choose a PIN containing exactly 4 digits.')
      return
    }
    if (!credentialKind || !secret) {
      setNotice('Select either a password or PIN.')
      return
    }

    if (preview) {
      setNotice('Preview only. A real personalized invitation link will create the account here.')
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
    && ((credentialKind === 'password' && password.length >= 8 && /[^A-Za-z0-9\s]/.test(password)) || (credentialKind === 'pin' && pin.length === 4))

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
                  minLength="8"
                  maxLength="128"
                  placeholder="8+ characters · 1 symbol"
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
                maxLength="4"
                placeholder="4 digits"
              />
            </label>

            {notice && <p className="invite-welcome__notice" role="alert">{notice}</p>}
            <button className="invite-welcome__submit" type="submit" disabled={!canSubmit}>
              {busy ? 'Creating your account…' : 'Enter Polaris'}
            </button>
            <p className="invite-welcome__privacy">Polaris is an invite-only, based boys club. We're here to get rich, interact with each other, educate each other and elevate each other. Your account and privacy is always yours, we're anonymous first, built around privacy and identity. If you want to sell the account—you can. If you don't log in within 30 days of receiving an invite, your code will expire and be deleted; merely do not interact if you do not want to register.</p>
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
