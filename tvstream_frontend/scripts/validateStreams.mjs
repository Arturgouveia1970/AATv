// Run with: node scripts/validateStreams.mjs
import fetch from 'node-fetch';
import { parse } from 'm3u8-parser';

const channels = [
  // Example entry:
  { name: 'CGTN', url: 'https://live.cgtn.com/200/prog_index.m3u8', type: 'hls' }
];

for (const ch of channels) {
  console.log(`Checking ${ch.name}...`);
  try {
    const res = await fetch(ch.url, { method: 'GET', redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ctype = res.headers.get('content-type');
    console.log(`  ✔ Status ${res.status}, type ${ctype}`);

    if (ch.type === 'hls') {
      const text = await res.text();
      const parser = new parse();
      parser.push(text);
      parser.end();
      if (parser.manifest.playlists?.length) {
        console.log(`  ✔ HLS variants: ${parser.manifest.playlists.length}`);
      } else {
        console.warn(`  ⚠ No variants found`);
      }
    }
  } catch (err) {
    console.error(`  ✖ Error:`, err.message);
  }
}
