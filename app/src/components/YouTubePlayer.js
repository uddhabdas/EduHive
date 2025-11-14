import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function YouTubePlayer({ 
  playlistId, 
  videoId, 
  start = 0, 
  onTick, 
  onEnded, 
  onReady,
  onError,
}) {
  const webViewRef = useRef(null);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <style>
          * { margin: 0; padding: 0; }
          html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
          #player { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="player"></div>
        <script src="https://www.youtube.com/iframe_api"></script>
        <script>
          let player;
          let currentVideoId = null;
          let tickInterval = null;

          function onYouTubeIframeAPIReady() {
            const playerVars = {
              modestbranding: 1,
              rel: 0,
              playsinline: 1,
              start: ${start || 0},
              origin: 'https://www.youtube.com'
            };

            ${playlistId ? `
              playerVars.listType = 'playlist';
              playerVars.list = '${playlistId}';
            ` : ''}

            player = new YT.Player('player', {
              height: '100%',
              width: '100%',
              host: 'https://www.youtube.com',
              ${videoId ? `videoId: '${videoId}',` : ''}
              playerVars: playerVars,
              events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
                onError: onPlayerError,
              }
            });
          }

          function onPlayerReady(event) {
            try {
              const videoData = player.getVideoData();
              currentVideoId = videoData.video_id;
              const duration = player.getDuration();
              
              let playlist = null;
              if (${playlistId ? 'true' : 'false'}) {
                try {
                  playlist = player.getPlaylist();
                } catch (e) {}
              }

              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ready',
                videoId: currentVideoId,
                duration: duration,
                playlist: playlist
              }));
            } catch (e) {
              console.error('onReady error:', e);
            }
          }

          let playlistSent = false;
          function onPlayerStateChange(event) {
            try {
              const videoData = player.getVideoData();
              currentVideoId = videoData.video_id;

              // Try to fetch playlist once when cued or playing
              if (!playlistSent && ${playlistId ? 'true' : 'false'} && (event.data === YT.PlayerState.CUED || event.data === YT.PlayerState.PLAYING)) {
                try {
                  const list = player.getPlaylist();
                  if (list && list.length > 0) {
                    playlistSent = true;
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'ready',
                      videoId: currentVideoId,
                      duration: player.getDuration(),
                      playlist: list
                    }));
                  }
                } catch (e) {}
              }

              if (event.data === YT.PlayerState.PLAYING) {
                startTicking();
              } else if (event.data === YT.PlayerState.PAUSED || 
                         event.data === YT.PlayerState.BUFFERING) {
                stopTicking();
              } else if (event.data === YT.PlayerState.ENDED) {
                stopTicking();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ended',
                  videoId: currentVideoId,
                  duration: player.getDuration()
                }));
              }
            } catch (e) {
              console.error('onStateChange error:', e);
            }
          }

          function startTicking() {
            stopTicking();
            tickInterval = setInterval(() => {
              try {
                const currentTime = player.getCurrentTime();
                const duration = player.getDuration();
                const videoData = player.getVideoData();
                currentVideoId = videoData.video_id;

                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'tick',
                  position: currentTime,
                  duration: duration,
                  videoId: currentVideoId
                }));
              } catch (e) {
                console.error('tick error:', e);
              }
            }, 2000);
          }

          function onPlayerError(event) {
            try {
              const code = event.data; // 2,5,100,101,150,153
              const videoData = player.getVideoData();
              const vid = videoData && videoData.video_id;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                code,
                videoId: vid,
              }));
            } catch (e) {}
          }

          function stopTicking() {
            if (tickInterval) {
              clearInterval(tickInterval);
              tickInterval = null;
            }
          }
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'ready' && onReady) {
        onReady({
          videoId: data.videoId,
          duration: data.duration,
          playlist: data.playlist
        });
      } else if (data.type === 'tick' && onTick) {
        onTick({
          position: data.position,
          duration: data.duration,
          videoId: data.videoId
        });
      } else if (data.type === 'ended' && onEnded) {
        onEnded({
          videoId: data.videoId,
          duration: data.duration
        });
      } else if (data.type === 'error' && onError) {
        onError({ code: data.code, videoId: data.videoId });
      }
    } catch (_e) {
      // silently ignore malformed messages from the iframe
    }
  };

  return (
    <View style={styles.container}>
      {/* WebView IFrame player */}
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
});
