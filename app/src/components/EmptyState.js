import React from 'react';
import { View, Text } from 'react-native';
import Button from './Button';

export default function EmptyState({ title, subtitle, onPrimary, onSecondary, primaryText, secondaryText }) {
  return (
    <View className="items-center justify-center p-6">
      <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</Text>
      {subtitle ? <Text className="mt-2 text-center text-neutral-600 dark:text-neutral-400">{subtitle}</Text> : null}
      <View className="mt-4 w-full gap-3">
        {primaryText ? <Button title={primaryText} onPress={onPrimary} /> : null}
        {secondaryText ? <Button title={secondaryText} onPress={onSecondary} variant="ghost" /> : null}
      </View>
    </View>
  );
}
