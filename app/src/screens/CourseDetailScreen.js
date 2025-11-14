import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Image, Animated, Easing } from 'react-native';
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
      <Text className="w-6 text-xs text-neutral-500">{index + 1}.</Text>
      <Image source={{ uri: item.thumbnailUrl || 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' }}
             className="w-16 h-9 mx-3 rounded-md" resizeMode="cover"
             onError={(e) => { /* show a neutral block on error */ }} />
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
        api.get(`/api/courses/${id}`).catch(() => ({ data: null })),
        api.get(`/api/courses/${id}/purchased`).catch(() => ({ data: { purchased: false } })),
        api.get('/api/wallet/balance').catch(() => ({ data: { balance: 0 } })),
      ]);
      
      setCourseDetails(courseRes.data);
      setPurchased(purchasedRes.data.purchased || false);
      setWalletBalance(walletRes.data.balance || 0);
    } catch (e) {
      console.error('Failed to load course details:', e);
    }
  };

  const handlePurchase = async () => {
    if (!courseDetails || !courseDetails.isPaid || courseDetails.price <= 0) {
      // Free course - just add to cart or enroll directly
      add({ _id: id, title: cleanTitle || title, price: 0 });
      return;
    }

    if (purchased) {
      // Already purchased
      return;
    }

    if (walletBalance < courseDetails.price) {
      const { Alert } = require('react-native');
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

    const { Alert } = require('react-native');
    Alert.alert(
      'Purchase Course',
      `Purchase "${cleanTitle || title}" for ₹${courseDetails.price.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            setPurchasing(true);
            try {
              await api.post(`/api/courses/${id}/purchase`);
              await loadCourseDetails();
              Alert.alert('Success', 'Course purchased successfully!');
            } catch (e) {
              Alert.alert('Error', e.response?.data?.error || 'Failed to purchase course');
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
                  <View>
                    <View className="flex-row items-center mb-2">
                      <Text className="text-white text-2xl font-bold mr-2">₹{courseDetails.price.toFixed(2)}</Text>
                      {walletBalance < courseDetails.price && (
                        <View className="bg-yellow-500/20 px-2 py-1 rounded">
                          <Text className="text-yellow-300 text-xs">Low Balance</Text>
                        </View>
                      )}
                    </View>
                    <Pressable
                      onPress={handlePurchase}
                      disabled={purchasing || walletBalance < courseDetails.price}
                      style={{ borderRadius: 9999, overflow: 'hidden', alignSelf: 'flex-start', opacity: (purchasing || walletBalance < courseDetails.price) ? 0.6 : 1 }}
                    >
                      <LinearGradient colors={["#14B8A6", "#10B981"]} start={{x:0,y:0}} end={{x:1,y:1}} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 9999, shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:0.2, shadowRadius:16, elevation:4 }}>
                        <Text className="text-white font-bold">{purchasing ? 'Processing...' : 'Purchase with Wallet'}</Text>
                      </LinearGradient>
                    </Pressable>
                    <Pressable
                      onPress={() => add({ _id: id, title: cleanTitle || title, price: courseDetails.price })}
                      className="mt-2"
                    >
                      <Text className="text-white/80 text-sm underline">Add to Cart</Text>
                    </Pressable>
                  </View>
                )
              ) : (
                <Pressable onPress={() => add({ _id: id, title: cleanTitle || title, price: 0 })}
                  style={{ borderRadius: 9999, overflow: 'hidden', alignSelf: 'flex-start' }}
                >
                  <LinearGradient colors={["#14B8A6", "#10B981"]} start={{x:0,y:0}} end={{x:1,y:1}} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 9999, shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:0.2, shadowRadius:16, elevation:4 }}>
                    <Text className="text-white font-bold">Enroll Now</Text>
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
                className="mt-6 bg-emerald-600 rounded-xl px-6 py-3"
              >
                <Text className="text-white font-bold">Purchase for ₹{courseDetails.price.toFixed(2)}</Text>
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
              ) : null}
            </View>
          )}
          {!selected?.videoUrl && (
            <View className="mt-3">
              <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <Text className="text-yellow-800">
                  No video file set for this lecture. Add a `videoUrl` field to this lecture (MP4/HTTP or local file URL), then reload.
                </Text>
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
