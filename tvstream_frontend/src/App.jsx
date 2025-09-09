// src/App.jsx
import React, { useState, useEffect } from 'react';
import CategoryList from './components/CategoryList';
import ChannelList from './components/ChannelList';
import Player from './components/Player';
import MovieList from './components/MovieList';
import { loadState, saveState } from './lib/state';
import InstallPrompt from './components/InstallPrompt';   // NEW
import IosInstallTip from './components/IosInstallTip';   // NEW
import { onServiceWorkerUpdate } from './utils/sw-update';// NEW
import './App.css';

function App() {
  const saved = loadState();

  const [selectedCategory, setSelectedCategory] = useState(saved.selectedCategory ?? null);
  const [selectedChannel,  setSelectedChannel]  = useState(saved.selectedChannel ?? null);
  const [selectedLanguage, setSelectedLanguage] = useState(saved.selectedLanguage ?? null);
  const [view, setView]                         = useState(saved.view ?? 'tv');
  const [drawerOpen, setDrawerOpen]             = useState(false);

  // SW update → offer refresh
  useEffect(() => {
    let dismissed = false;
    onServiceWorkerUpdate(() => {
      if (dismissed) return;
      const ok = window.confirm('A new version of AATv is available. Update now?');
      if (ok) window.location.reload();
      else dismissed = true;
    });
  }, []);

  useEffect(() => { if (view !== 'tv') setDrawerOpen(false); }, [view]);
  useEffect(() => { saveState({ view }); }, [view]);
  useEffect(() => { saveState({ selectedCategory, selectedLanguage }); }, [selectedCategory, selectedLanguage]);

  useEffect(() => {
    if (selectedChannel) {
      const { id, name, url, source, stream_url, backup, logo } = selectedChannel;
      saveState({ selectedChannel: { id, name, url, source, stream_url, backup, logo } });
    } else {
      saveState({ selectedChannel: null });
    }
  }, [selectedChannel]);

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

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setSelectedCategory(null);
    setSelectedChannel(null);
    saveState({ selectedLanguage: lang, selectedCategory: null, selectedChannel: null });
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <button
          className="ghost"
          aria-label="Open channels"
          onClick={() => setDrawerOpen((o) => !o)}
          title="Channels"
        >
          ☰
        </button>

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

          {/* Install button shows on Android/desktop when available */}
          <InstallPrompt />
        </div>
      </header>

      {/* Small iOS hint (only shows on iPhone/iPad & not already installed) */}
      <div style={{ padding: '0 12px' }}>
        <IosInstallTip />
      </div>

      {/* Main content */}
      {view === 'tv' ? (
        <div className="app-content">
          <aside className="channel-list">
            <div style={{ marginBottom: 10 }}>
              <h3 style={{ margin: '6px 0 8px', fontSize: 14, opacity: 0.8, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                Categories
              </h3>
              <CategoryList
                selectedCategorySlug={selectedCategory}
                onSelect={handleCategorySelect}
              />
            </div>

            <div>
              <h3 style={{ margin: '12px 0 8px', fontSize: 14, opacity: 0.8, letterSpacing: '.08em', textTransform: 'uppercase' }}>
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

          <main>
            <div className="video-player-container">
              <Player channel={selectedChannel} onLanguageChange={handleLanguageChange} />

              <div className="under-player" style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
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

      {/* Mobile drawer */}
      {drawerOpen && <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} aria-hidden="true" />}
      <div className={`drawer ${drawerOpen ? 'open' : ''}`} role="dialog" aria-label="Channels" aria-modal="true">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Browse</h3>
          <button className="ghost" onClick={() => setDrawerOpen(false)} aria-label="Close">✕</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <h3 style={{ margin: '6px 0 8px', fontSize: 14, opacity: 0.8, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Categories
          </h3>
          <CategoryList
            selectedCategorySlug={selectedCategory}
            onSelect={(slug) => {
              setSelectedCategory(slug);
              setSelectedChannel(null);
              saveState({ selectedCategory: slug, selectedChannel: null });
            }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <h3 style={{ margin: '12px 0 8px', fontSize: 14, opacity: 0.8, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Channels
          </h3>
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
                setDrawerOpen(false);
              }}
              selectedId={selectedChannel?.id}
            />
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} AATv • Streaming made simple</p>
      </footer>
    </div>
  );
}

export default App;
