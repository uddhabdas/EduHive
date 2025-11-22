import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, FlatList, Pressable, Image, useColorScheme, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import { api } from '../api/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/ErrorBanner';
import Loading from '../components/Loading';

export default function ExploreScreen({ navigation }) {
  const scheme = useColorScheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);

  const areas = ['Island', 'Province', 'Districts'];

  const loadData = useCallback(async () => {
    try {
      setError(null);
      // Load courses as institutions
      const coursesRes = await api.get('/api/courses');
      const allCourses = coursesRes.data || [];
      
      // Group courses by source or use as institutions
      const institutionsList = allCourses.map((course, index) => ({
        _id: course._id || `inst-${index}`,
        name: course.title || 'Institution',
        rating: 4.1 + (index % 3) * 0.2, // Mock rating
        reviewCount: 300 + index * 50,
        category: course.description?.split(' ')[0] || 'General',
        description: course.description || 'Educational institution offering quality courses.',
        thumbnailUrl: course.thumbnailUrl,
        area: areas[index % areas.length], // Mock area
      }));

      setCourses(institutionsList);
    } catch (e) {
      console.error('Failed to load explore data:', e);
      setError('Failed to load explore content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCourses = useMemo(() => {
    let filtered = courses;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(course => 
        course.name.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.category.toLowerCase().includes(q)
      );
    }
    
    // Apply area filter
    if (selectedArea) {
      filtered = filtered.filter(course => course.area === selectedArea);
    }
    
    return filtered;
  }, [courses, searchQuery, selectedArea]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  };

  const renderCourseCard = ({ item }) => (
    <Pressable
      className="bg-white dark:bg-neutral-900 rounded-xl p-3 mb-3"
      style={{ 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.08, 
        shadowRadius: 8, 
        elevation: 3 
      }}
      onPress={() => {
        // Navigate to course detail if it's a course
        if (item._id && item._id.startsWith('inst-') === false) {
          navigation.navigate('CourseDetail', {
            id: item._id,
            title: item.name,
            thumbnailUrl: item.thumbnailUrl,
            description: item.description,
          });
        }
      }}
    >
      <View className="flex-row">
        <View className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-lg items-center justify-center mr-3">
          {item.thumbnailUrl ? (
            <Image 
              source={{ uri: item.thumbnailUrl }} 
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <MaterialCommunityIcons name="school" size={32} color="#9CA3AF" />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-neutral-900 dark:text-white mb-1" numberOfLines={1} style={{ fontSize: 15 }}>
            {item.name}
          </Text>
          <View className="flex-row items-center mb-1">
            <MaterialCommunityIcons name="star" size={14} color="#FBBF24" />
            <Text className="text-xs text-neutral-600 dark:text-neutral-400 ml-1" style={{ fontSize: 12 }}>
              {item.rating.toFixed(1)} ({item.reviewCount})
            </Text>
          </View>
          <Text className="text-xs text-neutral-500 dark:text-neutral-500 mb-1" numberOfLines={1} style={{ fontSize: 11 }}>
            {item.category}
          </Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={2} style={{ fontSize: 11, lineHeight: 14 }}>
            {item.description}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
        <HeaderBar onSearch={() => {}} onCart={() => navigation.navigate('Cart')} onProfile={() => navigation.navigate('Profile')} />
        <Loading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={['top', 'left', 'right']}>
      <HeaderBar 
        onSearch={() => {}} 
        onCart={() => navigation.navigate('Cart')} 
        onProfile={() => navigation.navigate('Profile')} 
      />
      <ErrorBanner message={error} />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-6">
          {/* Greeting */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-base font-bold text-neutral-900 dark:text-white" style={{ fontSize: 16 }}>
                {getGreeting()}
              </Text>
              <Text className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5" style={{ fontSize: 14 }}>
                {user?.name || 'User'}
              </Text>
            </View>
            <View className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full items-center justify-center">
              <MaterialCommunityIcons name="account" size={20} color="#10B981" />
            </View>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center mb-5 gap-2">
            <View className="flex-1 bg-white dark:bg-neutral-900 rounded-xl px-4 py-3 flex-row items-center"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
            >
              <TextInput
                className="flex-1 text-neutral-900 dark:text-white"
                placeholder="Search"
                placeholderTextColor={scheme === 'dark' ? '#737373' : '#a3a3a3'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ fontSize: 15 }}
              />
            </View>
            <Pressable
              className="w-11 h-11 bg-blue-600 rounded-full items-center justify-center"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 }}
            >
              <MaterialCommunityIcons name="magnify" size={20} color="#FFFFFF" />
            </Pressable>
            <Pressable
              className="w-11 h-11 bg-white dark:bg-neutral-900 rounded-full items-center justify-center"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
            >
              <MaterialCommunityIcons name="filter-variant" size={20} color={scheme === 'dark' ? '#FFFFFF' : '#111827'} />
            </Pressable>
          </View>

          {/* Popular Courses Section */}
          {filteredCourses.length > 0 && (
            <View className="mb-5">
              <Text className="text-lg font-bold text-neutral-900 dark:text-white mb-3" style={{ fontSize: 18 }}>
                Popular Courses
              </Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={filteredCourses.slice(0, 5)}
                keyExtractor={(item) => `popular-${item._id}`}
                renderItem={({ item }) => (
                  <Pressable
                    className="bg-white dark:bg-neutral-900 rounded-xl mr-3"
                    style={{ 
                      width: 180,
                      shadowColor: '#000', 
                      shadowOffset: { width: 0, height: 2 }, 
                      shadowOpacity: 0.08, 
                      shadowRadius: 8, 
                      elevation: 3 
                    }}
                    onPress={() => {
                      if (item._id && !item._id.startsWith('inst-')) {
                        navigation.navigate('CourseDetail', {
                          id: item._id,
                          title: item.name,
                          thumbnailUrl: item.thumbnailUrl,
                          description: item.description,
                        });
                      }
                    }}
                  >
                    {item.thumbnailUrl ? (
                      <Image 
                        source={{ uri: item.thumbnailUrl }} 
                        className="w-full h-28 rounded-t-xl"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-28 bg-neutral-100 dark:bg-neutral-800 rounded-t-xl items-center justify-center">
                        <MaterialCommunityIcons name="book-open-variant" size={32} color="#9CA3AF" />
                      </View>
                    )}
                    <View className="p-2.5">
                      <Text className="text-sm font-bold text-neutral-900 dark:text-white mb-1" numberOfLines={1} style={{ fontSize: 13 }}>
                        {item.name}
                      </Text>
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons name="star" size={12} color="#FBBF24" />
                        <Text className="text-xs text-neutral-600 dark:text-neutral-400 ml-1" style={{ fontSize: 11 }}>
                          {item.rating.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                )}
                contentContainerStyle={{ paddingRight: 16 }}
              />
            </View>
          )}

          {/* All Courses Section */}
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-neutral-900 dark:text-white" style={{ fontSize: 18 }}>
                All Courses
              </Text>
              <Pressable onPress={() => setShowFilter(!showFilter)}>
                <MaterialCommunityIcons 
                  name="filter-variant" 
                  size={18} 
                  color={showFilter ? '#3B82F6' : (scheme === 'dark' ? '#737373' : '#9CA3AF')} 
                />
              </Pressable>
            </View>

            {/* Area Filter */}
            {showFilter && (
              <View className="mb-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2" style={{ fontSize: 12 }}>
                  Area
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {areas.map((area) => (
                    <Pressable
                      key={area}
                      onPress={() => {
                        setSelectedArea(selectedArea === area ? null : area);
                      }}
                      className={`px-3 py-1.5 rounded-full ${
                        selectedArea === area 
                          ? 'bg-blue-600' 
                          : 'bg-white dark:bg-neutral-900'
                      }`}
                    >
                      <Text className={`text-xs font-semibold ${
                        selectedArea === area 
                          ? 'text-white' 
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`} style={{ fontSize: 11 }}>
                        {area}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {filteredCourses.length === 0 ? (
              <View className="py-8 items-center">
                <MaterialCommunityIcons name="book-open-variant-outline" size={48} color="#9CA3AF" />
                <Text className="text-neutral-500 dark:text-neutral-400 mt-2 text-center">
                  No courses found
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredCourses}
                keyExtractor={(item) => `course-${item._id}`}
                renderItem={renderCourseCard}
                scrollEnabled={false}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

