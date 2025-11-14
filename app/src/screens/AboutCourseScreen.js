import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';

export default function AboutCourseScreen({ route, navigation }) {
  const { title, description, thumbnailUrl, source } = route.params || {};
  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <HeaderBar onSearch={() => {}} onCart={() => navigation.navigate('Cart')} onProfile={() => navigation.navigate('Profile')} />
      <ScrollView>
        <View className="px-4 pt-4">
          {thumbnailUrl ? (
            <Image source={{ uri: thumbnailUrl }} style={{ width: '100%', aspectRatio: 16/9, borderRadius: 16 }} />
          ) : (
            <View style={{ width: '100%', aspectRatio: 16/9, borderRadius: 16, backgroundColor: '#EEF2F7' }} />
          )}
          <Text className="mt-3 text-2xl font-extrabold text-neutral-900">{(title || '').replace(/^\s*NPTEL\s*:?\s*/i, '')}</Text>
          <Text className="mt-2 text-neutral-600">{description || 'About this course'}</Text>
          {source ? (
            {/* Source label removed to keep provider-agnostic UI */}
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
