import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, RefreshControl, ScrollView, useColorScheme, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api/client';
import HeaderBar from '../components/HeaderBar';
import CourseCard from '../components/CourseCard';
import { SkeletonCourseCard } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import SearchBar from '../components/SearchBar';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRef } from 'react';

export default function CoursesScreen({ navigation }) {
  const scheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [recommended, setRecommended] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [allRes, recRes] = await Promise.all([
        api.get('/api/courses'),
        api.get('/api/courses/recommended').catch(() => ({ data: [] })),
      ]);
      setCourses(allRes.data);
      setRecommended(Array.isArray(recRes.data) ? recRes.data : []);
    } catch (e) {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => c.title?.toLowerCase().includes(q));
  }, [courses, debouncedQuery]);

  const recommendedToShow = useMemo(() => {
    const list = (recommended || []).filter((c) => !debouncedQuery || c.title?.toLowerCase().includes(debouncedQuery.toLowerCase()));
    return list.slice(0, 4);
  }, [recommended, debouncedQuery]);
  const allCourses = useMemo(() => filtered, [filtered]);

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      await api.post('/api/seed/demo-courses');
      await load();
    } catch (e) {
      setError('Failed to load demo courses');
    } finally {
      setSeeding(false);
    }
  };

  const renderGridItem = ({ item }) => (
    <CourseCard
      course={item}
      onPress={() => navigation.navigate('CourseDetail', {
        id: item._id,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl,
        description: item.description,
        sourcePlaylistId: item.sourcePlaylistId,
      })}
    />
  );

  if (loading) {
    return (
      <View className="flex-1 bg-bg-light dark:bg-bg-dark">
        <HeaderBar onSearch={() => {}} onProfile={() => {}} />
        <View className="px-4 pt-4">
          <View className="flex-row gap-3">
            <SkeletonCourseCard wide />
            <SkeletonCourseCard wide />
          </View>
          <View className="flex-row gap-3 mt-3">
            <SkeletonCourseCard />
            <SkeletonCourseCard />
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={['top','left','right']}>
      <HeaderBar onSearch={() => { setShowSearch((s) => !s); setTimeout(() => searchRef.current?.focus(), 0); }} onCart={() => navigation.navigate('Cart')} onProfile={() => navigation.navigate('Profile')} />
      <ErrorBanner message={error} />
      
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
      >
        {/* Search Bar (toggled by header icon) */}
        {showSearch && (
          <View className="px-4 pt-3 pb-3">
            <SearchBar
              ref={searchRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search courses..."
              placeholderTextColor={scheme === 'dark' ? '#737373' : '#a3a3a3'}
            />
          </View>
        )}

        {allCourses.length === 0 ? (
          <View className="px-4 py-12">
            <EmptyState
              title="No courses yet"
              subtitle="Seed demo data to get started."
              primaryText={seeding ? 'Loading...' : 'Load Demo Data'}
              onPrimary={handleSeedData}
            />
          </View>
        ) : (
          <>
            {/* Recommended Section */}
            {recommendedToShow.length > 0 && (
              <View className="mb-5">
                <Text className="text-xl font-extrabold text-neutral-900 dark:text-white px-4 mb-3">
                  Recommended
                </Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                  data={recommendedToShow}
                  keyExtractor={(item) => `rec-${item._id}`}
                  renderItem={({ item }) => (
                    <CourseCard
                      wide
                      course={item}
                      onPress={() => navigation.navigate('CourseDetail', {
                        id: item._id,
                        title: item.title,
                        thumbnailUrl: item.thumbnailUrl,
                        description: item.description,
                        sourcePlaylistId: item.sourcePlaylistId,
                      })}
                    />
                  )}
                />
              </View>
            )}

            {/* All Courses Grid */}
            <View className="px-4 pb-4">
              <Text className="text-xl font-extrabold text-neutral-900 dark:text-white mb-3">
                All Courses
              </Text>
              <FlatList
                numColumns={2}
                columnWrapperStyle={{ gap: 12 }}
                scrollEnabled={false}
                removeClippedSubviews={false}
                initialNumToRender={allCourses.length}
                data={allCourses}
                keyExtractor={(item, idx) => `grid-${item._id}-${idx}`}
                renderItem={renderGridItem}
              />
            </View>
          </>
        )}
        {/* FAB Refresh */}
        <Pressable
          onPress={() => { setRefreshing(true); load(); }}
          className="absolute bottom-6 right-6 rounded-full items-center justify-center"
          style={{ width: 56, height: 56, backgroundColor: '#10B981', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 }}
          accessibilityLabel="Refresh"
        >
          <MaterialCommunityIcons name="refresh" size={26} color="#fff" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
