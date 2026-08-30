import { useCallback, useEffect, useState } from 'react'
import { callAdminApi } from './adminApi'
import './academy-admin.css'

const FILTERS = {
  pending: 'Pending',
  reviewed: 'Reviewed',
}

function AccessMessage({ authSession, onLogin, onReturn }) {
  return (
    <section className="academy-admin-page academy-admin-page--access">
      <button className="academy-admin-return" type="button" onClick={onReturn}>Return to board</button>
      <div className="academy-admin-access">
        <img src="/agora-logo.png" alt="Agora" />
        <p className="academy-admin-kicker">Story moderation</p>
        <h1>{authSession ? 'Administrator only' : 'Log in required'}</h1>
        <p>{authSession ? 'This account does not have approval access.' : 'Use the normal Polaris account login. There is no separate administrator password.'}</p>
        {!authSession && <button type="button" onClick={onLogin}>Open account login</button>}
      </div>
    </section>
  )
}

function SubmissionCard({ submission, busy, onReview }) {
  const reviewed = submission.status !== 'pending'

  return (
    <article className="academy-approval-card">
      <a className="academy-approval-card__image" href={submission.image_url} target="_blank" rel="noreferrer">
        <img src={submission.image_url} alt="" />
      </a>
      <div className="academy-approval-card__body">
        <header>
          <span className={`academy-approval-card__status academy-approval-card__status--${submission.status}`}>{submission.status}</span>
          <span>{submission.category}</span>
        </header>
        <h2>{submission.title}</h2>
        <p>{submission.subtitle}</p>
        <dl>
          <div><dt>Submitted by</dt><dd>@{submission.submitter_username}</dd></div>
          <div><dt>Received</dt><dd>{new Date(submission.created_at).toLocaleString()}</dd></div>
        </dl>
        <a className="academy-approval-card__source" href={submission.source_url} target="_blank" rel="noreferrer">Open story source ↗</a>
        {reviewed ? (
          <p className="academy-approval-card__reviewed">{submission.status} {submission.reviewed_at ? new Date(submission.reviewed_at).toLocaleString() : ''}</p>
        ) : (
          <footer>
            <button type="button" disabled={busy} onClick={() => onReview(submission.id, 'rejected')}>Reject</button>
            <button className="is-primary" type="button" disabled={busy} onClick={() => onReview(submission.id, 'approved')}>Approve and publish</button>
          </footer>
        )}
      </div>
    </article>
  )
}

function AcademyAdmin({ authSession, authStatus, onLogin, onReturn }) {
  const [filter, setFilter] = useState('pending')
  const [submissions, setSubmissions] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const loadSubmissions = useCallback(async () => {
    if (!authSession?.is_admin) return
    setLoading(true)
    setNotice('')
    try {
      const data = await callAdminApi('list-submissions', { filter }, authSession.session_token)
      setSubmissions(data.submissions || [])
      setPendingCount(Number(data.pendingCount || 0))
    } catch (error) {
      setNotice(error.message)
    } finally {
      setLoading(false)
    }
  }, [authSession, filter])

  useEffect(() => {
    loadSubmissions()
  }, [loadSubmissions])

  const review = async (submissionId, status) => {
    setBusy(true)
    setNotice('')
    try {
      await callAdminApi('review-submission', { submissionId, status }, authSession.session_token)
      setNotice(status === 'approved' ? 'Story approved and published.' : 'Story rejected.')
      await loadSubmissions()
    } catch (error) {
      setNotice(error.message)
    } finally {
      setBusy(false)
    }
  }

  if (authStatus === 'loading') {
    return <section className="academy-admin-page"><p className="academy-admin-loading">Loading administration…</p></section>
  }

  if (!authSession?.is_admin) {
    return <AccessMessage authSession={authSession} onLogin={onLogin} onReturn={onReturn} />
  }

  return (
    <section className="academy-admin-page">
      <div className="academy-admin-shell">
        <header className="academy-admin-heading">
          <div>
            <p className="academy-admin-kicker">Academy</p>
            <h1>Story Approvals</h1>
            <p>Review community submissions before they appear in Finance, Crime, or Freedom.</p>
          </div>
          <button type="button" onClick={onReturn}>Return to board</button>
        </header>

        <nav className="academy-admin-tabs" aria-label="Submission filters">
          {Object.entries(FILTERS).map(([value, label]) => (
            <button className={filter === value ? 'is-active' : ''} type="button" onClick={() => setFilter(value)} key={value}>
              {label}{value === 'pending' && <span>{pendingCount}</span>}
            </button>
          ))}
        </nav>

        {notice && <p className="academy-admin-notice" role="status">{notice}</p>}

        <div className="academy-approvals" aria-live="polite">
          {submissions.map((submission) => (
            <SubmissionCard submission={submission} busy={busy} onReview={review} key={submission.id} />
          ))}
          {!submissions.length && (
            <p className="academy-admin-empty">{loading ? 'Loading submissions…' : filter === 'pending' ? 'No stories are waiting for review.' : 'No reviewed stories yet.'}</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default AcademyAdmin
