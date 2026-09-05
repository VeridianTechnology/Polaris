export const ROUTES = {
  home: '/',
  landing: '/welcome',
  academy: '/agora',
  academyAdmin: '/agora/admin',
  agoraBusiness: '/academy/business',
  agoraCareerBlueCollar: '/academy/career/blue-collar',
  agoraCareerMechanical: '/academy/career/mechanical',
  agoraCareerTech: '/academy/career/tech',
  agoraCareerSocialMedia: '/academy/career/social-media',
  agoraCareerModeling: '/academy/career/modeling',
  agoraFinance: '/academy/finance',
  agoraFinanceStrategyRoom: '/academy/finance/strategy-room',
  agoraFinanceCrudeOil: '/academy/finance/strategy-room/crude-oil-to-motion',
  agoraFinanceTidalPower: '/academy/finance/strategy-room/tidal-power',
  agoraPolitics: '/academy/map',
  agoraCrime: '/academy/crime',
  agoraOverseas: '/academy/overseas',
  agoraManliness: '/academy/manliness',
  agoraProblems: '/academy/problems',
  agoraProblemsJapan: '/academy/problems/japan',
  agoraCrimeHinduCult: '/academy/crime/hindu-cult-investigation',
  agoraCrimeLindsayClancy: '/academy/crime/lindsay-clancy',
  agoraFreedom: '/academy/freedom',
  agoraFreedomFlockCameras: '/academy/freedom/flock-cameras',
  agoraConspiracy: '/academy/conspiracy',
  agoraCulture: '/academy/culture',
  agoraCultureMusic: '/academy/culture/music',
  agoraCultureMemes: '/academy/culture/memes',
  agoraCultureComedy: '/academy/culture/comedy',
  agoraCultureNewAgeAthletes: '/academy/culture/new-age-athletes',
  agoraCultureArt: '/academy/culture/art',
  agoraCultureHistory: '/academy/culture/history',
  agoraCultureFights: '/academy/culture/fights',
  agoraCultureReligion: '/academy/culture/religion',
  agoraCultureFoids: '/academy/culture/foids',
  agoraCultureStreet: '/academy/culture/street',
  agoraCultureVideoGames: '/academy/culture/video-games',
  agoraCultureContemplative: '/academy/culture/contemplative',
  agoraCultureFilm: '/academy/culture/film',
  agoraHealth: '/academy/health',
  agoraHealthPhysical: '/academy/health/physical',
  agoraScience: '/academy/science',
  agoraScienceHealth: '/academy/science/health',
  agoraSciencePhysics: '/academy/science/physics',
  agoraScienceLooksmaxxing: '/academy/science/looksmaxxing',
  agoraScienceWorkout: '/academy/science/workout',
  agoraScienceAstrology: '/academy/science/astrology',
  agoraScienceAnimals: '/academy/science/animals',
  agoraPeople: '/academy/people',
  agoraPeopleRightWing: '/academy/people/right-wing',
  agoraPeopleZoomerwoman: '/academy/people/right-wing/zoomerwoman',
  agoraPeoplePaulMiller: '/academy/people/right-wing/paul-miller',
}

export function academyProfilePath(username = 'nyx') {
  const normalizedUsername = String(username).trim().replace(/^@+/, '').toLowerCase()
  return `${ROUTES.academy}/profile/${encodeURIComponent(normalizedUsername || 'nyx')}`
}

export function legacyAcademyProfilePath(profileNumber) {
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
  unitedKingdom: 'united-kingdom',
  australiaFinance: 'australia-finance',
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
  unitedKingdom: 'world',
  australiaFinance: 'world',
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
    return { page: 'academy', path: ROUTES.academy }
  }

  if (path === ROUTES.landing) {
    return { page: 'home', path: ROUTES.landing }
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
      legacyProfile: true,
      path: legacyAcademyProfilePath(profileNumber),
    }
  }

  const academyProfileUsernameMatch = path.match(/^\/agora\/profile\/([A-Za-z0-9_]{2,32})$/)
  if (academyProfileUsernameMatch) {
    const profileUsername = academyProfileUsernameMatch[1].toLowerCase()
    return {
      page: 'academy-profile',
      area: 'agora',
      profileUsername,
      path: academyProfilePath(profileUsername),
    }
  }

  if (path === ROUTES.agoraBusiness || path === '/academy') {
    return { page: 'agora', section: 'business', path: ROUTES.agoraBusiness }
  }

  if (path === ROUTES.agoraCareerBlueCollar || path === ROUTES.agoraCareerMechanical) {
    return {
      page: 'agora',
      section: 'career',
      careerView: 'mechanical',
      path: ROUTES.agoraCareerMechanical,
    }
  }

  if (path === ROUTES.agoraCareerTech) {
    return {
      page: 'agora',
      section: 'career',
      careerView: 'tech',
      path: ROUTES.agoraCareerTech,
    }
  }

  if (path === ROUTES.agoraCareerSocialMedia) {
    return {
      page: 'agora',
      section: 'career',
      careerView: 'social-media',
      path: ROUTES.agoraCareerSocialMedia,
    }
  }

  if (path === ROUTES.agoraCareerModeling) {
    return {
      page: 'agora',
      section: 'career',
      careerView: 'modeling',
      path: ROUTES.agoraCareerModeling,
    }
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

  if (path === ROUTES.agoraConspiracy) {
    return {
      page: 'agora',
      section: 'conspiracy',
      conspiracyView: 'latest',
      path: ROUTES.agoraConspiracy,
    }
  }

  if (path === ROUTES.agoraCulture || path === ROUTES.agoraCultureMusic) {
    return {
      page: 'agora',
      section: 'culture',
      cultureView: 'music',
      path: ROUTES.agoraCultureMusic,
    }
  }

  if (path === ROUTES.agoraCultureMemes) {
    return {
      page: 'agora',
      section: 'culture',
      cultureView: 'memes',
      path: ROUTES.agoraCultureMemes,
    }
  }

  if (path === ROUTES.agoraCultureComedy) {
    return {
      page: 'agora',
      section: 'culture',
      cultureView: 'comedy',
      path: ROUTES.agoraCultureComedy,
    }
  }

  if (path === ROUTES.agoraCultureNewAgeAthletes) {
    return {
      page: 'agora',
      section: 'culture',
      cultureView: 'new-age-athletes',
      path: ROUTES.agoraCultureNewAgeAthletes,
    }
  }

  if (path === ROUTES.agoraCultureArt) {
    return {
      page: 'agora',
      section: 'culture',
      cultureView: 'art',
      path: ROUTES.agoraCultureArt,
    }
  }

  if (path === ROUTES.agoraCultureHistory) {
    return {
      page: 'agora',
      section: 'culture',
      cultureView: 'history',
      path: ROUTES.agoraCultureHistory,
    }
  }

  if (path === ROUTES.agoraCultureFights) {
    return {
      page: 'agora',
      section: 'culture',
      cultureView: 'fights',
      path: ROUTES.agoraCultureFights,
    }
  }

  if (path === ROUTES.agoraCultureReligion) {
    return {
      page: 'agora',
      section: 'culture',
      cultureView: 'religion',
      path: ROUTES.agoraCultureReligion,
    }
  }

  if (path === ROUTES.agoraCultureFoids || path === ROUTES.agoraCultureStreet) {
    return { page: 'agora', section: 'culture', cultureView: path === ROUTES.agoraCultureFoids ? 'foids' : 'street', path }
  }

  if (
    path === ROUTES.agoraHealth
    || path === ROUTES.agoraHealthPhysical
    || path === ROUTES.agoraScience
    || path === ROUTES.agoraScienceHealth
  ) {
    return {
      page: 'agora',
      section: 'science',
      scienceView: 'health',
      path: ROUTES.agoraScienceHealth,
    }
  }

  if (path === ROUTES.agoraSciencePhysics) {
    return {
      page: 'agora',
      section: 'science',
      scienceView: 'physics',
      path: ROUTES.agoraSciencePhysics,
    }
  }

  if (path === ROUTES.agoraScienceLooksmaxxing) {
    return {
      page: 'agora',
      section: 'science',
      scienceView: 'looksmaxxing',
      path: ROUTES.agoraScienceLooksmaxxing,
    }
  }

  if (path === ROUTES.agoraScienceWorkout) {
    return {
      page: 'agora',
      section: 'science',
      scienceView: 'workout',
      path: ROUTES.agoraScienceWorkout,
    }
  }

  if (path === ROUTES.agoraScienceAstrology) {
    return {
      page: 'agora',
      section: 'science',
      scienceView: 'astrology',
      path: ROUTES.agoraScienceAstrology,
    }
  }

  if (path === ROUTES.agoraPeople || path === ROUTES.agoraPeopleRightWing) {
    return {
      page: 'agora',
      section: 'people',
      peopleView: 'right-wing',
      path: ROUTES.agoraPeopleRightWing,
    }
  }

  if (path === ROUTES.agoraPeopleZoomerwoman) {
    return {
      page: 'agora',
      section: 'people',
      peopleView: 'right-wing',
      peopleCase: 'zoomerwoman',
      path: ROUTES.agoraPeopleZoomerwoman,
    }
  }

  if (path === ROUTES.agoraPeoplePaulMiller) {
    return {
      page: 'agora',
      section: 'people',
      peopleView: 'right-wing',
      peopleCase: 'paul-miller',
      path: ROUTES.agoraPeoplePaulMiller,
    }
  }

  if (path === ROUTES.agoraOverseas) {
    return { page: 'agora', section: 'overseas', path: ROUTES.agoraOverseas }
  }

  if (path === ROUTES.agoraManliness) {
    return { page: 'agora', section: 'manliness', path }
  }

  if (path === ROUTES.agoraProblems || path === ROUTES.agoraProblemsJapan) {
    return { page: 'agora', section: 'problems', path: ROUTES.agoraProblemsJapan }
  }

  if (path === ROUTES.agoraCultureVideoGames) {
    return { page: 'agora', section: 'culture', cultureView: 'video-games', path }
  }

  if (path === ROUTES.agoraCultureContemplative) {
    return { page: 'agora', section: 'culture', cultureView: 'contemplative', path }
  }

  if (path === ROUTES.agoraCultureFilm) {
    return { page: 'agora', section: 'culture', cultureView: 'film', path }
  }

  if (path === ROUTES.agoraScienceAnimals) {
    return { page: 'agora', section: 'science', scienceView: 'animals', path }
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

  return { page: 'academy', path: ROUTES.academy, notFound: true }
}
