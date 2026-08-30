import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../academy/supabaseClient'
import './political-map.css'

const MAPS = {
  world: {
    image: '/politics-world.jpg',
    alt: 'Relief map of the world',
    label: 'World',
  },
  middleEast: {
    image: '/politics-middle-east.jpg',
    alt: 'Relief map of the Middle East',
    label: 'Middle East',
  },
  israel: {
    image: '/politics-israel.jpg',
    alt: 'Detailed relief map of Israel and the surrounding region',
    label: 'Israel',
  },
  turkey: {
    image: '/politics-turkey.jpg',
    alt: 'Detailed relief map of Turkey and the surrounding region',
    label: 'Turkey',
  },
  ukraine: {
    image: '/politics-ukraine.jpg',
    alt: 'Detailed relief map of Ukraine',
    label: 'Ukraine',
  },
  russia: {
    image: '/politics-russia.jpg',
    alt: 'Detailed relief map of Russia',
    label: 'Russia',
  },
  taiwan: {
    image: '/politics-taiwan.jpg',
    alt: 'Detailed relief map of Taiwan and the Taiwan Strait',
    label: 'Taiwan',
  },
  alberta: {
    image: '/politics-alberta.jpg',
    alt: 'Detailed relief map of Alberta and western Canada',
    label: 'Alberta',
  },
  japan: {
    image: '/politics-japan.jpg',
    alt: 'Detailed relief map of Japan and the surrounding seas',
    label: 'Japan',
  },
  australia: {
    image: '/politics-australia.jpg',
    alt: 'Detailed relief map of Australia and the surrounding seas',
    label: 'Australia',
  },
  australiaFinance: {
    image: '/politics-australia.jpg',
    alt: 'Detailed relief map of Australia and the surrounding seas',
    label: 'Australia',
  },
  unitedKingdom: {
    image: '/politics-united-kingdom.jpg',
    alt: 'Detailed relief map of the United Kingdom',
    label: 'United Kingdom',
  },
  unitedStates: {
    image: '/politics-united-states.jpg',
    alt: 'Detailed relief map of the United States',
    label: 'United States',
  },
}

const MAP_ENTRY_KEYS = {
  middleEast: 'middle-east',
  unitedStates: 'united-states',
  australiaFinance: 'australia-finance',
  unitedKingdom: 'united-kingdom',
}

function BackIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M16 10H4m5-5-5 5 5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.25" />
      <path d="m8.4 6.8 5 3.2-5 3.2V6.8Z" fill="currentColor" />
    </svg>
  )
}

function TweetEmbed({ url, author }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const renderTweet = () => window.twttr?.widgets?.load(containerRef.current)
    let script = document.querySelector('script[data-polaris-x-widgets]')

    if (window.twttr?.widgets) {
      renderTweet()
      return undefined
    }

    if (!script) {
      script = document.createElement('script')
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      script.dataset.polarisXWidgets = 'true'
      document.head.append(script)
    }

    script.addEventListener('load', renderTweet)
    return () => script.removeEventListener('load', renderTweet)
  }, [url])

  return (
    <div className="financial-panel__tweet" ref={containerRef}>
      <blockquote className="twitter-tweet" data-dnt="true" data-theme="light">
        <a href={url} target="_blank" rel="noreferrer">View {author || 'this post'} on X ↗</a>
      </blockquote>
    </div>
  )
}

const RELATIONS = {
  israel: {
    primary: 'Israel',
    counterpart: 'Turkey',
    primaryClass: 'israel',
    counterpartClass: 'turkey',
    score: '-75',
    status: '',
    video: 'https://www.youtube.com/watch?v=K313YV2lmmw',
    analysis:
      'Essentially F35s, the latest US aircraft cannot be sent or bought by Turkey because Israel is starting to see Turkey as opposition in the Middle East. Not now, but conflict looks like it could be likely within 20 to 40 years.',
  },
  taiwan: {
    primary: 'Taiwan',
    counterpart: 'China',
    primaryClass: 'blue',
    counterpartClass: 'red',
    score: '-140',
    status: 'Mortal Enemies',
    video: 'https://www.youtube.com/watch?v=hogzHyUpe_Y',
    analysis:
      "Chinese demographics are urging it to conflict sooner, than later. I disagree with Tom Bilyeu's sentiment, American debt necessitates that China wait until America is weak, but there is some evidence to the contrary. The collapsing birth rate is the most pressing issue for China urging it forward against the United States and against Taiwan.",
  },
  ukraine: {
    primary: 'Ukraine',
    counterpart: 'Russia',
    primaryClass: 'blue',
    counterpartClass: 'red',
    score: '-160',
    status: 'Active War',
    video: 'https://www.youtube.com/watch?v=K0cHrknGz-U',
    analysis:
      "The whole war has become a giant nothingburger and a war of economic attrition against Russia to bring it's oil exports and war machinery to a halt, unsuccessful while Russia has taken less territory than Manhatten in the following year. A real snoozefest, but an active and tragic one.",
  },
  alberta: {
    primary: 'Alberta',
    counterpart: 'United States',
    primaryClass: 'blue',
    counterpartClass: 'red',
    score: '-25',
    status: '',
    video: 'https://www.youtube.com/watch?v=fr4__yr0gXE&t=934s',
    analysis:
      "American pressure on Alberta is mostly verbal at this point but within 50 years, it is extremely likely at the current rate Alberta will become American. Right now, it's mostly a meme, but this is causing some hostility. Ironically, the warming of American relations to Alberta caused many that lived in Alberta to be against secession.",
  },
}

const FINANCIAL_REPORTS = {
  japan: {
    country: 'Japan',
    score: '-30',
    scoreLabel: 'Financial Stability Score',
    video: 'https://www.youtube.com/watch?v=NSx2d9tTd8A',
    analysis:
      'Japan is running into debt problems, needing to sell of US treasuries for dollars to guard the yen, ultimately needing a bailout from the United States.',
  },
  unitedStates: {
    country: 'United States',
    title: 'Boomers are losing home value',
    score: '20+',
    scoreLabel: 'Stability',
    video: 'https://www.youtube.com/watch?v=09FevuUtoOc',
    analysis:
      'Finally, the housing slump begins. This is actually great, a full on crash would be a disaster but if year over year, the next three to five years, home prices go down 50%, it would be amazing for the middle class, youngsters and the economy. The "number must go up" is doing incredible damage to the working class, boomers basically did it to themselves by milking and robbing the younger generations so hard, there\'s no one to buy up their inflated home property values. Good. Fuck them.',
  },
  australiaFinance: {
    country: 'Australia',
    title: 'First home buyer tax breaks',
    score: '+5',
    scoreLabel: 'Awareness',
    tweet: 'https://x.com/AlboMP/status/2093876832164782506',
    tweetAuthor: 'Anthony Albanese (@AlboMP)',
    analysis:
      'The Prime Minister of Australia has made a public commitment to cheaper housing through tax breaks for first time home buyers. I think this all cap, but at least the awareness has spread.',
  },
  unitedKingdom: {
    country: 'United Kingdom',
    title: 'Bond Instability',
    score: '-50',
    scoreLabel: 'Stability',
    video: 'https://www.youtube.com/watch?v=vamgbxM-fec',
    analysis:
      "The bond situation in England is falling apart further with the dismantling of the welfare state as England or rather the UK refuses to tax it's ultra-rich. People can't afford heating and then they're told to work harder, England might be the first Western country to fall into civil war at this point.",
  },
}

const POLITICAL_PARTIES = {
  australia: {
    country: 'Australia',
    name: 'Libertarian Group of Australia',
    url: 'https://www.facebook.com/AusConLib',
    analysis:
      "Extreme boomer humor meme page but has 58k followers and at this point, if there's anything worth supporting in Australia, this would be it. A sad and miserable start, but a start nonetheless.",
  },
}

function RelationsPanel({ relation }) {
  return (
    <aside
      className="relations-panel"
      aria-label={`${relation.primary} and ${relation.counterpart} relations`}
    >
      <div className="relations-panel__countries">
        <span className={`relations-panel__country relations-panel__country--${relation.primaryClass}`}>
          {relation.primary}
        </span>
        <span
          className={`relations-panel__line relations-panel__line--${relation.primaryClass}-${relation.counterpartClass}`}
          aria-hidden="true"
        />
        <span className={`relations-panel__country relations-panel__country--${relation.counterpartClass}`}>
          {relation.counterpart}
        </span>
      </div>
      <div className="relations-panel__heading">
        <p>
          Relations: {relation.score}
          {relation.status && <em>({relation.status})</em>}
        </p>
        <span>By NYX</span>
      </div>
      <a href={relation.video} target="_blank" rel="noreferrer">
        <PlayIcon />
        <span>Watch analysis</span>
      </a>
      <p className="relations-panel__analysis">{relation.analysis}</p>
    </aside>
  )
}

function FinancialPanel({ report }) {
  return (
    <aside className={`relations-panel financial-panel${report.tweet ? ' financial-panel--tweet' : ''}`} aria-label={`${report.country} financial report`}>
      <div className="financial-panel__topline">
        <span>{report.country}</span>
        <small>By NYX</small>
      </div>
      {report.title && <h2>{report.title}</h2>}
      <div className="financial-panel__score">
        <span>{report.scoreLabel || 'Financial Stability Score'}</span>
        <strong>{report.score}</strong>
      </div>
      {report.tweet && <TweetEmbed url={report.tweet} author={report.tweetAuthor} />}
      {report.video && (
        <a href={report.video} target="_blank" rel="noreferrer">
          <PlayIcon />
          <span>Watch analysis</span>
        </a>
      )}
      <p className="relations-panel__analysis">{report.analysis}</p>
    </aside>
  )
}

function PoliticalPartyPanel({ party }) {
  return (
    <aside className="relations-panel political-party-panel" aria-label={`${party.country} political party`}>
      <p className="political-party-panel__country">{party.country}</p>
      <h2>{party.name}</h2>
      <a href={party.url} target="_blank" rel="noreferrer">
        <span>Open Facebook page ↗</span>
      </a>
      <p className="relations-panel__analysis">{party.analysis}</p>
    </aside>
  )
}

function PoliticalMap({ view, onViewChange, onBack }) {
  const [databaseEntries, setDatabaseEntries] = useState({})
  const entryKey = MAP_ENTRY_KEYS[view] || view
  const databaseEntry = databaseEntries[entryKey]
  const activeMap = {
    ...MAPS[view],
    image: databaseEntry?.image_path || MAPS[view].image,
    label: databaseEntry?.map_label || MAPS[view].label,
  }
  const activeRelation = RELATIONS[view] && {
    ...RELATIONS[view],
    primary: databaseEntry?.primary_label || RELATIONS[view].primary,
    counterpart: databaseEntry?.counterpart_label || RELATIONS[view].counterpart,
    score: databaseEntry?.score == null ? RELATIONS[view].score : String(databaseEntry.score),
    status: databaseEntry?.status ?? RELATIONS[view].status,
    video: databaseEntry?.source_url || RELATIONS[view].video,
    analysis: databaseEntry?.subtitle || RELATIONS[view].analysis,
  }
  const activeFinancialReport = FINANCIAL_REPORTS[view] && {
    ...FINANCIAL_REPORTS[view],
    country: databaseEntry?.primary_label || FINANCIAL_REPORTS[view].country,
    title: databaseEntry?.title || FINANCIAL_REPORTS[view].title,
    score: databaseEntry?.score_display
      || (databaseEntry?.score == null ? FINANCIAL_REPORTS[view].score : String(databaseEntry.score)),
    scoreLabel: databaseEntry?.status || FINANCIAL_REPORTS[view].scoreLabel,
    video: FINANCIAL_REPORTS[view].tweet
      ? FINANCIAL_REPORTS[view].video
      : databaseEntry?.source_url || FINANCIAL_REPORTS[view].video,
    tweet: FINANCIAL_REPORTS[view].tweet
      ? databaseEntry?.source_url || FINANCIAL_REPORTS[view].tweet
      : null,
    analysis: databaseEntry?.subtitle || FINANCIAL_REPORTS[view].analysis,
  }
  const activePoliticalParty = POLITICAL_PARTIES[view] && {
    ...POLITICAL_PARTIES[view],
    name: databaseEntry?.primary_label || POLITICAL_PARTIES[view].name,
    url: databaseEntry?.source_url || POLITICAL_PARTIES[view].url,
    analysis: databaseEntry?.subtitle || POLITICAL_PARTIES[view].analysis,
  }
  const [activeLayer, setActiveLayer] = useState(
    view === 'japan' || view === 'unitedStates' || view === 'australiaFinance' || view === 'unitedKingdom'
      ? 'finance'
      : view === 'australia'
        ? 'politicalParties'
        : 'flashPoints',
  )

  useEffect(() => {
    if (view === 'japan' || view === 'unitedStates' || view === 'australiaFinance' || view === 'unitedKingdom') setActiveLayer('finance')
    else if (view === 'australia') setActiveLayer('politicalParties')
    else if (view !== 'world') setActiveLayer('flashPoints')
  }, [view])

  useEffect(() => {
    if (!supabase) return undefined
    let cancelled = false
    supabase
      .from('academy_map_entries')
      .select('*')
      .eq('issue_key', 'september-2026')
      .eq('is_active', true)
      .then(({ data }) => {
        if (cancelled || !data) return
        setDatabaseEntries(Object.fromEntries(data.map((entry) => [entry.entry_key, entry])))
      })
    return () => { cancelled = true }
  }, [])

  const changeLayer = (layer) => {
    setActiveLayer(layer)
    if (view !== 'world') onViewChange('world')
  }

  return (
    <section className={`political-map political-map--${view}`} aria-label="Political map explorer">
      <div className="political-map__stage">
        <div className="political-map__layer-tabs" role="tablist" aria-label="Political map layers">
          <button
            className={`political-map__layer-tab${activeLayer === 'flashPoints' ? ' political-map__layer-tab--active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeLayer === 'flashPoints'}
            aria-controls="political-map-layer"
            onClick={() => changeLayer('flashPoints')}
          >
            Flash Points
          </button>
          <button
            className={`political-map__layer-tab${activeLayer === 'finance' ? ' political-map__layer-tab--active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeLayer === 'finance'}
            aria-controls="political-map-layer"
            onClick={() => changeLayer('finance')}
          >
            Finance
          </button>
          <button
            className={`political-map__layer-tab${activeLayer === 'politicalParties' ? ' political-map__layer-tab--active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeLayer === 'politicalParties'}
            aria-controls="political-map-layer"
            onClick={() => changeLayer('politicalParties')}
          >
            Political Parties
          </button>
        </div>

        <div className="political-map__frame" id="political-map-layer">
        <img
          className="political-map__image"
          src={activeMap.image}
          alt={activeMap.alt}
          key={view}
        />

        <div className="political-map__edge" aria-hidden="true" />

        {activeLayer === 'flashPoints' && view === 'world' && (
          <>
            <button
              className="map-hotspot map-hotspot--middle-east"
              type="button"
              onClick={() => onViewChange('middleEast')}
              aria-label="Explore the Middle East"
            >
              <span>Middle East</span>
            </button>
            <button
              className="map-hotspot map-hotspot--alberta"
              type="button"
              onClick={() => onViewChange('alberta')}
              aria-label="Open the detailed map of Alberta"
            >
              <span>Alberta</span>
            </button>
            <button
              className="map-hotspot map-hotspot--russia"
              type="button"
              onClick={() => onViewChange('russia')}
              aria-label="Open the detailed map of Russia"
            >
              <span>Russia</span>
            </button>
            <button
              className="map-hotspot map-hotspot--ukraine"
              type="button"
              onClick={() => onViewChange('ukraine')}
              aria-label="Open the detailed map of Ukraine"
            >
              <span>Ukraine</span>
            </button>
            <button
              className="map-hotspot map-hotspot--world-turkey"
              type="button"
              onClick={() => onViewChange('turkey')}
              aria-label="Open the detailed map of Turkey"
            >
              <span>Turkey</span>
            </button>
            <button
              className="map-hotspot map-hotspot--taiwan"
              type="button"
              onClick={() => onViewChange('taiwan')}
              aria-label="Open the detailed map of Taiwan"
            >
              <span>Taiwan</span>
            </button>
          </>
        )}

        {activeLayer === 'flashPoints' && view === 'middleEast' && (
          <>
            <button
              className="map-hotspot map-hotspot--turkey"
              type="button"
              onClick={() => onViewChange('turkey')}
              aria-label="Open the detailed map of Turkey"
            >
              <span>Turkey</span>
            </button>
            <button
              className="map-hotspot map-hotspot--israel"
              type="button"
              onClick={() => onViewChange('israel')}
              aria-label="Open the detailed map of Israel"
            >
              <span>Israel</span>
            </button>
          </>
        )}

        {activeLayer === 'finance' && view === 'world' && (
          <>
            <button
              className="map-hotspot map-hotspot--united-states"
              type="button"
              onClick={() => onViewChange('unitedStates')}
              aria-label="Open the United States financial stability report"
            >
              <span>United States</span>
            </button>
            <button
              className="map-hotspot map-hotspot--united-kingdom"
              type="button"
              onClick={() => onViewChange('unitedKingdom')}
              aria-label="Open the United Kingdom bond stability report"
            >
              <span>United Kingdom</span>
            </button>
            <button
              className="map-hotspot map-hotspot--japan"
              type="button"
              onClick={() => onViewChange('japan')}
              aria-label="Open Japan's financial stability report"
            >
              <span>Japan</span>
            </button>
            <button
              className="map-hotspot map-hotspot--australia"
              type="button"
              onClick={() => onViewChange('australiaFinance')}
              aria-label="Open Australia's housing awareness report"
            >
              <span>Australia</span>
            </button>
          </>
        )}

        {activeLayer === 'politicalParties' && view === 'world' && (
          <button
            className="map-hotspot map-hotspot--australia"
            type="button"
            onClick={() => onViewChange('australia')}
            aria-label="Open the Libertarian Group of Australia"
          >
            <span>Australia</span>
          </button>
        )}

        {view !== 'world' && (
          <button
            className="political-map__back"
            type="button"
            onClick={onBack}
            aria-label="Return to the previous map view"
          >
            <BackIcon />
            <span>Back</span>
          </button>
        )}

        {activeRelation && <RelationsPanel relation={activeRelation} />}
        {activeFinancialReport && !activeFinancialReport.tweet && <FinancialPanel report={activeFinancialReport} />}
        {activePoliticalParty && <PoliticalPartyPanel party={activePoliticalParty} />}

        <div className="political-map__caption">
          <span>Political atlas</span>
          <strong>{activeMap.label}</strong>
        </div>
        </div>
        {activeFinancialReport?.tweet && <FinancialPanel report={activeFinancialReport} />}
      </div>
    </section>
  )
}

export default PoliticalMap
