import { useEffect, useRef, useState } from 'react'
import './agora-auth.css'

export function AgoraAuthArtworkButton({ mode = 'login', className = '', ...props }) {
  const label = mode === 'logout' ? 'Log out' : 'Log in'
  return (
    <button
      className={`agora-auth-artwork-button agora-auth-artwork-button--${mode}${className ? ` ${className}` : ''}`}
      type="button"
      aria-label={label}
      {...props}
    >
      <span className="visually-hidden">{label}</span>
    </button>
  )
}

function AgoraLoginDialog({ open, onClose, onLogin, onRegister }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [mode, setMode] = useState('login')
  const [credentialMode, setCredentialMode] = useState('password')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const usernameRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    const focusFrame = requestAnimationFrame(() => usernameRef.current?.focus())
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !busy) onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open, busy, onClose])

  if (!open) return null

  const toggleCredentialMode = () => {
    setCredentialMode((current) => current === 'pin' ? 'password' : 'pin')
    setPassword('')
    setConfirmation('')
    setShowPassword(false)
    setNotice('')
  }

  const toggleMode = () => {
    setMode((current) => current === 'login' ? 'register' : 'login')
    setPassword('')
    setConfirmation('')
    setShowPassword(false)
    setNotice('')
  }

  const normalizedUsername = username.trim().replace(/^@+/, '')
  const validUsername = /^[A-Za-z0-9_]{3,32}$/.test(normalizedUsername)
  const validSecret = credentialMode === 'pin'
    ? (mode === 'register' ? /^\d{6}$/.test(password) : /^\d{4}(?:\d{2})?$/.test(password))
    : mode === 'login' ? Boolean(password) : password.length >= 12
  const canSubmit = validUsername
    && validSecret
    && (mode === 'login' || confirmation === password)
    && !busy

  const submit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    setNotice('')
    try {
      if (mode === 'register') await onRegister(username, credentialMode, password)
      else await onLogin(username, password)
      setPassword('')
      setConfirmation('')
      onClose()
    } catch (error) {
      setNotice(error?.message || (mode === 'register' ? 'Registration failed.' : 'Login failed.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="agora-login-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose()
    }}>
      <section className="agora-login-dialog" role="dialog" aria-modal="true" aria-labelledby="agora-login-title">
        <button className="agora-login-dialog__close" type="button" onClick={onClose} disabled={busy} aria-label="Close account dialog">×</button>
        <p className="agora-login-dialog__eyebrow">Open membership</p>
        <h2 id="agora-login-title">{mode === 'register' ? 'Create account' : 'Log in'}</h2>
        <form onSubmit={submit}>
          <div className="agora-login-dialog__field">
            <label htmlFor="agora-login-username">Username</label>
            <input id="agora-login-username" ref={usernameRef} type="text" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" maxLength="64" placeholder="username" required />
          </div>
          <div className="agora-login-dialog__field">
            <div className="agora-login-dialog__credential-heading">
              <label htmlFor="agora-login-password">{credentialMode === 'pin' ? (mode === 'register' ? 'Six-digit PIN' : 'PIN') : 'Password'}</label>
              <button
                className={`agora-login-dialog__pin-toggle${credentialMode === 'pin' ? ' is-selected' : ''}`}
                type="button"
                onClick={toggleCredentialMode}
                aria-label={credentialMode === 'pin' ? 'Use password instead' : mode === 'register' ? 'Use six-digit PIN' : 'Use PIN'}
                aria-pressed={credentialMode === 'pin'}
                title={credentialMode === 'pin' ? 'Use password instead' : 'Use PIN'}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="3" width="16" height="18" rx="2.5" />
                  <circle cx="9" cy="9" r="1" />
                  <circle cx="15" cy="9" r="1" />
                  <circle cx="9" cy="15" r="1" />
                  <circle cx="15" cy="15" r="1" />
                </svg>
              </button>
            </div>
            <div className="agora-login-dialog__password-field">
              <input
                id="agora-login-password"
                type={credentialMode === 'password' && showPassword ? 'text' : 'password'}
                inputMode={credentialMode === 'pin' ? 'numeric' : undefined}
                value={password}
                onChange={(event) => setPassword(credentialMode === 'pin' ? event.target.value.replace(/\D/g, '').slice(0, 6) : event.target.value)}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                maxLength={credentialMode === 'pin' ? 6 : 128}
                minLength={credentialMode === 'password' && mode === 'register' ? 12 : undefined}
                placeholder={credentialMode === 'pin' ? (mode === 'register' ? '123456' : 'PIN') : mode === 'register' ? '12 characters minimum' : 'password'}
                required
              />
              {credentialMode === 'password' && (
                <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                    <circle cx="12" cy="12" r="2.8" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {mode === 'register' && (
            <div className="agora-login-dialog__field">
              <label htmlFor="agora-login-confirmation">Confirm {credentialMode === 'pin' ? 'PIN' : 'password'}</label>
              <input
                id="agora-login-confirmation"
                type={credentialMode === 'password' && showPassword ? 'text' : 'password'}
                inputMode={credentialMode === 'pin' ? 'numeric' : undefined}
                value={confirmation}
                onChange={(event) => setConfirmation(credentialMode === 'pin' ? event.target.value.replace(/\D/g, '').slice(0, 6) : event.target.value)}
                autoComplete="new-password"
                maxLength={credentialMode === 'pin' ? 6 : 128}
                required
              />
            </div>
          )}
          {notice && <p className="agora-login-dialog__notice" role="alert">{notice}</p>}
          <button className="agora-login-dialog__submit" type="submit" disabled={!canSubmit}>
            {busy ? (mode === 'register' ? 'Creating account' : 'Logging in') : mode === 'register' ? 'Create account' : 'Log in'}
          </button>
          <button className="agora-login-dialog__mode-switch" type="button" onClick={toggleMode} disabled={busy}>
            {mode === 'register' ? 'Already have an account? Log in' : 'New to Polaris? Create an account'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default AgoraLoginDialog

export function AgoraAdminBadge({ large = false, className = '' }) {
  return (
    <span
      className={`agora-admin-badge${large ? ' agora-admin-badge--large' : ''}${className ? ` ${className}` : ''}`}
      title="Administrator"
      aria-label="Administrator"
    />
  )
}
