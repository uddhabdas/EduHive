import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';

export default function AboutCourseScreen({ route, navigation }) {
  const { title, description, thumbnailUrl, about, highlights } = route.params || {};
  const cleanTitle = (title || '').replace(/^\s*NPTEL\s*:?\s*/i, '');
  
  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={['top','left','right']}>
      <HeaderBar onSearch={() => {}} onCart={() => navigation.navigate('Cart')} onProfile={() => navigation.navigate('Profile')} />
      <ScrollView className="flex-1">
        <View className="px-4 pt-4 pb-6">
          {thumbnailUrl ? (
            <Image 
              source={{ uri: thumbnailUrl }} 
              style={{ width: '100%', aspectRatio: 16/9, borderRadius: 16 }} 
              resizeMode="cover"
              defaultSource={require('../../assets/images/logo.jpg')}
            />
          ) : (
            <View style={{ width: '100%', aspectRatio: 16/9, borderRadius: 16, backgroundColor: '#EEF2F7', alignItems: 'center', justifyContent: 'center' }}>
              <Text className="text-neutral-400 text-sm">No thumbnail</Text>
            </View>
          )}
          
          <Text className="mt-4 text-2xl font-extrabold text-neutral-900 dark:text-white">
            {cleanTitle}
          </Text>
          
          {description && (
            <Text className="mt-3 text-base text-neutral-600 dark:text-neutral-400 leading-6">
              {description}
            </Text>
          )}
          
          {about && (
            <View className="mt-4">
              <Text className="text-lg font-bold text-neutral-900 dark:text-white mb-2">About</Text>
              <Text className="text-base text-neutral-600 dark:text-neutral-400 leading-6">
                {about}
              </Text>
            </View>
          )}
          
          {highlights && Array.isArray(highlights) && highlights.length > 0 && (
            <View className="mt-4">
              <Text className="text-lg font-bold text-neutral-900 dark:text-white mb-3">Highlights</Text>
              {highlights.map((highlight, index) => (
                <View key={index} className="flex-row items-start mb-2">
                  <Text className="text-emerald-600 dark:text-emerald-400 mr-2">•</Text>
                  <Text className="flex-1 text-base text-neutral-600 dark:text-neutral-400">
                    {highlight}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
