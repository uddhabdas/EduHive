import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import { api } from '../api/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { setAuthToken } from '../api/client';

export default function EditProfileScreen({ navigation, route }) {
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get('/api/me');
      setFormData({
        name: res.data.name || '',
        email: res.data.email || '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation', 'Name is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      Alert.alert('Validation', 'Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      console.log('Updating profile:', { name: formData.name.trim(), email: formData.email.trim() });
      const res = await api.put('/api/me', {
        name: formData.name.trim(),
        email: formData.email.trim(),
      });
      
      console.log('Profile update response:', res.data);
      
      // Update auth context
      if (updateUser) {
        await updateUser();
      }
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Profile update error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
      
      let errorMsg = 'Failed to update profile';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 404) {
          errorMsg = 'Profile endpoint not found. Please contact support.';
        } else if (status === 409) {
          errorMsg = data?.error || 'This email is already in use.';
        } else if (status === 400) {
          errorMsg = data?.error || 'Invalid data. Please check your input.';
        } else {
          errorMsg = data?.error || `Server error (${status})`;
        }
      } else if (error.request) {
        errorMsg = 'No response from server. Please check your connection.';
      } else {
        errorMsg = error.message || 'Network error. Please try again.';
      }
      
      Alert.alert('Update Failed', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
        <HeaderBar onSearch={() => {}} onProfile={() => {}} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={['top','left','right']}>
      <HeaderBar 
        onSearch={() => {}} 
        onProfile={() => {}} 
        title="Edit Profile"
      />
      <ScrollView className="flex-1">
        <View className="px-4 pt-4 pb-6">
          {/* Profile Info Card */}
          <View className="bg-white dark:bg-neutral-900 rounded-2xl p-5 mb-4" 
                style={{ shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.1, shadowRadius:8, elevation:3 }}>
            <Text className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Personal Information</Text>
            
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Name</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                className="bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3 text-neutral-900 dark:text-white text-base border border-neutral-200 dark:border-neutral-700"
                autoCapitalize="words"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Email</Text>
              <TextInput
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                className="bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3 text-neutral-900 dark:text-white text-base border border-neutral-200 dark:border-neutral-700"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{ borderRadius: 12, overflow: 'hidden', opacity: saving ? 0.6 : 1 }}
          >
            <LinearGradient 
              colors={["#14B8A6", "#10B981"]} 
              start={{x:0,y:0}} 
              end={{x:1,y:1}} 
              style={{ 
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor:'#000', 
                shadowOffset:{width:0,height:4}, 
                shadowOpacity:0.2, 
                shadowRadius:8, 
                elevation:5 
              }}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-center" style={{ fontSize: 16, fontWeight: '700' }}>Save Changes</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Cancel Button */}
          <Pressable
            onPress={() => navigation.goBack()}
            className="mt-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl py-4 items-center"
          >
            <Text className="text-neutral-700 dark:text-neutral-300 font-semibold">Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

