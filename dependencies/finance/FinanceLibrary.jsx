import { useEffect, useRef, useState } from 'react'
import { financeFeatures } from './financeFeatures.js'
import StorySubmission, { useApprovedStories } from '../shared/StorySubmission.jsx'
import CareerTabs from '../career/CareerTabs.jsx'
import RouteLink from '../../routing/RouteLink.jsx'
import './finance-library.css'

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.25" />
      <path d="m10 8 6 4-6 4V8Z" fill="currentColor" />
    </svg>
  )
}

function IntroToggleIcon({ isOpen }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M5 10h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      {!isOpen && (
        <path d="M10 5v10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      )}
    </svg>
  )
}

function FinanceCard({ feature, navigate }) {
  const cardContents = (
    <>
      <div className="finance-card__image-wrap">
        <img
          className={`finance-card__image${feature.imageFit === 'contain' ? ' finance-card__image--contain' : ''}`}
          src={feature.image}
          alt=""
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = '/academy-logo.png'
          }}
        />
        <span className="finance-card__play" aria-hidden="true">
          <PlayIcon />
        </span>
      </div>

      <div className="finance-card__body">
        <span className="finance-card__number" aria-hidden="true">{feature.id}</span>
        <h2>{feature.title}</h2>
        <p>{feature.analysis}</p>
        <span className="finance-card__action">
          <PlayIcon />
          <span>{feature.path ? 'Open report' : feature.submitted ? 'Open source' : 'Watch video'}</span>
        </span>
        {feature.author && <small className="finance-card__author">Submitted by {feature.author}</small>}
      </div>
    </>
  )

  return (
    <article className="finance-card">
      {feature.path ? (
        <RouteLink
          className="finance-card__link"
          to={feature.path}
          navigate={navigate}
          aria-label={`Open ${feature.title}`}
        >
          {cardContents}
        </RouteLink>
      ) : (
        <a
          className="finance-card__link"
          href={feature.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Watch ${feature.title} on YouTube`}
        >
          {cardContents}
        </a>
      )}
    </article>
  )
}

function FinanceMeter({ label, value }) {
  return (
    <div className="finance-meter">
      <div className="finance-meter__label">
        <span>{label}</span>
        <strong>{value}/100</strong>
      </div>
      <div
        className="finance-meter__track"
        role="progressbar"
        aria-label={`${label} finance temperature`}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={value}
      >
        <span
          className="finance-meter__fill"
          style={{ '--meter-remaining': `${100 - value}%` }}
        />
      </div>
    </div>
  )
}

function FinanceLibrary({ navigate, authSession, onLogin }) {
  const [isIntroOpen, setIsIntroOpen] = useState(true)
  const introTimer = useRef(null)
  const approvedStories = useApprovedStories('finance')
  const features = [
    ...financeFeatures,
    ...approvedStories.map((story, index) => ({
      ...story,
      key: story.id,
      id: String(financeFeatures.length + index + 1).padStart(2, '0'),
    })),
  ]

  useEffect(() => {
    introTimer.current = setTimeout(() => setIsIntroOpen(false), 15_000)

    return () => clearTimeout(introTimer.current)
  }, [])

  const toggleIntro = () => {
    clearTimeout(introTimer.current)
    setIsIntroOpen((isOpen) => !isOpen)
  }

  return (
    <section
      className={`finance-library${isIntroOpen ? '' : ' finance-library--intro-closed'}`}
      aria-labelledby="finance-library-title"
    >
      <button
        className="finance-library__toggle"
        type="button"
        onClick={toggleIntro}
        aria-expanded={isIntroOpen}
        aria-controls="finance-library-intro"
        aria-label={isIntroOpen ? 'Close finance introduction' : 'Open finance introduction'}
      >
        <IntroToggleIcon isOpen={isIntroOpen} />
      </button>

      <div className="finance-library__intro-shell" id="finance-library-intro">
        <header className="finance-library__intro">
          <p>Research library</p>
          <h1 id="finance-library-title">Finance</h1>
          <CareerTabs active="finance" navigate={navigate} />

          <aside className="finance-temperature" aria-label="Finance market temperature">
            <FinanceMeter label="AI" value={90} />
            <FinanceMeter label="Crypto" value={45} />
            <p className="finance-temperature__analysis">
              While AI has cooled off a bit, financing and finance surrounding crypto is still red hot.
              Crypto is beginning to heat up.
            </p>
          </aside>
        </header>
      </div>

      <StorySubmission category="finance" authSession={authSession} onLogin={onLogin} />

      <div className="finance-grid" aria-label="Finance videos">
        {features.map((feature) => (
          <FinanceCard feature={feature} navigate={navigate} key={feature.key || feature.id} />
        ))}
      </div>
    </section>
  )
}

export default FinanceLibrary
