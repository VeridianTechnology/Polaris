import { useEffect, useState } from 'react'
import VisitorCoordinates from '../dependencies/homepage/geo/VisitorCoordinates.jsx'
import SoundBars from '../dependencies/homepage/soundbars/SoundBars.jsx'
import LaunchTimer from '../dependencies/homepage/LaunchTimer.jsx'
import InviteWelcome from '../dependencies/homepage/InviteWelcome.jsx'
import VentureCapitalGrid from '../dependencies/business/venture-capital/VentureCapitalGrid.jsx'
import FinanceLibrary from '../dependencies/finance/FinanceLibrary.jsx'
import { financeFollowUps } from '../dependencies/finance/financeFeatures.js'
import PoliticalMap from '../dependencies/politics/map/PoliticalMap.jsx'
import CrimeLibrary from '../dependencies/crime/CrimeLibrary.jsx'
import CrimeCase from '../dependencies/crime/CrimeCase.jsx'
import FreedomLibrary from '../dependencies/freedom/FreedomLibrary.jsx'
import VideoDetailPage from '../dependencies/shared/VideoDetailPage.jsx'
import AcademyBoard from '../dependencies/academy/AcademyBoard.jsx'
import AcademyAdmin from '../dependencies/academy/admin/AcademyAdmin.jsx'
import AcademyProfile from '../dependencies/academy/profile/AcademyProfile.jsx'
import AgoraLoginDialog, { AgoraAuthArtworkButton } from '../dependencies/academy/auth/AgoraLoginDialog.jsx'
import { useAgoraAuth } from '../dependencies/academy/auth/agoraAuth.js'
import { supabase } from '../dependencies/academy/supabaseClient.js'
import RouteLink from '../routing/RouteLink.jsx'
import useAppRouter from '../routing/useAppRouter.js'
import { parentPoliticalView, politicsPath, ROUTES } from '../routing/routes.js'

function readInviteEntry(route) {
  if (route.page === 'invite') {
    return { username: route.inviteHandle || '', inviteToken: '' }
  }
  const parameters = new URLSearchParams(window.location.search)
  return {
    username: parameters.get('welcome') || '',
    inviteToken: parameters.get('invite') || '',
  }
}

function AppHeader({ route, navigate, authSession, authStatus, onLogin, onLogout }) {
  if (route.page === 'home' || route.page === 'new-user-preview' || route.page === 'invite') return null

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
          to={ROUTES.home}
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
          <RouteLink
            className={`section-tab${route.section === 'business' ? ' section-tab--active' : ''}`}
            to={ROUTES.agoraBusiness}
            navigate={navigate}
            active={route.section === 'business'}
          >
            Business
          </RouteLink>
          <RouteLink
            className={`section-tab${route.section === 'finance' ? ' section-tab--active' : ''}`}
            to={ROUTES.agoraFinance}
            navigate={navigate}
            active={route.section === 'finance'}
          >
            Finance
          </RouteLink>
          <RouteLink
            className={`section-tab${route.section === 'politics' ? ' section-tab--active' : ''}`}
            to={ROUTES.agoraPolitics}
            navigate={navigate}
            active={route.section === 'politics'}
          >
            Map
          </RouteLink>
          <RouteLink
            className={`section-tab${route.section === 'crime' ? ' section-tab--active' : ''}`}
            to={ROUTES.agoraCrime}
            navigate={navigate}
            active={route.section === 'crime'}
          >
            Crime
          </RouteLink>
          <RouteLink
            className={`section-tab${route.section === 'freedom' ? ' section-tab--active' : ''}`}
            to={ROUTES.agoraFreedom}
            navigate={navigate}
            active={route.section === 'freedom'}
          >
            Freedom
          </RouteLink>
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

function HomePage({ navigate, userCount }) {
  return (
    <>
      <section className="hero__content" id="top">
        <img className="home-logo" src="/polaris-logo.png" alt="Polaris" />
        <p className="eyebrow">Welcome to</p>
        <h1>Polaris</h1>
        <p className="tagline">You're new digital home</p>
        <p className="home-user-count">{userCount.toLocaleString()} user{userCount === 1 ? '' : 's'}</p>
      </section>

      <LaunchTimer />

      <footer className="hero__footer" id="gather">
        <SoundBars />
        <RouteLink className="discover-link" to={ROUTES.agoraBusiness} navigate={navigate}>
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
  const { session: authSession, status: authStatus, login, claimInvite, logout } = useAgoraAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const inviteEntry = readInviteEntry(route)
  const [userCount, setUserCount] = useState(0)
  const isHome = route.page === 'home'
  const isNewUserPreview = route.page === 'new-user-preview'
  const isInvite = route.page === 'invite'
  const isLanding = isHome || isNewUserPreview || isInvite
  const hasPersonalInvite = Boolean(inviteEntry.username && (inviteEntry.inviteToken || isInvite))
  const showInviteWelcome = isNewUserPreview || ((isHome || isInvite) && hasPersonalInvite)
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
    if (!supabase) return undefined
    let cancelled = false
    supabase.rpc('get_agora_user_count').then(({ data, error }) => {
      if (cancelled || error) return
      setUserCount(Number(data || 0))
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const isAgora = route.page === 'academy' || route.page === 'academy-profile' || route.page === 'admin'
    const iconPath = isAgora
      ? '/agora-logo.png'
      : route.page === 'agora'
        ? '/academy-logo.png'
        : '/polaris-logo.png'
    const detailPageTitle = route.crimeCase === 'lindsay-clancy'
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
    const pageTitle = isAgora
      ? route.page === 'admin'
        ? 'Agora Administration — Polaris'
        : route.page === 'academy-profile'
          ? `Profile ${String(route.profileNumber).padStart(4, '0')} — Agora — Polaris`
          : 'Agora — Polaris'
      : route.page === 'agora'
        ? detailPageTitle || `Academy ${route.section === 'politics' ? 'Map' : `${route.section.charAt(0).toUpperCase()}${route.section.slice(1)}`} — Polaris`
        : isNewUserPreview
          ? 'New User Preview — Polaris'
          : isInvite
            ? `Welcome @${route.inviteHandle} — Polaris`
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
  }, [route.page, route.section, route.crimeCase, route.financeCase, route.freedomCase, route.profileNumber, route.inviteHandle, isNewUserPreview, isInvite])

  const changePoliticalView = (view) => navigate(politicsPath(view))
  const leavePoliticalView = () => navigate(politicsPath(parentPoliticalView(politicalView)))
  const finishInviteClaim = async (claim) => {
    await claimInvite(claim)
    navigate(ROUTES.home, { replace: true })
  }

  return (
    <main className={`hero${isLanding ? '' : ` hero--entered hero--${heroMode}`}`}>
      {route.page !== 'academy' && route.page !== 'academy-profile' && route.page !== 'admin' && (
        <>
          <img
            className={`hero__image hero__image--welcome${showInviteWelcome ? ' hero__image--invitation' : ''}`}
            src={showInviteWelcome ? '/welcome-01.jpg' : '/agora-hero.png'}
            alt={isLanding ? (showInviteWelcome ? 'A white marble bust in warm morning light' : 'A luminous white tree rising between monumental columns') : ''}
          />
          <img
            className="hero__image hero__image--city"
            src={enteredBackground}
            alt={isLanding ? '' : enteredBackgroundAlt}
          />
          {!showInviteWelcome && <div className="hero__wash" />}
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

      {(route.page === 'home' || route.page === 'invite') && showInviteWelcome && (
        <InviteWelcome
          username={inviteEntry.username}
          inviteToken={inviteEntry.inviteToken}
          onClaim={finishInviteClaim}
          onEnterAgora={() => navigate(ROUTES.academy)}
        />
      )}
      {isNewUserPreview && (
        <InviteWelcome
          username={inviteEntry.username || '@New'}
          inviteToken=""
          preview
          onClaim={finishInviteClaim}
          onEnterAgora={() => navigate(ROUTES.academy)}
        />
      )}
      {route.page === 'home' && !showInviteWelcome && (
        <HomePage navigate={navigate} userCount={userCount} />
      )}
      {route.page === 'academy' && (
        <AcademyBoard
          navigate={navigate}
          authSession={authSession}
          userCount={userCount}
          onLogin={() => setLoginOpen(true)}
        />
      )}
      {route.page === 'academy-profile' && (
        <AcademyProfile
          profileNumber={route.profileNumber}
          authSession={authSession}
          onLogin={() => setLoginOpen(true)}
          onReturn={() => navigate(ROUTES.academy)}
          onOpenAdmin={() => navigate(ROUTES.academyAdmin)}
        />
      )}
      {route.page === 'admin' && (
        <AcademyAdmin onReturn={() => navigate(ROUTES.academy)} />
      )}
      {route.page === 'agora' && route.section === 'business' && <VentureCapitalGrid />}
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
        ) : <FinanceLibrary navigate={navigate} />
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
            : <CrimeLibrary navigate={navigate} />
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
        ) : <FreedomLibrary navigate={navigate} />
      )}
      {route.page === 'agora' && route.section === 'politics' && (
        <PoliticalMap
          view={politicalView}
          onViewChange={changePoliticalView}
          onBack={leavePoliticalView}
        />
      )}

      <AgoraLoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={login} />
    </main>
  )
}

export default App
