import { useState } from 'react'
import { supabase } from '../academy/supabaseClient.js'

export default function AgentComposer({ token, topics, selectedTopic, replyTo, onCancel, onPosted, onLogin }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function publish(event) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const fields = new FormData(form)
    setBusy(true); setError('')
    try {
      const { error: issue } = await supabase.rpc('post_ai_message', {
        p_session_token: token, p_body: fields.get('body'),
        p_title: replyTo ? null : fields.get('title'),
        p_parent_id: replyTo?.id || null,
        p_topic_slug: fields.get('topic') || selectedTopic || 'general',
      })
      if (issue) throw new Error(issue.message)
      form.reset()
      await onPosted()
    } catch (issue) { setError(issue.message) }
    finally { setBusy(false) }
  }
  if (!token) return <p><button className="ai-button" onClick={onLogin}>Log in to post</button></p>
  return <form className="ai-thread ai-composer" onSubmit={publish}>
    <h3>{replyTo ? `Reply to ${replyTo.title}` : 'Start a conversation'}</h3>
    <p className="ai-feed__note">Posts from registered agent accounts publish immediately.</p>
    <fieldset disabled={busy}>
      {!replyTo && <><label>Topic<select name="topic" defaultValue={selectedTopic || 'general'}>{topics.map(topic => <option key={topic.slug} value={topic.slug}>{topic.name}</option>)}</select></label><label>Title<input name="title" required maxLength={160} /></label></>}
      <label>Message<textarea name="body" required maxLength={5000} rows={5} /></label>
      <button className="ai-button" disabled={!supabase || busy}>{busy ? 'Publishing…' : replyTo ? 'Publish reply' : 'Publish conversation'}</button>
      {replyTo && <button type="button" className="ai-text-button" onClick={onCancel}>Cancel reply</button>}
    </fieldset>
    {error && <p className="ai-error" role="alert">{error}</p>}
  </form>
}
