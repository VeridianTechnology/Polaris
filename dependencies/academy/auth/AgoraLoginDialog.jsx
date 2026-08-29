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

function AgoraLoginDialog({ open, onClose, onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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
    setShowPassword(false)
    setNotice('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!username.trim() || !password || (credentialMode === 'pin' && password.length !== 4) || busy) return
    setBusy(true)
    setNotice('')
    try {
      await onLogin(username, password)
      setPassword('')
      onClose()
    } catch (error) {
      setNotice(error?.message || 'Login failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="agora-login-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose()
    }}>
      <section className="agora-login-dialog" role="dialog" aria-modal="true" aria-labelledby="agora-login-title">
        <button className="agora-login-dialog__close" type="button" onClick={onClose} disabled={busy} aria-label="Close login">×</button>
        <h2 id="agora-login-title">Log in</h2>
        <form onSubmit={submit}>
          <div className="agora-login-dialog__field">
            <label htmlFor="agora-login-username">Username</label>
            <input id="agora-login-username" ref={usernameRef} type="text" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" maxLength="64" placeholder="username" required />
          </div>
          <div className="agora-login-dialog__field">
            <div className="agora-login-dialog__credential-heading">
              <label htmlFor="agora-login-password">{credentialMode === 'pin' ? 'PIN' : 'Password'}</label>
              <button
                className={`agora-login-dialog__pin-toggle${credentialMode === 'pin' ? ' is-selected' : ''}`}
                type="button"
                onClick={toggleCredentialMode}
                aria-label={credentialMode === 'pin' ? 'Use password instead' : 'Use four-digit PIN'}
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
                onChange={(event) => setPassword(credentialMode === 'pin' ? event.target.value.replace(/\D/g, '').slice(0, 4) : event.target.value)}
                autoComplete="current-password"
                maxLength={credentialMode === 'pin' ? 4 : 200}
                placeholder={credentialMode === 'pin' ? '1234' : 'password'}
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
          {notice && <p className="agora-login-dialog__notice" role="alert">{notice}</p>}
          <button className="agora-login-dialog__submit" type="submit" disabled={busy || !username.trim() || !password || (credentialMode === 'pin' && password.length !== 4)}>{busy ? 'Logging in' : 'Log in'}</button>
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
