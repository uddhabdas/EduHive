import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';


export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <HeaderBar onSearch={() => {}} onCart={() => {}} onProfile={() => {}} />
      <ScrollView>
        <View className="px-4 pt-4">
          <Text className="text-2xl font-extrabold text-neutral-900 mb-3">Settings</Text>
          <View className="bg-white rounded-2xl p-4" style={{ shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:0.06, shadowRadius:16, elevation:3 }}>
            <Text className="text-neutral-900 font-semibold mb-2">General</Text>
            <Text className="text-neutral-700">Use the theme toggle in the header to switch Light/Dark.</Text>
            <View className="h-px bg-neutral-200 my-3" />
            <Text className="text-neutral-900 font-semibold mb-2">Storage</Text>
            <Text className="text-neutral-700 mb-2">Clear cart items</Text>
            <View className="flex-row">
              <View className="flex-1" />
              <View className="items-end">
                <Text onPress={async () => {
                  try { const AsyncStorage = require('@react-native-async-storage/async-storage').default; await AsyncStorage.removeItem('cart_items'); }
                  catch {}
                }} className="text-brand font-bold">Clear</Text>
              </View>
            </View>
          </View>
          
          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
