import { useEffect, useRef, useState } from 'react'
import './soundbars.css'

const BAR_COUNT = 10

function SpeakerIcon({ isPlaying }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 10v4h3l4 3V7l-4 3H5Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
      {isPlaying ? (
        <>
          <path d="M15 9.5c.8.6 1.2 1.4 1.2 2.5s-.4 1.9-1.2 2.5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
          <path d="M17.4 7.6c1.3 1.1 2 2.5 2 4.4s-.7 3.3-2 4.4" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
        </>
      ) : (
        <path d="m15.4 10.1 3.8 3.8m0-3.8-3.8 3.8" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
      )}
    </svg>
  )
}

function SoundBars() {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current

    return () => {
      audio?.pause()
    }
  }, [])

  const toggleAudio = async () => {
    const audio = audioRef.current

    if (!audio) return

    if (!audio.paused) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    audio.volume = 1
    audio.muted = false

    try {
      await audio.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }

  return (
    <div className="sound-control">
      <audio
        ref={audioRef}
        src="/agora-homepage.mp3"
        preload="metadata"
        loop
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      <button
        className={`sound-toggle${isPlaying ? ' sound-toggle--playing' : ''}`}
        type="button"
        aria-label={isPlaying ? 'Turn homepage music off' : 'Turn homepage music on'}
        aria-pressed={isPlaying}
        onClick={toggleAudio}
      >
        <span className="sound-toggle__button">
          <SpeakerIcon isPlaying={isPlaying} />
        </span>
        <span className="sound-bars" aria-hidden="true">
          {Array.from({ length: BAR_COUNT }, (_, index) => (
            <span
              className="sound-bars__bar"
              key={index}
              style={{ '--bar-index': index }}
            />
          ))}
        </span>
      </button>
    </div>
  )
}

export default SoundBars
