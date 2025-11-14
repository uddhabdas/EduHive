import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import CourseCard from '../components/CourseCard';
import { api } from '../api/client';
import { SkeletonCourseCard } from '../components/Skeleton';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';

export default function MyCoursesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);

  const loadCourses = useCallback(async () => {
    setError(null);
    try {
      const purchasesRes = await api.get('/api/purchases');
      const purchasedCourses = purchasesRes.data.map((p) => p.courseId).filter(Boolean);
      
      if (purchasedCourses.length === 0) {
        setCourses([]);
        return;
      }

      // Fetch course details for purchased courses
      const courseDetails = await Promise.all(
        purchasedCourses.map(async (course) => {
          try {
            const res = await api.get(`/api/courses/${course._id || course}`);
            return res.data;
          } catch (e) {
            return null;
          }
        })
      );

      setCourses(courseDetails.filter(Boolean));
    } catch (e) {
      console.error('Failed to load purchased courses:', e);
      setError('Failed to load your courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={['top', 'left', 'right']}>
        <HeaderBar onSearch={() => {}} onCart={() => navigation.navigate('Cart')} onProfile={() => navigation.navigate('Profile')} />
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={['top', 'left', 'right']}>
      <HeaderBar onSearch={() => {}} onCart={() => navigation.navigate('Cart')} onProfile={() => navigation.navigate('Profile')} />
      <ErrorBanner message={error} />
      
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        className="flex-1"
      >
        <View className="px-4 pt-4 pb-6">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">My Courses</Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            {courses.length} {courses.length === 1 ? 'course' : 'courses'} purchased
          </Text>

          {courses.length === 0 ? (
            <EmptyState
              title="No courses yet"
              subtitle="Purchase courses to start learning"
              primaryText="Browse Courses"
              onPrimary={() => navigation.navigate('Courses')}
            />
          ) : (
            <FlatList
              numColumns={2}
              columnWrapperStyle={{ gap: 12 }}
              scrollEnabled={false}
              data={courses}
              keyExtractor={(item) => `mycourse-${item._id}`}
              renderItem={({ item }) => (
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
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

