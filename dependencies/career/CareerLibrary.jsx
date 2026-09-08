import InstagramCollection from '../shared/InstagramCollection.jsx'
import { careerFeatures } from './careerFeatures.js'

function CareerLibrary({ careerView = 'mechanical' }) {
  const selectedView = ['mechanical', 'tech', 'social-media', 'modeling'].includes(careerView) ? careerView : 'mechanical'
  const dataKey = selectedView === 'social-media' ? 'socialMedia' : selectedView
  const features = careerFeatures[dataKey]

  return (
    <section className="social-library" aria-labelledby="career-library-title">
      <header className="social-library__intro">
        <p>Work, enterprise &amp; applied skill</p>
        <h1 id="career-library-title">Career</h1>
      </header>

      <InstagramCollection features={features} label={`${selectedView} career selections`} />
    </section>
  )
}

export default CareerLibrary
