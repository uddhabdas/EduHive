import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      
      <ScrollView className="flex-1">
        <View className="px-4 pt-4 pb-6">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Add Money to Wallet</Text>
          <Text className="text-neutral-600 dark:text-neutral-400 mb-6">
            Pay via UPI and enter your UTR number to add money to your wallet
          </Text>

          {/* UPI Info Card */}
          <View className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 mb-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}>
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-sm font-medium mb-1">Pay to UPI ID</Text>
                <Text className="text-white text-2xl font-bold">{UPI_ID}</Text>
              </View>
              <MaterialCommunityIcons name="wallet" size={40} color="#FFFFFF" />
            </View>
            <Button
              title="Open UPI App"
              onPress={openUPI}
              variant="outline"
              className="bg-white/20 border-white/30 mt-2"
              textClassName="text-white"
            />
          </View>

          {/* Amount Input */}
          <View className="bg-white dark:bg-neutral-900 rounded-2xl p-6 mb-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 }}>
            <Text className="text-base font-semibold text-neutral-900 dark:text-white mb-4">Enter Amount</Text>
            <View className="flex-row items-center border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 mb-4">
              <Text className="text-2xl font-bold text-neutral-900 dark:text-white mr-2">₹</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                className="flex-1 text-2xl font-bold text-neutral-900 dark:text-white"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Quick Amount Buttons */}
            <View className="flex-row flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <Pressable
                  key={amt}
                  onPress={() => setAmount(amt.toString())}
                  className={`px-4 py-2 rounded-lg border ${
                    amount === amt.toString()
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700'
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      amount === amt.toString()
                        ? 'text-white'
                        : 'text-neutral-900 dark:text-white'
                    }`}
                  >
                    ₹{amt}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* UTR Number Input */}
          <View className="bg-white dark:bg-neutral-900 rounded-2xl p-6 mb-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 }}>
            <Text className="text-base font-semibold text-neutral-900 dark:text-white mb-2">
              UTR Number *
            </Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Enter the UTR/Transaction ID from your payment receipt
            </Text>
            <TextInput
              value={utrNumber}
              onChangeText={setUtrNumber}
              placeholder="Enter UTR number"
              className="border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-base text-neutral-900 dark:text-white"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Description (Optional) */}
          <View className="bg-white dark:bg-neutral-900 rounded-2xl p-6 mb-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 }}>
            <Text className="text-base font-semibold text-neutral-900 dark:text-white mb-2">
              Description (Optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add any additional notes..."
              multiline
              numberOfLines={3}
              className="border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-base text-neutral-900 dark:text-white"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Instructions */}
          <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
            <Text className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Instructions:</Text>
            <View className="space-y-2">
              <View className="flex-row">
                <Text className="text-blue-800 dark:text-blue-400 mr-2">1.</Text>
                <Text className="text-blue-800 dark:text-blue-400 flex-1 text-sm">
                  Pay the amount to UPI ID: {UPI_ID}
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-blue-800 dark:text-blue-400 mr-2">2.</Text>
                <Text className="text-blue-800 dark:text-blue-400 flex-1 text-sm">
                  Copy the UTR/Transaction ID from your payment receipt
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-blue-800 dark:text-blue-400 mr-2">3.</Text>
                <Text className="text-blue-800 dark:text-blue-400 flex-1 text-sm">
                  Enter the amount and UTR number above
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-blue-800 dark:text-blue-400 mr-2">4.</Text>
                <Text className="text-blue-800 dark:text-blue-400 flex-1 text-sm">
                  Submit the request. Admin will verify and add money to your wallet
                </Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <Button
            title={loading ? 'Submitting...' : 'Submit Request'}
            onPress={handleSubmit}
            disabled={loading || !amount || !utrNumber}
            className="mb-4"
          />

          <Pressable onPress={() => navigation.goBack()}>
            <Text className="text-center text-neutral-500 dark:text-neutral-400">Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

