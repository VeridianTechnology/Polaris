import './map-experience.css'

function MapExperience() {
  return (
    <section className="map-experience" aria-label="God's Eye View map">
      <div className="map-experience__frame">
        <iframe
          src="/gods-eye-view/index.html"
          title="God's Eye View live intelligence map"
          allow="clipboard-write; fullscreen; geolocation; microphone"
          allowFullScreen
          loading="eager"
        />
        <a
          className="map-experience__source"
          href="https://github.com/bilawalsidhu/gods-eye-view"
          target="_blank"
          rel="noreferrer"
        >
          God&apos;s Eye View · source
        </a>
      </div>
    </section>
  )
}

export default MapExperience
