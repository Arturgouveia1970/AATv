// tvstream_frontend/src/data/channels.ts
import { viaProxy } from '../lib/hls';

export type StreamType = 'hls' | 'mp4' | 'dash' | 'youtube';

export interface Channel {
  id: string;
  name: string;
  language: string;
  category: 'News' | 'Sports' | 'Kids' | 'Movies' | 'Music' | 'Docs' | 'Regional' | 'Other';
  country?: string;

  source: string;
  backup?: string;

  streamType: StreamType;
  requiresProxy?: boolean;
  notes?: string;

  icon?: string;
  logo?: string;

  youtubeChannelId?: string;
}

export const channels: Channel[] = [
  {
    id: 'aljazeera',
    name: 'Al Jazeera English',
    language: 'en',
    category: 'News',
    streamType: 'hls',
    source: viaProxy('https://live-hls-aje-ak.getaj.net/AJE/index.m3u8'),
    backup: 'https://live-hls-aje-ak.getaj.net/AJE/index.m3u8',
    notes: 'Using Akamai AJE host; proxy ensures headers + CORS.'
  },

  // DW
  {
    id: 'dw',
    name: 'DW News',
    language: 'en',
    category: 'News',
    streamType: 'hls',
    source: viaProxy('https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/stream05/streamPlaylist.m3u8'),
    backup: viaProxy('https://dwamdstream101.akamaized.net/hls/live/2015525/dwstream102/stream05/streamPlaylist.m3u8')
  },

  // CNA
  {
    id: 'cna',
    name: 'CNA (Singapore)',
    language: 'en',
    category: 'News',
    streamType: 'hls',
    source: viaProxy('https://d2e1asnsl7br7b.cloudfront.net/7782e205e72f43aeb4a48ec97f66ebbe/index.m3u8')
  },

  {
    id: 'bbc-news',
    name: 'BBC News (YouTube)',
    language: 'en',
    category: 'News',
    country: 'GB',
    streamType: 'youtube',
    source: 'https://www.youtube.com/channel/UC16niRr50-MSBwiO3YDb3RA/live',
    youtubeChannelId: 'UC16niRr50-MSBwiO3YDb3RA',
    icon: '/icons/AATv_icons/bbc-news.png',
    notes: 'YouTube live; shows offline screen when not live.'
  },

  // Red Bull TV
  {
    id: 'redbull',
    name: 'Red Bull TV',
    language: 'en',
    category: 'Sports',
    streamType: 'hls',
    source: viaProxy('https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8'),
    backup: viaProxy('https://rbmn-live.akamaized.net/hls/live/622817/BoRB-US/master_928.m3u8')
  },

  // Works direct
  {
    id: 'tvcultura',
    name: 'TV Cultura',
    language: 'pt',
    category: 'News',
    streamType: 'hls',
    source: 'https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8'
  },

  {
    id: 'arirang',
    name: 'Arirang TV',
    language: 'en',
    category: 'News',
    streamType: 'hls',
    source: viaProxy('https://amdlive-ch01-ctnd-com.akamaized.net/arirang_1ch/smil:arirang_1ch.smil/playlist.m3u8')
  },

  {
    id: 'smithsonian',
    name: 'Smithsonian Channel',
    language: 'en',
    category: 'Docs',
    streamType: 'hls',
    source: viaProxy('https://smithsonianaus-samsungau.amagi.tv/playlist.m3u8')
  },

  {
    id: 'nasa-public',
    name: 'NASA Public Channel',
    language: 'en',
    category: 'Docs',
    streamType: 'hls',
    source: viaProxy('https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8')
  },

  {
    id: 'france24-en',
    name: 'France 24 (English)',
    language: 'en',
    category: 'News',
    country: 'FR',
    streamType: 'hls',
    requiresProxy: true,
    icon: '/icons/AATv_icons/france24.png',
    source: viaProxy('https://static.france24.com/live/F24_EN_HI_HLS/live_web.m3u8'),
    backup: 'https://static.france24.com/live/F24_EN_HI_HLS/live_web.m3u8',
    notes: 'Proxied primary helps with CORS.'
  },

  {
    id: 'bbc-worldnews',
    name: 'BBC World News',
    language: 'en',
    category: 'News',
    streamType: 'hls',
    source: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service'
  },

  {
    id: 'euronews-en',
    name: 'Euronews (English)',
    language: 'en',
    category: 'News',
    streamType: 'hls',
    source: viaProxy('https://euronews-euronews-english-1-gb.samsung.wurl.com/manifest_1080p.m3u8')
  },

  // Music
  {
    id: 'rockzilla-tv',
    name: 'Rockzilla TV',
    language: 'en',
    category: 'Music',
    streamType: 'hls',
    source: viaProxy('https://rockzillatv.rocks/stream/rockzillatv/playlist.m3u8')
  },
  {
    id: 'nostalgia-hits',
    name: 'Nostalgia Hits',
    language: 'en',
    category: 'Music',
    streamType: 'hls',
    source: viaProxy('https://stream.nstg.tv/hits/sd/index.m3u8')
  },

  // Other
  {
    id: 'pets-tv',
    name: 'Pets TV',
    language: 'en',
    category: 'Other',
    streamType: 'hls',
    source: viaProxy('https://pets-tv.live.stream.geo.akamaized.net/amagi_hls_data_petXXA-pet-tv/CDN/playlist.m3u8')
  },
  {
    id: 'fashion-tv',
    name: 'Fashion TV',
    language: 'en',
    category: 'Other',
    streamType: 'hls',
    source: viaProxy('https://fash1043.cloudycdn.services/slive/_definst_/ftv_paris_adaptive.smil/playlist.m3u8')
  },
  {
    id: 'diy-network',
    name: 'DIY Network',
    language: 'en',
    category: 'Other',
    streamType: 'hls',
    source: viaProxy('https://dai.google.com/linear/hls/event/TxL4NjSeRlC0aRtOc5eA7g/master.m3u8'),
    notes: 'Google DAI manifests can rotate.'
  },

  // Test
  {
    id: 'aatv-test-sintel',
    name: 'AATv Test (Sintel)',
    language: 'en',
    category: 'Other',
    streamType: 'hls',
    logo: '/icons/AATv_icons/AATv_48x48.png',
    source: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    backup: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },

  // Global news
  {
    id: 'nhk-world',
    name: 'NHK World-Japan',
    language: 'en',
    category: 'News',
    streamType: 'hls',
    source: viaProxy('https://nhkworld.webcdn.stream.ne.jp/www11/hls/live/2003458/nhkworld/index.m3u8')
  },
  {
    id: 'trt-world',
    name: 'TRT World',
    language: 'en',
    category: 'News',
    streamType: 'hls',
    source: viaProxy('https://tv-trtworld.live.trt.com.tr/master_1080.m3u8')
  },
  {
    id: 'cgtn-en',
    name: 'CGTN (English)',
    language: 'en',
    category: 'News',
    streamType: 'hls',
    source: viaProxy('https://news.cgtn.com/resource/live/english/cgtn-news.m3u8')
  },
  {
    id: 'alarabiya',
    name: 'Al Arabiya',
    language: 'ar',
    category: 'News',
    streamType: 'hls',
    source: viaProxy('https://live.alarabiya.net/alarabiapublish/alarabiya.smil/playlist.m3u8')
  }
];

export default channels;
