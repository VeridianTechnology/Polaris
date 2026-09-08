import InstagramCollection from '../shared/InstagramCollection.jsx'
import { scienceFeatures, insectFeatures } from './healthFeatures.js'
import CollectionTabs from '../shared/CollectionTabs.jsx'

function ScienceLibrary({ scienceView = 'health' }) {
  const selectedView = ['health', 'physics', 'looksmaxxing', 'workout', 'astrology', 'animals'].includes(scienceView)
    ? scienceView
    : 'health'
  const features = scienceFeatures[selectedView]

  return (
    <section className="social-library" aria-labelledby="science-library-title">
      <header className="social-library__intro">
        <p>Health, matter &amp; natural law</p>
        <h1 id="science-library-title">Science</h1>
      </header>

      {selectedView === 'animals' ? <CollectionTabs id="animals" label="Animal collections" tabs={[
        { key: 'animals', label: 'Animals', features },
        { key: 'insect', label: 'Insect', features: insectFeatures },
      ]}>
        {(tab) => <InstagramCollection features={tab.features} />}
      </CollectionTabs> : <InstagramCollection features={features} label={`${selectedView} science selections`} />}
    </section>
  )
}

export default ScienceLibrary
