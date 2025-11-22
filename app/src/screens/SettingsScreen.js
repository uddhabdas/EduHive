import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }) {
  const scheme = useColorScheme();
  const { clear } = useCart();
  const { logout } = useAuth();
  const [clearing, setClearing] = useState(false);

  const handleClearCart = async () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              clear();
              await AsyncStorage.removeItem('cart_items');
              Alert.alert('Success', 'Cart cleared successfully');
            } catch (e) {
              Alert.alert('Error', 'Failed to clear cart');
            } finally {
              setClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, danger = false }) => (
    <Pressable
      onPress={onPress}
      className="bg-white dark:bg-neutral-900 rounded-xl p-4 mb-3 flex-row items-center"
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}
    >
      <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={danger ? '#EF4444' : '#10B981'}
        />
      </View>
      <View className="flex-1">
        <Text className={`text-base font-bold ${danger ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-white'}`}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {subtitle}
          </Text>
        )}
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={scheme === 'dark' ? '#737373' : '#a3a3a3'}
      />
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={['top', 'left', 'right']}>
      <HeaderBar onSearch={() => {}} onCart={() => navigation.navigate('Cart')} onProfile={() => navigation.navigate('Profile')} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-6">
          <Text className="text-3xl font-extrabold text-neutral-900 dark:text-white mb-6">Settings</Text>

          {/* General Settings */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-neutral-700 dark:text-neutral-300 mb-3 px-1">General</Text>
            <SettingItem
              icon="theme-light-dark"
              title="Theme"
              subtitle="Use the theme toggle in the header to switch Light/Dark mode"
              onPress={() => {}}
            />
            <SettingItem
              icon="account-edit"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <SettingItem
              icon="book-open-variant"
              title="My Courses"
              subtitle="View all your enrolled courses"
              onPress={() => navigation.navigate('MyCourses')}
            />
            <SettingItem
              icon="wallet"
              title="Wallet"
              subtitle="Manage your wallet balance and transactions"
              onPress={() => navigation.navigate('Wallet')}
            />
          </View>

          {/* Storage & Data */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-neutral-700 dark:text-neutral-300 mb-3 px-1">Storage & Data</Text>
            <SettingItem
              icon="cart-off"
              title="Clear Cart"
              subtitle="Remove all items from your shopping cart"
              onPress={handleClearCart}
              danger={false}
            />
            <SettingItem
              icon="cached"
              title="Clear Cache"
              subtitle="Clear app cache and temporary data"
              onPress={async () => {
                Alert.alert(
                  'Clear Cache',
                  'This will clear all cached data. Continue?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear',
                      onPress: async () => {
                        try {
                          // Clear various cache items
                          await AsyncStorage.multiRemove([
                            'cart_items',
                            // Add other cache keys if needed
                          ]);
                          Alert.alert('Success', 'Cache cleared successfully');
                        } catch (e) {
                          Alert.alert('Error', 'Failed to clear cache');
                        }
                      },
                    },
                  ]
                );
              }}
            />
          </View>

          {/* About */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-neutral-700 dark:text-neutral-300 mb-3 px-1">About</Text>
            <SettingItem
              icon="information"
              title="App Version"
              subtitle="EduHive v1.0.0"
              onPress={() => {}}
            />
            <SettingItem
              icon="help-circle"
              title="Help & Support"
              subtitle="Get help with using the app"
              onPress={() => {
                Alert.alert('Help & Support', 'For support, please contact us at support@eduhive.com');
              }}
            />
          </View>

          {/* Account Actions */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-neutral-700 dark:text-neutral-300 mb-3 px-1">Account</Text>
            <SettingItem
              icon="logout"
              title="Logout"
              subtitle="Sign out from your account"
              onPress={handleLogout}
              danger={true}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
