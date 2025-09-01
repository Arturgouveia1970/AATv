export type StreamType = 'hls' | 'mp4' | 'dash';

export interface Channel {
  id: string;                 // slug: "cgtn-en"
  name: string;               // "CGTN News (English)"
  language: string;           // "en"
  category: 'News' | 'Sports' | 'Kids' | 'Movies' | 'Music' | 'Docs' | 'Regional' | 'Other';
  country?: string;           // "CN", "GB", etc.
  streamType: StreamType;     // 'hls' for .m3u8
  url: string;                // stream manifest or mp4
  logo?: string;              // CDN/logo URL
  requiresProxy?: boolean;    // true if CORS/referrer issues
  notes?: string;             // licensing quirks, geo info
}
