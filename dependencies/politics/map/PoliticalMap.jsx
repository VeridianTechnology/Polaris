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
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
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

function PoliticalMap({ view, onViewChange }) {
  const activeMap = MAPS[view]
  const activeRelation = RELATIONS[view]

  return (
    <section className={`political-map political-map--${view}`} aria-label="Political map explorer">
      <div className="political-map__frame">
        <img
          className="political-map__image"
          src={activeMap.image}
          alt={activeMap.alt}
          key={view}
        />

        <div className="political-map__edge" aria-hidden="true" />

        {view === 'world' && (
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
              className="map-hotspot map-hotspot--taiwan"
              type="button"
              onClick={() => onViewChange('taiwan')}
              aria-label="Open the detailed map of Taiwan"
            >
              <span>Taiwan</span>
            </button>
          </>
        )}

        {view === 'middleEast' && (
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

        {view !== 'world' && (
          <button
            className="political-map__close"
            type="button"
            onClick={() => onViewChange('world')}
            aria-label="Close detailed map and return to the world map"
          >
            <CloseIcon />
          </button>
        )}

        {activeRelation && <RelationsPanel relation={activeRelation} />}

        <div className="political-map__caption">
          <span>Political atlas</span>
          <strong>{activeMap.label}</strong>
        </div>
      </div>
    </section>
  )
}

export default PoliticalMap
