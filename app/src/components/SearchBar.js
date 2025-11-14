import React, { forwardRef } from 'react';
import { TextInput, View } from 'react-native';

const SearchBar = forwardRef(({ value, onChangeText, placeholder, placeholderTextColor }, ref) => {
  return (
    <View
      className="rounded-2xl bg-white dark:bg-neutral-900"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
      }}
    >
      <TextInput
        ref={ref}
        className="px-4 py-3 text-neutral-900 dark:text-white"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        returnKeyType="search"
      />
    </View>
  );
});

export default SearchBar;
