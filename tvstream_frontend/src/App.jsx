// src/App.jsx
import React, { useState, useEffect } from 'react';
import CategoryList from './components/CategoryList';
import ChannelList from './components/ChannelList';
import Player from './components/Player';
import MovieList from './components/MovieList';
import './App.css';

function App() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [view, setView] = useState('tv'); // 'tv' | 'movies'
  const [drawerOpen, setDrawerOpen] = useState(false); // mobile drawer

  // Close drawer when switching to Movies view
  useEffect(() => {
    if (view !== 'tv') setDrawerOpen(false);
  }, [view]);

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    setSelectedChannel(null);
  };

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
  };

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setSelectedCategory(null);
    setSelectedChannel(null);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        {/* Mobile menu button (shown via CSS @media rule) */}
        <button
          className="ghost"
          aria-label="Open channels"
          onClick={() => setDrawerOpen((o) => !o)}
          title="Channels"
        >
          ☰
        </button>
        {/*<h1 className="title" style={{ marginLeft: 6 }}>
          <img 
            src="/icons/AATv_icons/AATv_48x48.png" 
            alt="AATv logo" 
            style={{ height: 36, verticalAlign: 'middle' }} 
          />
        </h1> */}

        <h1 className="title brand">AATv</h1>
        

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className={`${view === 'tv' ? 'primary' : ''}`}
            onClick={() => setView('tv')}
            title="TV"
          >
            TV
          </button>
          <button
            className={`${view === 'movies' ? 'primary' : ''}`}
            onClick={() => setView('movies')}
            title="Movies"
          >
            Movies
          </button>
        </div>
      </header>

      {/* Main content */}
      {view === 'tv' ? (
        <div className="app-content">
          {/* Sidebar (desktop) */}
          <aside className="channel-list">
            <div style={{ marginBottom: 10 }}>
              <h3
                style={{
                  margin: '6px 0 8px',
                  fontSize: 14,
                  opacity: 0.8,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                }}
              >
                Categories
              </h3>
              <CategoryList
                selectedCategorySlug={selectedCategory}
                onSelect={handleCategorySelect}
              />
            </div>

            <div>
              <h3
                style={{
                  margin: '12px 0 8px',
                  fontSize: 14,
                  opacity: 0.8,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                }}
              >
                Channels
              </h3>
              <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 6 }}>
                <ChannelList
                  selectedCategorySlug={selectedCategory}
                  onSelect={handleChannelSelect}
                  selectedId={selectedChannel?.id}
                />
              </div>
            </div>
          </aside>

          {/* Player (desktop & mobile) */}
          <main>
            <div className="video-player-container">

              <Player channel={selectedChannel} />

              {/* Logo under the player (replaces missing /icons/app-logo.svg) */}
              <div
                className="under-player"
                style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}
              >
                <img
                  src="/icons/AATv_icons/AATv_192x192.png"
                  alt="AATv logo"
                  style={{ height: 120, opacity: 0.9 }}
                />
              </div>

            </div>
          </main>
        </div>
      ) : (
        <MovieList />
      )}

      {/* --- Mobile drawer (channels) --- */}
      {drawerOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`drawer ${drawerOpen ? 'open' : ''}`}
        role="dialog"
        aria-label="Channels"
        aria-modal="true"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Browse</h3>
          <button className="ghost" onClick={() => setDrawerOpen(false)} aria-label="Close">✕</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <h3
            style={{
              margin: '6px 0 8px',
              fontSize: 14,
              opacity: 0.8,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
            }}
          >
            Categories
          </h3>
          <CategoryList
            selectedCategorySlug={selectedCategory}
            onSelect={(slug) => {
              setSelectedCategory(slug);
              setSelectedChannel(null);
              // keep drawer open to pick a channel
            }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <h3
            style={{
              margin: '12px 0 8px',
              fontSize: 14,
              opacity: 0.8,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
            }}
          >
            Channels
          </h3>
          <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: 6 }}>
            <ChannelList
              selectedCategorySlug={selectedCategory}
              onSelect={(ch) => {
                setSelectedChannel(ch);
                setDrawerOpen(false); // close after picking a channel
              }}
              selectedId={selectedChannel?.id}
            />
          </div>
        </div>
      </div>
      {/* --- Footer --- */}
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} AATv • Streaming made simple</p>
      </footer>

    </div>
  );
}

export default App;
