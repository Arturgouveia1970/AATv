import React, { useState, useCallback, useEffect } from 'react';
import HlsPlayer from './HlsPlayer';

const isHls = (u) =>
  typeof u === 'string' &&
  (u.toLowerCase().includes('.m3u8') || u.startsWith('/hls?url='));

export default function Player({ channel, onBackupChange }) {
  if (!channel) {
    return <p style={{ padding: '1rem' }}>Select a channel to play</p>;
  }

  const primary = channel.source || channel.file || channel.url || channel.stream_url || '';
  const backup  = channel.backup || '';

  const [current, setCurrent] = useState(primary);
  const [usedBackup, setUsedBackup] = useState(false);

  // Notify parent when backup state changes
  useEffect(() => {
    onBackupChange?.(usedBackup);
  }, [usedBackup, onBackupChange]);

  // Reset when channel changes
  useEffect(() => {
    setCurrent(primary);
    setUsedBackup(false);
  }, [primary, channel?.id]);

  const onFatalError = useCallback(() => {
    if (!usedBackup && backup) {
      setUsedBackup(true);
      setCurrent(backup);
      console.warn('[Player] Switched to backup stream');
    }
  }, [usedBackup, backup]);

  const hls = isHls(current);

  return (
    <div className="video-frame">
      {hls ? (
        <HlsPlayer
          key={current}
          src={current}
          url={current}
          source={current}
          onError={onFatalError}
          onHlsError={(data) => data?.fatal && onFatalError()}
        />
      ) : (
        <video
          key={current}
          src={current}
          controls
          autoPlay
          playsInline
          onError={onFatalError}
          style={{ width: '100%', maxHeight: 520, background: '#000' }}
        />
      )}
    </div>
  );
}
