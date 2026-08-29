import { sanitizeUrl } from '@braintree/sanitize-url'

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<]+/gi
const TRAILING_PUNCTUATION = /[),.!?;:'\"]+$/

export const MAX_POST_LINKS = 3
export const MAX_POST_LINK_LENGTH = 200

export function normalizeSafeHttpUrl(value) {
  const candidate = String(value || '').replace(TRAILING_PUNCTUATION, '')
  const absoluteUrl = candidate.startsWith('www.') ? `https://${candidate}` : candidate
  const sanitized = sanitizeUrl(absoluteUrl)

  if (!sanitized || sanitized === 'about:blank') return null

  try {
    const parsed = new URL(sanitized)
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) return null
    return parsed.toString()
  } catch {
    return null
  }
}

export function inspectPostLinks(value) {
  const rawLinks = (value.match(URL_PATTERN) || []).map((match) => match.replace(TRAILING_PUNCTUATION, ''))
  const links = rawLinks.map(normalizeSafeHttpUrl).filter(Boolean)
  return {
    count: rawLinks.length,
    longestLength: rawLinks.reduce((longest, link) => Math.max(longest, link.length), 0),
    hasTooMany: rawLinks.length > MAX_POST_LINKS,
    hasOversizedLink: rawLinks.some((link) => link.length > MAX_POST_LINK_LENGTH),
    hasUnsafeLink: links.length !== rawLinks.length,
  }
}

export function countVisibleCharacters(value) {
  return value.replace(URL_PATTERN, '').trim().length
}

export function textWithoutLinks(value) {
  return value
    .replace(URL_PATTERN, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export function extractLinks(value) {
  const matches = value.match(URL_PATTERN) || []
  const normalized = matches.map(normalizeSafeHttpUrl).filter(Boolean)

  return [...new Set(normalized)]
}

export function getYouTubeVideoId(value) {
  try {
    const url = new URL(value)
    const hostname = url.hostname.replace(/^www\./, '')

    if (hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || null
    if (!['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(hostname)) return null

    if (url.pathname === '/watch') return url.searchParams.get('v')
    const pathParts = url.pathname.split('/').filter(Boolean)
    if (['embed', 'shorts', 'live'].includes(pathParts[0])) return pathParts[1] || null
  } catch {
    return null
  }

  return null
}

export function getLinkHostname(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return value
  }
}
