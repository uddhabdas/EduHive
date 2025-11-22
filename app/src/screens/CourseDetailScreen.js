import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Image, Animated, Easing, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../api/client';
import LocalVideoPlayer from '../components/LocalVideoPlayer';
import Button from '../components/Button';
import ErrorBanner from '../components/ErrorBanner';
import Loading from '../components/Loading';
import { formatDuration, useDebounce } from '../utils/helpers';
import { getCourseMeta } from '../data/courseMeta';
import { useCart } from '../context/CartContext';

function ProgressRing({ percent, size = 60 }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(percent, 0), 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#10B981"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
        <Text className="text-xs font-bold text-neutral-900 dark:text-white">
          {Math.round(progress * 100)}%
        </Text>
      </View>
    </View>
  );
}

function LectureListItem({ item, index, onPress, progress }) {
  const isCompleted = progress && progress.completed;
  const hasProgress = progress && progress.position > 0;

  const openExternal = () => {
    const { Linking } = require('react-native');
    Linking.openURL(`https://youtube.com/watch?v=${item.videoId}`);
  };

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center p-4 border-b border-neutral-200 dark:border-neutral-800`}
    >
      <Text className="w-6 text-xs text-neutral-500 dark:text-neutral-400">{index + 1}.</Text>
      <Image 
        source={{ 
          uri: item.thumbnailUrl || 
               (item.videoId ? `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg` : 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
        }}
        className="w-16 h-9 mx-3 rounded-md" 
        resizeMode="cover"
        onError={() => {}}
        defaultSource={require('../../assets/images/logo.jpg')}
      />
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-base font-semibold text-neutral-900 dark:text-white" numberOfLines={2}>
            {item.title}
          </Text>
          <Pressable onPress={openExternal} accessibilityLabel="Open on YouTube">
            <MaterialCommunityIcons name="open-in-new" size={18} color="#0072FF" />
          </Pressable>
        </View>
        <View className="mt-1 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
          <View style={{ width: `${Math.min(100, (hasProgress && progress.duration>0) ? (progress.position/progress.duration*100) : 0)}%` }}
                className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-brand'}`} />
        </View>
      </View>
    </Pressable>
  );
}

export default function CourseDetailScreen({ route, navigation }) {
  const { id, title, thumbnailUrl, description, sourcePlaylistId } = route.params;
  const cleanTitle = (title || '').replace(/^\s*NPTEL\s*:?\s*/i, '');
  const { add } = useCart();
  const [loading, setLoading] = useState(true);
  const [lectures, setLectures] = useState([]);
  const [progressSummary, setProgressSummary] = useState(null);
  const [progressItems, setProgressItems] = useState([]);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const [autoSkipTries, setAutoSkipTries] = useState(0);
  const [courseDetails, setCourseDetails] = useState(null);
  const [purchased, setPurchased] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [purchasing, setPurchasing] = useState(false);

  const loadProgress = useCallback(async () => {
    try {
      const progressRes = await api.get(`/api/progress/course/${id}`);
      setProgressSummary(progressRes.data.summary);
      setProgressItems(progressRes.data.items);
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
  }, [id]);

  const loadCourseDetails = async () => {
    try {
      // Try to get full course details from admin API (if available) or use basic info
      const [courseRes, purchasedRes, walletRes] = await Promise.all([
        api.get(`/api/courses/${id}`).catch((err) => {
          console.warn('Failed to load course details:', err);
          return { data: null };
        }),
        api.get(`/api/courses/${id}/purchased`).catch(() => ({ data: { purchased: false } })),
        api.get('/api/wallet/balance').catch(() => ({ data: { balance: 0 } })),
      ]);
      
      if (courseRes.data) {
        setCourseDetails(courseRes.data);
      } else {
        // Fallback to route params if API fails
        setCourseDetails({
          _id: id,
          title: title,
          description: description,
          thumbnailUrl: thumbnailUrl,
          isPaid: false,
          price: 0,
        });
      }
      setPurchased(purchasedRes.data.purchased || false);
      setWalletBalance(walletRes.data.balance || 0);
    } catch (e) {
      console.error('Failed to load course details:', e);
    }
  };

  const handlePurchase = async () => {
    if (purchasing) return;

    if (!courseDetails) {
      Alert.alert('Error', 'Course details not loaded. Please try again.');
      return;
    }

    // Free course – enroll directly without wallet/cart
    if (!courseDetails.isPaid || courseDetails.price <= 0) {
      try {
        setPurchasing(true);
        await api.post(`/api/courses/${id}/purchase`);
        await loadCourseDetails();
        Alert.alert('Enrolled', 'This free course has been added to My Courses.');
      } catch (e) {
        const msg = e?.response?.data?.error || 'Failed to enroll in free course';
        Alert.alert('Enrollment Failed', msg);
      } finally {
        setPurchasing(false);
      }
      return;
    }

    // Re-check purchased status before attempting purchase
    try {
      const purchasedCheck = await api.get(`/api/courses/${id}/purchased`);
      if (purchasedCheck.data?.purchased) {
        Alert.alert('Already Purchased', 'You have already purchased this course.');
        await loadCourseDetails(); // Refresh UI
        return;
      }
    } catch (e) {
      console.warn('Failed to check purchase status:', e);
    }

    if (purchased) {
      Alert.alert('Already Purchased', 'You have already purchased this course.');
      return;
    }

    // Re-check wallet balance
    try {
      const walletRes = await api.get('/api/wallet/balance');
      const currentBalance = walletRes.data?.balance || 0;
      if (currentBalance < courseDetails.price) {
        Alert.alert(
          'Insufficient Balance',
          `You need ₹${courseDetails.price.toFixed(2)} but only have ₹${currentBalance.toFixed(2)} in your wallet.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Money', onPress: () => navigation.navigate('WalletTopUp') },
          ]
        );
        return;
      }
    } catch (e) {
      console.warn('Failed to check wallet balance:', e);
    }

    if (walletBalance < courseDetails.price) {
      Alert.alert(
        'Insufficient Balance',
        `You need ₹${courseDetails.price.toFixed(2)} but only have ₹${walletBalance.toFixed(2)} in your wallet.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Money', onPress: () => navigation.navigate('WalletTopUp') },
        ]
      );
      return;
    }

    Alert.alert(
      'Purchase Course',
      `Purchase "${cleanTitle || title}" for ₹${courseDetails.price.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            // Prevent double-clicking
            if (purchasing) {
              return;
            }
            
            setPurchasing(true);
            try {
              console.log('Attempting purchase for course:', id);
              const response = await api.post(`/api/courses/${id}/purchase`);
              
              // Explicitly check response status
              if (response.status >= 200 && response.status < 300) {
                // Success - reload course details and show success
                console.log('Purchase successful:', response.data);
                // Immediately update purchased state
                setPurchased(true);
                // Update wallet balance from response
                if (response.data?.newBalance !== undefined) {
                  setWalletBalance(response.data.newBalance);
                }
                await loadCourseDetails();
                Alert.alert('Success', 'Course purchased successfully!');
              } else {
                // Unexpected status code
                const errorMsg = response.data?.error || 'Purchase failed. Please try again.';
                console.error('Unexpected status:', response.status, response.data);
                Alert.alert('Purchase Failed', errorMsg);
              }
            } catch (e) {
              console.error('Purchase error:', e);
              console.error('Error response:', e.response?.data);
              console.error('Error status:', e.response?.status);
              console.error('Error config:', e.config);
              
              // Handle different error types
              let errorMsg = 'Failed to purchase course';
              
              if (e.response) {
                // Server responded with error
                const status = e.response.status;
                const data = e.response.data;
                
                if (status === 400) {
                  // Specific 400 error messages
                  errorMsg = data?.error || 'Purchase failed. Please check your wallet balance or if the course is already purchased.';
                } else if (status === 404) {
                  errorMsg = data?.error || 'Course or user not found.';
                } else {
                  errorMsg = data?.error || `Server error (${status})`;
                }
              } else if (e.request) {
                // Request made but no response
                errorMsg = 'No response from server. Please check your connection.';
              } else {
                // Error setting up request
                errorMsg = e.message || 'Network error. Please try again.';
              }
              
              Alert.alert('Purchase Failed', errorMsg);
            } finally {
              setPurchasing(false);
            }
          },
        },
      ]
    );
  };

  const loadLectures = async () => {
    setError(null);
    try {
      const lecRes = await api.get(`/api/courses/${id}/lectures`);
      setLectures(lecRes.data);
      
      // Load progress
      await loadProgress();

      // If no lectures and has playlist, we'll sync on first play via onReady
      if (lecRes.data.length === 0 && sourcePlaylistId) {
        // no-op; player will sync once ready
      } else if (lecRes.data.length > 0) {
        // Try to get next lecture
        try {
          const nextRes = await api.get(`/api/progress/next/${id}`);
          const nextLecture = lecRes.data.find((l) => l._id === nextRes.data.lectureId);
          setSelected(nextLecture || lecRes.data[0]);
        } catch {
          setSelected(lecRes.data[0]);
        }
      }
    } catch (e) {
      if (e.response?.status === 403) {
        setError('You need to purchase this course to access lectures');
        setLectures([]);
      } else {
        setError('Failed to load course');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistReady = useCallback(async ({ videoId, duration, playlist }) => {
    // Sync playlist to server
    if (playlist && playlist.length > 0 && !syncing) {
      setSyncing(true);
      try {
        const items = playlist.map((vid, idx) => ({
          videoId: vid,
          title: `Video ${idx + 1}`,
          orderIndex: idx + 1,
          duration: idx === 0 ? duration : 0,
        }));

        await api.post(`/api/courses/${id}/sync-from-player`, {
          playlistId: sourcePlaylistId,
          items,
        });

        // Reload lectures
        const lecRes = await api.get(`/api/courses/${id}/lectures`);
        setLectures(lecRes.data);
        if (lecRes.data.length > 0) {
          setSelected(lecRes.data[0]);
        }
      } catch (e) {
        console.error('Failed to sync playlist:', e);
      } finally {
        setSyncing(false);
      }
    }
  }, [id, sourcePlaylistId, syncing]);

  const handleTick = useCallback(async ({ position, duration, videoId }) => {
    if (!selected) return;
    
    try {
      await api.post('/api/progress/upsert', {
        courseId: id,
        lectureId: selected._id,
        videoId,
        position,
        duration,
      });
      
      // Reload progress
      await loadProgress();
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }, [selected, id, loadProgress]);

  const debouncedHandleTick = useDebounce(handleTick, 2000);

  const handleEnded = useCallback(async ({ videoId, duration }) => {
    if (!selected) return;

    try {
      await api.post('/api/progress/upsert', {
        courseId: id,
        lectureId: selected._id,
        videoId,
        position: duration,
        duration,
      });

      await loadProgress();

      // Auto-advance to next lecture
      try {
        const nextRes = await api.get(`/api/progress/next/${id}`);
        const nextLecture = lectures.find((l) => l._id === nextRes.data.lectureId);
        if (nextLecture) setSelected(nextLecture);
      } catch {}
    } catch (e) {
      console.error('Failed to mark as complete:', e);
    }
  }, [selected, id, loadProgress, lectures]);

  const handleContinueWatching = useCallback(async () => {
    try {
      const nextRes = await api.get(`/api/progress/next/${id}`);
      const nextLecture = lectures.find((l) => l._id === nextRes.data.lectureId);
      if (nextLecture) {
        setSelected(nextLecture);
      }
    } catch (e) {
      console.error('Failed to get next lecture:', e);
    }
  }, [id, lectures]);

  useEffect(() => {
    loadCourseDetails();
    loadLectures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getProgressForLecture = useCallback((lectureId) => {
    const target = typeof lectureId === 'string' ? lectureId : (lectureId && lectureId.toString());
    return progressItems.find((p) => (typeof p.lectureId === 'string' ? p.lectureId : p.lectureId?.toString()) === target);
  }, [progressItems]);

  if (loading) return <Loading />;

  const meta = getCourseMeta({ id, title });
  if (!meta && __DEV__) {
    console.warn(
      `[courseMeta] Missing entry for course "${cleanTitle || title}" (${id}). ` +
      `Add one in app/src/data/courseMeta.js, for example:\n` +
      `  '${id}': { about: '...', highlights: ['...'], audience: '...' }`
    );
  }
  const aboutText = meta?.about || description || `Master the fundamentals of ${cleanTitle || title}. Learn by doing with practical examples and clear explanations.`;
  const highlights = Array.isArray(meta?.highlights) ? meta.highlights : [
    'Clear, structured lessons focused on outcomes',
    'Hands‑on practice and guided examples',
    'Best practices you can apply immediately',
  ];
  const audience = meta?.audience || 'Beginners and intermediates looking for a fast, curated path.';

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <ErrorBanner message={error} />

      <ScrollView>
        {/* Gradient Hero with overlay */}
        <View className="relative">
          {thumbnailUrl ? (
            <Image source={{ uri: thumbnailUrl }} className="w-full h-56" resizeMode="cover" />
          ) : (
            <View className="w-full h-56 bg-neutral-300 dark:bg-neutral-800" />
          )}
          <LinearGradient
            colors={["rgba(20,184,166,0.5)", "rgba(16,185,129,0.65)", "rgba(0,0,0,0.55)"]}
            className="absolute inset-0"
          />
          <View className="absolute bottom-0 left-0 right-0 p-4">
            <Text className="text-2xl font-extrabold text-white mb-1">{cleanTitle || title}</Text>
            {description ? (
              <Text className="text-sm text-white/90" numberOfLines={2}>
                {description}
              </Text>
            ) : null}
            {/* Source label removed for a platform-agnostic experience */}
            <View className="mt-3">
              {courseDetails && courseDetails.isPaid && courseDetails.price > 0 ? (
                purchased ? (
                  <View className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-2 self-start">
                    <Text className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Purchased</Text>
                  </View>
                ) : (
                  <View className="w-full">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-baseline">
                        <Text className="text-white text-3xl font-bold mr-2">₹{courseDetails.price.toFixed(2)}</Text>
                        {walletBalance < courseDetails.price && (
                          <View className="bg-yellow-500/20 border border-yellow-500/30 px-2 py-1 rounded-lg">
                            <Text className="text-yellow-300 text-xs font-medium">Low Balance</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View className="flex-row gap-3 items-center">
                      <Pressable
                        onPress={handlePurchase}
                        disabled={purchasing || purchased || walletBalance < courseDetails.price}
                        style={{ 
                          flex: 1,
                          borderRadius: 12, 
                          overflow: 'hidden', 
                          opacity: (purchasing || purchased || walletBalance < courseDetails.price) ? 0.6 : 1 
                        }}
                      >
                        <LinearGradient 
                          colors={["#14B8A6", "#10B981"]} 
                          start={{x:0,y:0}} 
                          end={{x:1,y:1}} 
                          style={{ 
                            paddingHorizontal: 20, 
                            paddingVertical: 14, 
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor:'#000', 
                            shadowOffset:{width:0,height:4}, 
                            shadowOpacity:0.3, 
                            shadowRadius:8, 
                            elevation:5 
                          }}
                        >
                          <Text className="text-white font-bold text-base">
                            {purchasing ? 'Processing...' : 'Purchase Now'}
                          </Text>
                        </LinearGradient>
                      </Pressable>
                      <Pressable
                        onPress={() => add({ _id: id, title: cleanTitle || title, price: courseDetails.price })}
                        style={{ 
                          width: 50,
                          height: 50,
                          borderRadius: 12,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderWidth: 1,
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MaterialCommunityIcons name="cart-plus" size={22} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </View>
                )
              ) : (
                <Pressable
                  onPress={handlePurchase}
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                  disabled={purchasing}
                >
                  <LinearGradient
                    colors={["#14B8A6", "#10B981"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 5,
                      opacity: purchasing ? 0.6 : 1,
                    }}
                  >
                    <Text className="text-white font-bold text-base">
                      {purchasing ? 'Enrolling...' : 'Enroll Now'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              )}
              <View className="mt-3" />
            </View>
          </View>
        </View>

        {/* Progress Summary Row */}
        {progressSummary && lectures.length > 0 && (
          <View className="px-4 pt-4 pb-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <ProgressRing percent={progressSummary.percent} size={50} />
              <View className="ml-3">
                <Text className="text-base font-bold text-neutral-900 dark:text-white">
                  {Math.round(progressSummary.percent * 100)}% Complete
                </Text>
                {progressSummary.remainingSeconds > 0 && (
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                    {formatDuration(progressSummary.remainingSeconds)} remaining
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Info cards with glass effect */}
        <View className="px-4 pb-4">
          <BlurView intensity={20} tint="light" style={{ borderRadius: 16 }}>
            <View className="bg-white/80 rounded-2xl p-4" style={{ shadowColor:'#000', shadowOffset:{width:0,height:10}, shadowOpacity:0.08, shadowRadius:25, elevation:5 }}>
              <Text className="text-lg font-bold text-neutralDark">About this course</Text>
              <Text className="mt-2 text-muted">{aboutText}</Text>
              <View className="mt-3">
                <Text className="text-sm font-semibold text-neutral-800 mb-1">What you'll learn</Text>
                <View className="gap-1">
                  {highlights.map((h, i) => (
                    <Text key={`hl-${i}`} className="text-sm text-neutral-600">• {h}</Text>
                  ))}
                </View>
              </View>
              <View className="mt-3">
                <Text className="text-sm font-semibold text-neutral-800 mb-1">Who is this for</Text>
                <Text className="text-sm text-neutral-600">{audience}</Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Roadmap timeline */}
        <View className="px-4 pb-4">
          <View className="bg-white rounded-2xl p-4" style={{ shadowColor:'#000', shadowOffset:{width:0,height:10}, shadowOpacity:0.08, shadowRadius:25, elevation:5 }}>
            <Text className="text-lg font-bold text-neutralDark mb-2">Roadmap</Text>
            {(lectures.length ? lectures.slice(0,4) : [1,2,3,4]).map((it, idx) => {
              const done = progressSummary && progressSummary.percent >= (idx+1)/(Math.min(lectures.length || 4, 4));
              return (
                <View key={`rm-${idx}`} className="flex-row items-start mb-3">
                  <View className="items-center mr-3">
                    <View className={done ? 'w-3 h-3 rounded-full bg-accent' : 'w-3 h-3 rounded-full bg-neutral-300'} />
                    {idx < 3 && <View className="w-0.5 flex-1 bg-neutral-200" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-neutralDark font-semibold">{lectures[idx]?.title || `Step ${idx+1}`}</Text>
                    <Text className="text-muted text-sm">{lectures[idx]?.description || 'Continue to unlock the next step'}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Video Player */}
        <View className="px-4 pb-4">
          {courseDetails && courseDetails.isPaid && courseDetails.price > 0 && !purchased ? (
            <View
              className="rounded-2xl overflow-hidden bg-neutral-900 items-center justify-center"
              style={{
                aspectRatio: 16/9,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.06,
                shadowRadius: 25,
                elevation: 5,
              }}
            >
              <MaterialCommunityIcons name="lock" size={64} color="#9CA3AF" />
              <Text className="text-white text-lg font-bold mt-4">Course Locked</Text>
              <Text className="text-neutral-400 text-sm mt-2 text-center px-8">
                Purchase this course to unlock all lectures
              </Text>
              <Pressable
                onPress={handlePurchase}
                disabled={purchasing}
                style={{ 
                  marginTop: 24, 
                  backgroundColor: '#10B981', 
                  borderRadius: 12, 
                  paddingHorizontal: 24, 
                  paddingVertical: 14,
                  opacity: purchasing ? 0.6 : 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Text className="text-white font-bold text-base">
                  {purchasing ? 'Processing...' : `Purchase for ₹${courseDetails.price.toFixed(2)}`}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              className="rounded-2xl overflow-hidden"
              style={{
                aspectRatio: 16/9,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.06,
                shadowRadius: 25,
                elevation: 5,
              }}
            >
              {selected?.videoUrl ? (
                <LocalVideoPlayer
                  uri={selected.videoUrl}
                  start={(getProgressForLecture(selected._id)?.position) || 0}
                  onReady={() => {}}
                  onTick={debouncedHandleTick}
                  onEnded={handleEnded}
                />
              ) : selected?.videoId ? (
                <View className="flex-1 items-center justify-center bg-neutral-900">
                  <MaterialCommunityIcons name="play-circle-outline" size={64} color="#9CA3AF" />
                  <Text className="text-white text-lg font-semibold mt-4">YouTube Video</Text>
                  <Text className="text-neutral-400 text-sm mt-2 text-center px-8">
                    Tap to open in YouTube
                  </Text>
                  <Pressable
                    onPress={() => {
                      const { Linking } = require('react-native');
                      Linking.openURL(`https://youtube.com/watch?v=${selected.videoId}`);
                    }}
                    className="mt-4 bg-red-600 rounded-xl px-6 py-3"
                  >
                    <Text className="text-white font-bold">Open in YouTube</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )}
          {!selected?.videoUrl && !selected?.videoId && (
            <View className="mt-3">
              <View className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4">
                <View className="flex-row items-start">
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#F59E0B" className="mr-2" />
                  <View className="flex-1">
                    <Text className="text-yellow-800 dark:text-yellow-300 font-semibold mb-1">
                      No Video Available
                    </Text>
                    <Text className="text-yellow-700 dark:text-yellow-400 text-sm">
                      This lecture doesn't have a video yet. Please check back later or contact support.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* YouTube-specific error UI removed */}

        {/* Continue Watching Button */}
        {lectures.length > 0 && (!courseDetails || !courseDetails.isPaid || courseDetails.price <= 0 || purchased) && (
          <View className="px-4 pb-2">
            <Button title="Continue Learning" onPress={handleContinueWatching} />
          </View>
        )}

        {/* Lectures List */}
        {(!courseDetails || !courseDetails.isPaid || courseDetails.price <= 0 || purchased) && (
          <View className="px-4 pb-4">
            <Text className="text-xl font-extrabold text-neutral-900 dark:text-white mb-3">
              Lectures ({lectures.length})
            </Text>
          <View
            className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.08,
              shadowRadius: 25,
              elevation: 5,
            }}
          >
                {lectures.map((item, idx) => (
                  <LectureListItem
                    key={item._id}
                    item={item}
                    index={idx}
                    onPress={() => {
                      // Block if trying to jump ahead of first incomplete
                      const firstIncomplete = progressItems.find((p) => !p.completed);
                      if (firstIncomplete) {
                        const targetIdx = lectures.findIndex((l) => l._id === item._id);
                        const firstIdx = lectures.findIndex((l) => l._id === firstIncomplete.lectureId);
                        if (targetIdx > firstIdx) {
                          const { Alert } = require('react-native');
                          Alert.alert('Locked', 'Finish the current stage (watch 90%) to unlock next.');
                          return;
                        }
                      }
                      setSelected(item);
                    }}
                    progress={getProgressForLecture(item._id)}
                  />
                ))}
          </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
