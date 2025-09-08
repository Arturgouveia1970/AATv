// src/components/HlsPlayer.jsx
import React, { useEffect, useRef } from 'react'
import Hls from 'hls.js'

/**
 * Drop-in HLS player with low-latency tuning and live-edge nudge.
 * Props:
 *  - src (string)           : HLS URL (.m3u8)
 *  - onError (fn)           : called on fatal <video> error or fatal hls.js error
 *  - onHlsError (fn)        : raw hls.js error callback (optional)
 *  - autoPlay (bool)        : default true
 *  - controls (bool)        : default true
 *  - ...props               : forwarded to <video>
 */
export default function HlsPlayer({
  src,
  onError,
  onHlsError,
  autoPlay = true,
  controls = true,
  ...props
}) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    // Clean up helper
    const cleanupVideo = () => {
      try {
        video.removeAttribute('src')
        video.load()
      } catch {}
    }

    // Native HLS (Safari / iOS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      // Try to start near live edge on Safari
      const onLoadedMetadata = () => {
        try {
          // Safari exposes seekable for live; jump to end
          const end = video.seekable?.length ? video.seekable.end(video.seekable.length - 1) : NaN
          if (!Number.isNaN(end)) video.currentTime = end
        } catch {}
      }
      video.addEventListener('loadedmetadata', onLoadedMetadata)

      const onVideoError = () => onError?.()
      video.addEventListener('error', onVideoError)

      return () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata)
        video.removeEventListener('error', onVideoError)
        cleanupVideo()
      }
    }

    // hls.js path
    if (Hls.isSupported()) {
      const hls = new Hls({
        // Low-latency & live tuning (effective if upstream supports LL-HLS)
        lowLatencyMode: true,
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 5,
        maxLiveSyncPlaybackRate: 1.5,

        // Keep buffers modest for quicker catch-up
        maxBufferLength: 10,
        maxBufferSize: 60 * 1000 * 1000, // 60MB safety cap

        // Timeouts & retries
        manifestLoadingTimeOut: 15000,
        levelLoadingTimeOut: 15000,
        fragLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 4,
        levelLoadingMaxRetry: 4,
        fragLoadingMaxRetry: 4,

        // Worker helps on mobile/low-end CPUs
        enableWorker: true,
      })

      hls.attachMedia(video)
      hls.loadSource(src)

      // Start near live edge when ready
      const seekNearLive = () => {
        try {
          const live = hls?.liveSyncPosition
          if (Number.isFinite(live)) {
            // a tiny offset behind live keeps playback stable
            video.currentTime = Math.max(0, live - 1)
          } else {
            // fallback: jump to end of seekable
            const end = video.seekable?.length ? video.seekable.end(video.seekable.length - 1) : NaN
            if (!Number.isNaN(end)) video.currentTime = end
          }
        } catch {}
      }

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // ensure we start loading close to live
        hls.startLoad(-1)
      })

      hls.on(Hls.Events.LEVEL_LOADED, (_e, data) => {
        if (data?.details?.live) seekNearLive()
      })

      // Error handling
      hls.on(Hls.Events.ERROR, (_e, data) => {
        // Allow caller to inspect all hls errors if they want
        onHlsError?.(data)

        if (data?.fatal) {
          // Try basic recoveries; if they fail, delegate to onError
          try {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError()
                break
              default:
                hls.destroy()
                onError?.()
                return
            }
          } catch {
            try { hls.destroy() } catch {}
            onError?.()
          }
        }
      })

      // Also listen to <video> element error (e.g., stalled src)
      const onVideoError = () => onError?.()
      video.addEventListener('error', onVideoError)

      return () => {
        video.removeEventListener('error', onVideoError)
        try { hls.destroy() } catch {}
        cleanupVideo()
      }
    }

    // Fallback: not supported
    console.error('HLS not supported in this browser.')
    const onVideoError = () => onError?.()
    video.addEventListener('error', onVideoError)
    return () => {
      video.removeEventListener('error', onVideoError)
      cleanupVideo()
    }
  }, [src, onError, onHlsError])

  return (
    <video
      ref={videoRef}
      controls={controls}
      autoPlay={autoPlay}
      playsInline
      style={{ width: '100%', maxHeight: 520, background: '#000', borderRadius: 8 }}
      {...props}
    />
  )
}
