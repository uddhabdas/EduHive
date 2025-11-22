import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert, Linking, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderBar from '../components/HeaderBar';
import { api } from '../api/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Button from '../components/Button';
import ErrorBanner from '../components/ErrorBanner';

export default function WalletTopUpScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const UPI_ID = 'eduhive@ybl';
  const quickAmounts = [100, 250, 500, 1000, 2000, 5000];

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!utrNumber || utrNumber.trim().length === 0) {
      setError('Please enter UTR number');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.post('/api/wallet/topup', {
        amount: parseFloat(amount),
        utrNumber: utrNumber.trim(),
        description: description || `Wallet top-up - UTR: ${utrNumber.trim()}`,
      });

      Alert.alert(
        'Request Submitted',
        'Your wallet top-up request has been submitted. It will be processed after admin approval.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
              // Refresh wallet screen if it exists
              if (navigation.getState()?.routes) {
                const walletRoute = navigation.getState().routes.find(r => r.name === 'Wallet');
                if (walletRoute) {
                  // Trigger refresh
                }
              }
            },
          },
        ]
      );
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyUPI = async () => {
    try {
      await Clipboard.setString(UPI_ID);
      Alert.alert('Copied!', 'UPI ID copied to clipboard');
    } catch (e) {
      Alert.alert('Error', 'Failed to copy UPI ID');
    }
  };

  const openUPI = () => {
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=EduHive&am=${amount || '0'}&cu=INR`;
    Linking.canOpenURL(upiUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(upiUrl);
        } else {
          Alert.alert('UPI App Not Found', 'Please install a UPI app like Google Pay, PhonePe, or Paytm');
        }
      })
      .catch((err) => {
        Alert.alert('Error', 'Could not open UPI app');
      });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={['top', 'left', 'right']}>
      <HeaderBar onSearch={() => {}} onCart={() => navigation.navigate('Cart')} onProfile={() => navigation.navigate('Profile')} />
      <ErrorBanner message={error} />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-6">
          <View className="mb-6">
            <Text className="text-3xl font-extrabold text-neutral-900 dark:text-white mb-2">Add Money</Text>
            <Text className="text-base text-neutral-600 dark:text-neutral-400">
              Top up your wallet using UPI payment
            </Text>
          </View>

          {/* Enter Amount Section - FIRST */}
          <View className="bg-white dark:bg-neutral-900 rounded-2xl p-6 mb-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}>
            <Text className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Enter Amount</Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">Select or enter the amount you want to add</Text>
            
            <View className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl px-5 py-4 mb-5 border-2 border-neutral-200 dark:border-neutral-700">
              <View className="flex-row items-center">
                <Text className="text-3xl font-bold text-neutral-900 dark:text-white mr-2">₹</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  className="flex-1 text-3xl font-bold text-neutral-900 dark:text-white"
                  placeholderTextColor="#9CA3AF"
                  style={{ fontSize: 28 }}
                />
              </View>
            </View>

            {/* Quick Amount Buttons */}
            <View>
              <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">Quick Select</Text>
              <View className="flex-row flex-wrap gap-3">
                {quickAmounts.map((amt) => (
                  <Pressable
                    key={amt}
                    onPress={() => setAmount(amt.toString())}
                    style={{
                      flex: 1,
                      minWidth: '30%',
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      backgroundColor: amount === amt.toString() ? '#10B981' : 'transparent',
                      borderWidth: 2,
                      borderColor: amount === amt.toString() ? '#10B981' : '#E5E7EB',
                      shadowColor: amount === amt.toString() ? '#10B981' : 'transparent',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: amount === amt.toString() ? 0.3 : 0,
                      shadowRadius: 4,
                      elevation: amount === amt.toString() ? 3 : 0,
                    }}
                  >
                    <Text
                      className={`font-bold text-center ${
                        amount === amt.toString()
                          ? 'text-white'
                          : 'text-neutral-900 dark:text-white'
                      }`}
                      style={{ fontSize: 15 }}
                    >
                      ₹{amt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* UPI Info Card - SECOND */}
          <View className="mb-6" style={{ borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 }}>
            <LinearGradient
              colors={["#10B981", "#059669", "#047857"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 24 }}
            >
              <View className="flex-row items-center justify-between mb-6">
                <View className="flex-1">
                  <Text className="text-white/90 text-sm font-medium mb-2">Pay to UPI ID</Text>
                  <View className="flex-row items-center">
                    <Text className="text-white text-3xl font-bold mr-3">{UPI_ID}</Text>
                    <Pressable
                      onPress={copyUPI}
                      className="bg-white/20 rounded-full p-2"
                    >
                      <MaterialCommunityIcons name="content-copy" size={18} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
                <View className="bg-white/20 rounded-full p-4">
                  <MaterialCommunityIcons name="wallet" size={32} color="#FFFFFF" />
                </View>
              </View>
              
              <Pressable
                onPress={openUPI}
                style={{ 
                  borderRadius: 12, 
                  overflow: 'hidden',
                  minHeight: 52
                }}
              >
                <LinearGradient
                  colors={["#14B8A6", "#10B981"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5
                  }}
                >
                  <MaterialCommunityIcons name="open-in-app" size={22} color="#FFFFFF" />
                  <Text className="text-white font-bold ml-2" style={{ fontSize: 16, fontWeight: '700' }}>Via UPI Apps</Text>
                </LinearGradient>
              </Pressable>
            </LinearGradient>
          </View>


          {/* UTR Number Input */}
          <View className="bg-white dark:bg-neutral-900 rounded-2xl p-6 mb-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}>
            <View className="flex-row items-center mb-2">
              <Text className="text-lg font-bold text-neutral-900 dark:text-white">
                UTR Number
              </Text>
              <Text className="text-red-500 ml-1">*</Text>
            </View>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Enter the UTR/Transaction ID from your payment receipt
            </Text>
            <TextInput
              value={utrNumber}
              onChangeText={setUtrNumber}
              placeholder="Enter UTR number"
              className="bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-4 text-base text-neutral-900 dark:text-white"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Description (Optional) */}
          <View className="bg-white dark:bg-neutral-900 rounded-2xl p-6 mb-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}>
            <Text className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
              Description <Text className="text-neutral-400 text-sm font-normal">(Optional)</Text>
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add any additional notes..."
              multiline
              numberOfLines={3}
              className="bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-4 text-base text-neutral-900 dark:text-white"
              placeholderTextColor="#9CA3AF"
              textAlignVertical="top"
            />
          </View>


          {/* Submit Button */}
          <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
            <LinearGradient
              colors={["#14B8A6", "#10B981"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16 }}
            >
              <Pressable
                onPress={handleSubmit}
                disabled={loading || !amount || !utrNumber}
                style={{ opacity: (loading || !amount || !utrNumber) ? 0.6 : 1 }}
              >
                <Text className="text-white font-bold text-center" style={{ fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
                  {loading ? 'Submitting Request...' : 'Submit Request'}
                </Text>
              </Pressable>
            </LinearGradient>
          </View>

          <Pressable 
            onPress={() => navigation.goBack()}
            className="py-3"
          >
            <Text className="text-center text-neutral-500 dark:text-neutral-400 font-medium">Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

