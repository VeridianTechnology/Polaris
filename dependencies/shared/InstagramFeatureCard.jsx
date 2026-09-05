import { useState } from 'react'
import './instagram-feature-card.css'

function InstagramFeatureCard({ feature }) {
  const [embedLoaded, setEmbedLoaded] = useState(false)

  return (
    <article className="instagram-feature-card">
      <div className="instagram-feature-card__media" style={feature.mediaAspectRatio ? { aspectRatio: feature.mediaAspectRatio } : undefined}>
        {feature.image && !feature.videoSrc && (
          <img
            className={embedLoaded ? 'instagram-feature-card__placeholder--hidden' : ''}
            src={feature.image}
            alt={feature.imageAlt || feature.title}
          />
        )}
        {feature.videoSrc ? (
          <video
            className="instagram-feature-card__video"
            src={feature.videoSrc}
            poster={feature.image}
            aria-label={feature.title}
            controls
            playsInline
            preload="metadata"
          />
        ) : <iframe
          className={embedLoaded ? 'instagram-feature-card__embed instagram-feature-card__embed--loaded' : 'instagram-feature-card__embed'}
          src={feature.embedUrl}
          title={`${feature.title} live Instagram post`}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setEmbedLoaded(true)}
        />}
        {!feature.videoSrc && !embedLoaded && (
          <>
            <span className="instagram-feature-card__loading">Loading live post</span>
            <span className="instagram-feature-card__platform">Instagram</span>
          </>
        )}
      </div>

      {feature.caption && <div className="instagram-feature-card__body"><p>{feature.caption}</p></div>}
    </article>
  )
}

export default InstagramFeatureCard
