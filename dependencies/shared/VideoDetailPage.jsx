import { useEffect, useState } from 'react'
import RouteLink from '../../routing/RouteLink.jsx'
import { isSupabaseConfigured, supabase } from '../academy/supabaseClient.js'
import './video-detail-page.css'

const ISSUE_KEY = 'september-2026'
const MAX_COMMENTS = 15

function readLocalComments(storageKey) {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]')
  } catch {
    return []
  }
}

function saveLocalComments(storageKey, comments) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(comments))
  } catch {
    // The in-memory discussion still works when browser storage is unavailable.
  }
}

function formatCommentDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function VideoComments({ commentsTable, itemColumn, itemNumber, storageKey }) {
  const [comments, setComments] = useState(() => readLocalComments(storageKey))
  const [draft, setDraft] = useState('')
  const [commentMode, setCommentMode] = useState(isSupabaseConfigured ? 'loading' : 'local')
  const [notice, setNotice] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (!supabase) return undefined

    let cancelled = false

    async function loadComments() {
      const { data, error } = await supabase
        .from(commentsTable)
        .select('id, author_name, body, created_at')
        .eq('issue_key', ISSUE_KEY)
        .eq(itemColumn, itemNumber)
        .order('created_at', { ascending: true })
        .limit(MAX_COMMENTS)

      if (cancelled) return

      if (error) {
        setCommentMode('local')
        setNotice('Comments are saved in this browser until the new media-comments migration is applied.')
        return
      }

      setComments(data || [])
      setCommentMode('database')
    }

    loadComments()

    return () => {
      cancelled = true
    }
  }, [commentsTable, itemColumn, itemNumber])

  const publishComment = async (event) => {
    event.preventDefault()
    const body = draft.trim()

    if (!body || posting || commentMode === 'loading' || comments.length >= MAX_COMMENTS) return

    setPosting(true)
    setNotice('')

    if (commentMode === 'database' && supabase) {
      const { data, error } = await supabase
        .from(commentsTable)
        .insert({
          issue_key: ISSUE_KEY,
          [itemColumn]: itemNumber,
          author_name: 'NYX',
          body,
        })
        .select('id, author_name, body, created_at')
        .single()

      if (error) {
        setNotice(
          error.code === '23514'
            ? 'This discussion has reached its 15-comment limit.'
            : error.message,
        )
        setPosting(false)
        return
      }

      setComments((current) => [...current, data])
    } else {
      const localComment = {
        id: `local-${Date.now()}`,
        author_name: 'NYX',
        body,
        created_at: new Date().toISOString(),
      }

      setComments((current) => {
        if (current.length >= MAX_COMMENTS) return current
        const next = [...current, localComment]
        saveLocalComments(storageKey, next)
        return next
      })
      setNotice('Saved locally. Run the supplied migration to share comments between visitors.')
    }

    setDraft('')
    setPosting(false)
  }

  return (
    <section className="video-discussion" aria-labelledby={`discussion-${commentsTable}-${itemNumber}`}>
      <header>
        <div>
          <p>Public record</p>
          <h2 id={`discussion-${commentsTable}-${itemNumber}`}>Comments</h2>
        </div>
        <strong aria-label={`${comments.length} of ${MAX_COMMENTS} comments`}>
          {comments.length}/{MAX_COMMENTS}
        </strong>
      </header>

      <form onSubmit={publishComment}>
        <label htmlFor={`comment-${commentsTable}-${itemNumber}`}>Comment as NYX</label>
        <textarea
          id={`comment-${commentsTable}-${itemNumber}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add to the discussion…"
          maxLength="1200"
          rows="3"
          disabled={comments.length >= MAX_COMMENTS}
        />
        <button
          type="submit"
          disabled={!draft.trim() || posting || commentMode === 'loading' || comments.length >= MAX_COMMENTS}
        >
          {posting ? 'Posting…' : 'Post comment'}
        </button>
      </form>

      {commentMode === 'loading' && <p className="video-discussion__notice">Loading comments…</p>}
      {notice && <p className="video-discussion__notice" role="status">{notice}</p>}
      {comments.length >= MAX_COMMENTS && (
        <p className="video-discussion__notice" role="status">
          This discussion is full. The maximum is 15 comments.
        </p>
      )}

      <div className="video-discussion__feed" aria-live="polite">
        {comments.length === 0 && commentMode !== 'loading' ? (
          <p className="video-discussion__empty">No comments yet.</p>
        ) : comments.map((comment) => (
          <article key={comment.id}>
            <div>
              <strong>{comment.author_name}</strong>
              <time dateTime={comment.created_at}>{formatCommentDate(comment.created_at)}</time>
            </div>
            <p>{comment.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function VideoDetailPage({
  navigate,
  backPath,
  backLabel,
  eyebrow,
  itemNumber,
  title,
  hideTitle = false,
  status,
  analysis,
  followUps = [],
  embedUrl,
  sourceUrl,
  commentsTable,
  commentItemColumn,
  commentStorageKey,
}) {
  return (
    <section className="video-detail" aria-labelledby="video-detail-title">
      <RouteLink className="video-detail__back" to={backPath} navigate={navigate}>
        <span aria-hidden="true">←</span>
        {backLabel}
      </RouteLink>

      <div className="video-detail__layout">
        <header className="video-detail__header">
          <p>{eyebrow} {String(itemNumber).padStart(2, '0')} · September 2026</p>
          {hideTitle ? (
            <h1 className="video-detail__title--hidden" id="video-detail-title">{title}</h1>
          ) : (
            <h1 id="video-detail-title">{title}</h1>
          )}
          {status && (
            <div className="video-detail__active">
              <span aria-hidden="true" />
              {status}
            </div>
          )}
          <div className="video-detail__summary">
            <p>{analysis}</p>
          </div>
          {followUps.length > 0 && (
            <nav className="video-detail__follow-ups" aria-label="Follow-up videos">
              {followUps.map((followUp) => (
                <RouteLink
                  className="video-detail__follow-up"
                  key={followUp.path}
                  to={followUp.path}
                  navigate={navigate}
                >
                  {followUp.image && (
                    <img src={followUp.image} alt="" />
                  )}
                  <span>{followUp.label}</span>
                  <strong>{followUp.title}</strong>
                  <p>{followUp.analysis}</p>
                  <small>Open video report →</small>
                </RouteLink>
              ))}
            </nav>
          )}
        </header>

        <div className="video-detail__main">
          <article className="video-detail__media">
            <p>Video report</p>
            <div className="video-detail__frame">
              <iframe
                src={embedUrl}
                title={`${title} video player`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <a href={sourceUrl} target="_blank" rel="noreferrer">
              Watch on YouTube ↗
            </a>
          </article>

          <VideoComments
            commentsTable={commentsTable}
            itemColumn={commentItemColumn}
            itemNumber={itemNumber}
            storageKey={commentStorageKey}
          />
        </div>
      </div>
    </section>
  )
}

export default VideoDetailPage
