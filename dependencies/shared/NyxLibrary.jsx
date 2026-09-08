import InstagramCollection from './InstagramCollection.jsx'
import { instagramSelections } from '../academy/reviewedInstagram.js'

function NyxLibrary() {
  return (
    <section className="social-library" aria-labelledby="nyx-library-title">
      <header className="social-library__intro">
        <p>Selections by NYX</p>
        <h1 id="nyx-library-title">NYX</h1>
      </header>
      <InstagramCollection features={instagramSelections('nyx')} label="NYX selections" />
    </section>
  )
}

export default NyxLibrary
