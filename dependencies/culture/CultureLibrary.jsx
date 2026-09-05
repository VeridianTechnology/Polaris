import { useState } from 'react'
import InstagramFeatureCard from '../shared/InstagramFeatureCard.jsx'
import CultureTabs from './CultureTabs.jsx'
import { cultureFeatures, cultureSubcategories } from './cultureFeatures.js'

function CultureLibrary({ cultureView = 'music', navigate }) {
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
  const activeTab = selectedTabs[selectedView] || 'main'
  const selectedFeatures = tabs.find((tab) => tab.key === activeTab)?.features || cultureFeatures[selectedView]
  const features = selectedFeatures.flatMap((feature) => [
    feature,
    ...(feature.additionalLinks || []).map((link) => ({
      id: link.url,
      title: link.label,
      url: link.url,
      embedUrl: `${link.url.replace(/\/$/, '')}/embed/`,
    })),
  ])
  const gridSize = features.length >= 3 ? 'three' : features.length === 2 ? 'two' : 'one'

  return (
    <section className="social-library" aria-labelledby="culture-library-title">
      <header className="social-library__intro">
        <p>Sound, humor &amp; culture</p>
        <h1 id="culture-library-title">Culture</h1>
        {selectedView !== 'religion' && <CultureTabs active={selectedView} navigate={navigate} />}
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
              onClick={() => setSelectedTabs((tabs) => ({ ...tabs, [selectedView]: tab.key }))}
              onKeyDown={(event) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
                event.preventDefault()
                const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
                const next = tabs[nextIndex].key
                setSelectedTabs((tabs) => ({ ...tabs, [selectedView]: next }))
                document.getElementById(`culture-subtab-${next}`)?.focus()
              }}
            >{tab.label}</button>
          ))}
        </div>
      )}
      <div id="culture-collection" role={subcategory ? 'tabpanel' : undefined} aria-labelledby={subcategory ? `culture-subtab-${activeTab}` : undefined} tabIndex={subcategory ? 0 : undefined}>
      <div className={`social-feature-grid social-feature-grid--${gridSize}`} aria-label={`${selectedView} selections`}>
        {features.map((feature) => <InstagramFeatureCard feature={feature} key={feature.embedUrl} />)}
      </div>
      </div>
    </section>
  )
}

export default CultureLibrary
