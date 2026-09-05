import RouteLink from '../../routing/RouteLink.jsx'
import { ROUTES } from '../../routing/routes.js'
import InstagramFeatureCard from '../shared/InstagramFeatureCard.jsx'
import { scienceFeatures, insectFeatures } from './healthFeatures.js'
import CollectionTabs from '../shared/CollectionTabs.jsx'

function ScienceLibrary({ scienceView = 'health', navigate }) {
  const selectedView = ['health', 'physics', 'looksmaxxing', 'workout', 'astrology', 'animals'].includes(scienceView)
    ? scienceView
    : 'health'
  const features = scienceFeatures[selectedView]
  const gridSize = features.length >= 3 ? 'three' : features.length === 2 ? 'two' : 'one'

  return (
    <section className="social-library" aria-labelledby="science-library-title">
      <header className="social-library__intro">
        <p>Health, matter &amp; natural law</p>
        <h1 id="science-library-title">Science</h1>
        <nav className="social-library__tabs" aria-label="Science categories">
          <RouteLink
            className={`social-library__tab${selectedView === 'health' ? ' social-library__tab--active' : ''}`}
            to={ROUTES.agoraScienceHealth}
            navigate={navigate}
            active={selectedView === 'health'}
          >
            Health
          </RouteLink>
          <RouteLink
            className={`social-library__tab${selectedView === 'physics' ? ' social-library__tab--active' : ''}`}
            to={ROUTES.agoraSciencePhysics}
            navigate={navigate}
            active={selectedView === 'physics'}
          >
            Physics
          </RouteLink>
          <RouteLink
            className={`social-library__tab${selectedView === 'looksmaxxing' ? ' social-library__tab--active' : ''}`}
            to={ROUTES.agoraScienceLooksmaxxing}
            navigate={navigate}
            active={selectedView === 'looksmaxxing'}
          >
            Looksmaxxing
          </RouteLink>
          <RouteLink
            className={`social-library__tab${selectedView === 'workout' ? ' social-library__tab--active' : ''}`}
            to={ROUTES.agoraScienceWorkout}
            navigate={navigate}
            active={selectedView === 'workout'}
          >
            Workout
          </RouteLink>
          <RouteLink
            className={`social-library__tab${selectedView === 'astrology' ? ' social-library__tab--active' : ''}`}
            to={ROUTES.agoraScienceAstrology}
            navigate={navigate}
            active={selectedView === 'astrology'}
          >
            Astrology
          </RouteLink>
          <RouteLink className={`social-library__tab${selectedView === 'animals' ? ' social-library__tab--active' : ''}`} to={ROUTES.agoraScienceAnimals} navigate={navigate} active={selectedView === 'animals'}>
            Animals
          </RouteLink>
        </nav>
      </header>

      {selectedView === 'animals' ? <CollectionTabs id="animals" label="Animal collections" tabs={[
        { key: 'animals', label: 'Animals', features },
        { key: 'insect', label: 'Insect', features: insectFeatures },
      ]}>
        {(tab) => <div className={`social-feature-grid social-feature-grid--${tab.features.length >= 3 ? 'three' : tab.features.length === 2 ? 'two' : 'one'}`}>
          {tab.features.map((feature) => <InstagramFeatureCard feature={feature} key={feature.embedUrl} />)}
        </div>}
      </CollectionTabs> : <div className={`social-feature-grid social-feature-grid--${gridSize}`} aria-label={`${selectedView} science selections`}>
        {features.map((feature) => <InstagramFeatureCard feature={feature} key={feature.embedUrl} />)}
      </div>}
    </section>
  )
}

export default ScienceLibrary
