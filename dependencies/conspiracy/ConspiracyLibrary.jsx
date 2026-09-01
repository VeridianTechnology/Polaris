import InstagramFeatureCard from '../shared/InstagramFeatureCard.jsx'
import { conspiracyFeatures } from './conspiracyFeatures.js'

function ConspiracyLibrary() {
  return (
    <section className="social-library" aria-labelledby="conspiracy-library-title">
      <header className="social-library__intro">
        <p>Claims outside the consensus</p>
        <h1 id="conspiracy-library-title">Conspiracy</h1>
      </header>

      <div className="social-feature-grid social-feature-grid--one" aria-label="Conspiracy selections">
        {conspiracyFeatures.map((feature) => <InstagramFeatureCard feature={feature} key={feature.id} />)}
      </div>
    </section>
  )
}

export default ConspiracyLibrary
