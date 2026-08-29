import { useEffect, useState } from 'react'
import RouteLink from '../../routing/RouteLink.jsx'
import { ROUTES } from '../../routing/routes.js'
import { isSupabaseConfigured, supabase } from '../academy/supabaseClient.js'
import './crime-case.css'

const ISSUE_KEY = 'september-2026'
const CASE_NUMBER = 2
const MAX_COMMENTS = 15
const LOCAL_COMMENTS_KEY = 'polaris-crime-lindsay-clancy-comments'

const evidenceImages = [
  {
    src: '/crime-lindsay-meme-01.jpg',
    alt: 'A social-media post discussing contradictory claims about postpartum hormones',
    label: 'Meme 01',
  },
  {
    src: '/crime-lindsay-meme-02.jpg',
    alt: 'A comparison meme showing Lindsay Clancy beside a historical illustration',
    label: 'Meme 02',
  },
]

function readLocalComments() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_COMMENTS_KEY) || '[]')
  } catch {
    return []
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

function CrimeCase({ navigate }) {
  const [expandedImage, setExpandedImage] = useState(null)
  const [comments, setComments] = useState(readLocalComments)
  const [draft, setDraft] = useState('')
  const [commentMode, setCommentMode] = useState(isSupabaseConfigured ? 'loading' : 'local')
  const [commentNotice, setCommentNotice] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (!expandedImage) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setExpandedImage(null)
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [expandedImage])

  useEffect(() => {
    if (!supabase) return undefined

    let cancelled = false

    async function loadComments() {
      const { data, error } = await supabase
        .from('academy_crime_comments')
        .select('id, author_name, body, created_at')
        .eq('issue_key', ISSUE_KEY)
        .eq('crime_item_number', CASE_NUMBER)
        .order('created_at', { ascending: true })
        .limit(MAX_COMMENTS)

      if (cancelled) return

      if (error) {
        setCommentMode('local')
        setCommentNotice('Comments are saved in this browser until the August 29 Supabase migration is applied.')
        return
      }

      setComments(data || [])
      setCommentMode('database')
    }

    loadComments()

    return () => {
      cancelled = true
    }
  }, [])

  const publishComment = async (event) => {
    event.preventDefault()
    const body = draft.trim()
    if (!body || posting || commentMode === 'loading' || comments.length >= MAX_COMMENTS) return

    setPosting(true)
    setCommentNotice('')

    if (commentMode === 'database' && supabase) {
      const { data, error } = await supabase
        .from('academy_crime_comments')
        .insert({
          issue_key: ISSUE_KEY,
          crime_item_number: CASE_NUMBER,
          author_name: 'NYX',
          body,
        })
        .select('id, author_name, body, created_at')
        .single()

      if (error) {
        setCommentNotice(
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
        localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(next))
        return next
      })
      setCommentNotice('Saved locally in this browser. Apply the supplied migration to share comments between visitors.')
    }

    setDraft('')
    setPosting(false)
  }

  return (
    <section className="crime-case" aria-labelledby="crime-case-title">
      <RouteLink className="crime-case__back" to={ROUTES.agoraCrime} navigate={navigate}>
        <span aria-hidden="true">←</span>
        Crime index
      </RouteLink>

      <header className="crime-case__header">
        <p>Case file 02 · September 2026</p>
        <h1 id="crime-case-title">Lindsay Clancy</h1>
        <div className="crime-case__active">
          <span aria-hidden="true" />
          Active
        </div>
        <p className="crime-case__summary">
          Murdered her kids in a post-partum rage, the answer is still unclear why. All over the news,
          you&apos;d be under a rock not to hear about it.
        </p>
      </header>

      <div className="crime-case__evidence-layout">
        <aside className="crime-case__docket" aria-label="Case details">
          <p>Case</p>
          <strong>02</strong>
          <dl>
            <div>
              <dt>Author</dt>
              <dd>NYX</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>Open</dd>
            </div>
            <div>
              <dt>Issue</dt>
              <dd>September 2026</dd>
            </div>
          </dl>
        </aside>

        <article className="crime-case__primary">
          <p>Primary post</p>
          <a
            href="https://x.com/ThomBrady5/status/2092909854172025294"
            target="_blank"
            rel="noreferrer"
            aria-label="Open the original post on X"
          >
            <img
              src="/crime-lindsay-tweet.png"
              alt="Post discussing public fundraising for Lindsay Clancy"
            />
          </a>
          <a
            className="crime-case__source"
            href="https://x.com/ThomBrady5/status/2092909854172025294"
            target="_blank"
            rel="noreferrer"
          >
            View original post ↗
          </a>
        </article>

        <aside className="crime-case__supporting" aria-label="Supporting material">
          <section className="crime-case__threads" aria-labelledby="supporting-threads-title">
            <p>Supporting material</p>
            <h2 id="supporting-threads-title">Threads</h2>
            <a
              href="https://www.threads.com/@lkozar65/post/DcmVh2tGWSA?xmt=AQG0ZGtlBeVrTp5OHvzln9F3u-CP8uMe3eeLhPq65DMr0LoKQpCxduqrV7HMuzvSqRrkNfAs&slof=1"
              target="_blank"
              rel="noreferrer"
            >
              <strong>The counter against Patrick being the killer</strong>
              <span>Open on Threads ↗</span>
            </a>
          </section>

          <section className="crime-case__gallery" aria-labelledby="supporting-memes-title">
            <div>
              <p>Supporting material</p>
              <h2 id="supporting-memes-title">Memes</h2>
            </div>
            {evidenceImages.map((item) => (
              <button type="button" key={item.src} onClick={() => setExpandedImage(item)}>
                <img src={item.src} alt={item.alt} />
                <span>{item.label} · Expand</span>
              </button>
            ))}
          </section>
        </aside>
      </div>

      <section className="crime-discussion" aria-labelledby="crime-discussion-title">
        <header>
          <div>
            <p>Public record</p>
            <h2 id="crime-discussion-title">Comments</h2>
          </div>
          <strong className="crime-discussion__counter" aria-label={`${comments.length} of ${MAX_COMMENTS} comments`}>
            {comments.length}/{MAX_COMMENTS}
          </strong>
        </header>

        <form onSubmit={publishComment}>
          <label htmlFor="crime-comment">Comment as NYX</label>
          <textarea
            id="crime-comment"
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

        {comments.length >= MAX_COMMENTS && (
          <p className="crime-discussion__notice" role="status">
            This discussion is full. The maximum is 15 comments.
          </p>
        )}

        {commentMode === 'loading' && <p className="crime-discussion__notice">Loading comments…</p>}
        {commentNotice && <p className="crime-discussion__notice" role="status">{commentNotice}</p>}

        <div className="crime-discussion__feed" aria-live="polite">
          {comments.length === 0 && commentMode !== 'loading' ? (
            <p className="crime-discussion__empty">No comments yet.</p>
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

      {expandedImage && (
        <div
          className="crime-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={expandedImage.label}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setExpandedImage(null)
          }}
        >
          <button
            className="crime-lightbox__close"
            type="button"
            onClick={() => setExpandedImage(null)}
            aria-label="Close expanded meme"
          >
            <span aria-hidden="true">×</span>
            Close
          </button>
          <figure>
            <img src={expandedImage.src} alt={expandedImage.alt} />
            <figcaption>{expandedImage.label}</figcaption>
          </figure>
        </div>
      )}
    </section>
  )
}

export default CrimeCase
