import { useEffect, useState } from 'react'
import { callAdminApi, readAdminSession, saveAdminSession } from './adminApi'
import './academy-admin.css'

const MAX_NEW_USERS = 15
const PASSWORD_LENGTH = 18
const CHARACTER_GROUPS = [
  'ABCDEFGHJKLMNPQRSTUVWXYZ',
  'abcdefghijkmnopqrstuvwxyz',
  '23456789',
  '!@#$%&*+-=?',
]

function randomIndex(length) {
  const maximum = Math.floor(0x100000000 / length) * length
  const value = new Uint32Array(1)

  do crypto.getRandomValues(value)
  while (value[0] >= maximum)

  return value[0] % length
}

function generatePassword() {
  const allCharacters = CHARACTER_GROUPS.join('')
  const characters = CHARACTER_GROUPS.map((group) => group[randomIndex(group.length)])

  while (characters.length < PASSWORD_LENGTH) {
    characters.push(allCharacters[randomIndex(allCharacters.length)])
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1)
    ;[characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]]
  }

  return characters.join('')
}

function createEmptyUser() {
  return {
    id: crypto.randomUUID(),
    handle: '',
    password: '',
    showPassword: false,
  }
}

function normalizeHandle(value) {
  return value.trim().replace(/^@+/, '')
}

function LoginGate({ onLogin, busy, notice }) {
  const [pin, setPin] = useState('')
  const [password, setPassword] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    const succeeded = await onLogin(pin, password)
    if (succeeded) {
      setPin('')
      setPassword('')
    }
  }

  return (
    <div className="academy-admin-login">
      <img src="/agora-logo.png" alt="Agora" />
      <form onSubmit={submit}>
        <p className="academy-admin-kicker">Restricted access</p>
        <h1>Administration</h1>
        <p>Enter the Agora PIN and administrator password.</p>

        <label>
          <span>PIN</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 12))}
            required
          />
        </label>
        <label>
          <span>Administrator password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {notice && <p className="academy-admin-notice" role="alert">{notice}</p>}
        <button type="submit" disabled={busy || !pin || !password}>
          {busy ? 'Verifying…' : 'Enter administration'}
        </button>
      </form>
    </div>
  )
}

function NewUserRow({ user, index, onChange, onRemove }) {
  const handle = normalizeHandle(user.handle)

  return (
    <div className="academy-admin-new-row">
      <label>
        <span>Twitter @</span>
        <input
          value={user.handle}
          onChange={(event) => onChange({ handle: event.target.value.replace(/\s/g, '') })}
          placeholder="@username"
          autoComplete="off"
          required
        />
      </label>
      <label>
        <span>Twitter URL</span>
        <input
          value={handle ? `https://x.com/${handle}` : ''}
          placeholder="https://x.com/username"
          readOnly
          tabIndex="-1"
        />
      </label>
      <label>
        <span>Message-board password</span>
        <span className="academy-admin-password-field">
          <input
            type={user.showPassword ? 'text' : 'password'}
            value={user.password}
            onChange={(event) => onChange({ password: event.target.value })}
            placeholder="Generate or enter a password"
            minLength="12"
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => onChange({ showPassword: !user.showPassword })}
            aria-label={user.showPassword ? 'Hide password' : 'Show password'}
          >
            {user.showPassword ? 'Hide' : 'Show'}
          </button>
        </span>
      </label>
      <button
        className="academy-admin-outline-button"
        type="button"
        onClick={() => onChange({ password: generatePassword(), showPassword: true })}
      >
        Generate password
      </button>
      {index > 0 && (
        <button
          className="academy-admin-remove-button"
          type="button"
          onClick={onRemove}
          aria-label={`Remove user ${index + 1}`}
        >
          ×
        </button>
      )}
    </div>
  )
}

function AcademyAdmin({ onReturn }) {
  const [session, setSession] = useState(readAdminSession)
  const [users, setUsers] = useState([])
  const [lockedIps, setLockedIps] = useState([])
  const [newUsers, setNewUsers] = useState([createEmptyUser()])
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [notice, setNotice] = useState('')

  const useDashboard = (data) => {
    setUsers(data.users || [])
    setLockedIps(data.lockedIps || [])
    setReady(true)
  }

  useEffect(() => {
    if (!session) {
      setReady(true)
      return
    }

    let cancelled = false
    callAdminApi('dashboard', {}, session).then((data) => {
      if (!cancelled) useDashboard(data)
    }).catch((error) => {
      if (cancelled) return
      saveAdminSession('')
      setSession('')
      setNotice(error.message)
      setReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [session])

  const login = async (pin, password) => {
    setBusy(true)
    setNotice('')

    try {
      const data = await callAdminApi('login', { pin, password }, '')
      saveAdminSession(data.sessionToken)
      setSession(data.sessionToken)
      useDashboard(data)
      return true
    } catch (error) {
      setNotice(error.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const updateNewUser = (id, changes) => {
    setNewUsers((current) => current.map((user) => (
      user.id === id ? { ...user, ...changes } : user
    )))
  }

  const refreshDashboard = async () => {
    const data = await callAdminApi('dashboard', {}, session)
    useDashboard(data)
  }

  const createUsers = async (event) => {
    event.preventDefault()
    setBusy(true)
    setNotice('')

    try {
      const batch = newUsers.map((user) => ({
        handle: normalizeHandle(user.handle),
        password: user.password,
      }))
      const data = await callAdminApi('create-users', { users: batch }, session)
      const failed = (data.results || []).filter((result) => !result.created)

      if (failed.length) {
        setNotice(`${data.createdCount} created. ${failed.map((result) => `${result.handle}: ${result.error}`).join(' ')}`)
      } else {
        setNotice(`${data.createdCount} user${data.createdCount === 1 ? '' : 's'} created.`)
        setNewUsers([createEmptyUser()])
      }

      await refreshDashboard()
    } catch (error) {
      setNotice(error.message)
    } finally {
      setBusy(false)
    }
  }

  const toggleStatus = async (user) => {
    setBusy(true)
    setNotice('')

    try {
      await callAdminApi('set-user-status', {
        userId: user.id,
        status: user.status === 'active' ? 'inactive' : 'active',
      }, session)
      await refreshDashboard()
    } catch (error) {
      setNotice(error.message)
    } finally {
      setBusy(false)
    }
  }

  const unlockIp = async (ipAddress) => {
    setBusy(true)
    setNotice('')

    try {
      await callAdminApi('unlock-ip', { ipAddress }, session)
      await refreshDashboard()
    } catch (error) {
      setNotice(error.message)
    } finally {
      setBusy(false)
    }
  }

  const logout = () => {
    saveAdminSession('')
    setSession('')
    setUsers([])
    setLockedIps([])
    setNotice('')
  }

  if (!ready) {
    return <section className="academy-admin-page"><p className="academy-admin-loading">Loading administration…</p></section>
  }

  if (!session) {
    return (
      <section className="academy-admin-page">
        <button className="academy-admin-return" type="button" onClick={onReturn}>Return to board</button>
        <LoginGate onLogin={login} busy={busy} notice={notice} />
      </section>
    )
  }

  return (
    <section className="academy-admin-page">
      <div className="academy-admin-shell">
        <header className="academy-admin-heading">
          <div>
            <p className="academy-admin-kicker">Agora</p>
            <h1>User Administration</h1>
            <p>Create and manage message-board accounts.</p>
          </div>
          <div className="academy-admin-heading__actions">
            <button type="button" onClick={onReturn}>Return to board</button>
            <button type="button" onClick={logout}>Lock admin</button>
          </div>
        </header>

        <form className="academy-admin-card academy-admin-create" onSubmit={createUsers}>
          {newUsers.map((user, index) => (
            <NewUserRow
              key={user.id}
              user={user}
              index={index}
              onChange={(changes) => updateNewUser(user.id, changes)}
              onRemove={() => setNewUsers((current) => current.filter((entry) => entry.id !== user.id))}
            />
          ))}

          <div className="academy-admin-create__actions">
            <button
              className="academy-admin-outline-button"
              type="button"
              disabled={newUsers.length >= MAX_NEW_USERS}
              onClick={() => setNewUsers((current) => [...current, createEmptyUser()])}
            >
              + Add another user ({newUsers.length}/{MAX_NEW_USERS})
            </button>
            <p>Passwords are encrypted by Supabase Auth and cannot be viewed after creation.</p>
            <button className="academy-admin-primary-button" type="submit" disabled={busy}>
              {busy ? 'Working…' : 'Create users'}
            </button>
          </div>
          {notice && <p className="academy-admin-notice" role="status">{notice}</p>}
        </form>

        <section className="academy-admin-card academy-admin-existing">
          <h2>Existing users</h2>
          <div className="academy-admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>Twitter @</th>
                  <th>Twitter URL</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td><span className="academy-admin-profile" aria-hidden="true" /></td>
                    <td>@{user.twitter_handle}</td>
                    <td><a href={user.twitter_url} target="_blank" rel="noreferrer">{user.twitter_url}</a></td>
                    <td>{new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                    <td><span className={`academy-admin-status academy-admin-status--${user.status}`}>{user.status}</span></td>
                    <td>
                      <button className="academy-admin-row-action" type="button" onClick={() => toggleStatus(user)} disabled={busy}>
                        {user.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr><td colSpan="6" className="academy-admin-empty">No managed users yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {lockedIps.length > 0 && (
          <section className="academy-admin-card academy-admin-lockouts">
            <h2>Locked IP addresses</h2>
            {lockedIps.map((entry) => (
              <div key={entry.ip_address}>
                <code>{entry.ip_address}</code>
                <span>Locked {new Date(entry.locked_at).toLocaleString()}</span>
                <button type="button" onClick={() => unlockIp(entry.ip_address)} disabled={busy}>Unlock</button>
              </div>
            ))}
          </section>
        )}
      </div>
    </section>
  )
}

export default AcademyAdmin
