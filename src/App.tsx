import { useMemo, useState } from 'react'
import {
  Search, Play, Radio, Tv, Clapperboard, Headphones, GraduationCap,
  Users, Menu, X, ChevronRight, ArrowUpRight, Sparkles, ShieldCheck,
  CircleHelp, LayoutDashboard, Heart, Globe2
} from 'lucide-react'

type Item = {
  id: number
  title: string
  category: string
  type: string
  description: string
  image: string
  label: string
  duration?: string
}

const items: Item[] = [
  {
    id: 1, title: 'The Sound of Home', category: 'Culture', type: 'Documentary',
    description: 'A journey through the people, places and rhythms shaping a new generation of African music.',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1100&q=85',
    label: 'AFROLIVESTREAM ORIGINAL', duration: '42 min'
  },
  {
    id: 2, title: 'Stories After Dark', category: 'Community', type: 'Talk show',
    description: 'Honest conversations with creators, entrepreneurs and changemakers from across the continent.',
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=85',
    label: 'NEW EPISODE', duration: '28 min'
  },
  {
    id: 3, title: 'Made in Africa', category: 'Business', type: 'Series',
    description: 'Meet the innovators and makers building the future of African industry.',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=85',
    label: 'FEATURED SERIES', duration: '6 episodes'
  },
  {
    id: 4, title: 'Rhythm & Roots', category: 'Music', type: 'Music',
    description: 'Live performances and intimate sessions celebrating the sounds that connect us.',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85',
    label: 'MUSIC', duration: 'Live sessions'
  },
  {
    id: 5, title: 'Next Gen Africa', category: 'Education', type: 'Learning',
    description: 'Skills, career journeys and practical ideas for the next generation of talent.',
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=85',
    label: 'LEARN', duration: '18 min'
  },
  {
    id: 6, title: 'City to Coast', category: 'Travel', type: 'Travel series',
    description: 'Discover the neighbourhoods, landscapes and local stories that make each place unique.',
    image: 'https://images.unsplash.com/photo-1489749798305-4fec3ae63d43?auto=format&fit=crop&w=900&q=85',
    label: 'EXPLORE', duration: '5 episodes'
  },
]

const categories = [
  { name: 'For You', icon: Sparkles },
  { name: 'Live TV', icon: Tv },
  { name: 'Radio', icon: Radio },
  { name: 'Movies & Series', icon: Clapperboard },
  { name: 'Podcasts', icon: Headphones },
  { name: 'Community', icon: Users },
  { name: 'Education', icon: GraduationCap },
]

function App() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('For You')
  const [selected, setSelected] = useState<Item | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [saved, setSaved] = useState<number[]>([])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    return items.filter(item => {
      const matchesSearch = !term || `${item.title} ${item.category} ${item.description} ${item.type}`.toLowerCase().includes(term)
      const category = activeCategory.toLowerCase()
      const matchesCategory = activeCategory === 'For You'
        || (activeCategory === 'Movies & Series' && ['documentary', 'series', 'travel series'].includes(item.type.toLowerCase()))
        || (activeCategory === 'Podcasts' && item.type.toLowerCase().includes('talk'))
        || (activeCategory === 'Education' && item.category === 'Education')
        || (activeCategory === 'Community' && item.category === 'Community')
        || (activeCategory === 'Live TV' && false)
        || (activeCategory === 'Radio' && item.category === 'Music')
        || item.category.toLowerCase() === category
      return matchesSearch && matchesCategory
    })
  }, [search, activeCategory])

  const toggleSaved = (id: number) => {
    setSaved(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id])
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Afrolivestream home" onClick={() => { setActiveCategory('For You'); setShowAdmin(false) }}>
          <span className="brand-mark"><span /><span /><span /></span>
          <span className="brand-name">afro<span>live</span>stream</span>
        </a>
        <nav className={`main-nav ${showMenu ? 'open' : ''}`}>
          {['Discover', 'Live', 'Series', 'Podcasts'].map(link => (
            <button key={link} className={link === 'Discover' ? 'nav-link active' : 'nav-link'} onClick={() => {
              setShowAdmin(false)
              setActiveCategory(link === 'Live' ? 'Live TV' : link === 'Series' ? 'Movies & Series' : link === 'Podcasts' ? 'Podcasts' : 'For You')
              setShowMenu(false)
            }}>{link}</button>
          ))}
        </nav>
        <div className="top-actions">
          <label className="search-box">
            <Search size={17} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stories..." aria-label="Search stories" />
            {search && <button className="clear-search" onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}
          </label>
          <button className="admin-link" onClick={() => setShowAdmin(v => !v)}><LayoutDashboard size={16} /> <span>Studio</span></button>
          <button className="mobile-menu" onClick={() => setShowMenu(v => !v)} aria-label="Toggle menu">{showMenu ? <X /> : <Menu />}</button>
        </div>
      </header>

      {showAdmin ? (
        <main className="admin-page">
          <div className="eyebrow"><LayoutDashboard size={14} /> CREATOR STUDIO</div>
          <h1>Content starts <span>here.</span></h1>
          <p className="admin-intro">A preview of the Afrolivestream publishing workspace. This demo is local-only; authentication and database integration are not yet connected.</p>
          <div className="admin-grid">
            <div className="admin-stat"><span>Catalogue items</span><strong>{items.length.toString().padStart(2, '0')}</strong><small>Sample content only</small></div>
            <div className="admin-stat"><span>Saved by you</span><strong>{saved.length.toString().padStart(2, '0')}</strong><small>Current browser session</small></div>
            <div className="admin-stat"><span>Rights status</span><strong className="pending">Review</strong><small>Before any public launch</small></div>
          </div>
          <section className="admin-panel">
            <div className="section-heading"><div><span className="eyebrow">CONTENT LIBRARY</span><h2>Catalogue overview</h2></div><span className="demo-pill">DEMO DATA</span></div>
            <div className="admin-table">
              <div className="table-row table-head"><span>Title</span><span>Type</span><span>Rights</span><span>Status</span></div>
              {items.map(item => <div className="table-row" key={item.id}><span className="table-title">{item.title}</span><span>{item.type}</span><span><span className="dot amber" /> Needs review</span><span className="draft-tag">Draft</span></div>)}
            </div>
          </section>
          <button className="text-button" onClick={() => setShowAdmin(false)}>← Back to viewer</button>
        </main>
      ) : (
        <main>
          <section className="hero">
            <div className="hero-backdrop" />
            <div className="hero-content">
              <div className="hero-kicker"><span className="live-dot" /> A NEW HOME FOR AFRICAN STORIES</div>
              <h1>Stories that<br />move <span>us.</span></h1>
              <p>Discover the voices, sounds and ideas shaping Africa — one story at a time.</p>
              <div className="hero-buttons">
                <button className="primary-button" onClick={() => setSelected(items[0])}><Play size={17} fill="currentColor" /> Explore featured story</button>
                <button className="secondary-button" onClick={() => { setActiveCategory('Live TV'); document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' }) }}><Radio size={17} /> Explore live</button>
              </div>
              <div className="hero-proof"><span><ShieldCheck size={15} /> Rights-first platform</span><span><Globe2 size={15} /> Made for Africa & the world</span></div>
            </div>
            <div className="hero-feature-card">
              <img src={items[0].image} alt="" />
              <div className="feature-card-overlay" />
              <div className="feature-card-copy"><span className="feature-tag">FEATURED STORY</span><h3>The Sound<br />of Home</h3><button onClick={() => setSelected(items[0])}>Watch preview <ArrowUpRight size={14} /></button></div>
            </div>
            <div className="hero-index"><span>01</span><i /><span>06</span></div>
          </section>

          <section className="category-strip" id="browse">
            <div className="category-scroll">
              {categories.map(({ name, icon: Icon }) => (
                <button key={name} className={`category-chip ${activeCategory === name ? 'selected' : ''}`} onClick={() => setActiveCategory(name)}>
                  <Icon size={17} strokeWidth={1.8} /><span>{name}</span>
                </button>
              ))}
            </div>
          </section>

          {(activeCategory === 'Live TV' || activeCategory === 'Radio') && (
            <section className="live-notice">
              <div className="live-notice-icon">{activeCategory === 'Radio' ? <Radio /> : <Tv />}</div>
              <div><strong>{activeCategory === 'Radio' ? 'Radio directory' : 'Live TV directory'}</strong><p>{activeCategory === 'Radio' ? 'Authorised radio streams will appear here when configured.' : 'Live channels will appear here after their online distribution rights and stream sources are verified.'}</p></div>
              <span className="demo-pill">SETUP REQUIRED</span>
            </section>
          )}

          <section className="content-section">
            <div className="section-heading">
              <div><span className="eyebrow">{search ? 'SEARCH RESULTS' : 'HANDPICKED FOR YOU'}</span><h2>{search ? `Results for “${search}”` : activeCategory === 'For You' ? 'Discover something new' : activeCategory}</h2></div>
              <button className="see-all" onClick={() => { setActiveCategory('For You'); setSearch('') }}>View all <ChevronRight size={16} /></button>
            </div>
            {filteredItems.length ? (
              <div className="content-grid">
                {filteredItems.map((item, index) => (
                  <article className={`content-card ${index === 0 ? 'featured-card' : ''}`} key={item.id}>
                    <button className="poster-button" onClick={() => setSelected(item)} aria-label={`Open ${item.title}`}>
                      <img src={item.image} alt="" loading="lazy" />
                      <span className="poster-shade" />
                      <span className="content-label">{item.label}</span>
                      <span className="play-circle"><Play size={18} fill="currentColor" /></span>
                      <span className="poster-duration">{item.duration}</span>
                    </button>
                    <div className="card-meta"><div><h3>{item.title}</h3><p>{item.category} <span>·</span> {item.type}</p></div>
                      <button className={`save-button ${saved.includes(item.id) ? 'saved' : ''}`} onClick={() => toggleSaved(item.id)} aria-label={saved.includes(item.id) ? 'Remove from saved' : 'Save item'}><Heart size={17} fill={saved.includes(item.id) ? 'currentColor' : 'none'} /></button>
                    </div>
                    <p className="card-description">{item.description}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state"><Search size={28} /><h3>No stories found</h3><p>Try another search or browse all categories.</p><button className="secondary-button" onClick={() => { setSearch(''); setActiveCategory('For You') }}>Reset discovery</button></div>
            )}
          </section>

          <section className="membership-banner">
            <div className="membership-icon"><Sparkles size={22} /></div>
            <div><span className="eyebrow">BUILT AROUND OUR STORIES</span><h2>A platform for the voices that deserve to be heard.</h2><p>Independent creators, local broadcasters and communities — all in one place.</p></div>
            <button onClick={() => setShowAdmin(true)}>Creator studio <ChevronRight size={16} /></button>
          </section>
        </main>
      )}

      <footer className="footer">
        <a className="brand footer-brand" href="#"><span className="brand-mark"><span /><span /><span /></span><span className="brand-name">afro<span>live</span>stream</span></a>
        <span>Stories that move us.</span>
        <div className="footer-links"><a href="#browse">Discover</a><a href="#browse">Channels</a><button onClick={() => setShowAdmin(true)}>Creator studio</button><a href="mailto:hello@afrolivestream.example">Contact</a></div>
        <p className="footer-note"><CircleHelp size={13} /> Prototype preview. Sample catalogue only; no third-party live streams are embedded.</p>
        <p className="copyright">© {new Date().getFullYear()} Afrolivestream. Built for stories with purpose.</p>
      </footer>

      {selected && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <section className="detail-modal" role="dialog" aria-modal="true" aria-label={`${selected.title} details`} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close details"><X /></button>
            <div className="modal-image"><img src={selected.image} alt="" /><span className="modal-image-shade" /></div>
            <div className="modal-copy"><span className="eyebrow">{selected.label}</span><h2>{selected.title}</h2><p className="modal-type">{selected.category} · {selected.type} · {selected.duration}</p><p>{selected.description}</p><div className="preview-notice"><ShieldCheck size={16} /><span>Preview mode — playback will be enabled when an authorised content source is configured.</span></div><button className="primary-button" onClick={() => setSelected(null)}>Continue exploring <ChevronRight size={16} /></button></div>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
