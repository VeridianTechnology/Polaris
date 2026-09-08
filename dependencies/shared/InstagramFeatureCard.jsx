import { useEffect, useRef, useState } from 'react'
import ReelPlayer from './ReelPlayer.jsx'
import './instagram-feature-card.css'

function InstagramFeatureCard({ feature, onUnavailable }) {
  const [embedLoaded, setEmbedLoaded] = useState(false)
  const mediaRef = useRef(null)
  const [publicMedia, setPublicMedia] = useState(null)
  const [resolved, setResolved] = useState(false)
  const [nativeFailed, setNativeFailed] = useState(false)
  const canResolve = !feature.videoSrc && ['video', 'post', 'preview'].includes(feature.status)
  const slides = feature.videoSrc ? [{ type: 'video', src: feature.videoSrc, poster: feature.image }] : publicMedia?.slides

  useEffect(() => {
    if (!canResolve || !feature.post) return
    const controller = new AbortController()
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      fetch(`/.netlify/functions/instagram-media?post=${encodeURIComponent(feature.post)}`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() : null)
        .then((media) => { if (!controller.signal.aborted) { setPublicMedia(media); setResolved(true) } })
        .catch(() => { if (!controller.signal.aborted) setResolved(true) })
    }, { rootMargin: '300px' })
    observer.observe(mediaRef.current)
    return () => { observer.disconnect(); controller.abort() }
  }, [canResolve, feature.post])

  return (
    <article className="instagram-feature-card" data-media-status={feature.status}>
      <div ref={mediaRef} className="instagram-feature-card__media" style={{ '--media-ratio': feature.mediaRatio || 1 }}>
        {slides && !nativeFailed ? <ReelPlayer feature={feature} slides={slides} onError={() => setNativeFailed(true)} /> : canResolve && !resolved ? <span className="instagram-feature-card__loading">Loading post</span> : <>
        {feature.image && !feature.videoSrc && (
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
          scrolling="no"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setEmbedLoaded(true)}
          onError={onUnavailable}
        />
        {!feature.videoSrc && !embedLoaded && (
          <>
            <span className="instagram-feature-card__loading">Loading live post</span>
            <span className="instagram-feature-card__platform">Instagram</span>
          </>
        )}
        </>}
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
