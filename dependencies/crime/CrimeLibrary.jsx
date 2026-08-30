import { crimeFeatures } from './crimeFeatures.js'
import StorySubmission, { useApprovedStories } from '../shared/StorySubmission.jsx'
import RouteLink from '../../routing/RouteLink.jsx'
import './crime-library.css'

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.25" />
      <path d="m10 8 6 4-6 4V8Z" fill="currentColor" />
    </svg>
  )
}

function CrimeCard({ feature, navigate }) {
  const cardContents = (
    <>
      {feature.status && (
        <div className="crime-card__status">
          <span aria-hidden="true" />
          <strong>{feature.status}</strong>
        </div>
      )}

      <div className="crime-card__image-wrap">
        <img
          className="crime-card__image"
          src={feature.image}
          alt=""
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = '/academy-logo.png'
          }}
        />
        <span className="crime-card__play" aria-hidden="true">
          <PlayIcon />
        </span>
      </div>

      <div className="crime-card__body">
        <span className="crime-card__number" aria-hidden="true">{feature.id}</span>
        <h2>{feature.title}</h2>
        <p>{feature.analysis}</p>
        <span className="crime-card__action">
          <PlayIcon />
          <span>{feature.path ? 'Open case file' : feature.submitted ? 'Open source' : 'Watch video'}</span>
        </span>
        {feature.author && <small className="crime-card__author">Submitted by {feature.author}</small>}
      </div>
    </>
  )

  return (
    <article className="crime-card">
      {feature.path ? (
        <RouteLink
          className="crime-card__link"
          to={feature.path}
          navigate={navigate}
          aria-label={`Open the ${feature.title} case file`}
        >
          {cardContents}
        </RouteLink>
      ) : (
        <a
          className="crime-card__link"
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

function CrimeLibrary({ navigate, authSession, onLogin }) {
  const approvedStories = useApprovedStories('crime')
  const features = [
    ...crimeFeatures,
    ...approvedStories.map((story, index) => ({
      ...story,
      key: story.id,
      id: String(crimeFeatures.length + index + 1).padStart(2, '0'),
      status: 'ACTIVE',
    })),
  ]

  return (
    <section className="crime-library" aria-labelledby="crime-library-title">
      <header className="crime-library__intro">
        <p>Investigations</p>
        <h1 id="crime-library-title">Crime</h1>
      </header>

      <StorySubmission category="crime" authSession={authSession} onLogin={onLogin} />

      <div className="crime-grid" aria-label="Crime and investigation videos">
        {features.map((feature) => (
          <CrimeCard feature={feature} navigate={navigate} key={feature.key || feature.id} />
        ))}
      </div>
    </section>
  )
}

export default CrimeLibrary
