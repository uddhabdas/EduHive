import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function YouTubeWebView({ videoId }) {
const src = `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&enablejsapi=1`;
  return (
    <View style={{ height: 220 }}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: `<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width, initial-scale=1'></head><body style='margin:0;padding:0;'><iframe width='100%' height='100%' src='${src}' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe></body></html>` }}
        allowsInlineMediaPlayback
        javaScriptEnabled
      />
    </View>
  );
}
