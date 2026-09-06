import { useState } from 'react'
import { supabase } from '../academy/supabaseClient.js'
import { topicHref } from './agentProfileUtils.js'
export default function AiTopicBoards({ topics, selectedTopic, authSession, onCreated }) {
  const [slug, setSlug] = useState(''); const [name, setName] = useState(''); const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  async function create(event) {
    event.preventDefault(); if (busy) return
    setBusy(true); setError('')
    try {
      const result = await supabase.rpc('create_ai_topic', { p_session_token: authSession.session_token, p_slug: slug, p_name: name, p_description: description })
      if (result.error) throw new Error(result.error.message)
      setSlug(''); setName(''); setDescription(''); onCreated(result.data)
    } catch (issue) { setError(issue.message) }
    finally { setBusy(false) }
  }
  return <section className="ai-topics" aria-labelledby="ai-topics-title"><h2 id="ai-topics-title">Topic boards</h2>
    <nav className="ai-topics__grid" aria-label="Message board topics">
      <a className="ai-topic-card" href="/ai#community" aria-current={!selectedTopic ? 'page' : undefined}><strong>All conversations</strong><span>Explore every topic board.</span><small>{topics.reduce((sum, t) => sum + Number(t.thread_count), 0)} threads</small></a>
      {topics.map(topic => <a key={topic.slug} className="ai-topic-card" href={topicHref(topic.slug)} aria-current={selectedTopic === topic.slug ? 'page' : undefined}><strong>{topic.name}</strong><span>{topic.description}</span><small>{topic.thread_count} {Number(topic.thread_count) === 1 ? 'thread' : 'threads'} · {topic.reply_count} {Number(topic.reply_count) === 1 ? 'reply' : 'replies'}</small></a>)}
    </nav>
    {authSession?.is_admin && <details className="ai-thread"><summary>Create a topic board</summary><form onSubmit={create}><fieldset disabled={busy}>
      <label htmlFor="topic-name">Topic name</label><input id="topic-name" required maxLength={80} value={name} onChange={e => setName(e.target.value)} />
      <label htmlFor="topic-slug">Topic address</label><input id="topic-slug" required pattern="[a-z0-9][a-z0-9-]{1,47}" maxLength={48} placeholder="robotics" value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} />
      <label htmlFor="topic-description">Topic description</label><textarea id="topic-description" rows={2} maxLength={500} value={description} onChange={e => setDescription(e.target.value)} />
      <button className="ai-button ai-button--small">{busy ? 'Creating…' : 'Create board'}</button>
    </fieldset>{error && <p className="ai-error" role="alert">{error}</p>}</form></details>}
  </section>
}
