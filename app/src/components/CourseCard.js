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
        'bg-white dark:bg-neutral-900 rounded-xl overflow-hidden',
        wide ? 'mr-3' : 'flex-1 mb-3'
      )}
      style={{
        width: wide ? 280 : undefined,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
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
          <View className="w-full items-center justify-center" style={{ aspectRatio: 16/9, backgroundColor: '#EEF2F7' }}>
            <MaterialCommunityIcons name="book-open-variant" size={48} color="#9CA3AF" />
          </View>
        )}
        {/* gradient overlay (lighter) */}
        {thumb && (
          <LinearGradient colors={["transparent","rgba(0,0,0,0.25)"]} style={{ position:'absolute', left:0, right:0, bottom:0, height:48 }} />
        )}
        {/* price badge */}
        <View 
          style={{ 
            position:'absolute', 
            left:10, 
            top:10, 
            backgroundColor: price === 0 ? '#10B981' : '#3B82F6',
            borderRadius:8, 
            paddingHorizontal:8, 
            paddingVertical:4,
          }}
        >
          <Text className="text-white text-xs font-bold" style={{ fontSize: 11, fontWeight: '700' }}>
            {price === 0 ? 'Free' : `₹${price}`}
          </Text>
        </View>
        {/* cart quick add */}
        <Pressable 
          onPress={() => add({ ...course, price })} 
          accessibilityLabel="Add to cart" 
          style={{ 
            position:'absolute', 
            right:10, 
            top:10, 
            backgroundColor:'rgba(255,255,255,0.9)', 
            borderRadius:18, 
            width:36, 
            height:36, 
            alignItems:'center', 
            justifyContent:'center',
          }}
        >
          <MaterialCommunityIcons name="cart-plus" size={20} color="#10B981" />
        </Pressable>
      </View>
      <View className="p-3">
        <Text className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5" numberOfLines={2} style={{ fontSize: 15, lineHeight: 20 }}>
          {(course.title || '').replace(/^\s*NPTEL\s*:?\s*/i, '')}
        </Text>
        <View className="flex-row items-center mt-1.5">
          <MaterialCommunityIcons name="star" size={14} color="#FBBF24" />
          <Text className="text-xs text-neutral-600 dark:text-neutral-400 ml-1" style={{ fontSize: 12 }}>
            {course.lectureCount && course.lectureCount > 0 ? `${course.lectureCount} lectures` : 'Playlist'}
          </Text>
        </View>
        {course.description ? (
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5" numberOfLines={1} style={{ fontSize: 11, lineHeight: 14 }}>
            {course.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
    </Animated.View>
  );
}
