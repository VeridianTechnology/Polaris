import { useEffect, useState } from 'react'
import { supabase } from '../academy/supabaseClient'
import './story-submission.css'

const EMPTY_DRAFT = {
  title: '',
  subtitle: '',
  sourceUrl: '',
  imageUrl: '',
}

export function useApprovedStories(category) {
  const [stories, setStories] = useState([])

  useEffect(() => {
    if (!supabase) return undefined
    let cancelled = false

    supabase.rpc('get_approved_academy_stories', { p_category: category }).then(({ data, error }) => {
      if (cancelled || error) return
      setStories((data || []).map((story) => ({
        id: story.id,
        title: story.title,
        analysis: story.subtitle,
        image: story.image_url,
        url: story.source_url,
        author: `@${story.submitter_username}`,
        submitted: true,
      })))
    })

    return () => { cancelled = true }
  }, [category])

  return stories
}

function StorySubmission({ category, authSession, onLogin }) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [imageFailed, setImageFailed] = useState(false)

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setNotice('')
    if (field === 'imageUrl') setImageFailed(false)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!supabase || !authSession?.session_token || busy) return
    setBusy(true)
    setNotice('')

    const { error } = await supabase.rpc('submit_academy_story', {
      p_session_token: authSession.session_token,
      p_category: category,
      p_source_url: draft.sourceUrl,
      p_image_url: draft.imageUrl,
      p_title: draft.title,
      p_subtitle: draft.subtitle,
    })

    if (error) {
      setNotice(error.message || 'The story could not be submitted.')
    } else {
      setDraft(EMPTY_DRAFT)
      setImageFailed(false)
      setNotice('Submitted for review. It will appear here after approval.')
    }
    setBusy(false)
  }

  return (
    <aside className={`story-submission${isOpen ? ' story-submission--open' : ''}`}>
      <button
        className="story-submission__toggle"
        type="button"
        onClick={() => {
          setIsOpen((current) => !current)
          setNotice('')
        }}
        aria-expanded={isOpen}
      >
        <span aria-hidden="true">+</span>
        Submit a story
      </button>

      {isOpen && !authSession && (
        <div className="story-submission__login">
          <p>Create an account or log in to submit a story for review.</p>
          <button type="button" onClick={onLogin}>Open account</button>
        </div>
      )}

      {isOpen && authSession && (
        <form className="story-submission__form" onSubmit={submit}>
          <header>
            <div>
              <p>Pending review</p>
              <h2>Submit to {category}</h2>
            </div>
            <span>As @{authSession.username}</span>
          </header>

          <div className="story-submission__fields">
            <label>
              <span>Username</span>
              <input value={`@${authSession.username}`} readOnly />
            </label>
            <label>
              <span>Title</span>
              <input value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} minLength="3" maxLength="160" required />
            </label>
            <label className="story-submission__wide">
              <span>Story URL</span>
              <input type="url" value={draft.sourceUrl} onChange={(event) => updateDraft('sourceUrl', event.target.value)} maxLength="2000" placeholder="https://…" required />
            </label>
            <label className="story-submission__wide">
              <span>Image URL</span>
              <input type="url" value={draft.imageUrl} onChange={(event) => updateDraft('imageUrl', event.target.value)} maxLength="2000" placeholder="https://…/image.jpg" required />
            </label>
            <label className="story-submission__wide">
              <span>Subtext</span>
              <textarea value={draft.subtitle} onChange={(event) => updateDraft('subtitle', event.target.value)} maxLength="1200" rows="5" required />
              <small>{draft.subtitle.length}/1200</small>
            </label>
          </div>

          {draft.imageUrl && !imageFailed && (
            <figure className="story-submission__preview">
              <img src={draft.imageUrl} alt="Submission preview" onError={() => setImageFailed(true)} />
              <figcaption>Image preview</figcaption>
            </figure>
          )}
          {imageFailed && <p className="story-submission__image-error">That image URL could not be previewed. Check that it links directly to a public image.</p>}
          {notice && <p className="story-submission__notice" role="status">{notice}</p>}

          <footer>
            <p>Every submission is private until an administrator approves it.</p>
            <button type="submit" disabled={busy || imageFailed}>{busy ? 'Submitting…' : 'Send for approval'}</button>
          </footer>
        </form>
      )}
    </aside>
  )
}

export default StorySubmission
