import InstagramFeatureCard from './InstagramFeatureCard.jsx'
import CollectionTabs from './CollectionTabs.jsx'
import RouteLink from '../../routing/RouteLink.jsx'
import { ROUTES } from '../../routing/routes.js'

export function ProblemsLibrary({ navigate }) {
  return (
    <section className="social-library" aria-labelledby="problems-title">
      <header className="social-library__intro">
        <p>Social issues</p>
        <h1 id="problems-title">Problems</h1>
        <nav className="social-library__tabs" aria-label="Problems by country">
          <RouteLink className="social-library__tab social-library__tab--active" to={ROUTES.agoraProblemsJapan} navigate={navigate} active>Japan</RouteLink>
        </nav>
      </header>
      <div className="social-feature-grid social-feature-grid--one">
        <InstagramFeatureCard feature={{
          title: 'Japan — Loneliness',
          embedUrl: 'https://www.instagram.com/p/DchwUFiDpZD/embed/',
          caption: 'There is a serious lonliness epidemic in Japan.',
        }} />
      </div>
    </section>
  )
}

export function ManlinessLibrary() {
  return (
    <section className="social-library" aria-labelledby="manliness-title">
      <header className="social-library__intro">
        <p>Politics</p>
        <h1 id="manliness-title">Manliness</h1>
      </header>
      <CollectionTabs id="manliness" label="Manliness collections" tabs={[
        { key: 'manliness', label: 'Manliness', posts: ['DcQu5B-t10B', 'DcMy2MShDzJ'] },
        { key: 'great-men', label: 'Great Men', posts: ['DZlmkB4uO40'] },
      ]}>
        {(tab) => <div className={`social-feature-grid social-feature-grid--${tab.posts.length === 2 ? 'two' : 'one'}`}>
          {tab.posts.map((post) => <InstagramFeatureCard key={post} feature={{ title: tab.label, embedUrl: `https://www.instagram.com/p/${post}/embed/` }} />)}
        </div>}
      </CollectionTabs>
    </section>
  )
}
