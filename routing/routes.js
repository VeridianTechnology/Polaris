export const ROUTES = {
  home: '/',
  academy: '/agora',
  academyAdmin: '/agora/admin',
  agoraBusiness: '/academy/business',
  agoraFinance: '/academy/finance',
  agoraFinanceStrategyRoom: '/academy/finance/strategy-room',
  agoraFinanceCrudeOil: '/academy/finance/strategy-room/crude-oil-to-motion',
  agoraFinanceTidalPower: '/academy/finance/strategy-room/tidal-power',
  agoraPolitics: '/academy/map',
  agoraCrime: '/academy/crime',
  agoraCrimeHinduCult: '/academy/crime/hindu-cult-investigation',
  agoraCrimeLindsayClancy: '/academy/crime/lindsay-clancy',
  agoraFreedom: '/academy/freedom',
  agoraFreedomFlockCameras: '/academy/freedom/flock-cameras',
}

export function academyProfilePath(profileNumber) {
  const normalizedNumber = Number.parseInt(profileNumber, 10)
  return `${ROUTES.academy}/profile/${Number.isFinite(normalizedNumber) ? normalizedNumber : 1}`
}

const POLITICAL_VIEW_SLUGS = {
  world: '',
  middleEast: 'middle-east',
  israel: 'israel',
  turkey: 'turkey',
  ukraine: 'ukraine',
  russia: 'russia',
  taiwan: 'taiwan',
  alberta: 'alberta',
  japan: 'japan',
  unitedStates: 'united-states',
  australia: 'australia',
}

const SLUG_POLITICAL_VIEWS = Object.fromEntries(
  Object.entries(POLITICAL_VIEW_SLUGS).map(([view, slug]) => [slug, view]),
)

const POLITICAL_VIEW_PARENTS = {
  middleEast: 'world',
  israel: 'middleEast',
  turkey: 'middleEast',
  ukraine: 'world',
  russia: 'world',
  taiwan: 'world',
  alberta: 'world',
  japan: 'world',
  unitedStates: 'world',
  australia: 'world',
}

const normalizePath = (pathname) => {
  if (!pathname || pathname === '/') return '/'
  return pathname.replace(/\/+$/, '')
}

export function politicsPath(view = 'world') {
  const slug = POLITICAL_VIEW_SLUGS[view]
  if (slug === undefined) return ROUTES.agoraPolitics
  return slug ? `${ROUTES.agoraPolitics}/${slug}` : ROUTES.agoraPolitics
}

export function parentPoliticalView(view) {
  return POLITICAL_VIEW_PARENTS[view] || 'world'
}

export function matchRoute(pathname) {
  const path = normalizePath(pathname)

  if (path === ROUTES.home) {
    return { page: 'home', path: ROUTES.home }
  }

  if (path === ROUTES.academy) {
    return { page: 'academy', path: ROUTES.academy }
  }

  if (path === ROUTES.academyAdmin) {
    return { page: 'admin', area: 'agora', path: ROUTES.academyAdmin }
  }

  const academyProfileMatch = path.match(/^\/agora\/profile\/(\d+)$/)
  if (academyProfileMatch) {
    const profileNumber = Number.parseInt(academyProfileMatch[1], 10)
    return {
      page: 'academy-profile',
      area: 'agora',
      profileNumber,
      path: academyProfilePath(profileNumber),
    }
  }

  if (path === ROUTES.agoraBusiness || path === '/academy') {
    return { page: 'agora', section: 'business', path: ROUTES.agoraBusiness }
  }

  if (path === ROUTES.agoraFinance) {
    return { page: 'agora', section: 'finance', path: ROUTES.agoraFinance }
  }

  if (path === ROUTES.agoraFinanceStrategyRoom) {
    return {
      page: 'agora',
      section: 'finance',
      financeCase: 'strategy-room',
      path: ROUTES.agoraFinanceStrategyRoom,
    }
  }

  if (path === ROUTES.agoraFinanceCrudeOil) {
    return {
      page: 'agora',
      section: 'finance',
      financeCase: 'crude-oil-to-motion',
      path: ROUTES.agoraFinanceCrudeOil,
    }
  }

  if (path === ROUTES.agoraFinanceTidalPower) {
    return {
      page: 'agora',
      section: 'finance',
      financeCase: 'tidal-power',
      path: ROUTES.agoraFinanceTidalPower,
    }
  }

  if (path === ROUTES.agoraCrime) {
    return { page: 'agora', section: 'crime', path: ROUTES.agoraCrime }
  }

  if (path === ROUTES.agoraCrimeHinduCult) {
    return {
      page: 'agora',
      section: 'crime',
      crimeCase: 'hindu-cult-investigation',
      path: ROUTES.agoraCrimeHinduCult,
    }
  }

  if (path === ROUTES.agoraCrimeLindsayClancy) {
    return {
      page: 'agora',
      section: 'crime',
      crimeCase: 'lindsay-clancy',
      path: ROUTES.agoraCrimeLindsayClancy,
    }
  }

  if (path === ROUTES.agoraFreedom) {
    return { page: 'agora', section: 'freedom', path: ROUTES.agoraFreedom }
  }

  if (path === ROUTES.agoraFreedomFlockCameras) {
    return {
      page: 'agora',
      section: 'freedom',
      freedomCase: 'flock-cameras',
      path: ROUTES.agoraFreedomFlockCameras,
    }
  }

  if (path === ROUTES.agoraPolitics || path === '/academy/politics') {
    return {
      page: 'agora',
      section: 'politics',
      politicalView: 'world',
      path: ROUTES.agoraPolitics,
    }
  }

  const politicsMatch = path.match(/^\/academy\/(?:map|politics)\/([^/]+)$/)
  const politicalView = politicsMatch ? SLUG_POLITICAL_VIEWS[politicsMatch[1]] : undefined

  if (politicalView) {
    return {
      page: 'agora',
      section: 'politics',
      politicalView,
      path: politicsPath(politicalView),
    }
  }

  return { page: 'home', path: ROUTES.home, notFound: true }
}
