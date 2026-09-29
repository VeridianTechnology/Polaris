import InstagramCollection from '../shared/InstagramCollection.jsx'
import { instagramSelections } from '../academy/reviewedInstagram.js'

function RaceLibrary() {
  return (
    <section className="social-library" aria-labelledby="race-library-title">
      <header className="social-library__intro">
        <p>Identity, demographics &amp; society</p>
        <h1 id="race-library-title">Race</h1>
      </header>
      <InstagramCollection features={instagramSelections('politics/race')} label="Race selections" />
    </section>
  )
}

export default RaceLibrary
