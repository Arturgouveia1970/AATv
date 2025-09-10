// src/App.jsx
import React, { useState, useEffect } from 'react';
import CategoryList from './components/CategoryList';
import ChannelList from './components/ChannelList';
import Player from './components/Player';
import MovieList from './components/MovieList';
import { loadState, saveState } from './lib/state';
import './App.css';

function App() {
  // Load once from localStorage
  const saved = loadState();

  // Seed initial state from saved values (BUT do not restore selectedChannel to avoid autoplay)
  const [selectedCategory, setSelectedCategory] = useState(saved.selectedCategory ?? null);
  const [selectedChannel, setSelectedChannel]   = useState(null); // <-- always start empty
  const [view, setView]                         = useState(saved.view ?? 'tv'); // 'tv' | 'movies'
  const [drawerOpen, setDrawerOpen]             = useState(false); // mobile drawer

  // NEW: track a "fresh open" so drawer shows Categories first
  const [drawerFreshOpen, setDrawerFreshOpen]   = useState(false);

  // Close drawer when switching to Movies view
  useEffect(() => {
    if (view !== 'tv') setDrawerOpen(false);
  }, [view]);

  // Persist view changes
  useEffect(() => {
    saveState({ view });
  }, [view]);

  // Persist category changes
  useEffect(() => {
    saveState({ selectedCategory });
  }, [selectedCategory]);

  // Persist selected channel (store essential fields only)
  useEffect(() => {
    if (selectedChannel) {
      const { id, name, url, source, stream_url, backup, logo } = selectedChannel;
      saveState({
        selectedChannel: { id, name, url, source, stream_url, backup, logo },
      });
    } else {
      saveState({ selectedChannel: null });
    }
  }, [selectedChannel]);

  // Handlers
  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    setSelectedChannel(null);
    saveState({ selectedCategory: slug, selectedChannel: null });
  };

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
    if (channel) {
      const { id, name, url, source, stream_url, backup, logo } = channel;
      saveState({ selectedChannel: { id, name, url, source, stream_url, backup, logo } });
    } else {
      saveState({ selectedChannel: null });
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        {/* Mobile menu button (shown via CSS @media rule) */}
        <button
          className="ghost"
          aria-label="Open channels"
          onClick={() => {
            setDrawerFreshOpen(true);          // ← show Categories first
            setDrawerOpen(true);
          }}
          title="Channels"
        >
          ☰
        </button>

        {/* Optional image logo (commented out) */}
        {/* <h1 className="title" style={{ marginLeft: 6 }}>
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
          {/* Sidebar (desktop): headings removed for a cleaner UI */}
          <aside className="channel-list">
            <CategoryList
              selectedCategorySlug={selectedCategory}
              onSelect={handleCategorySelect}
            />

            <div style={{ height: 12 }} />

            {/* Only show ChannelList AFTER a category is chosen */}
            {selectedCategory && (
              <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 6 }}>
                <ChannelList
                  selectedCategorySlug={selectedCategory}
                  onSelect={handleChannelSelect}
                  selectedId={selectedChannel?.id}
                />
              </div>
            )}
          </aside>

          {/* Player (desktop & mobile) */}
          <main>
            <div className="video-player-container">
              <Player channel={selectedChannel} />

              {/* Logo under the player */}
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
          <button className="ghost" onClick={() => setDrawerOpen(false)} aria-label="Close">
            ✕
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          {/* Drawer always shows Categories first */}
          <CategoryList
            selectedCategorySlug={selectedCategory}
            onSelect={(slug) => {
              setSelectedCategory(slug);
              setSelectedChannel(null);
              saveState({ selectedCategory: slug, selectedChannel: null });
              setDrawerFreshOpen(false);       // ← now show channels in this drawer session
            }}
          />
        </div>

        {/* Show Channels in drawer only after a category was chosen _in this session_ */}
        {!drawerFreshOpen && selectedCategory && (
          <div style={{ marginTop: 12 }}>
            {/* Channels list (no heading) */}
            <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: 6 }}>
              <ChannelList
                selectedCategorySlug={selectedCategory}
                onSelect={(ch) => {
                  setSelectedChannel(ch);
                  if (ch) {
                    const { id, name, url, source, stream_url, backup, logo } = ch;
                    saveState({ selectedChannel: { id, name, url, source, stream_url, backup, logo } });
                  } else {
                    saveState({ selectedChannel: null });
                  }
                  setDrawerOpen(false); // close after picking a channel
                }}
                selectedId={selectedChannel?.id}
              />
            </div>
          </div>
        )}
      </div>

      {/* --- Footer --- */}
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} AATv • Streaming made simple</p>
      </footer>
    </div>
  );
}

export default App;
