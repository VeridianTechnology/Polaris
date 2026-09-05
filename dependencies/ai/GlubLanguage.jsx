import { useRef, useState } from 'react'
import { ALPHABET, SCRIPT_NAME, alphabetSvg, glyphFor } from '../../Glub/language/alphabet.js'

export function GlubText({ text }) {
  return <span className="glub-script" role="img" aria-label={text}>
    <span aria-hidden="true">{text.split(/(\s+)/).map((part, index) => /^\s+$/.test(part)
      ? part
      : <span className="glub-script__word" key={index}>{Array.from(part).map((character, charIndex) => {
        const glyph = glyphFor(character)
        return glyph ? <svg key={charIndex} viewBox="0 0 24 24" className="glub-script__glyph" focusable="false"><path d={glyph.path} /></svg> : <span key={charIndex}>{character}</span>
      })}</span>)}</span>
  </span>
}

export function GlubMessage({ text, mode }) {
  return <div className="ai-thread__body">
    {mode !== 'english' && <GlubText text={text} />}
    {mode !== 'glyphs' && <span className={mode === 'both' ? 'glub-translation' : undefined}>{text}</span>}
  </div>
}

export default function GlubLanguage({ mode, onModeChange }) {
  const [sample, setSample] = useState('Glub observes the world.')
  const [selected, setSelected] = useState(ALPHABET[0])
  const [notice, setNotice] = useState('')
  const input = useRef(null)

  function insert(glyph) {
    setSelected(glyph)
    const start = input.current?.selectionStart ?? sample.length
    const end = input.current?.selectionEnd ?? sample.length
    if (sample.length - (end - start) >= 240) return
    setSample(sample.slice(0, start) + glyph.letter.toLowerCase() + sample.slice(end))
    requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(start + 1, start + 1) })
  }

  function download() {
    const url = URL.createObjectURL(new Blob([alphabetSvg()], { type: 'image/svg+xml' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'glub-alphabet-v1.svg'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('Alphabet sheet downloaded.')
  }

  return <aside className="ai-language" aria-labelledby="ai-language-title">
    <p className="ai-eyebrow">Alphabet / Version 01</p><h2 id="ai-language-title">{SCRIPT_NAME}</h2>
    <p>26 original letters. Ordinary text underneath.</p>
    <label htmlFor="glub-display">Read messages in</label>
    <select id="glub-display" value={mode} onChange={(event) => onModeChange(event.target.value)}>
      <option value="both">Glub + English</option><option value="english">English</option><option value="glyphs">Glub Script</option>
    </select>
    <div className="glub-alphabet" role="group" aria-label="Glub alphabet character picker">
      {ALPHABET.map((glyph) => <button type="button" key={glyph.letter} title={`${glyph.letter} — ${glyph.name}`} aria-label={`Insert ${glyph.letter} — ${glyph.name}`} onMouseDown={(event) => event.preventDefault()} onClick={() => insert(glyph)}>
        <GlubText text={glyph.letter} /><small aria-hidden="true">{glyph.letter}</small>
      </button>)}
    </div>
    <p className="glub-glyph-name" aria-live="polite">{selected.letter} / {selected.name}</p>
    <label htmlFor="glub-playground">Try the alphabet</label><textarea ref={input} id="glub-playground" value={sample} onChange={(event) => setSample(event.target.value)} rows={3} maxLength={240} />
    <div className="glub-preview"><GlubText text={sample || 'Glub'} /></div>
    <p className="ai-muted">Left to right. Numbers and punctuation stay familiar. The letter picker writes into the sample above.</p>
    <button className="ai-text-button" type="button" onClick={download}>Download alphabet ↗</button><p role="status" className="ai-notice">{notice}</p>
  </aside>
}
