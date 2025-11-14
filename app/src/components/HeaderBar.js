import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../context/CartContext';
import { useThemeMode } from '../context/ThemeContext';

export default function HeaderBar({ onSearch, onProfile, onCart }) {
  const { items } = useCart?.() || { items: [] };
  const { effective, setTheme } = useThemeMode();
  const count = Array.isArray(items) ? items.length : 0;
  const toggleTheme = () => setTheme(effective === 'dark' ? 'light' : 'dark');
  return (
    <View className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      <View className="flex-row items-center justify-between px-3 py-1" style={{ minHeight: 52 }}>
        <View className="flex-row items-center">
          <Image source={require('../../assets/images/logo.jpg')} style={{ width: 64, height: 64, borderRadius: 14 }} />
        </View>
        <View className="flex-row items-center">
          <Pressable className="px-1.5" accessibilityLabel="Search" onPress={onSearch}>
            <MaterialCommunityIcons name="magnify" size={26} color={effective==='dark' ? '#ffffff' : '#111827'} />
          </Pressable>
          <Pressable className="px-1.5" accessibilityLabel="Toggle theme" onPress={toggleTheme}>
            <MaterialCommunityIcons name={effective==='dark' ? 'white-balance-sunny' : 'moon-waxing-crescent'} size={22} color={effective==='dark' ? '#ffffff' : '#111827'} />
          </Pressable>
          <Pressable className="px-1.5" accessibilityLabel="Cart" onPress={onCart}>
            <View>
              <MaterialCommunityIcons name="cart-outline" size={24} color={effective==='dark' ? '#ffffff' : '#111827'} />
              {count > 0 && (
                <View style={{ position:'absolute', right:-6, top:-4, minWidth:18, height:18, borderRadius:9, backgroundColor:'#16A34A', alignItems:'center', justifyContent:'center', paddingHorizontal:4 }}>
                  <Text className="text-white text-xs font-bold">{count}</Text>
                </View>
              )}
            </View>
          </Pressable>
          <Pressable className="px-1.5" accessibilityLabel="Profile" onPress={onProfile}>
            <MaterialCommunityIcons name="account-circle-outline" size={28} color={effective==='dark' ? '#ffffff' : '#111827'} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
