import InstagramCollection from '../shared/InstagramCollection.jsx'
import { conspiracyFeatures } from './conspiracyFeatures.js'

function ConspiracyLibrary() {
  return (
    <section className="social-library" aria-labelledby="conspiracy-library-title">
      <header className="social-library__intro">
        <p>Claims outside the consensus</p>
        <h1 id="conspiracy-library-title">Conspiracy</h1>
      </header>

      <InstagramCollection features={conspiracyFeatures} label="Conspiracy selections" />
    </section>
  )
}

export default ConspiracyLibrary
