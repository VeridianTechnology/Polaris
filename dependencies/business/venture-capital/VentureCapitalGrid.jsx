import ReviewedInstagramSection from '../../academy/ReviewedInstagramSection.jsx'
import { useEffect, useRef, useState } from 'react'
import { vcFirms } from './vcFirms.js'
import RouteLink from '../../../routing/RouteLink.jsx'
import { ROUTES } from '../../../routing/routes.js'
import './venture-capital-grid.css'

function CopyIcon({ copied }) {
  if (copied) {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
        <path d="m4.5 10.2 3.2 3.1 7.8-7.6" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <rect x="6.5" y="6.5" width="8.5" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <path d="M12.5 6.5V5A1.5 1.5 0 0 0 11 3.5H5A1.5 1.5 0 0 0 3.5 5v6A1.5 1.5 0 0 0 5 12.5h1.5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}

function CopyEmail({ email }) {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef(null)

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = email
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
    }

    setCopied(true)
    clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      className="vc-card__email"
      type="button"
      onClick={copyEmail}
      title={`Copy ${email}`}
      aria-label={`Copy ${email} to clipboard`}
    >
      <span>{email}</span>
      <CopyIcon copied={copied} />
      <span className="visually-hidden" aria-live="polite">
        {copied ? 'Email copied' : ''}
      </span>
    </button>
  )
}

function FirmCard({ firm }) {
  return (
    <article className="vc-card">
      <span className="vc-card__rating" aria-label={`Rating ${firm.rating}`}>
        {firm.rating}
      </span>

      <a
        className="vc-card__image-link"
        href={firm.website}
        target="_blank"
        rel="noreferrer"
        aria-label={`Visit the ${firm.name} website`}
      >
        <img className="vc-card__image" src={firm.image} alt={firm.name} />
      </a>

      <div className="vc-card__contact">
        <h2>Contact</h2>
        <a href={firm.twitter.url} target="_blank" rel="noreferrer">
          {firm.twitter.label}
        </a>
        <CopyEmail email={firm.email} />
      </div>
    </article>
  )
}

function VentureCapitalGrid({ businessView = 'firms', navigate }) {
  const activeView = businessView === 'advice' ? 'advice' : 'firms'

  return (
    <section className="vc-directory" aria-labelledby="vc-directory-title">
      <div className="vc-directory__intro-shell">
        <div className="vc-directory__intro">
          <p className="vc-directory__eyebrow">Funding directory</p>
          <h1 id="vc-directory-title">Venture Capital</h1>
          <nav className="vc-view-tabs" aria-label="Venture Capital sections">
            <RouteLink
              className={`vc-view-tabs__item${activeView === 'firms' ? ' vc-view-tabs__item--active' : ''}`}
              to={ROUTES.agoraBusiness}
              navigate={navigate}
              active={activeView === 'firms'}
            >
              Venture Firms
            </RouteLink>
            <RouteLink
              className={`vc-view-tabs__item${activeView === 'advice' ? ' vc-view-tabs__item--active' : ''}`}
              to={ROUTES.agoraBusinessAdvice}
              navigate={navigate}
              active={activeView === 'advice'}
            >
              Advice
            </RouteLink>
          </nav>
          <p className="vc-directory__subtitle">
            {activeView === 'firms'
              ? 'A directory of venture capital firms, with contact details and ratings to help you find funding for your idea.'
              : 'Selected perspectives and practical advice for founders building and funding a company.'}
          </p>
        </div>
      </div>

      {activeView === 'firms' ? (
        <div className="vc-grid" aria-label="Venture capital firms">
          {vcFirms.map((firm) => (
            <FirmCard firm={firm} key={firm.name} />
          ))}
        </div>
      ) : (
        <div className="vc-advice">
          <ReviewedInstagramSection collection="business" />
        </div>
      )}
    </section>
  )
}

export default VentureCapitalGrid
