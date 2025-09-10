// src/components/Player.jsx
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import HlsPlayer from './HlsPlayer'
import { isHls, alreadyProxied, withApiProxy } from '../lib/hls'

function toYouTubeEmbed(url) {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    let id = null
    if (host === 'youtu.be') id = u.pathname.slice(1)
    if (/youtube\.com|youtube-nocookie\.com/i.test(host)) {
      if (u.pathname === '/watch') id = u.searchParams.get('v')
      if (u.pathname.startsWith('/live/')) id = u.pathname.split('/')[2]
      if (u.pathname.startsWith('/embed/')) id = u.pathname.split('/')[2]
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

  const primary = channel.source || channel.file || channel.url || channel.stream_url || ''
  const backup  = channel.backup || ''
  const declaredType = (channel.type || '').toLowerCase()

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
    return /(?:youtu\.be|youtube\.com)/i.test(currentPlay)
  }, [declaredType, currentPlay])

  const ytEmbed = useMemo(() => (isYouTube ? toYouTubeEmbed(currentPlay) : null), [isYouTube, currentPlay])
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
      <div className="flex items-center justify-center bg-black text-white" style={{ height: 400 }}>
        <p>📺 {channel.name} — coming shortly…</p>
      </div>
    )
  }

  return (
    <div className="video-frame">
      {isYouTube && ytEmbed ? (
        <div className="aspect-video" style={{ background: '#000' }}>
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
