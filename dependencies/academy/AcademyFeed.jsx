import { useMemo, useRef, useState } from 'react'
import nitterLogo from './nitter/public/logo.png'
import './academy-feed.css'

const STARTER_POSTS = [
  {
    id: 1,
    name: 'Agora Academy',
    handle: '@academy',
    initials: 'AA',
    time: '12m',
    text: 'Welcome to Academy — a quieter timeline for useful ideas, field notes, and conversations worth returning to.',
    replies: 8,
    repeats: 21,
    likes: 94,
  },
  {
    id: 2,
    name: 'NYX',
    handle: '@nyx',
    initials: 'N',
    time: '38m',
    text: 'Knowledge becomes durable when people can challenge it in public, revise it without ceremony, and preserve the path that led to the conclusion.',
    replies: 17,
    repeats: 42,
    likes: 183,
  },
  {
    id: 3,
    name: 'Field Notes',
    handle: '@fieldnotes',
    initials: 'FN',
    time: '2h',
    text: 'The strongest maps do more than show territory. They reveal incentives, pressure, distance, and what each side believes it cannot afford to lose.',
    replies: 12,
    repeats: 30,
    likes: 127,
  },
]

function AcademyIcon({ name }) {
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V21h13V9.5M9.5 21v-7h5v7" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" /><path d="M9.5 21h5" /></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21c.7-4.2 3.2-6.5 7.5-6.5s6.8 2.3 7.5 6.5" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m4 18 5-5 3 3 3-4 5 6" /></>,
    comment: <path d="M20 11.5a8 8 0 0 1-8.4 8L5 21l1.7-4.3A8 8 0 1 1 20 11.5Z" />,
    repeat: <><path d="m17 3 4 4-4 4" /><path d="M3 11V9a2 2 0 0 1 2-2h16M7 21l-4-4 4-4" /><path d="M21 13v2a2 2 0 0 1-2 2H3" /></>,
    heart: <path d="M20.8 5.7c-2.2-2.3-5.8-1.8-7.5.7L12 8.2l-1.3-1.8C9 3.9 5.4 3.4 3.2 5.7.4 8.7 2 13 5 15.8L12 22l7-6.2c3-2.8 4.6-7.1 1.8-10.1Z" />,
    share: <><circle cx="18" cy="5" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="19" r="2" /><path d="m8 11 8-5M8 13l8 5" /></>,
  }

  return <svg aria-hidden="true" viewBox="0 0 24 24">{paths[name]}</svg>
}

function Post({ post }) {
  return (
    <article className="academy-post">
      <div className="academy-avatar" aria-hidden="true">{post.initials}</div>
      <div className="academy-post__body">
        <header>
          <strong>{post.name}</strong>
          <span>{post.handle}</span>
          <time>{post.time}</time>
        </header>
        <p>{post.text}</p>
        <footer aria-label="Post activity">
          <button type="button" aria-label={`${post.replies} replies`}><AcademyIcon name="comment" /><span>{post.replies}</span></button>
          <button type="button" aria-label={`${post.repeats} reposts`}><AcademyIcon name="repeat" /><span>{post.repeats}</span></button>
          <button type="button" aria-label={`${post.likes} likes`}><AcademyIcon name="heart" /><span>{post.likes}</span></button>
          <button type="button" aria-label="Share post"><AcademyIcon name="share" /></button>
        </footer>
      </div>
    </article>
  )
}

function AcademyFeed() {
  const [posts, setPosts] = useState(STARTER_POSTS)
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const composerRef = useRef(null)

  const visiblePosts = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return posts
    return posts.filter((post) => `${post.name} ${post.handle} ${post.text}`.toLowerCase().includes(term))
  }, [posts, query])

  const publish = (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return

    setPosts((current) => [{
      id: Date.now(),
      name: 'Agora Member',
      handle: '@member',
      initials: 'A',
      time: 'now',
      text,
      replies: 0,
      repeats: 0,
      likes: 0,
    }, ...current])
    setDraft('')
  }

  return (
    <section className="academy" aria-label="Academy social timeline">
      <div className="academy-shell">
        <aside className="academy-sidebar" aria-label="Academy navigation">
          <div className="academy-brand">
            <img src={nitterLogo} alt="" />
            <div><strong>Academy</strong><span>Private discourse</span></div>
          </div>
          <nav>
            <button className="academy-nav-item academy-nav-item--active" type="button"><AcademyIcon name="home" /><span>Home</span></button>
            <button className="academy-nav-item" type="button"><AcademyIcon name="search" /><span>Explore</span></button>
            <button className="academy-nav-item" type="button"><AcademyIcon name="bell" /><span>Notices</span></button>
            <button className="academy-nav-item" type="button"><AcademyIcon name="bookmark" /><span>Archive</span></button>
            <button className="academy-nav-item" type="button"><AcademyIcon name="user" /><span>Profile</span></button>
          </nav>
          <button className="academy-compose-button" type="button" onClick={() => composerRef.current?.focus()}>New note</button>
          <a className="academy-source" href="https://github.com/zedeus/nitter" target="_blank" rel="noreferrer">
            Frontend adapted from Nitter
          </a>
        </aside>

        <main className="academy-timeline">
          <header className="academy-timeline__header">
            <div><span>Agora network</span><h1>Academy</h1></div>
            <button type="button" aria-label="Timeline settings">•••</button>
          </header>
          <div className="academy-tabs" role="tablist" aria-label="Timeline filters">
            <button className="academy-tabs__active" type="button" role="tab" aria-selected="true">Knowledge</button>
            <button type="button" role="tab" aria-selected="false">Following</button>
          </div>
          <form className="academy-composer" onSubmit={publish}>
            <div className="academy-avatar" aria-hidden="true">A</div>
            <div>
              <textarea
                ref={composerRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Share an idea with the Agora…"
                rows="2"
                maxLength="500"
                aria-label="New Academy note"
              />
              <footer>
                <button className="academy-media-button" type="button" aria-label="Add media"><AcademyIcon name="image" /></button>
                <span>{draft.length}/500</span>
                <button className="academy-publish-button" type="submit" disabled={!draft.trim()}>Publish</button>
              </footer>
            </div>
          </form>
          <div className="academy-posts" aria-live="polite">
            {visiblePosts.length ? visiblePosts.map((post) => <Post key={post.id} post={post} />) : (
              <p className="academy-empty">No notes match this search.</p>
            )}
          </div>
        </main>

        <aside className="academy-context" aria-label="Academy context">
          <label className="academy-search">
            <AcademyIcon name="search" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Academy" />
          </label>
          <section>
            <span className="academy-context__eyebrow">Current discussions</span>
            <h2>Topics in motion</h2>
            <a href="#academy-topic-1"><small>Geopolitics</small><strong>Long-range incentives</strong><span>214 notes</span></a>
            <a href="#academy-topic-2"><small>Business</small><strong>Early-stage capital</strong><span>97 notes</span></a>
            <a href="#academy-topic-3"><small>Technology</small><strong>Privacy-first networks</strong><span>166 notes</span></a>
          </section>
          <section className="academy-context__about">
            <span className="academy-context__eyebrow">About this prototype</span>
            <h2>Lightweight by design.</h2>
            <p>The interface borrows Nitter’s compact timeline, panel hierarchy, and privacy-first visual language.</p>
          </section>
        </aside>
      </div>
    </section>
  )
}

export default AcademyFeed
