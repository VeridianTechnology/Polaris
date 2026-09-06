import InstagramFeatureCard from '../shared/InstagramFeatureCard.jsx'
import { instagramSelections } from './reviewedInstagram.js'

export default function ReviewedInstagramSection({ collection }) {
  const features = instagramSelections(collection)
  if (!features.length) return null
  return (
    <section aria-label="Instagram selections" style={{ marginTop: '3rem' }}>
      <div className={`social-feature-grid social-feature-grid--${features.length >= 3 ? 'three' : features.length === 2 ? 'two' : 'one'}`}>
        {features.map((feature) => <InstagramFeatureCard key={feature.id} feature={feature} />)}
      </div>
    </section>
  )
}
