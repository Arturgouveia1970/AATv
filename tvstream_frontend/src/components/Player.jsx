// src/components/Player.jsx
import React, { useState, useCallback, useEffect } from 'react'
import HlsPlayer from './HlsPlayer'
import { isHls, alreadyProxied, withApiProxy } from '../lib/hls'

// If a channel source was saved as /hls?url=... or /api/hls?url=...,
// decode it back to the raw absolute URL so we can re-wrap for this env.
const decodeIfProxied = (u) => {
  if (typeof u !== 'string') return u
  const m = u.match(/^\/(?:api\/)?hls\?url=(.+)$/)
  return m ? decodeURIComponent(m[1]) : u
}

export default function Player({ channel, onBackupChange }) {
  if (!channel) {
    return <p style={{ padding: '1rem' }}>Select a channel to play</p>
  }

  // Prefer raw URLs; we'll proxy if/when needed.
  const primary = decodeIfProxied(
    channel.source || channel.file || channel.url || channel.stream_url || ''
  )
  const backup  = decodeIfProxied(channel.backup || '')

  // We keep the original URL and compute a "playable" one (maybe proxied)
  const [currentOrig, setCurrentOrig] = useState(primary)
  const [currentPlay, setCurrentPlay] = useState(primary)
  const [usedProxy, setUsedProxy]     = useState(false)
  const [usedBackup, setUsedBackup]   = useState(false)

  // Notify parent when backup state changes
  useEffect(() => {
    onBackupChange?.(usedBackup)
  }, [usedBackup, onBackupChange])

  // Reset when channel changes
  useEffect(() => {
    setCurrentOrig(primary)
    setCurrentPlay(primary)
    setUsedProxy(false)
    setUsedBackup(false)
  }, [primary, channel?.id])

  const tryProxyThenBackup = useCallback(() => {
    // 1) If HLS and not already proxied, retry via proxy
    if (isHls(currentOrig) && !alreadyProxied(currentPlay)) {
      const proxied = withApiProxy(currentOrig)
      setUsedProxy(true)
      setCurrentPlay(proxied)
      console.warn('[Player] Retrying via proxy:', proxied)
      return
    }
    // 2) If backup exists and we haven't used it, switch to backup
    if (!usedBackup && backup) {
      setUsedBackup(true)
      setCurrentOrig(backup)
      setCurrentPlay(backup)
      console.warn('[Player] Switched to backup stream')
      return
    }
    // 3) Give up (surface error state via UI if you want)
    console.warn('[Player] Stream unavailable after proxy/backup attempts')
  }, [currentOrig, currentPlay, usedBackup, backup])

  const hls = isHls(currentPlay)

  return (
    <div className="video-frame">
      {hls ? (
        <HlsPlayer
          key={currentPlay}
          src={currentPlay}
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
