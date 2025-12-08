// src/data/channels.ts

export type StreamType = 'hls' | 'mp4' | 'dash' | 'youtube';

export interface Channel {
  id: string;                 // slug: "cgtn-en"
  name: string;               // "CGTN News (English)"
  language: string;           // e.g. "en"
  category: 'News' | 'Sports' | 'Kids' | 'Movies' | 'Music' | 'Docs' | 'Regional' | 'Other';
  country?: string;           // "CN", "GB", etc.

  // Canonical primary URL your Player reads first
  source: string;             // HLS/MP4/DASH URL OR a YouTube URL
  backup?: string;

  streamType: StreamType;     // include 'youtube' for YT channels
  requiresProxy?: boolean;
  notes?: string;

  // Either is fine; your UI can prefer logo over icon
  icon?: string;
  logo?: string;

  // Helpful for YouTube handle→live
  youtubeChannelId?: string;
}

export const channels: Channel[] = [
  // src/data/channels.ts (or .js)
  {
    id: "aljazeera",
    name: "Al Jazeera English",
    language: "en",
    category: "News",
    streamType: "hls",
    // Use the proxy up-front so playlists & segments are rewritten and headers set.
    source: "/hls?url=" + encodeURIComponent("https://live-hls-aje-ak.getaj.net/AJE/index.m3u8"),
    // Optional raw backup (player can try this if proxy fails)
    backup: "https://live-hls-aje-ak.getaj.net/AJE/index.m3u8",
    notes: "Using Akamai AJE host; original live-hls-web-aje host wasn’t reachable on this network."
  },

  {
    id: "dw",
    name: "DW News",
    language: "en",
    category: "News",
    streamType: "hls",
    icon: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkG...", // trimmed
    source: "/hls?url=" + encodeURIComponent("https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/stream05/streamPlaylist.m3u8"),
    backup: "/hls?url=" + encodeURIComponent("https://dwamdstream101.akamaized.net/hls/live/2015525/dwstream102/stream05/streamPlaylist.m3u8")
  },

  {
    id: "cna",
    name: "CNA (Singapore)",
    language: "en",
    category: "News",
    streamType: "hls",
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASQAAACsCAMAAADlsyHf...", // trimmed
    source: "/hls?url=" + encodeURIComponent("https://d2e1asnsl7br7b.cloudfront.net/7782e205e72f43aeb4a48ec97f66ebbe/index.m3u8")
  },

  {
    id: "bbc-news",
    name: "BBC News (YouTube)",
    language: "en",
    category: "News",
    country: "GB",
    streamType: "youtube",
    source: "https://www.youtube.com/channel/UC16niRr50-MSBwiO3YDb3RA/live",
    youtubeChannelId: "UC16niRr50-MSBwiO3YDb3RA",
    icon: "/icons/AATv_icons/bbc-news.png",
    notes: "Legal YouTube live feed; if not live, YouTube shows an offline/placeholder screen."
  },

  {
    id: "redbull",
    name: "Red Bull TV",
    language: "en",
    category: "Sports",
    streamType: "hls",
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAVsAAACRCAMAAABaFeu5...", // trimmed
    source: "/hls?url=" + encodeURIComponent("https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8"),
    backup: "/hls?url=" + encodeURIComponent("https://rbmn-live.akamaized.net/hls/live/622817/BoRB-US/master_928.m3u8")
  },

  {
    id: "tvcultura",
    name: "TV Cultura",
    language: "pt",
    category: "News",
    streamType: "hls",
    source: "https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8"
  },

  {
    id: "arirang",
    name: "Arirang TV",
    language: "en",
    category: "News",
    streamType: "hls",
    icon: "data:image/png;base64,iVBORw0KGgo=", // placeholder
    source: "https://amdlive-ch01-ctnd-com.akamaized.net/arirang_1ch/smil:arirang_1ch.smil/playlist.m3u8"
  },

  {
    id: "smithsonian",
    name: "Smithsonian Channel",
    language: "en",
    category: "Docs",
    streamType: "hls",
    icon: "data:image/png;base64,iVBORw0KGgo=", // placeholder
    source: "https://smithsonianaus-samsungau.amagi.tv/playlist.m3u8"
  },

  {
    id: "nasa-public",
    name: "NASA Public Channel",
    language: "en",
    category: "Docs",
    streamType: "hls",
    icon: "data:image/png;base64,iVBORw0KGgo=", // placeholder
    source: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8"
  },

  {
    id: "france24-en",
    name: "France 24 (English)",
    language: "en",
    category: "News",
    country: "FR",
    streamType: "hls",
    requiresProxy: true,
    icon: "/icons/AATv_icons/france24.png",
    source: "/hls?url=" + encodeURIComponent("https://static.france24.com/live/F24_EN_HI_HLS/live_web.m3u8"),
    backup: "https://static.france24.com/live/F24_EN_HI_HLS/live_web.m3u8",
    notes: "Direct manifest is the same as backup; proxied primary helps with CORS on some setups."
  },

  {
    id: "bbc-worldnews",
    name: "BBC World News",
    language: "en",
    category: "News",
    streamType: "hls",
    icon: "data:image/png;base64,iVBORw0KGgo=", // placeholder
    source: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service",
    notes: "This endpoint is often an audio stream; keep as-is if you want a lightweight fallback."
  },

  {
    id: "euronews-en",
    name: "Euronews (English)",
    language: "en",
    category: "News",
    streamType: "hls",
    icon: "data:image/png;base64,iVBORw0KGgo=", // placeholder
    source: "https://euronews-euronews-english-1-gb.samsung.wurl.com/manifest_1080p.m3u8"
  },

  // ---- MUSIC ----
  {
    id: "rockzilla-tv",
    name: "Rockzilla TV",
    language: "en",
    category: "Music",
    streamType: "hls",
    icon: "data:image/png;base64,iVBORw0KGgo=", // placeholder
    source: "https://rockzillatv.rocks/stream/rockzillatv/playlist.m3u8"
  },
  {
    id: "nostalgia-hits",
    name: "Nostalgia Hits",
    language: "en",
    category: "Music",
    streamType: "hls",
    icon: "data:image/png;base64,iVBORw0KGgo=", // placeholder
    source: "https://stream.nstg.tv/hits/sd/index.m3u8"
  },

  // ---- ENTERTAINMENT & LIFESTYLE ----
  {
    id: "pets-tv",
    name: "Pets TV",
    language: "en",
    category: "Other",
    streamType: "hls",
    icon: "data:image/png;base64,iVBORw0KGgo=", // placeholder
    source: "https://pets-tv.live.stream.geo.akamaized.net/amagi_hls_data_petXXA-pet-tv/CDN/playlist.m3u8"
  },
  {
    id: "fashion-tv",
    name: "Fashion TV",
    language: "en",
    category: "Other",
    streamType: "hls",
    icon: "data:image/png;base64,iVBORw0KGgo=", // placeholder
    source: "https://fash1043.cloudycdn.services/slive/_definst_/ftv_paris_adaptive.smil/playlist.m3u8"
  },
  {
    id: "diy-network",
    name: "DIY Network",
    language: "en",
    category: "Other",
    streamType: "hls",
    icon: "data:image/png;base64,iVBORw0KGgo=", // placeholder
    source: "https://dai.google.com/linear/hls/event/TxL4NjSeRlC0aRtOc5eA7g/master.m3u8",
    notes: "Google DAI manifests can rotate; leave as soft-fail."
  },

  // ---- TEST HLS ----
  {
    id: "aatv-test-sintel",
    name: "AATv Test (Sintel)",
    language: "en",
    category: "Other",
    streamType: "hls",
    logo: "/icons/AATv_icons/AATv_48x48.png",
    source: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
    backup: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  },

  // ---- GLOBAL NEWS ----
  {
    id: "nhk-world",
    name: "NHK World-Japan",
    language: "en",
    category: "News",
    streamType: "hls",
    source: "https://nhkworld.webcdn.stream.ne.jp/www11/hls/live/2003458/nhkworld/index.m3u8"
  },
  {
    id: "trt-world",
    name: "TRT World",
    language: "en",
    category: "News",
    streamType: "hls",
    source: "https://tv-trtworld.live.trt.com.tr/master_1080.m3u8"
  },
  {
    id: "cgtn-en",
    name: "CGTN (English)",
    language: "en",
    category: "News",
    streamType: "hls",
    source: "https://news.cgtn.com/resource/live/english/cgtn-news.m3u8"
  },
  {
    id: "alarabiya",
    name: "Al Arabiya",
    language: "ar",
    category: "News",
    streamType: "hls",
    source: "https://live.alarabiya.net/alarabiapublish/alarabiya.smil/playlist.m3u8"
  }
];

export default channels;