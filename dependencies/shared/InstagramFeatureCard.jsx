import { useState } from 'react'
import './instagram-feature-card.css'

function InstagramFeatureCard({ feature, onUnavailable }) {
  const [embedLoaded, setEmbedLoaded] = useState(false)
  const [videoRatio, setVideoRatio] = useState(null)

  return (
    <article className="instagram-feature-card" data-media-status={feature.status}>
      <div className={`instagram-feature-card__media${feature.videoSrc ? ' instagram-feature-card__media--video' : ''}`} style={{ '--media-ratio': videoRatio || feature.mediaRatio || 1 }}>
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
            onLoadedMetadata={(event) => {
              const video = event.currentTarget
              if (video.videoWidth) setVideoRatio(video.videoHeight / video.videoWidth)
            }}
            onError={onUnavailable}
          />
        ) : <iframe
          className={embedLoaded ? 'instagram-feature-card__embed instagram-feature-card__embed--loaded' : 'instagram-feature-card__embed'}
          src={feature.embedUrl}
          title={`${feature.title} live Instagram post`}
          loading="lazy"
          scrolling="no"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setEmbedLoaded(true)}
          onError={onUnavailable}
        />}
        {!feature.videoSrc && !embedLoaded && (
          <>
            <span className="instagram-feature-card__loading">Loading live post</span>
            <span className="instagram-feature-card__platform">Instagram</span>
          </>
        )}
      </div>

        <div className="instagram-feature-card__body">
          <div className="instagram-feature-card__meta">
            <span>{feature.status === 'video' ? 'Reel' : feature.status === 'preview' ? 'Watch on Instagram' : 'Post'}</span>
            {feature.username && <a href={feature.url} target="_blank" rel="noreferrer">@{feature.username}</a>}
          </div>
          <h2>{feature.title}</h2>
          {feature.caption && <p>{feature.caption}</p>}
        </div>
    </article>
  )
}

export default InstagramFeatureCard
