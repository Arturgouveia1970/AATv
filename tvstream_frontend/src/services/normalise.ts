// src/services/normalize.ts
export const looksHls = (u?: string) =>
    typeof u === 'string' && /\.m3u8(\?|$)/i.test(u);
  
  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  const fromSlug = (slug: string) => {
    const s = slug.replace(/-+/g, ' ').trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  
  export const normalizeCategory = (raw: any) => {
    if (!raw) return { slug: 'news', name: 'News' };
    if (typeof raw === 'string') {
      const name = raw.trim() || 'News';
      return { slug: slugify(name), name };
    }
    const slug = (raw?.slug || '').trim();
    const name = (raw?.name || '').trim();
    if (slug && name) return { slug, name };
    if (name) return { slug: slugify(name), name };
    if (slug) return { slug, name: fromSlug(slug) };
    return { slug: 'news', name: 'News' };
  };
  