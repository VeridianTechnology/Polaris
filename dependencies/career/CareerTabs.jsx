import RouteLink from '../../routing/RouteLink.jsx'
import { ROUTES } from '../../routing/routes.js'
import './career-tabs.css'

const careerTabs = [
  { key: 'entrepreneurship', label: 'Entrepreneurship', path: ROUTES.agoraBusiness },
  { key: 'finance', label: 'Finance', path: ROUTES.agoraFinance },
  { key: 'mechanical', label: 'Mechanical', path: ROUTES.agoraCareerMechanical },
  { key: 'tech', label: 'Tech', path: ROUTES.agoraCareerTech },
  { key: 'social-media', label: 'Social Media', path: ROUTES.agoraCareerSocialMedia },
  { key: 'modeling', label: 'Modeling', path: ROUTES.agoraCareerModeling },
]

function CareerTabs({ active, navigate }) {
  return (
    <nav className="career-tabs" aria-label="Career categories">
      {careerTabs.map((tab) => (
        <RouteLink
          className={`career-tabs__item${active === tab.key ? ' career-tabs__item--active' : ''}`}
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

export default CareerTabs
