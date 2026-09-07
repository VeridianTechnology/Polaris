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
  const visible = prepared.filter((feature) => !unavailable.includes(feature))
    .sort((a, b) => Number(b.status === 'video') - Number(a.status === 'video'))
  const size = visible.length >= 3 ? 'three' : visible.length === 2 ? 'two' : 'one'
  return (
    <div className="instagram-collection" aria-label={label}>
      {visible.length > 0 && <div className={`social-feature-grid social-feature-grid--${size}`}>
        {visible.map((feature) => <InstagramFeatureCard
          key={feature.post || feature.id} feature={feature}
          onUnavailable={() => setFailed((current) => new Set([...current, feature.post]))}
        />)}
      </div>}
      {unavailable.length > 0 && <nav className="instagram-unavailable" aria-label="Private or unavailable posts">
        <p>Private or unavailable on Instagram</p>
        <div className="instagram-unavailable__links">
          {unavailable.map((feature) => <a key={feature.post || feature.id} href={feature.url} target="_blank" rel="noreferrer">
            {feature.title}<span aria-hidden="true">↗</span>
          </a>)}
        </div>
      </nav>}
    </div>
  )
}
