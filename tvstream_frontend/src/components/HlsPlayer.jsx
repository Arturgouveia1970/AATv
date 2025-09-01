import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function HlsPlayer({ src }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Native HLS support (Safari, iOS, etc.)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return () => {
        video.removeAttribute('src');
        video.load();
      };
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        manifestLoadingTimeOut: 20000, // 20 seconds
        levelLoadingTimeOut: 20000,
        fragLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 5,
        levelLoadingMaxRetry: 5,
        fragLoadingMaxRetry: 5,
      });

      hls.attachMedia(video);
      hls.loadSource(src);

      hls.on(Hls.Events.ERROR, (_e, data) => {
        console.error('HLS error:', data);
      });

      return () => hls.destroy();
    }

    console.error('HLS not supported in this browser.');
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      style={{
        width: '100%',
        maxHeight: '480px',
        background: '#000',
        borderRadius: 8,
      }}
    />
  );
}
