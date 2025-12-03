// src/services/dataSource.ts
import { channels as localChannels } from '../data/channels' // no extension to satisfy TS
import { fetchChannels as apiFetchChannels } from './api'
import { parse as parseM3U } from 'iptv-playlist-parser'

/* ------------------------- helpers (define FIRST!) ------------------------- */
const toSlug = (s: string) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const fromSlug = (slug: string) => {
  const s = String(slug || '').replace(/-+/g, ' ').trim()
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'News'
}

const looksHls = (u?: string) => !!u && /\.m3u8(\?|$)/i.test(u)
const looksYouTube = (u?: string) =>
  !!u && /(youtu\.be|youtube\.com|youtube-nocookie\.com)/i.test(u)

const normalizeCategory = (cat: any) => {
  // Keep it simple: string → {slug,name}, object → trust fields, fallback News.
  if (!cat) return { slug: 'news', name: 'News' }
  if (typeof cat === 'string') {
    const name = cat.trim() || 'News'
    return { slug: toSlug(name), name }
  }
  const slug = (cat?.slug && String(cat.slug).trim()) || ''
  const name = (cat?.name && String(cat.name).trim()) || ''
  if (slug && name) return { slug, name }
  if (name) return { slug: toSlug(name), name }
  if (slug) return { slug, name: fromSlug(slug) }
  return { slug: 'news', name: 'News' }
}

/* ------------------------------ env flags --------------------------------- */
const useLocal =
  String((import.meta as any)?.env?.VITE_USE_LOCAL ?? 'true').toLowerCase() === 'true'

// Keep a sensible default so dev always shows something
const m3uUrl: string | undefined =
  (import.meta as any)?.env?.VITE_IPTV_M3U_URL ||
  'https://iptv-org.github.io/iptv/languages/eng.m3u'

console.log('[dataSource] VITE_USE_LOCAL =', useLocal)
console.log('[dataSource] VITE_IPTV_M3U_URL =', m3uUrl)

/* ------------------------------- M3U cache -------------------------------- */
let m3uCache: any[] | null = null
let m3uCacheAt = 0
const M3U_CACHE_MS = 5 * 60 * 1000 // 5 minutes

const slugifyId = (s: string) => toSlug(s).slice(0, 80)
const hashUrl = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/* ---------------------------- M3U ingestion ------------------------------- */
async function fetchM3UItems(): Promise<any[]> {
  if (!m3uUrl) return []
  const now = Date.now()
  if (m3uCache && now - m3uCacheAt < M3U_CACHE_MS) return m3uCache

  try {
    const res = await fetch(m3uUrl, { cache: 'no-store' })
    if (!res.ok) {
      console.warn('[dataSource] M3U fetch failed:', res.status, res.statusText)
      m3uCache = []
      m3uCacheAt = now
      return m3uCache
    }
    const text = await res.text()
    const parsed = parseM3U(text) // { items: [...] }
    const items = Array.isArray(parsed?.items) ? parsed.items : []

    // Map M3U items → your channel shape (HLS-only by design)
    const mapped = items
      .filter((it: any) => looksHls(it?.url))
      .map((it: any) => {
        const attrs = it?.attrs || {}
        const baseName = it?.name || attrs['tvg-name'] || attrs['tvg-id'] || 'Unknown'
        const name = baseName
        const logo = attrs['tvg-logo'] || undefined

        // Use group-title directly, fallback "Other"
        const rawGroup = attrs['group-title'] || 'Other'
        const category = normalizeCategory(rawGroup)

        const langRaw = attrs['tvg-language'] || ''
        const language = langRaw
          ? { code: toSlug(langRaw).slice(0, 3), name: String(langRaw) }
          : undefined

        const url: string = String(it.url)
        const baseId = slugifyId(attrs['tvg-id'] || name)
        const id = `m3u-${baseId}-${hashUrl(url)}`

        return {
          id,
          name,
          logo,
          category,
          language,
          // IMPORTANT: direct URL; the Player handles proxy/backup on error
          source: url,
          stream_url: url,
          url,
          streamType: 'hls' as const,
        }
      })

    m3uCache = mapped
    m3uCacheAt = now
    console.log('[dataSource] M3U items:', mapped.length, 'from', m3uUrl)
    return mapped
  } catch (e) {
    console.warn('[dataSource] M3U error:', e)
    m3uCache = []
    m3uCacheAt = Date.now()
    return m3uCache
  }
}

/* ---------------------- normalize local/API channels ---------------------- */
const normalizeChannel = (raw: any) => {
  const primaryRaw = raw.source || raw.stream_url || raw.url || raw.file || ''
  const logo = raw.logo || raw.icon || undefined
  const category = normalizeCategory(raw.category)

  // classify by URL if streamType isn't provided
  const detectedType =
    raw.streamType ||
    raw.type ||
    (looksHls(primaryRaw) ? 'hls' : looksYouTube(primaryRaw) ? 'youtube' : undefined)

  // Keep source ALWAYS (we were deleting it for non-HLS before)
  // Only populate legacy HLS aliases when the source is HLS
  const legacy =
    detectedType === 'hls'
      ? {
          stream_url: primaryRaw,
          url: primaryRaw,
        }
      : {}

  return {
    ...raw,
    logo,
    category,
    source: primaryRaw,
    backup: raw.backup || undefined,
    streamType: detectedType,
    ...legacy,
  }
}

const looksPlayable = (ch: any) => {
  const src = ch?.source || ch?.url || ch?.stream_url || ch?.file
  const t = String(ch?.streamType || ch?.type || '').toLowerCase()
  return looksHls(src) || looksYouTube(src) || t === 'youtube'
}

/* ------------------------------ public API -------------------------------- */
export async function fetchChannelsSmart(): Promise<any[]> {
  const base: any[] = useLocal
    ? (Array.isArray(localChannels) ? localChannels : [])
    : (await apiFetchChannels()) || []

  const normalizedLocal = base.map(normalizeChannel).filter(looksPlayable)

  const m3u = await fetchM3UItems() // normalized + HLS-only

  // Merge without touching existing ids; de-dupe by (name+source)
  const seen = new Set<string>()
  const keyOf = (c: any) => `${toSlug(c.name)}::${c.source || c.url || ''}`
  const merged: any[] = []

  for (const c of normalizedLocal) {
    const k = keyOf(c)
    seen.add(k)
    merged.push(c)
  }
  for (const c of m3u) {
    const k = keyOf(c)
    if (!seen.has(k)) {
      seen.add(k)
      merged.push(c)
    }
  }

  console.log(
    '[dataSource] channels: local/API',
    normalizedLocal.length,
    '+ m3u',
    m3u.length,
    '→ merged',
    merged.length
  )
  return merged
}

export async function fetchCategoriesSmart(): Promise<
  { id: number; slug: string; name: string }[]
> {
  const channels = await fetchChannelsSmart()
  const uniq = new Map<string, { id: number; slug: string; name: string }>()
  for (const ch of channels) {
    const cat = normalizeCategory(ch?.category)
    const slug = cat.slug || 'news'
    const name = cat.name || 'News'
    if (!uniq.has(slug)) {
      uniq.set(slug, { id: uniq.size + 1, slug, name })
    }
  }
  return Array.from(uniq.values()).sort((a, b) => a.name.localeCompare(b.name))
}
