import InstagramCollection from '../shared/InstagramCollection.jsx'
import { instagramSelections } from '../academy/reviewedInstagram.js'

function ImmigrationLibrary() {
  return (
    <section className="social-library" aria-labelledby="immigration-library-title">
      <header className="social-library__intro">
        <p>Movement, labor &amp; citizenship</p>
        <h1 id="immigration-library-title">Immigration</h1>
      </header>
      <InstagramCollection features={instagramSelections('politics/immigration')} label="Immigration selections" />
    </section>
  )
}

export default ImmigrationLibrary
