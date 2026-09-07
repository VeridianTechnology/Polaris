import InstagramCollection from '../shared/InstagramCollection.jsx'
import { instagramSelections } from './reviewedInstagram.js'

export default function ReviewedInstagramSection({ collection }) {
  const features = instagramSelections(collection)
  if (!features.length) return null
  return (
    <section aria-label="Instagram selections" style={{ marginTop: '3rem' }}>
      <InstagramCollection features={features} />
    </section>
  )
}
