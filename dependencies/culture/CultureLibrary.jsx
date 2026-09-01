import InstagramFeatureCard from '../shared/InstagramFeatureCard.jsx'
import CultureTabs from './CultureTabs.jsx'
import { cultureFeatures } from './cultureFeatures.js'

function CultureLibrary({ cultureView = 'music', navigate }) {
  const selectedView = ['music', 'memes', 'comedy', 'new-age-athletes', 'art', 'history', 'fights', 'religion'].includes(cultureView)
    ? cultureView
    : 'music'
  const features = cultureFeatures[selectedView]
  const gridSize = features.length === 3 ? 'three' : features.length === 2 ? 'two' : 'one'

  return (
    <section className="social-library" aria-labelledby="culture-library-title">
      <header className="social-library__intro">
        <p>Sound, humor &amp; culture</p>
        <h1 id="culture-library-title">Culture</h1>
        <CultureTabs active={selectedView} navigate={navigate} />
      </header>

      <div className={`social-feature-grid social-feature-grid--${gridSize}`} aria-label={`${selectedView} selections`}>
        {features.map((feature) => <InstagramFeatureCard feature={feature} key={feature.id} />)}
      </div>
    </section>
  )
}

export default CultureLibrary
