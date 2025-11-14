import React from 'react';
import { Pressable, View, Text, Image } from 'react-native';
import clsx from 'clsx';

export default function Card({ title, subtitle, imageUrl, onPress, className }) {
  return (
    <Pressable onPress={onPress} className={clsx('flex-row gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800', className)}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} className="w-16 h-16 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      ) : (
        <View className="w-16 h-16 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      )}
      <View className="flex-1">
        <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</Text>
        {subtitle ? <Text numberOfLines={2} className="text-neutral-600 dark:text-neutral-400 mt-1">{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}
