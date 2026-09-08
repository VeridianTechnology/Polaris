import { financeFeatures } from './financeFeatures.js'
import StorySubmission, { useApprovedStories } from '../shared/StorySubmission.jsx'
import ReviewedInstagramSection from '../academy/ReviewedInstagramSection.jsx'
import RouteLink from '../../routing/RouteLink.jsx'
import { ROUTES } from '../../routing/routes.js'
import './finance-library.css'

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.25" />
      <path d="m10 8 6 4-6 4V8Z" fill="currentColor" />
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

function FinanceLibrary({ financeView = 'major-stories', navigate, authSession, onLogin }) {
  const activeView = ['history', 'lessons'].includes(financeView) ? financeView : 'major-stories'
  const approvedStories = useApprovedStories('finance')
  const features = [
    ...financeFeatures,
    ...approvedStories.map((story, index) => ({
      ...story,
      key: story.id,
      id: String(financeFeatures.length + index + 1).padStart(2, '0'),
    })),
  ]

  return (
    <section className="finance-library" aria-labelledby="finance-library-title">
      <div className="finance-library__intro-shell">
        <header className="finance-library__intro">
          <p>Research library</p>
          <h1 id="finance-library-title">Finance</h1>
          <nav className="finance-view-tabs" aria-label="Finance sections">
            <RouteLink className={`finance-view-tabs__item${activeView === 'major-stories' ? ' is-active' : ''}`} to={ROUTES.agoraFinance} navigate={navigate} active={activeView === 'major-stories'}>Major Stories</RouteLink>
            <RouteLink className={`finance-view-tabs__item${activeView === 'history' ? ' is-active' : ''}`} to={ROUTES.agoraFinanceHistory} navigate={navigate} active={activeView === 'history'}>History</RouteLink>
            <RouteLink className={`finance-view-tabs__item${activeView === 'lessons' ? ' is-active' : ''}`} to={ROUTES.agoraFinanceLessons} navigate={navigate} active={activeView === 'lessons'}>Lessons</RouteLink>
          </nav>

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

      {activeView === 'major-stories' ? (
        <div role="tabpanel">
          <StorySubmission category="finance" authSession={authSession} onLogin={onLogin} />
          <div className="finance-grid" aria-label="Major finance stories">
            {features.map((feature) => (
              <FinanceCard feature={feature} navigate={navigate} key={feature.key || feature.id} />
            ))}
          </div>
        </div>
      ) : activeView === 'history' ? (
        <div className="finance-history" role="tabpanel">
          <ReviewedInstagramSection collection="finance/history" />
        </div>
      ) : (
        <div className="finance-history" role="tabpanel">
          <ReviewedInstagramSection collection="finance/lessons" />
        </div>
      )}
    </section>
  )
}

export default FinanceLibrary
