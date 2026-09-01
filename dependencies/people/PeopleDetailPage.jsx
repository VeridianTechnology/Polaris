import RouteLink from '../../routing/RouteLink.jsx'
import { ROUTES } from '../../routing/routes.js'
import { VideoComments } from '../shared/VideoDetailPage.jsx'
import { peopleFeatures } from './peopleFeatures.js'
import './people-detail-page.css'

function PeopleDetailPage({ peopleSlug, navigate }) {
  const person = peopleFeatures.rightWing.find((entry) => entry.slug === peopleSlug)

  if (!person) return null

  const itemNumber = Number.parseInt(person.id, 10)

  return (
    <section className="people-detail" aria-labelledby="people-detail-title">
      <RouteLink className="people-detail__back" to={ROUTES.agoraPeopleRightWing} navigate={navigate}>
        <span aria-hidden="true">←</span>
        People index
      </RouteLink>

      <div className="people-detail__layout">
        <header className="people-detail__header">
          <p>Right Wing · Person {person.id} · September 2026</p>
          <h1 id="people-detail-title">{person.title}</h1>
          <p className="people-detail__summary">{person.analysis}</p>
          <a className="people-detail__source" href={person.url} target="_blank" rel="noreferrer">
            View on X ↗
          </a>
        </header>

        <div className="people-detail__main">
          <article className="people-detail__portrait">
            <p>Original source</p>
            <a href={person.url} target="_blank" rel="noreferrer" aria-label={`Open ${person.title} on X`}>
              <img src={person.image} alt={person.title} />
            </a>
            <a href={person.url} target="_blank" rel="noreferrer">
              {person.handle} on X ↗
            </a>
          </article>

          <VideoComments
            commentsTable="academy_people_comments"
            itemColumn="people_item_number"
            itemNumber={itemNumber}
            storageKey={person.commentStorageKey}
            maxComments={25}
          />
        </div>
      </div>
    </section>
  )
}

export default PeopleDetailPage
