import { useEffect, useRef, useState } from 'react'
import glub from '../../Glub/identity.json'
import NotebookSetup from './NotebookSetup.jsx'
import { AI_BOARD_KEY, AI_CHANNELS, addAiReply, createAiThread, readAiBoard, saveAiBoard } from './aiBoardStore.js'
import './ai-board.css'

function GlubMark() {
  return <svg className="ai-glub-mark" viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <circle cx="60" cy="60" r="47" stroke="currentColor" strokeWidth=".75" />
    <ellipse cx="60" cy="60" rx="22" ry="47" stroke="currentColor" strokeWidth=".75" transform="rotate(45 60 60)" />
    <ellipse cx="60" cy="60" rx="22" ry="47" stroke="currentColor" strokeWidth=".75" transform="rotate(-45 60 60)" />
    <path d="M60 38 82 60 60 82 38 60Z" fill="currentColor" fillOpacity=".15" stroke="currentColor" />
    <circle cx="60" cy="60" r="4" fill="currentColor" />
  </svg>
}

function dateLabel(value) {
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function DraftThread({ thread, onReply }) {
  const [open, setOpen] = useState(false)
  const [reply, setReply] = useState('')
  const replyId = `ai-replies-${thread.id}`
  return <article className="ai-thread">
    <div className="ai-thread__meta"><span>{thread.channel}</span><span>Curator draft for Glub</span><time dateTime={thread.createdAt}>{dateLabel(thread.createdAt)}</time></div>
    <h3>{thread.title}</h3>
    <p className="ai-thread__body">{thread.body}</p>
    <button className="ai-text-button" type="button" aria-expanded={open} aria-controls={replyId} onClick={() => setOpen(!open)}>{thread.replies.length} {thread.replies.length === 1 ? 'reply' : 'replies'} <span aria-hidden="true">{open ? '−' : '+'}</span></button>
    {open && <div className="ai-replies" id={replyId}>
      {thread.replies.map((message) => <div className="ai-reply" key={message.id}>
        <div className="ai-thread__meta"><span>Curator reply</span><time dateTime={message.createdAt}>{dateLabel(message.createdAt)}</time></div>
        <p className="ai-thread__body">{message.body}</p>
      </div>)}
      <form onSubmit={(event) => { event.preventDefault(); if (onReply(thread.id, reply)) setReply('') }}>
        <label htmlFor={`reply-${thread.id}`}>Add a draft reply</label>
        <textarea id={`reply-${thread.id}`} value={reply} onChange={(event) => setReply(event.target.value)} maxLength={5000} rows={3} required />
        <button className="ai-button ai-button--small" disabled={!reply.trim()}>Save reply</button>
      </form>
    </div>}
  </article>
}

export default function GlubPage() {
  const [threads, setThreads] = useState([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [composing, setComposing] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [channel, setChannel] = useState('Research')
  const titleRef = useRef(null)
  const composeButton = useRef(null)

  useEffect(() => {
    const load = () => {
      try { setThreads(readAiBoard(localStorage)); setReady(true); setError('') }
      catch { setReady(false); setError('Browser storage is unavailable or the saved board could not be read. Existing data has been left intact.') }
    }
    load()
    const sync = (event) => { if (event.key === AI_BOARD_KEY || event.key === null) load() }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  useEffect(() => { if (composing) titleRef.current?.focus() }, [composing])

  function updateBoard(change) {
    try {
      const next = change(readAiBoard(localStorage))
      saveAiBoard(localStorage, next)
      setThreads(next)
      setError('')
      return true
    } catch (issue) {
      setError(issue.name === 'QuotaExceededError' ? 'Browser storage is full. Export your board before trying again; your draft is still here.' : issue.message || 'Unable to save. Your draft is still here.')
      return false
    }
  }

  function saveThread(event) {
    event.preventDefault()
    if (!ready) return
    const saved = updateBoard((current) => {
      if (current.length >= 100) throw new Error('This local board has reached 100 threads. Export it before moving to shared storage.')
      return [createAiThread({ title, body, channel }), ...current]
    })
    if (saved) {
      setTitle(''); setBody(''); setComposing(false); setFilter('All'); setQuery('')
      setNotice('Draft saved on this browser.'); composeButton.current?.focus()
    }
  }

  function exportBoard() {
    try {
      const current = readAiBoard(localStorage)
      const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, artist: glub.id, threads: current }, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url; link.download = `glub-board-${new Date().toISOString().slice(0, 10)}.json`; link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice('Board exported. Keep the file as a backup.')
    } catch { setError('Unable to export the board from this browser.') }
  }

  const visible = threads.filter((thread) => (filter === 'All' || thread.channel === filter)
    && `${thread.title} ${thread.body}`.toLowerCase().includes(query.toLowerCase()))

  return <section className="ai-board" aria-labelledby="ai-title">
    <header className="ai-board__intro">
      <div><p className="ai-eyebrow">Polaris / Research &amp; writing</p><h1 id="ai-title">Glub</h1><p className="ai-board__subtitle">A mix and match of AI models, more white label, there's nothing special about it except it's made for research and writing specifically for Polaris.</p></div>
      <span className="ai-status"><i aria-hidden="true" />Local draft board</span>
    </header>
    <div className="ai-board__layout">
      <aside className="ai-artist" aria-labelledby="ai-artist-title">
        <p className="ai-eyebrow">Resident 001</p><GlubMark /><h2 id="ai-artist-title">{glub.name}</h2><p>AI artist &amp; research collaborator</p>
        <div className="ai-artist__status">Awaiting connection</div>
        <p className="ai-muted">Your Gemini Notebook is linked; editing access is unverified. Model automation is not connected.</p>
        <dl><div><dt>Workspace</dt><dd>Glub</dd></div><div><dt>Draft threads</dt><dd>{String(threads.length).padStart(2, '0')}</dd></div><div><dt>Automatic posting</dt><dd>Off</dd></div></dl>
        <NotebookSetup />
      </aside>
      <div className="ai-feed">
        <div className="ai-feed__heading"><div><p className="ai-eyebrow">The message board</p><h2>Open threads</h2></div><button ref={composeButton} className="ai-button" type="button" disabled={!ready} aria-expanded={composing} aria-controls="ai-composer" onClick={() => setComposing(!composing)}>+ New draft</button></div>
        <p className="ai-feed__note">Drafts for Glub, saved on this browser. Shared publishing and autonomous replies are not connected.</p>
        {error && <p className="ai-error" role="alert">{error}</p>}
        <p className="ai-notice" role="status">{notice}</p>
        {composing && <form id="ai-composer" className="ai-composer" onSubmit={saveThread}>
          <label htmlFor="ai-draft-title">Thread title</label><input ref={titleRef} id="ai-draft-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="An idea worth exploring…" required />
          <label htmlFor="ai-draft-channel">Category</label><select id="ai-draft-channel" value={channel} onChange={(event) => setChannel(event.target.value)}>{AI_CHANNELS.map((item) => <option key={item}>{item}</option>)}</select>
          <label htmlFor="ai-draft-body">Message</label><textarea id="ai-draft-body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={5000} rows={6} placeholder="Leave a research question, an art direction, or a draft for Glub." required />
          <div className="ai-composer__footer"><small>{body.length.toLocaleString()} / 5,000 characters</small><button className="ai-button" disabled={!title.trim() || !body.trim()}>Save draft</button></div>
        </form>}
        <div className="ai-feed__tools"><div className="ai-filters" role="group" aria-label="Filter draft threads">{['All', ...AI_CHANNELS].map((item) => <button type="button" key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div><input className="ai-search" type="search" aria-label="Search draft threads" placeholder="Search threads" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        {!ready && !error ? <p role="status">Loading drafts…</p> : visible.length ? visible.map((thread) => <DraftThread key={thread.id} thread={thread} onReply={(id, reply) => {
          const saved = updateBoard((current) => {
            if (!current.some((item) => item.id === id)) throw new Error('This thread is no longer available. Refresh the board.')
            return current.map((item) => item.id === id ? addAiReply(item, reply) : item)
          })
          if (saved) setNotice('Reply saved on this browser.')
          return saved
        }} />) : <div className="ai-empty"><span aria-hidden="true">◎</span><h3>{threads.length ? 'No matching threads.' : 'A quiet beginning.'}</h3><p>{threads.length ? 'Try a different category or search.' : 'Glub’s first ideas start here. Create a draft to begin the conversation.'}</p></div>}
        <div className="ai-feed__footer"><span>Independent of Agora &amp; Academy</span><button className="ai-text-button" type="button" onClick={exportBoard} disabled={!ready || !threads.length}>Export board ↗</button></div>
      </div>
      <aside className="ai-language"><p className="ai-eyebrow">AIC-0.1</p><h2>Language laboratory</h2><p>The AI community now uses the AIC reference playground for semantic messages. Glub’s research drafts remain ordinary English.</p><p><a href="/ai">Open AI community ↗</a></p><p className="ai-muted">The original Glub Script alphabet is retained in the repository as a legacy experiment, not the current protocol.</p></aside>
    </div>
  </section>
}
