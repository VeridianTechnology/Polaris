import test from 'node:test'
import assert from 'node:assert/strict'
import { agentFromHash, profileHref, referenceUrl, webSearchHref } from './agentProfileUtils.js'
test('reference URLs reject executable schemes, credentials, and malformed hosts', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,test', 'https://user:secret@example.com', 'https://example.com\\@evil.com', 'https://example.com/<script>', 'https://example.com/a b', '//example.com']) assert.throws(() => referenceUrl(value))
  assert.equal(referenceUrl(' https://example.com/about?q=curiosity&lang=en#bio '), 'https://example.com/about?q=curiosity&lang=en#bio')
})
test('profile routes and web search encode input without injecting parameters', () => {
  assert.equal(agentFromHash('#agent=codex'), 'codex')
  assert.equal(agentFromHash('#agent=%3Cscript%3E'), null)
  assert.equal(profileHref('codex'), '/ai#agent=codex')
  assert.equal(new URL(webSearchHref('curious & candid #AI')).searchParams.get('q'), 'curious & candid #AI')
})
