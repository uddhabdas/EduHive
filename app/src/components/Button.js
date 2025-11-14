import React from 'react';
import { Pressable, Text } from 'react-native';
import clsx from 'clsx';

export default function Button({ title, onPress, variant = 'primary', disabled, className }) {
  const base = 'h-12 px-4 rounded-xl items-center justify-center';
  
  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={clsx(base, 'bg-brand', disabled && 'opacity-50', className)}
      >
        <Text className="font-bold text-white text-base">{title}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={clsx(base, 'bg-transparent border-2 border-neutral-300 dark:border-neutral-600', disabled && 'opacity-50', className)}
    >
      <Text className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</Text>
    </Pressable>
  );
}
