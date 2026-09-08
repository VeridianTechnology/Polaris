import { instagramAudit } from '../dependencies/shared/instagramAudit.js'

const cache = new Map()
const pending = new Map()
const ttl = 15 * 60 * 1000

function publicMediaUrl(value) {
  if (!value) return null
  const url = new URL(value)
  return url.protocol === 'https:' && /(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(url.hostname) ? url.href : null
}

export function parsePublicMedia(html) {
  const encoded = html.match(/"contextJSON":("(?:\\.|[^"\\])*")/)
  const media = encoded && JSON.parse(JSON.parse(encoded[1]))?.gql_data?.shortcode_media
  if (!media) return null
  const nodes = media.edge_sidecar_to_children?.edges?.map(({ node }) => node) || [media]
  const slides = nodes.map((node) => ({
    type: node.is_video ? 'video' : 'image',
    src: publicMediaUrl(node.is_video ? node.video_url : node.display_url),
    poster: publicMediaUrl(node.display_url),
    width: node.dimensions?.width || 0,
    height: node.dimensions?.height || 0,
    alt: node.accessibility_caption || '',
  }))
  return slides.length && slides.every((slide) => slide.src) ? { slides } : null
}

// Resolve only the public embeds already curated on the site. Signed media URLs
// expire, so refresh them on demand instead of saving them in the frontend bundle.
export async function resolvePublicMedia(post) {
  if (!/^[\w-]{11}$/.test(post || '') || !['video', 'post', 'preview'].includes(instagramAudit[post]?.status)) return null
  const cached = cache.get(post)
  if (cached && cached.expires > Date.now()) return cached.value
  if (pending.has(post)) return pending.get(post)
  const request = (async () => {
    const response = await fetch(`https://www.instagram.com/p/${post}/embed/`, {
      signal: AbortSignal.timeout(12000),
    })
    if (!response.ok) throw new Error('Public embed unavailable')
    const value = parsePublicMedia(await response.text())
    cache.set(post, { value, expires: Date.now() + (value ? ttl : 60000) })
    return value
  })()
  pending.set(post, request)
  try { return await request } finally { pending.delete(post) }
}

export async function mediaResponse(post) {
  try {
    const video = await resolvePublicMedia(post)
    return {
      statusCode: video ? 200 : 404,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=60' },
      body: JSON.stringify(video || { error: 'Public video unavailable' }),
    }
  } catch {
    return { statusCode: 503, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Public video unavailable' }) }
  }
}
