// src/services/dataSource.js
import { channels as localChannels } from '../data/channels.js';
import {
  fetchCategories as apiFetchCategories,
  fetchChannels as apiFetchChannels,
} from './api';

// Use local by default unless explicitly disabled
const useLocal = String(import.meta.env.VITE_USE_LOCAL ?? 'true').toLowerCase() === 'true';

export async function fetchChannelsSmart() {
  console.log('[dataSource] VITE_USE_LOCAL =', useLocal);
  if (useLocal) {
    console.log('[dataSource] returning localChannels:', localChannels.length);
    return localChannels;
  }
  const api = await apiFetchChannels();
  return Array.isArray(api) ? api : [];
}

export async function fetchCategoriesSmart() {
  if (useLocal) {
    const uniq = new Map();
    for (const ch of localChannels) {
      const raw = (ch.category || 'News').trim();
      const slug = raw.toLowerCase().replace(/\s+/g, '-');
      if (!uniq.has(slug)) uniq.set(slug, { id: uniq.size + 1, slug, name: raw });
    }
    return Array.from(uniq.values());
  }
  return apiFetchCategories();
}
