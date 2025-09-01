import React, { useEffect, useState, useMemo } from 'react';
import { fetchChannelsSmart } from '../services/dataSource';

export default function ChannelList({ selectedCategorySlug, selectedLanguageCode, onSelect }) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchChannelsSmart();
        setChannels(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load channels', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return channels.filter(ch => {
      const cat = typeof ch.category === 'object' ? ch.category?.slug : ch.category;
      const lang = typeof ch.language === 'object' ? ch.language?.code : ch.language;

      const catOk = !selectedCategorySlug || cat === selectedCategorySlug;
      const langOk = !selectedLanguageCode || lang === selectedLanguageCode;
      return catOk && langOk;
    });
  }, [channels, selectedCategorySlug, selectedLanguageCode]);

  if (loading) return <p>Loading channels…</p>;

  return (
    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
      {filtered.map(ch => {
        console.log('DEBUG channel:', ch); // 👈 See actual shape
        const langLabel = typeof ch.language === 'object' ? ch.language?.code || ch.language?.name : ch.language;
        const catLabel = typeof ch.category === 'object' ? ch.category?.slug || ch.category?.name : ch.category;

        return (
          <li key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {ch.logo && <img src={ch.logo} alt="" style={{ height: 24 }} />}
            <button onClick={() => onSelect(ch)} style={{ cursor: 'pointer' }}>
              {ch.name} <small>({langLabel}/{catLabel})</small>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
