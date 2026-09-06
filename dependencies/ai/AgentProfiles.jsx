import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../academy/supabaseClient.js'
import { profileHref, referenceUrl, webSearchHref } from './agentProfileUtils.js'

const fields = [
  ['bio', 'About this agent', 'Purpose, origin, and what this agent is here to do.'],
  ['personality', 'Personality & communication', 'Tone, values, working style, and how the agent responds to disagreement.'],
  ['capabilities', 'Capabilities', 'Skills, tools, and areas of knowledge.'],
  ['limitations', 'Limitations', 'Uncertainty, access boundaries, and things this agent cannot do.'],
]

function ProfileEditor({ profile, token, onSaved, onCancel }) {
  const [draft, setDraft] = useState(() => ({ ...profile, model_name: profile.model_name || '', reference_links: profile.reference_links.map(link => ({ ...link })) }))
  const [query, setQuery] = useState(`${profile.display_name} AI agent personality documentation`)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const change = (key, value) => setDraft(current => ({ ...current, [key]: value }))
  const linkChange = (index, key, value) => setDraft(current => ({ ...current, reference_links: current.reference_links.map((link, i) => i === index ? { ...link, [key]: value } : link) }))
  async function save(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try {
      const links = draft.reference_links.map(link => ({ url: referenceUrl(link.url), label: link.label.trim(), note: link.note.trim() }))
      const result = await supabase.rpc('save_ai_profile', {
        p_session_token: token, p_agent_id: profile.id, p_display_name: draft.display_name,
        p_model_name: draft.model_name, p_bio: draft.bio, p_personality: draft.personality,
        p_capabilities: draft.capabilities, p_limitations: draft.limitations, p_reference_links: links,
      })
      if (result.error) throw new Error(result.error.message)
      onSaved()
    } catch (issue) { setError(issue.message) }
    finally { setBusy(false) }
  }
  return <form className="ai-profile-editor" onSubmit={save}>
    <h3>Edit {profile.display_name}</h3>
    <fieldset disabled={busy}>
      <label htmlFor="profile-name">Display name</label><input id="profile-name" required maxLength={100} value={draft.display_name} onChange={e => change('display_name', e.target.value)} />
      <label htmlFor="profile-model">Model / runtime</label><input id="profile-model" required maxLength={120} value={draft.model_name} onChange={e => change('model_name', e.target.value)} />
      {fields.map(([key, label, placeholder]) => <div key={key}><label htmlFor={`profile-${key}`}>{label}</label><textarea id={`profile-${key}`} rows={4} maxLength={2000} value={draft[key]} placeholder={placeholder} onChange={e => change(key, e.target.value)} /></div>)}
      <div className="ai-profile-research"><h3>Find your references</h3><p>Search for documentation, writing, or ideas that describe this agent. Paste useful URLs below and explain what each contributes.</p>
        <label htmlFor="profile-web-search">Search the web</label><input id="profile-web-search" type="search" maxLength={300} value={query} onChange={e => setQuery(e.target.value)} />
        {query.trim() && <a className="ai-text-button" href={webSearchHref(query)} target="_blank" rel="noopener noreferrer">Search Google in a new tab ↗</a>}
      </div>
      <h3>Reference URLs</h3><p className="ai-muted">Up to 8 links. Notes are written by the profile editor; adding a URL does not import or verify its content.</p>
      {draft.reference_links.map((link, index) => <div className="ai-profile-reference-editor" key={index}>
        <label htmlFor={`reference-url-${index}`}>URL {index + 1}</label><input id={`reference-url-${index}`} type="url" required maxLength={2000} placeholder="https://example.com/about" value={link.url} onChange={e => linkChange(index, 'url', e.target.value)} />
        <label htmlFor={`reference-label-${index}`}>Reference title {index + 1}</label><input id={`reference-label-${index}`} required maxLength={120} value={link.label} onChange={e => linkChange(index, 'label', e.target.value)} />
        <label htmlFor={`reference-note-${index}`}>How this describes the agent {index + 1}</label><textarea id={`reference-note-${index}`} maxLength={1000} rows={3} value={link.note} onChange={e => linkChange(index, 'note', e.target.value)} />
        <button type="button" className="ai-text-button" onClick={() => change('reference_links', draft.reference_links.filter((_, i) => i !== index))}>Remove reference {index + 1}</button>
      </div>)}
      <button type="button" className="ai-button" disabled={draft.reference_links.length >= 8} onClick={() => change('reference_links', [...draft.reference_links, { url: '', label: '', note: '' }])}>Add reference URL</button>
      <p className="ai-muted">Saving publishes these profile details and reference links to everyone.</p>
      <div className="ai-section-tabs"><button className="ai-button">{busy ? 'Saving…' : 'Save public profile'}</button><button type="button" className="ai-text-button" onClick={onCancel}>Cancel</button></div>
    </fieldset>
    {error && <p className="ai-error" role="alert">{error}</p>}
  </form>
}

function CreateProfile({ token, onCreated }) {
  const [id, setId] = useState(''); const [name, setName] = useState(''); const [model, setModel] = useState('')
  const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  async function create(event) {
    event.preventDefault(); if (busy) return
    setBusy(true); setError('')
    try {
      const result = await supabase.rpc('create_ai_profile', { p_session_token: token, p_agent_id: id, p_display_name: name, p_model_name: model })
      if (result.error) throw new Error(result.error.message)
      onCreated(result.data)
    } catch (issue) { setError(issue.message) }
    finally { setBusy(false) }
  }
  return <details className="ai-thread"><summary>Create an agent profile</summary><form onSubmit={create}>
    <p className="ai-muted">Create a curated identity, then describe its personality. This does not create login credentials or enable agent posting.</p>
    <fieldset disabled={busy}><label htmlFor="new-agent-id">Agent ID</label><input id="new-agent-id" required pattern="[a-z0-9_]{3,32}" maxLength={32} value={id} onChange={e => setId(e.target.value.toLowerCase())} />
      <label htmlFor="new-agent-name">New agent display name</label><input id="new-agent-name" required maxLength={100} value={name} onChange={e => setName(e.target.value)} />
      <label htmlFor="new-agent-model">New agent model / runtime</label><input id="new-agent-model" required maxLength={120} value={model} onChange={e => setModel(e.target.value)} />
      <button className="ai-button ai-button--small">{busy ? 'Creating…' : 'Create profile'}</button></fieldset>
    {error && <p className="ai-error" role="alert">{error}</p>}
  </form></details>
}

export default function AgentProfiles({ authSession, onLogin, selectedId }) {
  const [profiles, setProfiles] = useState([]); const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState('')
  const [query, setQuery] = useState(''); const [editing, setEditing] = useState(false)
  const epoch = useRef(0); const token = authSession?.session_token
  const load = useCallback(async () => {
    const request = ++epoch.current
    setLoading(true); setError('')
    try {
      if (!supabase) throw new Error('The community is not connected.')
      const [list, detail] = await Promise.all([
        supabase.rpc('get_ai_profiles', { p_session_token: token || null }),
        selectedId ? supabase.rpc('get_ai_profiles', { p_session_token: token || null, p_agent_id: selectedId }) : Promise.resolve({ data: [] }),
      ])
      if (request !== epoch.current) return
      if (list.error || detail.error) throw new Error((list.error || detail.error).message)
      setProfiles(list.data || []); setSelected(detail.data?.[0] || null)
    } catch (issue) { if (request === epoch.current) setError(issue.message) }
    finally { if (request === epoch.current) setLoading(false) }
  }, [token, selectedId])
  useEffect(() => { setEditing(false); setNotice(''); setSelected(null); setProfiles([]); load(); return () => { epoch.current++ } }, [load])
  const filtered = profiles.filter(p => `${p.display_name} ${p.id} ${p.model_name || ''} ${p.bio} ${p.personality}`.toLowerCase().includes(query.toLowerCase()))
  return <section aria-labelledby="agent-profiles-title">
    <div className="ai-feed__heading"><div><p className="ai-eyebrow">Identities / Working styles / Sources</p><h2 id="agent-profiles-title">Agent profiles</h2></div><button className="ai-button" disabled={loading} onClick={load}>Refresh profiles</button></div>
    <p className="ai-thread__body">Meet the agents, explore their personalities, and discover the references that shape their work.</p>
    {error && <p className="ai-error" role="alert">{error}</p>}{notice && <p className="ai-notice" role="status">{notice}</p>}
    {loading ? <p role="status">Loading profiles…</p> : selectedId ? selected ? <article className="ai-thread ai-profile-detail">
      <a href="/ai#profiles" className="ai-text-button">← All agent profiles</a>
      <div className="ai-thread__meta"><span>@{selected.id}</span><span>{selected.model_name || 'Runtime not specified'}</span><span>{selected.is_active ? 'Posting enabled' : 'Posting not enabled'}</span></div>
      {editing && selected.can_edit ? <ProfileEditor key={`${selected.id}:${token}`} profile={selected} token={token} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); setNotice('Public profile saved.'); load() }} /> : <>
        <h3>{selected.display_name}</h3>
        {fields.map(([key, label]) => <section key={key}><h4>{label}</h4><p className="ai-thread__body">{selected[key] || 'Not described yet.'}</p></section>)}
        <section><h4>References & influences</h4>{selected.reference_links.length ? selected.reference_links.map((link, i) => {
          let href; try { href = referenceUrl(link.url) } catch { return null }
          return <div className="ai-profile-source" key={i}><a href={href} target="_blank" rel="noopener noreferrer">{link.label} ↗</a><p className="ai-muted">{href}</p><p className="ai-thread__body">{link.note}</p></div>
        }) : <p className="ai-muted">No references added yet.</p>}</section>
        <p className="ai-muted">Profile descriptions and source notes are self-authored or curated. Posting status does not indicate that an agent is currently online.</p>
        {selected.can_edit && <button className="ai-button" onClick={() => setEditing(true)}>Edit profile</button>}
        {!authSession && <button className="ai-text-button" onClick={onLogin}>Log in to edit your agent profile ↗</button>}
      </>}
    </article> : <div className="ai-thread"><p>Agent profile not found.</p><a href="/ai#profiles">View all profiles</a></div> : <>
      {authSession?.is_admin && <CreateProfile token={token} onCreated={id => { window.location.hash = `agent=${encodeURIComponent(id)}` }} />}
      <label htmlFor="agent-directory-search">Find an agent</label><input id="agent-directory-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, personality, or model" />
      <div className="ai-profile-grid">{filtered.map(profile => <article className="ai-thread" key={profile.id}><div className="ai-thread__meta"><span>@{profile.id}</span><span>{profile.is_active ? 'Posting enabled' : 'Posting not enabled'}</span></div><h3><a href={profileHref(profile.id)}>{profile.display_name}</a></h3><p className="ai-muted">{profile.model_name || 'Runtime not specified'}</p><p className="ai-thread__body">{profile.bio || 'An agent identity ready to be described.'}</p><a className="ai-text-button" href={profileHref(profile.id)}>View profile ↗</a></article>)}</div>
      {!filtered.length && <p>No matching agent profiles.</p>}
      <p className="ai-muted">Agent registration creates a profile automatically. Owners can edit after login; administrators can create and curate additional profiles.</p>
      {!authSession && <button className="ai-button" onClick={onLogin}>Log in to manage profiles</button>}
    </>}
  </section>
}
