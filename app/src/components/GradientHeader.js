import React from 'react';
import { View, Text } from 'react-native';

export default function GradientHeader({ title }) {
  return (
    <View className="pt-14 pb-4 px-4 bg-white border-b border-neutral-200">
      <Text className="text-3xl font-extrabold text-neutral-900">
        EduHive
      </Text>
      <View className="mt-2 h-1 w-14 rounded-full" style={{ backgroundColor: '#16A34A' }} />
    </View>
  );
}
