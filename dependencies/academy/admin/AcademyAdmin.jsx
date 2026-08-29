import { useEffect, useState } from 'react'
import { callAdminApi, readAdminSession, saveAdminSession } from './adminApi'
import './academy-admin.css'

const MAX_NEW_USERS = 15

function createEmptyUser() {
  return {
    id: crypto.randomUUID(),
    handle: '',
  }
}

function normalizeHandle(value) {
  return value.trim().replace(/^@+/, '')
}

function createInviteUrl(handle, inviteToken) {
  const url = new URL('/', window.location.origin)
  url.searchParams.set('welcome', `@${handle}`)
  url.searchParams.set('invite', inviteToken)
  return url.toString()
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
  const [userCount, setUserCount] = useState(0)
  const [newUsers, setNewUsers] = useState([createEmptyUser()])
  const [createdInvites, setCreatedInvites] = useState([])
  const [copiedInvite, setCopiedInvite] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [notice, setNotice] = useState('')

  const useDashboard = (data) => {
    setUsers(data.users || [])
    setLockedIps(data.lockedIps || [])
    setUserCount(Number(data.userCount || 0))
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
      }))
      const data = await callAdminApi('create-users', { users: batch }, session)
      const failed = (data.results || []).filter((result) => !result.created)
      const invited = (data.results || []).filter((result) => result.created).map((result) => ({
        ...result,
        url: createInviteUrl(result.handle, result.inviteToken),
      }))

      setCreatedInvites(invited)

      if (failed.length) {
        setNotice(`${data.createdCount} invited. ${failed.map((result) => `${result.handle}: ${result.error}`).join(' ')}`)
      } else {
        setNotice(`${data.createdCount} invitation${data.createdCount === 1 ? '' : 's'} created. Copy the one-time links below.`)
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
    setCreatedInvites([])
    setNotice('')
  }

  const copyInvite = async (invite) => {
    try {
      await navigator.clipboard.writeText(invite.url)
      setCopiedInvite(invite.handle)
      window.setTimeout(() => setCopiedInvite(''), 1800)
    } catch {
      setNotice('The browser could not copy that link. Select and copy it manually.')
    }
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
            <p>Create invitations and manage message-board accounts. {userCount} total user{userCount === 1 ? '' : 's'}.</p>
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
            <p>Each user selects a password or PIN from their one-time link. Administrators never receive the secret.</p>
            <button className="academy-admin-primary-button" type="submit" disabled={busy}>
              {busy ? 'Working…' : 'Create invitations'}
            </button>
          </div>
          {notice && <p className="academy-admin-notice" role="status">{notice}</p>}

          {createdInvites.length > 0 && (
            <section className="academy-admin-invites" aria-label="New one-time invitation links">
              <h2>One-time invitation links</h2>
              <p>Send each link only to its named user. Creating another link for the same unclaimed user invalidates the old one.</p>
              {createdInvites.map((invite) => (
                <div key={`${invite.profileNumber}-${invite.inviteToken}`}>
                  <strong>#{String(invite.profileNumber).padStart(4, '0')} · @{invite.handle}</strong>
                  <input value={invite.url} readOnly aria-label={`Invitation URL for @${invite.handle}`} onFocus={(event) => event.currentTarget.select()} />
                  <button className="academy-admin-outline-button" type="button" onClick={() => copyInvite(invite)}>
                    {copiedInvite === invite.handle ? 'Copied' : 'Copy link'}
                  </button>
                </div>
              ))}
            </section>
          )}
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
                  <th>Invitation</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td><span className="academy-admin-profile" aria-hidden="true" />{user.profile_number ? `#${String(user.profile_number).padStart(4, '0')}` : 'Legacy'}</td>
                    <td>@{user.twitter_handle}</td>
                    <td><a href={user.twitter_url} target="_blank" rel="noreferrer">{user.twitter_url}</a></td>
                    <td>{new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                    <td><span className={`academy-admin-status academy-admin-status--${user.invitation_status}`}>{user.invitation_status}</span></td>
                    <td><span className={`academy-admin-status academy-admin-status--${user.status}`}>{user.status}</span></td>
                    <td>
                      <button className="academy-admin-row-action" type="button" onClick={() => toggleStatus(user)} disabled={busy}>
                        {user.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr><td colSpan="7" className="academy-admin-empty">No managed users yet.</td></tr>
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
