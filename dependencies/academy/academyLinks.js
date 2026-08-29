const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<]+/gi
const TRAILING_PUNCTUATION = /[),.!?;:'\"]+$/

export const MAX_POST_LINKS = 3
export const MAX_POST_LINK_LENGTH = 200

export function inspectPostLinks(value) {
  const links = (value.match(URL_PATTERN) || []).map((match) => match.replace(TRAILING_PUNCTUATION, ''))
  return {
    count: links.length,
    longestLength: links.reduce((longest, link) => Math.max(longest, link.length), 0),
    hasTooMany: links.length > MAX_POST_LINKS,
    hasOversizedLink: links.some((link) => link.length > MAX_POST_LINK_LENGTH),
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
  const normalized = matches.map((match) => {
    const cleanUrl = match.replace(TRAILING_PUNCTUATION, '')
    return cleanUrl.startsWith('www.') ? `https://${cleanUrl}` : cleanUrl
  })

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
