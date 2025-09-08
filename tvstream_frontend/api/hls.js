// tvstream_frontend/api/hls.js
import { Readable } from 'stream'

const UA =
  process.env.USER_AGENT ||
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type,Range,User-Agent,Referer,Origin'
  )
  res.setHeader('Access-Control-Expose-Headers', '*')
}

function extraHeadersFor(urlObj) {
  const h = {}
  // Example site-specific rules (CGTN):
  if (urlObj.hostname.includes('live.cgtn.com')) {
    h['Referer'] = 'https://www.cgtn.com'
    h['Origin'] = 'https://www.cgtn.com'
  }
  return h
}

export default async function handler(req, res) {
  try {
    setCors(res)

    if (req.method === 'OPTIONS') {
      res.status(204).end()
      return
    }

    const raw = (req.query?.url ?? req.url?.split('?url=')[1]) || ''
    if (!raw) {
      res.status(400).send('Missing url')
      return
    }

    const decoded = decodeURIComponent(raw)
    const u = new URL(decoded)

    const headers = {
      'User-Agent': UA,
      ...(req.headers.range ? { Range: req.headers.range } : {}),
      ...extraHeadersFor(u),
    }

    const upstream = await fetch(u.toString(), { headers })

    res.status(upstream.status)
    const ct = upstream.headers.get('content-type')
    if (ct) res.setHeader('content-type', ct)

    const cacheControl = upstream.headers.get('cache-control')
    if (cacheControl) res.setHeader('cache-control', cacheControl)

    if (req.method === 'HEAD' || !upstream.body) {
      res.end()
      return
    }

    const nodeStream = Readable.fromWeb(upstream.body)
    nodeStream.on('error', () => {
      try {
        res.end()
      } catch {}
    })
    nodeStream.pipe(res)
  } catch (e) {
    console.error('[api/hls] error', e)
    try {
      setCors(res)
      res.status(502).send('Bad gateway')
    } catch {}
  }
}
