// src/components/Player.jsx
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import HlsPlayer from './HlsPlayer'
import { isHls, alreadyProxied, withApiProxy } from '../lib/hls'

function toYouTubeEmbed(url, opts = {}) {
  const explicitChannelId = opts.youtubeChannelId
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '').toLowerCase()
    let id = null

    // Short links: https://youtu.be/VIDEO_ID
    if (host === 'youtu.be') id = u.pathname.slice(1)

    // Standard domains
    if (/^(youtube\.com|youtube-nocookie\.com)$/.test(host)) {
      const p = u.pathname

      // https://youtube.com/watch?v=VIDEO_ID
      if (p === '/watch') id = u.searchParams.get('v')

      // https://youtube.com/live/VIDEO_ID
      if (p.startsWith('/live/')) id = p.split('/')[2]

      // https://youtube.com/embed/VIDEO_ID
      if (p.startsWith('/embed/')) id = p.split('/')[2]

      // https://youtube.com/channel/UCxxxx/live  → live_stream by channel id
      if (p.startsWith('/channel/') && p.endsWith('/live')) {
        const channelId = p.split('/')[2]
        const embed = new URL('https://www.youtube-nocookie.com/embed/live_stream')
        embed.searchParams.set('channel', channelId)
        embed.searchParams.set('autoplay', '1')
        embed.searchParams.set('playsinline', '1')
        embed.searchParams.set('rel', '0')
        return embed.toString()
      }

      // https://youtube.com/@handle/live → needs channel id (not present in URL)
      if (p.startsWith('/@') && p.endsWith('/live')) {
        if (explicitChannelId) {
          const embed = new URL('https://www.youtube-nocookie.com/embed/live_stream')
          embed.searchParams.set('channel', explicitChannelId)
          embed.searchParams.set('autoplay', '1')
          embed.searchParams.set('playsinline', '1')
          embed.searchParams.set('rel', '0')
          return embed.toString()
        }
        // No channel id available → cannot embed this form directly
        return null
      }
    }

    if (!id) return null
    const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`)
    embed.searchParams.set('autoplay', '1')
    embed.searchParams.set('playsinline', '1')
    embed.searchParams.set('rel', '0')
    return embed.toString()
  } catch {
    return null
  }
}

export default function Player({ channel, onBackupChange }) {
  if (!channel) return <p style={{ padding: '1rem' }}>Select a channel to play</p>

  // Canonical primary/backup resolution (keeps legacy fields working)
  const primary = channel.source || channel.file || channel.url || channel.stream_url || ''
  const backup  = channel.backup || ''

  // Accept both legacy `type` and your TS `streamType`
  const declaredType = (channel.type || channel.streamType || '').toLowerCase()

  const [currentOrig, setCurrentOrig] = useState(primary)
  const [currentPlay, setCurrentPlay] = useState(primary)
  const [usedProxy, setUsedProxy]     = useState(false)
  const [usedBackup, setUsedBackup]   = useState(false)
  const [failed, setFailed]           = useState(false)

  useEffect(() => { onBackupChange?.(usedBackup) }, [usedBackup, onBackupChange])

  useEffect(() => {
    setCurrentOrig(primary)
    setCurrentPlay(primary)
    setUsedProxy(false)
    setUsedBackup(false)
    setFailed(false)
  }, [primary, channel?.id])

  const isYouTube = useMemo(() => {
    if (declaredType === 'youtube') return true
    return /(?:youtu\.be|youtube\.com|youtube-nocookie\.com)/i.test(currentPlay)
  }, [declaredType, currentPlay])

  const ytEmbed = useMemo(() => (
    isYouTube ? toYouTubeEmbed(currentPlay, { youtubeChannelId: channel.youtubeChannelId }) : null
  ), [isYouTube, currentPlay, channel?.youtubeChannelId])

  // Best-effort “Open on YouTube” target
  const openOnYouTubeHref = useMemo(() => {
    const src = String(channel?.source || currentOrig || currentPlay || '')
    if (src) return src
    if (channel?.youtubeChannelId) {
      return `https://www.youtube.com/channel/${channel.youtubeChannelId}/live`
    }
    return null
  }, [channel?.source, channel?.youtubeChannelId, currentOrig, currentPlay])

  const hls = !isYouTube && isHls(currentPlay)

  const tryProxyThenBackup = useCallback(() => {
    if (hls && isHls(currentOrig) && !alreadyProxied(currentPlay)) {
      const proxied = withApiProxy(currentOrig)
      setUsedProxy(true)
      setCurrentPlay(proxied)
      console.warn('[Player] Retrying via proxy:', proxied)
      return
    }
    if (!usedBackup && backup) {
      setUsedBackup(true)
      setCurrentOrig(backup)
      setCurrentPlay(backup)
      console.warn('[Player] Switched to backup stream')
      return
    }
    console.warn('[Player] Stream unavailable after proxy/backup attempts')
    setFailed(true)
  }, [hls, currentOrig, currentPlay, usedBackup, backup])

  if (failed) {
    return (
      <div style={{
        height: 400, background: '#000', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <p>📺 {channel.name} — coming shortly…</p>
      </div>
    )
  }

  return (
    <div className="video-frame">
      {isYouTube && ytEmbed ? (
        <div style={{ aspectRatio: '16 / 9', position: 'relative', background: '#000' }}>
          <iframe
            key={ytEmbed}
            src={ytEmbed}
            title={channel?.name || 'YouTube player'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ width: '100%', height: '100%', border: 0 }}
            onError={tryProxyThenBackup}
          />
          {openOnYouTubeHref && (
            <a
              href={openOnYouTubeHref}
              target="_blank"
              rel="noreferrer"
              style={{
                position: 'absolute',
                right: 8,
                bottom: 8,
                fontSize: 12,
                padding: '6px 10px',
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                borderRadius: 6,
                textDecoration: 'none'
              }}
            >
              Open on YouTube ↗
            </a>
          )}
        </div>
      ) : isYouTube && !ytEmbed ? (
        <div style={{
          aspectRatio: '16 / 9',
          background: '#000',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
          padding: 16
        }}>
          <div style={{ opacity: 0.85, marginBottom: 4 }}>
            {channel?.name || 'YouTube stream'} can’t be embedded.
          </div>
          {openOnYouTubeHref && (
            <a
              href={openOnYouTubeHref}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 14,
                padding: '8px 12px',
                background: '#2563eb',
                color: '#fff',
                borderRadius: 8,
                textDecoration: 'none'
              }}
            >
              Open on YouTube ↗
            </a>
          )}
        </div>
      ) : hls ? (
        <HlsPlayer
          key={currentPlay}
          src={currentPlay}
          url={currentPlay}
          source={currentPlay}
          onError={tryProxyThenBackup}
          onHlsError={(data) => data?.fatal && tryProxyThenBackup()}
        />
      ) : (
        <video
          key={currentPlay}
          src={currentPlay}
          controls
          autoPlay
          playsInline
          onError={tryProxyThenBackup}
          style={{ width: '100%', maxHeight: 520, background: '#000' }}
        />
      )}
    </div>
  )
}
