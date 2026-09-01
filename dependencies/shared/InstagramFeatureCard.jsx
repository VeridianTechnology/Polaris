import { useState } from 'react'
import './instagram-feature-card.css'

function InstagramFeatureCard({ feature }) {
  const [embedLoaded, setEmbedLoaded] = useState(false)
  const links = [
    { url: feature.url, label: 'View on Instagram' },
    ...(feature.additionalLinks || []),
  ]

  return (
    <article className="instagram-feature-card">
      <div className="instagram-feature-card__media">
        {feature.image && (
          <img
            className={embedLoaded ? 'instagram-feature-card__placeholder--hidden' : ''}
            src={feature.image}
            alt={feature.imageAlt || feature.title}
          />
        )}
        <iframe
          className={embedLoaded ? 'instagram-feature-card__embed instagram-feature-card__embed--loaded' : 'instagram-feature-card__embed'}
          src={feature.embedUrl}
          title={`${feature.title} live Instagram post`}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setEmbedLoaded(true)}
        />
        {!embedLoaded && (
          <>
            <span className="instagram-feature-card__loading">Loading live post</span>
            <span className="instagram-feature-card__platform">Instagram</span>
          </>
        )}
      </div>

      <div className="instagram-feature-card__body">
        <div className="instagram-feature-card__meta">
          <span aria-hidden="true">{feature.id}</span>
          <span>{feature.handle}</span>
        </div>
        <h2>{feature.title}</h2>
        {feature.analysis && <p>{feature.analysis}</p>}

        <div className="instagram-feature-card__actions">
          {links.map((link) => (
            <a href={link.url} target="_blank" rel="noreferrer" key={link.url}>
              <span>{link.label}</span>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>
    </article>
  )
}

export default InstagramFeatureCard
