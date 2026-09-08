import { useCallback, useEffect, useRef, useState } from 'react'
import { formatTime, mediaShape, seekTime } from './reelGeometry.js'
import './reel-player.css'

export default function ReelPlayer({ feature, slides, onError }) {
  const player = useRef(null)
  const video = useRef(null)
  const closeButton = useRef(null)
  const opener = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(true)
  const [muted, setMuted] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [dimensions, setDimensions] = useState(null)
  const slide = slides[index]
  const isVideo = slide.type === 'video'

  const togglePlayback = useCallback(() => {
    const current = video.current
    if (!current) return
    if (current.paused) current.play().catch(() => setPaused(true))
    else current.pause()
  }, [])

  const seek = useCallback((delta) => {
    const current = video.current
    if (current && Number.isFinite(current.duration)) current.currentTime = seekTime(current.currentTime, delta, current.duration)
  }, [])

  const close = useCallback(() => {
    if (player.current?.matches(':popover-open')) player.current.hidePopover()
    setExpanded(false)
    opener.current?.focus({ preventScroll: true })
  }, [])

  const enlarge = (event) => {
    opener.current = event.currentTarget
    player.current.showPopover()
    setExpanded(true)
    closeButton.current?.focus({ preventScroll: true })
  }

  const move = useCallback((delta) => {
    setIndex((current) => Math.max(0, Math.min(slides.length - 1, current + delta)))
    setTime(0)
    setDuration(0)
    setPaused(true)
    setDimensions(null)
  }, [slides.length])

  useEffect(() => {
    if (!expanded) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const keydown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return }
      if (event.code === 'Space' && isVideo) {
        event.preventDefault()
        if (!event.repeat) togglePlayback()
      }
      if (event.target instanceof HTMLInputElement) return
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault()
        const direction = event.key === 'ArrowRight' ? 1 : -1
        if (isVideo) seek(direction * 5)
        else move(direction)
      }
      if (event.key === 'Tab') {
        const focusable = [...player.current.querySelectorAll('button:not([disabled]), a[href], input:not([disabled])')]
          .filter((element) => element.getClientRects().length)
        const first = focusable[0]
        const last = focusable.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    const wheel = (event) => {
      if (!isVideo || event.ctrlKey || Math.abs(event.deltaY) < 1) return
      event.preventDefault()
      seek(Math.sign(event.deltaY) * Math.min(2, Math.abs(event.deltaY) / 50))
    }
    const element = player.current
    document.addEventListener('keydown', keydown, true)
    element.addEventListener('wheel', wheel, { passive: false })
    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', keydown, true)
      element.removeEventListener('wheel', wheel)
    }
  }, [expanded, isVideo, close, move, seek, togglePlayback])

  return <div className="reel-player-slot">
    {/* The popover promotes this same DOM subtree into the top layer. The video
        is never moved, recreated, or given a new source when the viewer closes. */}
    <div ref={player} popover="manual" className="reel-player"
      role={expanded ? 'dialog' : 'group'} aria-modal={expanded ? 'true' : undefined}
      aria-label={feature.title} data-expanded={expanded} data-media-shape={mediaShape(dimensions?.width || slide.width, dimensions?.height || slide.height)}>
      <button ref={closeButton} className="reel-player__close" onClick={close} aria-label="Close enlarged reel">×</button>
      <div className="reel-player__frame">
        <header className="reel-player__header">
          <a href={feature.url} target="_blank" rel="noreferrer">{feature.username ? `@${feature.username}` : 'Instagram'}</a>
          <span>{slides.length > 1 ? `${index + 1} / ${slides.length}` : isVideo ? 'Reel' : 'Post'}</span>
        </header>
        <div className="reel-player__stage">
          {isVideo ? <video ref={video} key={index} src={slide.src} poster={slide.poster || feature.image}
            aria-label={feature.title} playsInline preload="metadata" muted={muted}
            onLoadedMetadata={(event) => {
              const current = event.currentTarget
              setDuration(Number.isFinite(current.duration) ? current.duration : 0)
              setDimensions({ width: current.videoWidth, height: current.videoHeight })
            }}
            onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
            onPlay={() => setPaused(false)} onPause={() => setPaused(true)} onEnded={() => setPaused(true)} onError={onError}
          /> : <img src={slide.src} alt={slide.alt || `${feature.title}, image ${index + 1}`}
            onLoad={(event) => setDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} onError={onError} />}
          {isVideo ? <>
            {['top', 'right', 'bottom', 'left'].map((edge) => <button key={edge}
              className={`reel-player__enlarge reel-player__enlarge--${edge}`}
              aria-label={`Enlarge ${feature.title}${edge === 'top' ? '' : ` (${edge} edge)`}`}
              tabIndex={edge === 'top' ? 0 : -1} onClick={enlarge} />)}
          </> : <button className="reel-player__enlarge reel-player__enlarge--image" aria-label={`Enlarge ${feature.title}`} onClick={enlarge} />}
          {isVideo && <button className={`reel-player__center${paused ? '' : ' reel-player__center--playing'}`}
            aria-label={paused ? 'Play reel' : 'Pause reel'} onClick={togglePlayback}><span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span></button>}
          <button className="reel-player__expand-icon" aria-label={`Expand ${feature.title}`} onClick={enlarge}>⛶</button>
          {slides.length > 1 && <>
            <button className="reel-player__previous" aria-label="Previous image" disabled={index === 0} onClick={() => move(-1)}>‹</button>
            <button className="reel-player__next" aria-label="Next image" disabled={index === slides.length - 1} onClick={() => move(1)}>›</button>
          </>}
        </div>
        {isVideo && <div className="reel-player__controls">
          <button onClick={togglePlayback} aria-label={paused ? 'Play' : 'Pause'}>{paused ? '▶' : 'Ⅱ'}</button>
          <input aria-label="Reel position" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(time, duration)}
            disabled={!duration} aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
            onChange={(event) => { if (video.current) video.current.currentTime = Number(event.target.value); setTime(Number(event.target.value)) }} />
          <span className="reel-player__time">{formatTime(time)} / {formatTime(duration)}</span>
          <button onClick={() => setMuted((current) => !current)} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? 'Unmute' : 'Mute'}</button>
        </div>}
        <a className="reel-player__instagram" href={feature.url} target="_blank" rel="noreferrer">View more on Instagram <span aria-hidden="true">↗</span></a>
      </div>
      {expanded && <p className="reel-player__help">{isVideo ? 'Space to pause · Scroll or ← → to seek · Esc to close' : '← → to browse · Esc to close'}</p>}
    </div>
  </div>
}
