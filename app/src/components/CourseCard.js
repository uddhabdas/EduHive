import React, { useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../context/CartContext';
import { api } from '../api/client';
import clsx from 'clsx';
import { Animated } from 'react-native';

function derivePrice(course) {
  if (course.price != null) return course.price;
  // Deterministic pseudo price based on id
  const code = (course._id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const tiers = [0, 299, 499, 799];
  return tiers[code % tiers.length];
}

function slugifyTitle(t) {
  return (t || '')
    .replace(/\bNPTEL\b\s*:*/gi, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default function CourseCard({ course, onPress, wide = false }) {
  const [imgIndex, setImgIndex] = useState(0);
  const { add } = useCart();
  const price = derivePrice(course);
  const base = api?.defaults?.baseURL || '';
  const slug = slugifyTitle(course.title);
  const candidates = [
    course.thumbnailUrl,
    `${base}/course-images/${slug}.jpg`,
    `${base}/course-images/${slug}.png`,
    slug.endsWith('s') ? `${base}/course-images/${slug.slice(0,-1)}.jpg` : null,
    slug.endsWith('s') ? `${base}/course-images/${slug.slice(0,-1)}.png` : null,
    `${base}/course-images/${slug}s.jpg`,
    `${base}/course-images/${slug}s.png`,
    'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  ].filter(Boolean);
  const thumb = candidates[Math.min(imgIndex, candidates.length - 1)];
  const scale = React.useRef(new Animated.Value(1)).current;
  const onDown = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onUp = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
    <Pressable
      onPress={onPress}
      onPressIn={onDown}
      onPressOut={onUp}
      accessibilityLabel={`Open course ${course.title}`}
      className={clsx(
        'bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden',
        wide ? 'mr-4' : 'flex-1 mb-4'
      )}
      style={{
        width: wide ? 280 : undefined,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 25,
        elevation: 5,
      }}
    >
      <View>
        {thumb ? (
          <Image
            source={{ uri: thumb }}
            className="w-full"
            style={{ aspectRatio: 16/9 }}
            resizeMode="cover"
          onError={() => setImgIndex((i) => i + 1)}
          />
        ) : (
          <View className="w-full" style={{ aspectRatio: 16/9, backgroundColor: '#EEF2F7' }} />
        )}
        {/* gradient overlay (lighter) */}
        {thumb && (
          <LinearGradient colors={["transparent","rgba(0,0,0,0.25)"]} style={{ position:'absolute', left:0, right:0, bottom:0, height:48 }} />
        )}
        {/* price badge */}
        <LinearGradient colors={["#14B8A6","#10B981"]} style={{ position:'absolute', left:8, top:8, borderRadius:12, paddingHorizontal:8, paddingVertical:4 }}>
          <Text className="text-white text-xs font-semibold">{price === 0 ? 'Free' : `₹${price}`}</Text>
        </LinearGradient>
        {/* cart quick add */}
        <Pressable onPress={() => add({ ...course, price })} accessibilityLabel="Add to cart" style={{ position:'absolute', right:8, top:8, backgroundColor:'rgba(255,255,255,0.95)', borderRadius:20, width:36, height:36, alignItems:'center', justifyContent:'center' }}>
          <MaterialCommunityIcons name="cart-plus" size={20} color="#111827" />
        </Pressable>
      </View>
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <Text className="flex-1 text-lg font-bold text-neutral-900 dark:text-white" numberOfLines={2}>
            {(course.title || '').replace(/^\s*NPTEL\s*:?\s*/i, '')}
          </Text>
          <Text className="ml-2 text-sm font-extrabold text-brand">{price === 0 ? 'Free' : `₹${price}`}</Text>
        </View>
        <View className="flex-row items-center gap-2 mt-1">
          <MaterialCommunityIcons name="play-circle" size={14} color="#10B981" />
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">{course.lectureCount && course.lectureCount > 0 ? `${course.lectureCount} lectures` : 'Playlist'}</Text>
        </View>
        {course.description ? (
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1" numberOfLines={1}>
            {course.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
    </Animated.View>
  );
}
