import type { Channel } from '../types/channel';

export const maybeProxy = (url: string) => {
  if (url.startsWith('https://live.cgtn.com/')) {
    return url.replace('https://live.cgtn.com', '/cgtn');
  }
  return url;
};

export const isHls = (url: string) =>
  typeof url === 'string' && url.toLowerCase().includes('.m3u8');

export const normalizeChannel = (ch: Channel): Channel => ({
  ...ch,
  url: ch.requiresProxy ? maybeProxy(ch.url) : ch.url
});
