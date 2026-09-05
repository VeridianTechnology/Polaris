import InstagramFeatureCard from '../shared/InstagramFeatureCard.jsx'
import CareerTabs from './CareerTabs.jsx'
import { careerFeatures } from './careerFeatures.js'

function CareerLibrary({ careerView = 'mechanical', navigate }) {
  const selectedView = ['mechanical', 'tech', 'social-media', 'modeling'].includes(careerView) ? careerView : 'mechanical'
  const dataKey = selectedView === 'social-media' ? 'socialMedia' : selectedView
  const features = careerFeatures[dataKey]
  const gridSize = features.length >= 3 ? 'three' : features.length === 2 ? 'two' : 'one'

  return (
    <section className="social-library" aria-labelledby="career-library-title">
      <header className="social-library__intro">
        <p>Work, enterprise &amp; applied skill</p>
        <h1 id="career-library-title">Career</h1>
        <CareerTabs active={selectedView} navigate={navigate} />
      </header>

      <div className={`social-feature-grid social-feature-grid--${gridSize}`} aria-label={`${selectedView} career selections`}>
        {features.map((feature) => <InstagramFeatureCard feature={feature} key={feature.embedUrl} />)}
      </div>
    </section>
  )
}

export default CareerLibrary
