import React, { useEffect, useState, useMemo } from 'react';
import { fetchChannelsSmart } from '../services/dataSource';

const toSlug = (v) =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');

export default function ChannelList({ selectedCategorySlug, selectedId, onSelect }) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchChannelsSmart();
        setChannels(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load channels', e);
        setError(e);
        setChannels([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!selectedCategorySlug) return channels;
    const sel = toSlug(selectedCategorySlug);
    return channels.filter((ch) => {
      const rawCat =
        typeof ch.category === 'object'
          ? ch.category?.slug ?? ch.category?.name
          : ch.category;
      return toSlug(rawCat) === sel;
    });
  }, [channels, selectedCategorySlug]);

  if (loading) return <p style={{opacity:.8}}>Loading…</p>;
  if (error)   return <p style={{color:'#f66'}}>Could not load channels.</p>;
  if (!filtered.length) return <p style={{opacity:.8}}>No channels in this category.</p>;

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {filtered.map((ch) => (
        <li key={ch.id} style={{ marginBottom: 6 }}>
          <button
            onClick={() => onSelect?.(ch)}
            className={`chip ${selectedId === ch.id ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--border, #2a2f3a)',
              background: selectedId === ch.id ? 'var(--chip-active,#1b2332)' : 'transparent',
              cursor: 'pointer'
            }}
          >
            {ch.logo && (
              <img
                src={ch.logo}
                alt=""
                style={{ height: 18, width: 18, objectFit: 'contain', opacity: .9 }}
              />
            )}
            <span style={{ textAlign: 'left' }}>{ch.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
