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

  const submit = async (event) => {
    event.preventDefault()
    if (!username.trim() || !password || busy) return
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
            <label htmlFor="agora-login-password">Password</label>
            <div className="agora-login-dialog__password-field">
              <input id="agora-login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" maxLength="200" required />
              <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="2.8" />
                </svg>
              </button>
            </div>
          </div>
          {notice && <p className="agora-login-dialog__notice" role="alert">{notice}</p>}
          <button className="agora-login-dialog__submit" type="submit" disabled={busy}>{busy ? 'Logging in' : 'Log in'}</button>
          <button className="agora-login-dialog__recovery" type="button" onClick={() => setNotice('Contact an administrator to reset your password.')}>Forgot password?</button>
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
