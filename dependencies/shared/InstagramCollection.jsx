import { useState } from 'react'
import InstagramFeatureCard from './InstagramFeatureCard.jsx'
import { instagramAudit } from './instagramAudit.js'
import { instagramEditorial } from './instagramEditorial.js'

export function prepareInstagramFeature(feature) {
  const post = (feature.embedUrl || feature.url || '').match(/\/(?:p|reel)\/([^/]+)/)?.[1]
  const audit = instagramAudit[post] || {}
  const editorial = instagramEditorial[post] || {}
  const genericTitle = !feature.title || /\s\d+$/.test(feature.title)
  return {
    ...feature,
    ...editorial,
    post,
    title: editorial.title || (genericTitle && audit.username ? `From @${audit.username}` : feature.title) || 'Instagram post',
    caption: editorial.caption ?? feature.caption ?? '',
    url: feature.url || (post ? `https://www.instagram.com/p/${post}/` : undefined),
    embedUrl: feature.embedUrl || (post ? `https://www.instagram.com/p/${post}/embed/` : undefined),
    status: feature.videoSrc ? 'video' : audit.status || 'unknown',
    mediaRatio: audit.mediaRatio || 1,
    username: audit.username || feature.handle?.replace(/^@/, ''),
  }
}

export default function InstagramCollection({ features, label = 'Instagram selections' }) {
  const [failed, setFailed] = useState(() => new Set())
  const prepared = features.map(prepareInstagramFeature)
  const unavailable = prepared.filter((feature) => feature.status === 'unavailable' || failed.has(feature.post))
  // Publicly playable video leads, still images and carousels follow, and
  // Instagram-only previews stay at the end of the main collection.
  const statusOrder = { video: 0, post: 1, preview: 2, unknown: 2 }
  const visible = prepared.filter((feature) => !unavailable.includes(feature))
    .sort((a, b) => (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2))
  const size = visible.length >= 3 ? 'three' : visible.length === 2 ? 'two' : 'one'
  return (
    <div className="instagram-collection" aria-label={label}>
      {visible.length > 0 && <div className={`social-feature-grid social-feature-grid--${size}`}>
        {visible.map((feature) => <InstagramFeatureCard
          key={feature.post || feature.id} feature={feature}
          onUnavailable={() => setFailed((current) => new Set([...current, feature.post]))}
        />)}
      </div>}
      {unavailable.length > 0 && <details className="instagram-unavailable">
        <summary>Viewer discretion &amp; Instagram-only <span>{unavailable.length}</span></summary>
        <nav className="instagram-unavailable__links" aria-label="Viewer discretion or unavailable posts">
          {unavailable.map((feature) => <a key={feature.post || feature.id} href={feature.url} target="_blank" rel="noreferrer">
            {feature.title}<span aria-hidden="true">↗</span>
          </a>)}
        </nav>
      </details>}
    </div>
  )
}
