import { useState } from 'react'
import InstagramCollection from '../shared/InstagramCollection.jsx'
import { cultureFeatures, cultureSubcategories } from './cultureFeatures.js'
import { ROUTES } from '../../routing/routes.js'

const foidsRoutes = {
  main: ROUTES.agoraCultureFoids,
  advice: ROUTES.agoraCultureFoidsAdvice,
  astrology: ROUTES.agoraCultureFoidsAstrology,
  'accounts-to-follow': ROUTES.agoraCultureFoidsAccounts,
}

function InstagramAccounts({ accounts }) {
  return <div className="instagram-account-grid" aria-label="Instagram accounts to follow">
    {accounts.map((account) => <a key={account.username} className="instagram-account-card" href={account.url} target="_blank" rel="noreferrer">
      <span className="instagram-account-card__mark" aria-hidden="true">@</span>
      <span><strong>@{account.username}</strong><small>Open Instagram profile</small></span>
      <span className="instagram-account-card__arrow" aria-hidden="true">↗</span>
    </a>)}
  </div>
}

function CultureLibrary({ cultureView = 'music', cultureSubView, navigate }) {
  const [selectedTabs, setSelectedTabs] = useState({})
  const selectedView = Object.hasOwn(cultureFeatures, cultureView)
    ? cultureView
    : 'music'
  const subcategory = cultureSubcategories[selectedView]
  const tabs = subcategory ? [
    { key: 'main', label: subcategory.mainLabel || (selectedView === 'new-age-athletes' ? 'Athletes' : selectedView === 'history' ? 'History' : 'Fights'), features: cultureFeatures[selectedView] },
    ...(subcategory.label ? [{ key: 'extra', label: subcategory.label, features: subcategory.features }] : []),
    ...(subcategory.additionalTabs || []),
  ] : []
  const activeTab = tabs.some((tab) => tab.key === cultureSubView) ? cultureSubView : selectedTabs[selectedView] || 'main'
  const selectTab = (tabKey) => {
    setSelectedTabs((current) => ({ ...current, [selectedView]: tabKey }))
    if (selectedView === 'comedy') {
      if (tabKey === 'race') navigate(ROUTES.agoraCultureComedyRace)
      else if (cultureSubView === 'race') navigate(ROUTES.agoraCultureComedy)
    }
    if (selectedView === 'history') {
      if (tabKey === 'extra') navigate(ROUTES.agoraCultureHistoryAiRecreation)
      else if (cultureSubView === 'extra') navigate(ROUTES.agoraCultureHistory)
    }
    if (selectedView === 'foids') navigate(foidsRoutes[tabKey] || ROUTES.agoraCultureFoids)
  }
  const selectedTab = tabs.find((tab) => tab.key === activeTab)
  const selectedFeatures = selectedTab?.features || cultureFeatures[selectedView]
  const features = selectedFeatures.flatMap((feature) => [
    feature,
    ...(feature.additionalLinks || []).map((link) => ({
      id: link.url,
      title: link.label,
      url: link.url,
      embedUrl: `${link.url.replace(/\/$/, '')}/embed/`,
    })),
  ])

  return (
    <section className="social-library" aria-labelledby="culture-library-title">
      <header className="social-library__intro">
        <p>{selectedView === 'foids' ? 'Memes, advice &amp; accounts' : 'Sound, humor &amp; culture'}</p>
        <h1 id="culture-library-title">{selectedView === 'foids' ? 'Foids' : 'Culture'}</h1>
      </header>

      {subcategory && (
        <div className="social-library__subtabs" role="tablist" aria-label={`${selectedView} collections`}>
          {tabs.map((tab, index) => (
            <button
              key={tab.key}
              id={`culture-subtab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls="culture-collection"
              tabIndex={activeTab === tab.key ? 0 : -1}
              onClick={() => selectTab(tab.key)}
              onKeyDown={(event) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
                event.preventDefault()
                const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
                const next = tabs[nextIndex].key
                selectTab(next)
                document.getElementById(`culture-subtab-${next}`)?.focus()
              }}
            >{tab.label}</button>
          ))}
        </div>
      )}
      <div id="culture-collection" role={subcategory ? 'tabpanel' : undefined} aria-labelledby={subcategory ? `culture-subtab-${activeTab}` : undefined} tabIndex={subcategory ? 0 : undefined}>
      {selectedTab?.accounts
        ? <InstagramAccounts accounts={selectedTab.accounts} />
        : <InstagramCollection features={features} label={`${selectedView} selections`} />}
      </div>
    </section>
  )
}

export default CultureLibrary
