import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import clsx from 'clsx';

/**
 * Reusable button component following EduHive's design system.
 *
 * Variants:
 * - primary   → emerald gradient, white bold text, strong shadow
 * - outline   → transparent bg, emerald border/text, medium weight
 * - ghost     → text‑only, emerald, minimal chrome
 */
export default function Button({ title, onPress, variant = 'primary', disabled, className, textClassName }) {
  const isDisabled = !!disabled;

  // Shared container shadow + touch target
  const baseContainerStyle = {
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  };

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        className={clsx('w-full', isDisabled && 'opacity-60', className)}
        style={{
          ...baseContainerStyle,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <LinearGradient
          colors={["#14B8A6", "#10B981"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 24,
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'stretch',
          }}
        >
          <Text
            className={clsx('text-white font-bold text-center', textClassName)}
            style={{ fontSize: 16, fontWeight: '700' }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'outline') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        className={clsx('w-full', isDisabled && 'opacity-60', className)}
        style={{
          ...baseContainerStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: '#10B981',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
          elevation: 4,
        }}
      >
        <Text
          className={clsx('text-center text-emerald-600 dark:text-emerald-400 font-semibold', textClassName)}
          style={{ fontSize: 16, fontWeight: '600' }}
          numberOfLines={1}
        >
          {title}
        </Text>
      </Pressable>
    );
  }

  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        className={clsx('items-center justify-center', isDisabled && 'opacity-60', className)}
        style={{
          minHeight: 40,
          paddingVertical: 8,
          paddingHorizontal: 4,
        }}
      >
        <Text
          className={clsx('text-center font-semibold text-emerald-600 dark:text-emerald-400', textClassName)}
          style={{ fontSize: 16, fontWeight: '600' }}
          numberOfLines={1}
        >
          {title}
        </Text>
      </Pressable>
    );
  }

  // Fallback to primary styling for unknown variants
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={clsx('w-full', isDisabled && 'opacity-60', className)}
      style={{
        ...baseContainerStyle,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      <LinearGradient
        colors={["#14B8A6", "#10B981"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 24,
          minHeight: 48,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'stretch',
        }}
      >
        <Text
          className={clsx('text-white font-bold text-center', textClassName)}
          style={{ fontSize: 16, fontWeight: '700' }}
          numberOfLines={1}
        >
          {title}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}
