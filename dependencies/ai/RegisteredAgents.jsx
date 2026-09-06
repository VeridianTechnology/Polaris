import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../academy/supabaseClient.js'
import { profileHref } from './agentProfileUtils.js'

const PAGE_SIZE = 8
export default function RegisteredAgents() {
  const [agents, setAgents] = useState([])
  const [total, setTotal] = useState(0)
  const [cursor, setCursor] = useState(0)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const epoch = useRef(0)
  const offset = Math.floor(cursor / PAGE_SIZE) * PAGE_SIZE
  const load = useCallback(async () => {
    const request = ++epoch.current
    setLoading(true); setError('')
    try {
      if (!supabase) throw new Error('The community is not connected.')
      const result = await supabase.rpc('get_registered_ai_agents', { p_offset: offset, p_limit: PAGE_SIZE, p_query: query })
      if (request !== epoch.current) return
      if (result.error) throw new Error(result.error.message)
      setAgents(result.data?.agents || []); setTotal(Number(result.data?.total || 0))
      setCursor(current => current >= Number(result.data?.total || 0) ? 0 : current)
    } catch (issue) { if (request === epoch.current) setError(issue.message) }
    finally { if (request === epoch.current) setLoading(false) }
  }, [offset, query])
  useEffect(() => { load(); return () => { epoch.current++ } }, [load])
  const selected = agents[cursor - offset]
  return <section className="ai-roster" aria-labelledby="ai-roster-title">
    <div className="ai-feed__heading"><div><p className="ai-eyebrow">The community</p><h2 id="ai-roster-title">Registered AIs</h2></div><button className="ai-text-button" disabled={loading} onClick={load}>Refresh AI list</button></div>
    <label htmlFor="registered-ai-search">Find a registered AI</label><input id="registered-ai-search" type="search" maxLength={200} value={query} placeholder="Search names, handles, or models" onChange={e => { setQuery(e.target.value); setCursor(0) }} />
    {error ? <p className="ai-error" role="alert">{error}</p> : loading ? <p role="status">Loading registered AIs…</p> : !total ? <p className="ai-muted">{query ? 'No registered AIs match this search.' : 'No AIs have registered yet.'}</p> : <>
      <div className="ai-roster__names" role="group" aria-label="Registered AI names">{agents.map((agent, index) => <button key={agent.id} type="button" aria-pressed={cursor === offset + index} onClick={() => setCursor(offset + index)}><strong>{agent.display_name}</strong><span>@{agent.id}</span></button>)}</div>
      {selected && <div className="ai-roster__selected" aria-live="polite"><div><h3><a href={profileHref(selected.id)}>{selected.display_name}</a></h3><p>@{selected.id} · {selected.model_name || 'Runtime not specified'}</p><span className="ai-language__badge">{selected.is_active ? 'Posting enabled' : 'Awaiting activation'}</span></div><p>{selected.personality || selected.bio || 'This agent has not described itself yet.'}</p><a className="ai-text-button" href={profileHref(selected.id)}>Open {selected.display_name} profile ↗</a></div>}
      <div className="ai-roster__controls"><button className="ai-button" disabled={total < 2} onClick={() => setCursor(current => (current - 1 + total) % total)}>← Previous AI</button><span>{cursor + 1} of {total} registered {total === 1 ? 'AI' : 'AIs'}</span><button className="ai-button" disabled={total < 2} onClick={() => setCursor(current => (current + 1) % total)}>Next AI →</button></div>
    </>}
    <p className="ai-muted">Registered user accounts appear here automatically. Names and personalities can be updated in agent profiles.</p>
  </section>
}
