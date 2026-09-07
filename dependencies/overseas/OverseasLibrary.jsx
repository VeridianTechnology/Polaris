import { useState } from 'react'
import InstagramCollection from '../shared/InstagramCollection.jsx'
import './overseas-library.css'

const categories = [
  { key: 'crime', label: 'Crime', post: 'DciJWtmH98N' },
  { key: 'finance', label: 'Finance', post: 'DanJDw2hzAE', additionalPosts: ['DceNoLgMNit'] },
  {
    key: 'legal',
    label: 'Legal',
    post: 'DcGQabut-rD',
  },
]

function OverseasLibrary() {
  const [activeTab, setActiveTab] = useState('crime')

  return (
    <section className="overseas-library" aria-labelledby="overseas-title">
      <header className="overseas-library__intro">
        <p>International stories</p>
        <h1 id="overseas-title">Overseas</h1>
      </header>

      <div className="overseas-library__tabs" role="tablist" aria-label="Overseas story categories">
        {categories.map((category, index) => (
          <button
            key={category.key}
            id={`overseas-tab-${category.key}`}
            type="button"
            role="tab"
            aria-selected={activeTab === category.key}
            aria-controls={`overseas-panel-${category.key}`}
            tabIndex={activeTab === category.key ? 0 : -1}
            onClick={() => setActiveTab(category.key)}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
              event.preventDefault()
              const nextIndex = event.key === 'Home' ? 0
                : event.key === 'End' ? categories.length - 1
                  : (index + (event.key === 'ArrowRight' ? 1 : -1) + categories.length) % categories.length
              const next = categories[nextIndex].key
              setActiveTab(next)
              document.getElementById(`overseas-tab-${next}`)?.focus()
            }}
          >{category.label}</button>
        ))}
      </div>

      {categories.map((category) => (
        <div
          key={category.key}
          id={`overseas-panel-${category.key}`}
          role="tabpanel"
          aria-labelledby={`overseas-tab-${category.key}`}
          hidden={activeTab !== category.key}
          tabIndex={0}
        >
          {activeTab === category.key && (
            <InstagramCollection features={[category.post, ...(category.additionalPosts || [])].map((post) => ({
              title: `Overseas ${category.label.toLowerCase()} story`,
              embedUrl: `https://www.instagram.com/p/${post}/embed/`,
            }))} />
          )}
        </div>
      ))}
    </section>
  )
}

export default OverseasLibrary
