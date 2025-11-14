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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErr, setFieldErr] = useState({ email: '', password: '', confirm: '' });

  const validate = () => {
    const errs = { email: '', password: '', confirm: '' };
    if (!emailRx.test(email.trim())) errs.email = 'Enter a valid email';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (confirm !== password) errs.confirm = 'Passwords do not match';
    setFieldErr(errs);
    return !errs.email && !errs.password && !errs.confirm;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      setError(null);
      await register(email.trim(), password);
    } catch (e) {
      setError('Registration failed. Try a different email or check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-bg-light dark:bg-bg-dark">
      <View className="items-center mb-6">
        <Image source={require('../../assets/images/logo.jpg')} style={{ width: 72, height: 72, borderRadius: 16 }} />
        <Text className="mt-3 text-2xl font-extrabold text-neutral-900 dark:text-white">EDUHIVE</Text>
      </View>
      <View
        className="bg-white dark:bg-neutral-900 rounded-2xl p-6"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.08,
          shadowRadius: 25,
          elevation: 5,
        }}
      >
        <Text className="text-3xl font-extrabold text-center mb-2 text-neutral-900 dark:text-white">Join EduHive</Text>
        <Text className="text-center text-neutral-500 dark:text-neutral-400 mb-6">Create your free account</Text>
        
        <ErrorBanner message={error} />
        
        <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Email</Text>
        <TextInput
          className="bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 mb-1 text-neutral-900 dark:text-white"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={scheme === 'dark' ? '#737373' : '#a3a3a3'}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {fieldErr.email ? <Text className="text-red-500 text-xs mb-3 mt-1">{fieldErr.email}</Text> : <View className="mb-3" />}
        
        <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Password</Text>
        <View className="relative">
          <TextInput
            className="bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 pr-12 mb-1 text-neutral-900 dark:text-white"
            value={password}
            onChangeText={setPassword}
            placeholder="Min 6 characters"
            placeholderTextColor={scheme === 'dark' ? '#737373' : '#a3a3a3'}
            secureTextEntry={!showPassword}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3"
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color={scheme === 'dark' ? '#a3a3a3' : '#737373'}
            />
          </Pressable>
        </View>
        {fieldErr.password ? <Text className="text-red-500 text-xs mb-3 mt-1">{fieldErr.password}</Text> : <View className="mb-3" />}
        
        <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Confirm Password</Text>
        <View className="relative">
          <TextInput
            className="bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 pr-12 mb-1 text-neutral-900 dark:text-white"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Re-enter password"
            placeholderTextColor={scheme === 'dark' ? '#737373' : '#a3a3a3'}
            secureTextEntry={!showConfirm}
          />
          <Pressable
            onPress={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-3"
          >
            <MaterialCommunityIcons
              name={showConfirm ? 'eye-off' : 'eye'}
              size={24}
              color={scheme === 'dark' ? '#a3a3a3' : '#737373'}
            />
          </Pressable>
        </View>
        {fieldErr.confirm ? <Text className="text-red-500 text-xs mb-4 mt-1">{fieldErr.confirm}</Text> : <View className="mb-4" />}
        
        <Button title={loading ? 'Creating...' : 'Register'} onPress={onSubmit} disabled={loading} />
      </View>
    </View>
  );
}
