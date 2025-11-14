import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import clsx from 'clsx';

export function SkeletonBox({ className, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      className={clsx('bg-neutral-300 dark:bg-neutral-700 rounded-xl', className)}
      style={[{ opacity }, style]}
    />
  );
}

export function SkeletonCourseCard({ wide = false }) {
  return (
    <View
      className={clsx(
        'bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden',
        wide ? 'w-64 mr-4' : 'flex-1 mb-4'
      )}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 25,
        elevation: 5,
      }}
    >
      <SkeletonBox className="w-full h-36" />
      <View className="p-3">
        <SkeletonBox className="h-4 w-3/4 mb-2" />
        <SkeletonBox className="h-3 w-full" />
      </View>
    </View>
  );
}
