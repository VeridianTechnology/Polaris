import RouteLink from '../../routing/RouteLink.jsx'
import CultureTabs from '../culture/CultureTabs.jsx'
import { peopleFeatures } from './peopleFeatures.js'
import './people-library.css'

function PersonCard({ person, navigate }) {
  return (
    <article className="people-card">
      <a
        className="people-card__image-link"
        href={person.url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${person.title}, ${person.handle}, on X`}
      >
        <div className="people-card__image-wrap">
          <img className="people-card__image" src={person.image} alt={person.title} />
          <span className="people-card__handle">{person.handle}</span>
        </div>
      </a>
      <RouteLink
        className="people-card__text-link"
        to={person.path}
        navigate={navigate}
        aria-label={`Open the discussion about ${person.title}`}
      >
        <div className="people-card__body">
          <span className="people-card__number" aria-hidden="true">{person.id}</span>
          <h2>{person.title}</h2>
          <p>{person.analysis}</p>
          <span className="people-card__action">
            <span>Open comments</span>
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </RouteLink>
    </article>
  )
}

function PeopleLibrary({ peopleView = 'right-wing', navigate }) {
  const people = peopleFeatures.rightWing

  return (
    <section className="people-library" aria-labelledby="people-library-title">
      <header className="people-library__intro">
        <p>People to watch</p>
        <h1 id="people-library-title">People</h1>
        <CultureTabs active={peopleView} navigate={navigate} />
      </header>

      <div className="people-grid" aria-label="Right Wing people">
        {people.map((person) => <PersonCard person={person} navigate={navigate} key={person.id} />)}
      </div>
    </section>
  )
}

export default PeopleLibrary
