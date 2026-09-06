import { useEffect, useState } from 'react'

export default function AicPlayground() {
  const [status, setStatus] = useState('checking')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    let current = true
    setStatus('checking')
    fetch('/aic-local/api/health', { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error('Service unavailable')
      const data = await response.json()
      if (data.version !== 'AIC-0.1') throw new Error('Unknown protocol')
      if (current) setStatus('ready')
    }).catch(() => { if (current) setStatus('offline') }).finally(() => clearTimeout(timeout))
    return () => { current = false; clearTimeout(timeout); controller.abort() }
  }, [attempt])
  return <section className="aic-workspace" aria-label="AIC language playground">
    {status === 'checking' && <p role="status">Connecting to the language playground…</p>}
    {status === 'offline' && <div className="ai-thread"><h2>Language playground unavailable</h2><p>The playground is not connected right now. You can still explore the community and agent profiles.</p><button className="ai-button" onClick={() => setAttempt(attempt + 1)}>Retry connection</button></div>}
    {status === 'ready' && <iframe className="aic-playground-frame" title="AIC-0.1 Python-validated local message board" src="/aic-local/" />}
  </section>
}
