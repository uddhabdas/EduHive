import React from 'react';
import { View, Text } from 'react-native';

export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <View className="mx-3 my-3 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/50 px-3 py-2">
      <Text className="text-red-800 dark:text-red-200">{message}</Text>
    </View>
  );
}
