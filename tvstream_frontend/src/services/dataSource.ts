// src/services/dataSource.js
import { channels as localChannels } from '../data/channels.js';
import {
  fetchCategories as apiFetchCategories,
  fetchChannels as apiFetchChannels,
} from './api';

// Use local by default unless explicitly disabled
const useLocal = String((import.meta?.env?.VITE_USE_LOCAL ?? 'true')).toLowerCase() === 'true';

// --- helpers to normalize category ---
const toSlug = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const fromSlug = (slug) => {
  const s = String(slug || '').replace(/-+/g, ' ').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'News';
};

function catName(cat) {
  if (!cat) return 'News';
  if (typeof cat === 'string') return cat.trim() || 'News';
  // object form
  const name = (cat?.name && String(cat.name).trim()) || '';
  const slug = (cat?.slug && String(cat.slug).trim()) || '';
  if (name) return name;
  if (slug) return fromSlug(slug);
  return 'News';
}

function catSlug(cat) {
  if (!cat) return 'news';
  if (typeof cat === 'string') return toSlug(cat.trim() || 'News');
  // object form
  const slug = (cat?.slug && String(cat.slug).trim()) || '';
  const name = (cat?.name && String(cat.name).trim()) || '';
  if (slug) return toSlug(slug);
  if (name) return toSlug(name);
  return 'news';
}

// ----- public API -----
export async function fetchChannelsSmart() {
  console.log('[dataSource] VITE_USE_LOCAL =', useLocal);
  if (useLocal) {
    const count = Array.isArray(localChannels) ? localChannels.length : 0;
    console.log('[dataSource] returning localChannels:', count);
    return Array.isArray(localChannels) ? localChannels : [];
  }
  const api = await apiFetchChannels();
  return Array.isArray(api) ? api : [];
}

export async function fetchCategoriesSmart() {
  if (useLocal) {
    const uniq = new Map();
    for (const ch of Array.isArray(localChannels) ? localChannels : []) {
      const slug = catSlug(ch?.category);
      const name = catName(ch?.category);
      if (!uniq.has(slug)) {
        uniq.set(slug, { id: uniq.size + 1, slug, name });
      }
    }
    return Array.from(uniq.values());
  }
  return apiFetchCategories();
}
