import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Loading({ text }) {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator />
      {text ? <Text className="mt-2 text-neutral-600 dark:text-neutral-300">{text}</Text> : null}
    </View>
  );
}
