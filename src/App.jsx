import { useEffect, useState } from 'react'
import VisitorCoordinates from '../dependencies/homepage/geo/VisitorCoordinates.jsx'
import SoundBars from '../dependencies/homepage/soundbars/SoundBars.jsx'
import VentureCapitalGrid from '../dependencies/business/venture-capital/VentureCapitalGrid.jsx'
import PoliticalMap from '../dependencies/politics/map/PoliticalMap.jsx'
import AcademyFeed from '../dependencies/academy/AcademyFeed.jsx'
import MapExperience from '../dependencies/map/MapExperience.jsx'

const WELCOME_CACHE_KEY = 'agora-welcome-viewed'

const hasViewedWelcome = () => {
  try {
    return window.localStorage.getItem(WELCOME_CACHE_KEY) === 'true'
  } catch {
    return false
  }
}

const Arrow = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M14 7l5 5-5 5" />
  </svg>
)

const Mark = () => (
  <svg aria-hidden="true" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14.75" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M10.3 21.5 16 8.9l5.7 12.6M12.4 17h7.2"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

function App() {
  const [hasEntered, setHasEntered] = useState(hasViewedWelcome)
  const [activeSection, setActiveSection] = useState('business')
  const [politicalView, setPoliticalView] = useState('world')

  useEffect(() => {
    try {
      window.localStorage.setItem(WELCOME_CACHE_KEY, 'true')
    } catch {
      // The welcome screen still works when persistent storage is unavailable.
    }
  }, [])

  useEffect(() => {
    if (hasEntered) window.scrollTo(0, 0)
  }, [activeSection, hasEntered])

  const enterAgora = () => {
    try {
      window.localStorage.setItem(WELCOME_CACHE_KEY, 'true')
    } catch {
      // Enter normally when persistent storage is unavailable.
    }
    setActiveSection('business')
    setHasEntered(true)
  }
  const leaveAgora = () => setHasEntered(false)
  const handleEnteredBack = () => {
    if (activeSection === 'politics') {
      setPoliticalView('world')
      return
    }

    leaveAgora()
  }

  return (
    <main className={`hero${hasEntered ? ` hero--entered hero--${activeSection}` : ''}`}>
      <img
        className="hero__image hero__image--welcome"
        src="/agora-hero.png"
        alt={hasEntered ? '' : 'A luminous white tree rising between monumental columns'}
      />
      <img
        className="hero__image hero__image--city"
        src="/agora-city.png"
        alt={hasEntered ? 'A luminous monumental city carved from white marble' : ''}
      />
      <div className="hero__wash" />

      {hasEntered ? (
        <>
          <nav className="entered-toolbar" aria-label="Agora sections">
            <button className="back-button" type="button" onClick={handleEnteredBack}>
              <Arrow />
              <span>Back</span>
            </button>
            <div className="entered-tabs">
              <button
                className={`section-tab${activeSection === 'academy' ? ' section-tab--active' : ''}`}
                type="button"
                onClick={() => setActiveSection('academy')}
                aria-current={activeSection === 'academy' ? 'page' : undefined}
              >
                Academy
              </button>
              <button
                className={`section-tab${activeSection === 'business' ? ' section-tab--active' : ''}`}
                type="button"
                onClick={() => setActiveSection('business')}
                aria-current={activeSection === 'business' ? 'page' : undefined}
              >
                Business
              </button>
              <button
                className={`section-tab${activeSection === 'politics' ? ' section-tab--active' : ''}`}
                type="button"
                onClick={() => setActiveSection('politics')}
                aria-current={activeSection === 'politics' ? 'page' : undefined}
              >
                Politics
              </button>
              <button
                className={`section-tab${activeSection === 'map' ? ' section-tab--active' : ''}`}
                type="button"
                onClick={() => setActiveSection('map')}
                aria-current={activeSection === 'map' ? 'page' : undefined}
              >
                Map
              </button>
            </div>
            <p className="chapter-date">September of 2026</p>
          </nav>
          {activeSection === 'academy' ? (
            <AcademyFeed />
          ) : activeSection === 'business' ? (
            <VentureCapitalGrid />
          ) : activeSection === 'politics' ? (
            <PoliticalMap view={politicalView} onViewChange={setPoliticalView} />
          ) : (
            <MapExperience />
          )}
        </>
      ) : (
        <>
          <header className="site-header">
            <a className="brand" href="#top" aria-label="Agora home">
              <Mark />
              <span>AGORA</span>
            </a>

            <p className="edition">EST. IN THE DIGITAL AGE</p>

            <button className="enter-link" type="button" onClick={enterAgora}>
              <span>Enter the space</span>
              <Arrow />
            </button>
          </header>

          <section className="hero__content" id="top">
            <p className="eyebrow">Welcome to</p>
            <h1>Agora</h1>
            <p className="tagline">The First Digital Meeting Place</p>
          </section>

          <footer className="hero__footer" id="gather">
            <SoundBars />
            <button className="discover-link" type="button" onClick={enterAgora}>
              <span>Discover Agora</span>
              <span className="discover-link__line" />
            </button>
            <VisitorCoordinates />
          </footer>
        </>
      )}
    </main>
  )
}

export default App
