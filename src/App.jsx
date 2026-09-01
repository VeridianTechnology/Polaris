import { useEffect, useState } from 'react'
import VisitorCoordinates from '../dependencies/homepage/geo/VisitorCoordinates.jsx'
import SoundBars from '../dependencies/homepage/soundbars/SoundBars.jsx'
import LaunchTimer from '../dependencies/homepage/LaunchTimer.jsx'
import VentureCapitalGrid from '../dependencies/business/venture-capital/VentureCapitalGrid.jsx'
import CareerLibrary from '../dependencies/career/CareerLibrary.jsx'
import FinanceLibrary from '../dependencies/finance/FinanceLibrary.jsx'
import { financeFollowUps } from '../dependencies/finance/financeFeatures.js'
import PoliticalMap from '../dependencies/politics/map/PoliticalMap.jsx'
import CrimeLibrary from '../dependencies/crime/CrimeLibrary.jsx'
import CrimeCase from '../dependencies/crime/CrimeCase.jsx'
import FreedomLibrary from '../dependencies/freedom/FreedomLibrary.jsx'
import CultureLibrary from '../dependencies/culture/CultureLibrary.jsx'
import ScienceLibrary from '../dependencies/health/HealthLibrary.jsx'
import ConspiracyLibrary from '../dependencies/conspiracy/ConspiracyLibrary.jsx'
import PeopleLibrary from '../dependencies/people/PeopleLibrary.jsx'
import PeopleDetailPage from '../dependencies/people/PeopleDetailPage.jsx'
import VideoDetailPage from '../dependencies/shared/VideoDetailPage.jsx'
import AcademyBoard from '../dependencies/academy/AcademyBoard.jsx'
import AcademyAdmin from '../dependencies/academy/admin/AcademyAdmin.jsx'
import AcademyProfile from '../dependencies/academy/profile/AcademyProfile.jsx'
import AgoraLoginDialog, { AgoraAuthArtworkButton } from '../dependencies/academy/auth/AgoraLoginDialog.jsx'
import { useAgoraAuth } from '../dependencies/academy/auth/agoraAuth.js'
import RouteLink from '../routing/RouteLink.jsx'
import useAppRouter from '../routing/useAppRouter.js'
import { academyProfilePath, parentPoliticalView, politicsPath, ROUTES } from '../routing/routes.js'

function SectionDropdown({ label, active, children }) {
  const closeSiblingMenus = (currentMenu) => {
    Array.from(currentMenu.parentElement?.children || []).forEach((menu) => {
      if (menu !== currentMenu && menu.matches?.('details.section-menu[open]')) {
        menu.removeAttribute('open')
      }
    })
  }

  const closeOtherMenus = (event) => {
    if (event.currentTarget.open) closeSiblingMenus(event.currentTarget)
  }

  const closeMenu = (event) => {
    event.currentTarget.closest('details')?.removeAttribute('open')
    document.activeElement?.blur()
  }

  return (
    <details
      className="section-menu"
      onMouseEnter={(event) => closeSiblingMenus(event.currentTarget)}
      onToggle={closeOtherMenus}
    >
      <summary className={`section-tab section-menu__trigger${active ? ' section-tab--active' : ''}`}>
        <span>{label}</span>
        <svg aria-hidden="true" viewBox="0 0 12 8" fill="none">
          <path d="m1.5 1.5 4.5 4 4.5-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="section-menu__popover">
        <div className="section-menu__items" role="group" aria-label={`${label} sections`} onClick={closeMenu}>
          {children}
        </div>
      </div>
    </details>
  )
}

function AppHeader({ route, navigate, authSession, authStatus, onLogin, onLogout }) {
  if (route.page === 'home') return null

  const isAcademy = route.page === 'agora'
  const isAgora = route.page === 'academy' || route.page === 'academy-profile' || route.page === 'admin'
  const sectionLogo = isAcademy ? '/academy-logo.png' : '/agora-logo.png'
  const sectionName = isAcademy ? 'Academy' : 'Agora'

  return (
    <header className={`app-header app-header--${route.page}`}>
      <nav className="primary-tabs" aria-label="Primary navigation">
        <img className="app-header__logo" src={sectionLogo} alt={`${sectionName} logo`} />
        <RouteLink
          className={`primary-tab${route.page === 'home' ? ' primary-tab--active' : ''}`}
          to={ROUTES.landing}
          navigate={navigate}
          active={route.page === 'home'}
        >
          Home
        </RouteLink>
        <RouteLink
          className={`primary-tab${isAgora ? ' primary-tab--active' : ''}`}
          to={ROUTES.academy}
          navigate={navigate}
          active={isAgora}
        >
          Agora
        </RouteLink>
        <RouteLink
          className={`primary-tab${isAcademy ? ' primary-tab--active' : ''}`}
          to={ROUTES.agoraBusiness}
          navigate={navigate}
          active={isAcademy}
        >
          Academy
        </RouteLink>
      </nav>

      {isAcademy ? (
        <nav className="entered-tabs" aria-label="Academy sections">
          <SectionDropdown label="Career" active={['business', 'finance', 'career'].includes(route.section)}>
            <RouteLink
              className={`section-menu__item${route.section === 'business' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraBusiness}
              navigate={navigate}
              active={route.section === 'business'}
            >
              Entrepreneurship
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.section === 'finance' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraFinance}
              navigate={navigate}
              active={route.section === 'finance'}
            >
              Finance
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.careerView === 'mechanical' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraCareerMechanical}
              navigate={navigate}
              active={route.careerView === 'mechanical'}
            >
              Mechanical
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.careerView === 'tech' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraCareerTech}
              navigate={navigate}
              active={route.careerView === 'tech'}
            >
              Tech
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.careerView === 'social-media' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraCareerSocialMedia}
              navigate={navigate}
              active={route.careerView === 'social-media'}
            >
              Social Media
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.careerView === 'modeling' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraCareerModeling}
              navigate={navigate}
              active={route.careerView === 'modeling'}
            >
              Modeling
            </RouteLink>
          </SectionDropdown>
          <SectionDropdown
            label="Politics"
            active={['politics', 'crime', 'freedom', 'conspiracy'].includes(route.section)}
          >
            <RouteLink
              className={`section-menu__item${route.section === 'crime' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraCrime}
              navigate={navigate}
              active={route.section === 'crime'}
            >
              Crime
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.section === 'freedom' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraFreedom}
              navigate={navigate}
              active={route.section === 'freedom'}
            >
              Freedom
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.section === 'politics' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraPolitics}
              navigate={navigate}
              active={route.section === 'politics'}
            >
              Map
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.section === 'conspiracy' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraConspiracy}
              navigate={navigate}
              active={route.section === 'conspiracy'}
            >
              Conspiracy
            </RouteLink>
          </SectionDropdown>
          <SectionDropdown label="Culture" active={route.section === 'culture' || route.section === 'people'}>
            <RouteLink
              className={`section-menu__item${route.cultureView === 'music' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraCultureMusic}
              navigate={navigate}
              active={route.cultureView === 'music'}
            >
              Music
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.cultureView === 'memes' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraCultureMemes}
              navigate={navigate}
              active={route.cultureView === 'memes'}
            >
              Memes
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.cultureView === 'comedy' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraCultureComedy}
              navigate={navigate}
              active={route.cultureView === 'comedy'}
            >
              Comedy
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.peopleView === 'right-wing' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraPeopleRightWing}
              navigate={navigate}
              active={route.peopleView === 'right-wing'}
            >
              Right Wing People
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.cultureView === 'new-age-athletes' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraCultureNewAgeAthletes}
              navigate={navigate}
              active={route.cultureView === 'new-age-athletes'}
            >
              New Age Athletes
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.cultureView === 'art' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraCultureArt}
              navigate={navigate}
              active={route.cultureView === 'art'}
            >
              Art
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.cultureView === 'history' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraCultureHistory}
              navigate={navigate}
              active={route.cultureView === 'history'}
            >
              History
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.cultureView === 'fights' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraCultureFights}
              navigate={navigate}
              active={route.cultureView === 'fights'}
            >
              Fights
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.cultureView === 'religion' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraCultureReligion}
              navigate={navigate}
              active={route.cultureView === 'religion'}
            >
              Religion
            </RouteLink>
          </SectionDropdown>
          <SectionDropdown label="Science" active={route.section === 'science'}>
            <RouteLink
              className={`section-menu__item${route.scienceView === 'health' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraScienceHealth}
              navigate={navigate}
              active={route.scienceView === 'health'}
            >
              Health
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.scienceView === 'physics' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraSciencePhysics}
              navigate={navigate}
              active={route.scienceView === 'physics'}
            >
              Physics
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.scienceView === 'looksmaxxing' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraScienceLooksmaxxing}
              navigate={navigate}
              active={route.scienceView === 'looksmaxxing'}
            >
              Looksmaxxing
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.scienceView === 'workout' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraScienceWorkout}
              navigate={navigate}
              active={route.scienceView === 'workout'}
            >
              Workout
            </RouteLink>
            <RouteLink
              className={`section-menu__item${route.scienceView === 'astrology' ? ' section-menu__item--active' : ''}`}
              to={ROUTES.agoraScienceAstrology}
              navigate={navigate}
              active={route.scienceView === 'astrology'}
            >
              Astrology
            </RouteLink>
          </SectionDropdown>
        </nav>
      ) : <span aria-hidden="true" />}

      <div className="app-header__account">
        <p className="chapter-date">September of 2026</p>
        {authStatus !== 'loading' && (
          <AgoraAuthArtworkButton
            mode={authSession ? 'logout' : 'login'}
            className="app-header__auth-button"
            onClick={authSession ? onLogout : onLogin}
          />
        )}
      </div>
    </header>
  )
}

function HomePage({ navigate }) {
  return (
    <>
      <section className="hero__content" id="top">
        <img className="home-logo" src="/polaris-logo.png" alt="Polaris" />
        <p className="eyebrow">Welcome to</p>
        <h1>Polaris</h1>
        <p className="tagline">You're new digital home</p>
      </section>

      <LaunchTimer />
      <footer className="hero__footer" id="gather">
        <SoundBars />
        <RouteLink className="discover-link" to={ROUTES.academy} navigate={navigate}>
          <span>Discover Polaris</span>
          <span className="discover-link__line" />
        </RouteLink>
        <VisitorCoordinates />
      </footer>
    </>
  )
}

function App() {
  const { route, navigate } = useAppRouter()
  const { session: authSession, status: authStatus, login, register, logout } = useAgoraAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const isHome = route.page === 'home'
  const isLanding = isHome
  const heroMode = route.page === 'agora' ? route.section : route.page
  const politicalView = route.politicalView || 'world'
  const enteredBackground = route.section === 'finance'
    ? '/finance-background.jpg'
    : route.section === 'crime'
      ? '/crime-background.jpg'
      : '/agora-city.png'
  const enteredBackgroundAlt = route.section === 'finance'
    ? 'A luminous white pyramid complex'
    : route.section === 'crime'
      ? 'A pale monumental circular plaza'
      : 'A luminous monumental city carved from white marble'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route.path])

  useEffect(() => {
    const isAgora = route.page === 'academy' || route.page === 'academy-profile' || route.page === 'admin'
    const iconPath = isAgora
      ? '/agora-logo.png'
      : route.page === 'agora'
        ? '/academy-logo.png'
        : '/polaris-logo.png'
    const detailPageTitle = route.peopleCase === 'zoomerwoman'
      ? 'New Right Wing Darling — People — Polaris'
      : route.peopleCase === 'paul-miller'
        ? 'Paul Miller — People — Polaris'
        : route.crimeCase === 'lindsay-clancy'
      ? 'Lindsay Clancy — Crime — Polaris'
      : route.crimeCase === 'hindu-cult-investigation'
        ? 'Hindu Cult Investigation — Crime — Polaris'
        : route.financeCase === 'strategy-room'
          ? 'Finance Report 01 — Polaris'
          : route.financeCase === 'crude-oil-to-motion'
            ? 'Follow-up Video 1 — Finance — Polaris'
            : route.financeCase === 'tidal-power'
              ? 'Video 2: Tidal Power — Finance — Polaris'
          : route.freedomCase === 'flock-cameras'
            ? 'Flock Cameras — Freedom — Polaris'
            : null
    const academySectionTitle = route.section === 'business'
      ? 'Entrepreneurship'
      : route.section === 'career'
        ? route.careerView === 'tech'
          ? 'Career Tech'
          : route.careerView === 'social-media'
            ? 'Career Social Media'
            : route.careerView === 'modeling'
              ? 'Career Modeling'
            : 'Mechanical Career'
        : route.section === 'politics'
          ? 'Map'
          : route.section === 'people'
            ? 'Right Wing'
            : route.section
              ? `${route.section.charAt(0).toUpperCase()}${route.section.slice(1)}`
              : 'Academy'
    const pageTitle = isAgora
      ? route.page === 'admin'
        ? 'Story Approvals — Polaris'
        : route.page === 'academy-profile'
          ? `${route.profileUsername ? `@${route.profileUsername}` : `Profile ${String(route.profileNumber).padStart(4, '0')}`} — Agora — Polaris`
          : 'Agora — Polaris'
      : route.page === 'agora'
        ? detailPageTitle || `Academy ${academySectionTitle} — Polaris`
        : 'Polaris — Your New Digital Home'
    let favicon = document.querySelector('link[rel="icon"]')

    if (!favicon) {
      favicon = document.createElement('link')
      favicon.rel = 'icon'
      document.head.append(favicon)
    }

    favicon.type = 'image/png'
    favicon.href = iconPath
    document.title = pageTitle
  }, [route.page, route.section, route.careerView, route.crimeCase, route.financeCase, route.freedomCase, route.peopleCase, route.profileNumber, route.profileUsername])

  const changePoliticalView = (view) => navigate(politicsPath(view))
  const leavePoliticalView = () => navigate(politicsPath(parentPoliticalView(politicalView)))
  const loginAndOpenAgora = async (...credentials) => {
    const nextSession = await login(...credentials)
    navigate(ROUTES.academy, { replace: true })
    return nextSession
  }
  const registerAndOpenAgora = async (...credentials) => {
    const nextSession = await register(...credentials)
    navigate(ROUTES.academy, { replace: true })
    return nextSession
  }

  return (
    <main className={`hero${isLanding ? '' : ` hero--entered hero--${heroMode}`}`}>
      {route.page !== 'academy' && route.page !== 'academy-profile' && route.page !== 'admin' && (
        <>
          <img
            className="hero__image hero__image--welcome"
            src="/agora-hero.png"
            alt={isLanding ? 'A luminous white tree rising between monumental columns' : ''}
          />
          <img
            className="hero__image hero__image--city"
            src={enteredBackground}
            alt={isLanding ? '' : enteredBackgroundAlt}
          />
          <div className="hero__wash" />
        </>
      )}

      <AppHeader
        route={route}
        navigate={navigate}
        authSession={authSession}
        authStatus={authStatus}
        onLogin={() => setLoginOpen(true)}
        onLogout={logout}
      />

      {route.page === 'home' && (
        <HomePage navigate={navigate} />
      )}
      {route.page === 'academy' && (
        <AcademyBoard
          navigate={navigate}
          authSession={authSession}
          onLogin={() => setLoginOpen(true)}
        />
      )}
      {route.page === 'academy-profile' && (
        <AcademyProfile
          profileUsername={route.profileUsername}
          profileNumber={route.profileNumber}
          authSession={authSession}
          onLogin={() => setLoginOpen(true)}
          onReturn={() => navigate(ROUTES.academy)}
          onOpenAdmin={() => navigate(ROUTES.academyAdmin)}
          onCanonicalize={(username) => navigate(academyProfilePath(username), { replace: true })}
        />
      )}
      {route.page === 'admin' && (
        <AcademyAdmin
          authSession={authSession}
          authStatus={authStatus}
          onLogin={() => setLoginOpen(true)}
          onReturn={() => navigate(ROUTES.academy)}
        />
      )}
      {route.page === 'agora' && route.section === 'business' && <VentureCapitalGrid navigate={navigate} />}
      {route.page === 'agora' && route.section === 'career' && (
        <CareerLibrary careerView={route.careerView} navigate={navigate} />
      )}
      {route.page === 'agora' && route.section === 'finance' && (
        route.financeCase === 'strategy-room' ? (
          <VideoDetailPage
            navigate={navigate}
            backPath={ROUTES.agoraFinance}
            backLabel="Finance index"
            eyebrow="Finance report"
            itemNumber={1}
            title="Inside the Strategy Room"
            hideTitle
            analysis="McKinsey basically thinks there's going to be three times the US national debt in infrastructure spending over the next couple of decades, tons and tons of money basically. Investors and big-wigs can't get enough, worth looking into. Obviously all of this is going to datacenters, whether that means in space or on land or in the sea, we don't know yet."
            followUps={financeFollowUps}
            embedUrl="https://www.youtube.com/embed/LL9iuTpAmjA"
            sourceUrl="https://www.youtube.com/watch?v=LL9iuTpAmjA"
            commentsTable="academy_finance_comments"
            commentItemColumn="finance_item_number"
            commentStorageKey="polaris-finance-strategy-room-comments"
          />
        ) : route.financeCase === 'crude-oil-to-motion' ? (
          <VideoDetailPage
            navigate={navigate}
            backPath={ROUTES.agoraFinanceStrategyRoom}
            backLabel="Primary finance report"
            eyebrow="Finance follow-up"
            itemNumber={2}
            title="Follow-up Video #1"
            analysis={financeFollowUps[0].analysis}
            embedUrl={financeFollowUps[0].embedUrl}
            sourceUrl={financeFollowUps[0].url}
            commentsTable="academy_finance_comments"
            commentItemColumn="finance_item_number"
            commentStorageKey="polaris-finance-crude-oil-comments"
          />
        ) : route.financeCase === 'tidal-power' ? (
          <VideoDetailPage
            navigate={navigate}
            backPath={ROUTES.agoraFinanceStrategyRoom}
            backLabel="Primary finance report"
            eyebrow="Finance follow-up"
            itemNumber={3}
            title="Video #2"
            analysis={financeFollowUps[1].analysis}
            embedUrl={financeFollowUps[1].embedUrl}
            sourceUrl={financeFollowUps[1].url}
            commentsTable="academy_finance_comments"
            commentItemColumn="finance_item_number"
            commentStorageKey="polaris-finance-tidal-power-comments"
          />
        ) : <FinanceLibrary navigate={navigate} authSession={authSession} onLogin={() => setLoginOpen(true)} />
      )}
      {route.page === 'agora' && route.section === 'crime' && (
        route.crimeCase === 'lindsay-clancy'
          ? <CrimeCase navigate={navigate} />
          : route.crimeCase === 'hindu-cult-investigation'
            ? (
              <VideoDetailPage
                navigate={navigate}
                backPath={ROUTES.agoraCrime}
                backLabel="Crime index"
                eyebrow="Case file"
                itemNumber={1}
                title={'Hindu Cult Investi\u00ADgation'}
                status="ACTIVE"
                analysis="Exposing a child abuse Hindu cult and the people covering it up, amazing top tier journalism, 10/10. It's like watching a mini doc on a new mini Epstein."
                embedUrl="https://www.youtube.com/embed/ES82FWeOnU4?si=PFGycuXsiHB1TlLp"
                sourceUrl="https://www.youtube.com/watch?v=ES82FWeOnU4"
                commentsTable="academy_crime_comments"
                commentItemColumn="crime_item_number"
                commentStorageKey="polaris-crime-hindu-cult-comments"
              />
            )
            : <CrimeLibrary navigate={navigate} authSession={authSession} onLogin={() => setLoginOpen(true)} />
      )}
      {route.page === 'agora' && route.section === 'freedom' && (
        route.freedomCase === 'flock-cameras' ? (
          <VideoDetailPage
            navigate={navigate}
            backPath={ROUTES.agoraFreedom}
            backLabel="Freedom index"
            eyebrow="Freedom report"
            itemNumber={1}
            title="Flock Cameras"
            status="ACTIVE"
            analysis="Flock Cameras are going up all over the United States, orginally to track criminals, they're being used illictly by police for personal uses. Further, this creeps majorly on freedom in an a unique and unprecedent way."
            embedUrl="https://www.youtube.com/embed/S3MQLlMbS-Y"
            sourceUrl="https://www.youtube.com/watch?v=S3MQLlMbS-Y"
            commentsTable="academy_freedom_comments"
            commentItemColumn="freedom_item_number"
            commentStorageKey="polaris-freedom-flock-cameras-comments"
          />
        ) : <FreedomLibrary navigate={navigate} authSession={authSession} onLogin={() => setLoginOpen(true)} />
      )}
      {route.page === 'agora' && route.section === 'culture' && (
        <CultureLibrary cultureView={route.cultureView} navigate={navigate} />
      )}
      {route.page === 'agora' && route.section === 'science' && (
        <ScienceLibrary scienceView={route.scienceView} navigate={navigate} />
      )}
      {route.page === 'agora' && route.section === 'conspiracy' && <ConspiracyLibrary />}
      {route.page === 'agora' && route.section === 'people' && (
        route.peopleCase
          ? <PeopleDetailPage peopleSlug={route.peopleCase} navigate={navigate} />
          : <PeopleLibrary peopleView={route.peopleView} navigate={navigate} />
      )}
      {route.page === 'agora' && route.section === 'politics' && (
        <PoliticalMap
          view={politicalView}
          onViewChange={changePoliticalView}
          onBack={leavePoliticalView}
        />
      )}

      <AgoraLoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={loginAndOpenAgora}
        onRegister={registerAndOpenAgora}
      />
    </main>
  )
}

export default App
