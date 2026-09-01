import RouteLink from '../../routing/RouteLink.jsx'
import { ROUTES } from '../../routing/routes.js'

const cultureTabs = [
  { key: 'music', label: 'Music', path: ROUTES.agoraCultureMusic },
  { key: 'memes', label: 'Memes', path: ROUTES.agoraCultureMemes },
  { key: 'comedy', label: 'Comedy', path: ROUTES.agoraCultureComedy },
  { key: 'right-wing', label: 'Right Wing People', path: ROUTES.agoraPeopleRightWing },
  { key: 'new-age-athletes', label: 'New Age Athletes', path: ROUTES.agoraCultureNewAgeAthletes },
  { key: 'art', label: 'Art', path: ROUTES.agoraCultureArt },
  { key: 'history', label: 'History', path: ROUTES.agoraCultureHistory },
  { key: 'fights', label: 'Fights', path: ROUTES.agoraCultureFights },
  { key: 'religion', label: 'Religion', path: ROUTES.agoraCultureReligion },
]

function CultureTabs({ active, navigate }) {
  return (
    <nav className="social-library__tabs" aria-label="Culture categories">
      {cultureTabs.map((tab) => (
        <RouteLink
          className={`social-library__tab${active === tab.key ? ' social-library__tab--active' : ''}`}
          to={tab.path}
          navigate={navigate}
          active={active === tab.key}
          key={tab.key}
        >
          {tab.label}
        </RouteLink>
      ))}
    </nav>
  )
}

export default CultureTabs
