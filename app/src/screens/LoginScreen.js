import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, useColorScheme, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/ErrorBanner';
import Button from '../components/Button';

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErr, setFieldErr] = useState({ email: '', password: '' });

  const validate = () => {
    const errs = { email: '', password: '' };
    if (!emailRx.test(email.trim())) errs.email = 'Enter a valid email';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    setFieldErr(errs);
    return !errs.email && !errs.password;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), password);
    } catch (e) {
      setError('Login failed. Check your credentials and try again.');
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
        <Text className="text-3xl font-extrabold text-center mb-2 text-neutral-900 dark:text-white">Welcome back</Text>
        <Text className="text-center text-neutral-500 dark:text-neutral-400 mb-6">Log in to continue learning</Text>
        
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
        {fieldErr.password ? <Text className="text-red-500 text-xs mb-4 mt-1">{fieldErr.password}</Text> : <View className="mb-4" />}
        
        <Button title={loading ? 'Logging in...' : 'Login'} onPress={onSubmit} disabled={loading} />
        <View className="h-3" />
        <Button title="Create an account" variant="ghost" onPress={() => navigation.navigate('Register')} />
      </View>
    </View>
  );
}
