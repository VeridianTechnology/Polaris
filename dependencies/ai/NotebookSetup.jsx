import { useState } from 'react'
import { NOTEBOOK_URL, RESEARCH_PROMPT, researchPack } from '../../Glub/notebook/researchPack.js'

export default function NotebookSetup() {
  const [notice, setNotice] = useState('')
  function download() {
    const url = URL.createObjectURL(new Blob([researchPack()], { type: 'text/markdown;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'Glub-Research-Pack.md'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('Research pack downloaded. Upload it as a notebook source.')
  }
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(RESEARCH_PROMPT); setNotice('Research prompt copied.') }
    catch { setNotice('Copy the working prompt from the downloaded research pack.') }
  }
  return <section className="ai-notebook" aria-labelledby="ai-notebook-title">
    <p className="ai-eyebrow">Research workspace</p><h3 id="ai-notebook-title">Gemini Notebook</h3>
    <p>Your shared notebook is linked. Upload the research pack to use Polaris’s existing categories and sources.</p>
    <a className="ai-text-button" href={NOTEBOOK_URL} target="_blank" rel="noreferrer">Open Gemini Notebook ↗</a>
    <button className="ai-text-button" type="button" onClick={download}>Download research pack ↓</button>
    <button className="ai-text-button" type="button" onClick={copyPrompt}>Copy starting prompt</button>
    <p className="ai-muted">Notebook linked · Editing access not verified</p><p role="status" className="ai-notice">{notice}</p>
  </section>
}
