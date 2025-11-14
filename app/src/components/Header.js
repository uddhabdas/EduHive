import React from 'react';
import { Image, View } from 'react-native';

export default function Header() {
  return (
    <View className="pt-14 pb-4 px-4 bg-white border-b border-neutral-200">
      <Image source={require('../../assets/images/logo.jpg')} style={{ width: 36, height: 36, borderRadius: 8 }} />
    </View>
  );
}
