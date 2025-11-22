import React, { useRef, useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
// Using expo-av for now (will migrate to expo-video in future SDK)
// Note: expo-av is deprecated but still works in current SDK
import { Video } from 'expo-av';

export default function LocalVideoPlayer({ uri, start = 0, onTick, onEnded, onReady, style }) {
  const videoRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let interval;
    if (isReady && onTick) {
      interval = setInterval(async () => {
        try {
          const status = await videoRef.current?.getStatusAsync();
          if (status?.isLoaded) {
            onTick({ position: status.positionMillis / 1000, duration: status.durationMillis ? status.durationMillis / 1000 : 0 });
          }
        } catch {}
      }, 2000);
    }
    return () => interval && clearInterval(interval);
  }, [isReady, onTick]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {!isReady && <ActivityIndicator color="#10B981" style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }} />}
      <Video
        ref={videoRef}
        source={{ uri }}
        style={[{ width: '100%', height: '100%' }, style]}
        resizeMode="contain"
        shouldPlay
        useNativeControls
        positionMillis={start * 1000}
        onLoad={() => {
          setIsReady(true);
          onReady && onReady();
        }}
        onPlaybackStatusUpdate={(status) => {
          if (status.didJustFinish) {
            onEnded && onEnded({ duration: status.durationMillis ? status.durationMillis / 1000 : 0 });
          }
        }}
      />
    </View>
  );
}


