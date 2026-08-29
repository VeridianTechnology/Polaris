import { freedomFeatures } from './freedomFeatures.js'
import RouteLink from '../../routing/RouteLink.jsx'
import './freedom-library.css'

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.25" />
      <path d="m10 8 6 4-6 4V8Z" fill="currentColor" />
    </svg>
  )
}

function FreedomCard({ feature, navigate }) {
  const cardContents = (
    <>
      <div className="freedom-card__status">
        <span aria-hidden="true" />
        <strong>Active</strong>
      </div>

      <div className="freedom-card__image-wrap">
        <img className="freedom-card__image" src={feature.image} alt="" />
        <span className="freedom-card__play" aria-hidden="true">
          <PlayIcon />
        </span>
      </div>

      <div className="freedom-card__body">
        <span className="freedom-card__number" aria-hidden="true">{feature.id}</span>
        <p>{feature.analysis}</p>
        <span className="freedom-card__action">
          <PlayIcon />
          <span>{feature.path ? 'Open report' : 'Watch video'}</span>
        </span>
      </div>
    </>
  )

  return (
    <article className="freedom-card">
      {feature.path ? (
        <RouteLink
          className="freedom-card__link"
          to={feature.path}
          navigate={navigate}
          aria-label={`Open ${feature.title}`}
        >
          {cardContents}
        </RouteLink>
      ) : (
        <a
          className="freedom-card__link"
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

function FreedomLibrary({ navigate }) {
  return (
    <section className="freedom-library" aria-labelledby="freedom-library-title">
      <header className="freedom-library__intro">
        <p>Civil liberties</p>
        <h1 id="freedom-library-title">Freedom</h1>

        <aside className="freedom-threat" aria-label="Freedom threat level">
          <h2>Freedom Threat</h2>
          <div className="freedom-threat__label">
            <span>Flock</span>
            <strong>100/100</strong>
          </div>
          <div
            className="freedom-threat__track"
            role="progressbar"
            aria-label="Flock freedom threat"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="100"
          >
            <span />
          </div>
          <p>Red hot</p>
        </aside>
      </header>

      <div className="freedom-grid" aria-label="Freedom and civil-liberties videos">
        {freedomFeatures.map((feature) => (
          <FreedomCard feature={feature} navigate={navigate} key={feature.id} />
        ))}
      </div>
    </section>
  )
}

export default FreedomLibrary
