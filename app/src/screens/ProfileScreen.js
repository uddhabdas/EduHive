import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import { api } from '../api/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const { logout } = useAuth();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Get profile summary and wallet balance
      const [profileRes, walletRes] = await Promise.all([
        api.get('/api/profile/summary').catch(() => ({ data: {} })),
        api.get('/api/wallet/balance').catch(() => ({ data: { balance: 0 } })),
      ]);
      setProfile({
        ...(profileRes.data || {}),
        walletBalance: walletRes.data?.balance || 0,
      });
    } catch (e) {
      setError('Failed to load profile');
    }
  };

  const avatar = require('../../assets/images/logo.jpg');

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={['top','left','right']}>
      <HeaderBar onSearch={() => {}} onProfile={() => {}} />
      <ScrollView>
        <View className="px-4 pt-4 pb-6">
          <View className="flex-row items-center">
            <Image source={avatar} style={{ width: 72, height: 72, borderRadius: 36, marginRight: 12 }} />
            <View>
              <Text className="text-xl font-bold text-neutral-900 dark:text-white">{profile?.name || 'Learner'}</Text>
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">{profile?.email || ''}</Text>
            </View>
          </View>

          {/* Wallet Balance Card */}
          <Pressable
            onPress={() => navigation.navigate('Wallet')}
            className="mt-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5" style={{ shadowColor:'#000', shadowOffset:{width:0,height:10}, shadowOpacity:0.1, shadowRadius:25, elevation:5 }}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-sm font-medium mb-1">Wallet Balance</Text>
                <Text className="text-white text-3xl font-bold">₹{profile?.walletBalance?.toFixed(2) || '0.00'}</Text>
              </View>
              <MaterialCommunityIcons name="wallet" size={40} color="#FFFFFF" />
            </View>
            <View className="mt-4 flex-row items-center">
              <Text className="text-white/90 text-sm mr-2">Tap to manage wallet</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
            </View>
          </Pressable>

          {/* Stats */}
          <View className="mt-6 bg-white dark:bg-neutral-900 rounded-2xl p-4" style={{ shadowColor:'#000', shadowOffset:{width:0,height:10}, shadowOpacity:0.06, shadowRadius:25, elevation:5 }}>
            <View className="flex-row items-center justify-between">
              <View className="items-center flex-1">
                <MaterialCommunityIcons name="book-open-outline" size={22} color="#111827" />
                <Text className="mt-1 text-base font-bold text-neutral-900 dark:text-white">{profile?.coursesEnrolled ?? 0}</Text>
                <Text className="text-xs text-neutral-500">Courses</Text>
              </View>
              <View className="items-center flex-1">
                <MaterialCommunityIcons name="clock-outline" size={22} color="#111827" />
                <Text className="mt-1 text-base font-bold text-neutral-900 dark:text-white">{Math.round((profile?.totalWatchTime ?? 0)/60)}m</Text>
                <Text className="text-xs text-neutral-500">Watch time</Text>
              </View>
              <View className="items-center flex-1">
                <MaterialCommunityIcons name="check-circle-outline" size={22} color="#111827" />
                <Text className="mt-1 text-base font-bold text-neutral-900 dark:text-white">{profile?.completedLectures ?? 0}</Text>
                <Text className="text-xs text-neutral-500">Completed</Text>
              </View>
            </View>
          </View>

          {/* Links */}
          <View className="mt-6 bg-white dark:bg-neutral-900 rounded-2xl" style={{ overflow:'hidden', shadowColor:'#000', shadowOffset:{width:0,height:10}, shadowOpacity:0.06, shadowRadius:25, elevation:5 }}>
            {[
              { icon:'wallet', label:'My Wallet', onPress: () => navigation.navigate('Wallet') },
              { icon:'playlist-play', label:'My Courses', onPress: () => navigation.navigate('MyCourses') },
              { icon:'cog-outline', label:'Settings', onPress: () => navigation.navigate('Settings') },
              { icon:'logout', label:'Logout', onPress: () => logout() },
            ].map((item) => (
              <Pressable key={item.label} onPress={item.onPress} className="flex-row items-center p-4 border-b border-neutral-100 dark:border-neutral-800">
                <MaterialCommunityIcons name={item.icon} size={22} color="#111827" />
                <Text className="ml-3 text-base text-neutral-900 dark:text-white">{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
