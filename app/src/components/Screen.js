import React from 'react';
import { SafeAreaView, View } from 'react-native';

export default function Screen({ children, style }) {
  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-1 px-4" style={style}>
        {children}
      </View>
    </SafeAreaView>
  );
}
