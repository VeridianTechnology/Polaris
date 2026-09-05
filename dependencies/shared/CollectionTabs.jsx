import { useState } from 'react'
import './instagram-feature-card.css'

export default function CollectionTabs({ id, label, tabs, children }) {
  const [activeKey, setActiveKey] = useState(tabs[0].key)
  const activeTab = tabs.find((tab) => tab.key === activeKey) || tabs[0]
  return (
    <>
      <div className="social-library__subtabs" role="tablist" aria-label={label}>
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            id={`${id}-tab-${tab.key}`}
            type="button"
            role="tab"
            aria-selected={activeTab.key === tab.key}
            aria-controls={`${id}-panel`}
            tabIndex={activeTab.key === tab.key ? 0 : -1}
            onClick={() => setActiveKey(tab.key)}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
              event.preventDefault()
              const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
              const next = tabs[nextIndex].key
              setActiveKey(next)
              document.getElementById(`${id}-tab-${next}`)?.focus()
            }}
          >{tab.label}</button>
        ))}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${activeTab.key}`} tabIndex={0}>
        {children(activeTab)}
      </div>
    </>
  )
}
