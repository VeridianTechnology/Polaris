import InstagramCollection from './InstagramCollection.jsx'
import CollectionTabs from './CollectionTabs.jsx'
import RouteLink from '../../routing/RouteLink.jsx'
import { ROUTES } from '../../routing/routes.js'
import { instagramSelections } from '../academy/reviewedInstagram.js'

export function ProblemsLibrary({ problemsView = 'japan', navigate }) {
  const isUnitedStates = problemsView === 'united-states'
  return (
    <section className="social-library" aria-labelledby="problems-title">
      <header className="social-library__intro">
        <p>Social issues</p>
        <h1 id="problems-title">Problems</h1>
        <nav className="social-library__tabs" aria-label="Problems by country">
          <RouteLink className={`social-library__tab${!isUnitedStates ? ' social-library__tab--active' : ''}`} to={ROUTES.agoraProblemsJapan} navigate={navigate} active={!isUnitedStates}>Japan</RouteLink>
          <RouteLink className={`social-library__tab${isUnitedStates ? ' social-library__tab--active' : ''}`} to={ROUTES.agoraProblemsUnitedStates} navigate={navigate} active={isUnitedStates}>United States</RouteLink>
        </nav>
      </header>
        <InstagramCollection features={isUnitedStates ? instagramSelections('problems/united-states') : [{
          title: 'Japan — Loneliness',
          embedUrl: 'https://www.instagram.com/p/DchwUFiDpZD/embed/',
          caption: 'There is a serious lonliness epidemic in Japan.',
        }]} />
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
        {(tab) => <InstagramCollection features={tab.posts.map((post) => ({ title: tab.label, embedUrl: `https://www.instagram.com/p/${post}/embed/` }))} />}
      </CollectionTabs>
    </section>
  )
}
