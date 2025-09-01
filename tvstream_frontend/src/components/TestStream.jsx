import React from 'react';
import ReactPlayer from 'react-player';

const TestStream = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Test: NASA TV</h2>
      <ReactPlayer
        url="https://5a0c04a7474f.streamlock.net/live/MTL.stream/playlist.m3u8"
        controls
        width="100%"
        height="480px"
      />
    </div>
  );
};

export default TestStream;
