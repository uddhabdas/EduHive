import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, useColorScheme, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/ErrorBanner';
import Button from '../components/Button';

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const { register } = useAuth();
  const scheme = useColorScheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErr, setFieldErr] = useState({ name: '', email: '', password: '', confirm: '' });

  const validate = () => {
    const errs = { name: '', email: '', password: '', confirm: '' };
    if (!name.trim()) errs.name = 'Name is required';
    if (!emailRx.test(email.trim())) errs.email = 'Enter a valid email';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (confirm !== password) errs.confirm = 'Passwords do not match';
    setFieldErr(errs);
    return !errs.name && !errs.email && !errs.password && !errs.confirm;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      setError(null);
      await register(name.trim(), email.trim(), password);
    } catch (e) {
      setError('Registration failed. Try a different email or check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-bg-light dark:bg-bg-dark">
      <View className="items-center mb-8">
        <View className="bg-white dark:bg-neutral-900 rounded-xl p-3 mb-3" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}>
          <Image source={require('../../assets/images/logo.jpg')} style={{ width: 56, height: 56, borderRadius: 10 }} />
        </View>
        <Text className="text-2xl font-bold text-neutral-900 dark:text-white" style={{ fontSize: 24 }}>EDUHIVE</Text>
      </View>
      <View
        className="bg-white dark:bg-neutral-900 rounded-xl p-5"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 5,
        }}
      >
        <Text className="text-2xl font-bold text-center mb-1.5 text-neutral-900 dark:text-white" style={{ fontSize: 22 }}>Join EduHive</Text>
        <Text className="text-center text-neutral-500 dark:text-neutral-400 mb-6 text-sm" style={{ fontSize: 14 }}>Create your free account</Text>
        
        <ErrorBanner message={error} />
        
        <View className="mb-5">
          <Text className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2.5">Name</Text>
          <TextInput
            className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-3 text-neutral-900 dark:text-white"
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={scheme === 'dark' ? '#737373' : '#a3a3a3'}
            autoCapitalize="words"
            style={{ fontSize: 16 }}
          />
          {fieldErr.name ? <Text className="text-red-500 text-xs mb-1 mt-1.5">{fieldErr.name}</Text> : <View className="mb-1" />}
        </View>
        
        <View className="mb-5">
          <Text className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2.5">Email</Text>
          <TextInput
            className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-3 text-neutral-900 dark:text-white"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={scheme === 'dark' ? '#737373' : '#a3a3a3'}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{ fontSize: 16 }}
          />
          {fieldErr.email ? <Text className="text-red-500 text-xs mb-1 mt-1.5">{fieldErr.email}</Text> : <View className="mb-1" />}
        </View>
        
        <View className="mb-5">
          <Text className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2.5">Password</Text>
          <View className="relative">
            <TextInput
              className="bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3.5 pr-12 text-neutral-900 dark:text-white"
              value={password}
              onChangeText={setPassword}
              placeholder="Min 6 characters"
              placeholderTextColor={scheme === 'dark' ? '#737373' : '#a3a3a3'}
              secureTextEntry={!showPassword}
              style={{ fontSize: 16 }}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5"
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off' : 'eye'}
                size={22}
                color={scheme === 'dark' ? '#a3a3a3' : '#737373'}
              />
            </Pressable>
          </View>
          {fieldErr.password ? <Text className="text-red-500 text-xs mb-1 mt-1.5">{fieldErr.password}</Text> : <View className="mb-1" />}
        </View>
        
        <View className="mb-6">
          <Text className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2.5">Confirm Password</Text>
          <View className="relative">
            <TextInput
              className="bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3.5 pr-12 text-neutral-900 dark:text-white"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter password"
              placeholderTextColor={scheme === 'dark' ? '#737373' : '#a3a3a3'}
              secureTextEntry={!showConfirm}
              style={{ fontSize: 16 }}
            />
            <Pressable
              onPress={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-3.5"
            >
              <MaterialCommunityIcons
                name={showConfirm ? 'eye-off' : 'eye'}
                size={22}
                color={scheme === 'dark' ? '#a3a3a3' : '#737373'}
              />
            </Pressable>
          </View>
          {fieldErr.confirm ? <Text className="text-red-500 text-xs mb-1 mt-1.5">{fieldErr.confirm}</Text> : <View className="mb-1" />}
        </View>
        
        <Button title={loading ? 'Creating...' : 'Register'} onPress={onSubmit} disabled={loading} />
      </View>
    </View>
  );
}
