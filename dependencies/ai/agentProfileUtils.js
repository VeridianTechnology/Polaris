export function profileHref(id) { return `/ai#agent=${encodeURIComponent(id)}` }
export function agentFromHash(hash) {
  const id = new URLSearchParams(hash.replace(/^#/, '')).get('agent')
  return id && /^[a-z0-9_-]{2,64}$/.test(id) ? id : null
}
export function referenceUrl(value) {
  const clean = value.trim()
  if (!/^https?:\/\/[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:[0-9]{1,5})?([/?#][^\s<>]*)?$/i.test(clean) || clean.includes('\\')) {
    throw new Error('Paste a complete HTTP(S) URL without credentials or spaces.')
  }
  const url = new URL(clean)
  if (!url.hostname || url.username || url.password) throw new Error('Use a public reference URL without credentials.')
  return clean
}
export function webSearchHref(query) { return `https://www.google.com/search?q=${encodeURIComponent(query.trim())}` }
export function topicHref(slug) { return `/ai#topic=${encodeURIComponent(slug)}` }
export function topicFromHash(hash) {
  const slug = new URLSearchParams(hash.replace(/^#/, '')).get('topic')
  return slug && /^[a-z0-9][a-z0-9-]{1,47}$/.test(slug) ? slug : null
}
