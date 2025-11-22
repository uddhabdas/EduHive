import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import { useCart } from '../context/CartContext';
import { api } from '../api/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Button from '../components/Button';

export default function CartScreen({ navigation }) {
  const { items, remove, clear } = useCart();
  const [walletBalance, setWalletBalance] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadWalletBalance();
  }, []);

  const loadWalletBalance = async () => {
    try {
      const res = await api.get('/api/wallet/balance');
      setWalletBalance(res.data.balance || 0);
    } catch (e) {
      console.error('Failed to load wallet balance:', e);
    }
  };

  const total = items.reduce((sum, c) => sum + (c.price ?? 0), 0);
  const canPurchase = walletBalance >= total;

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return;
    }

    if (!canPurchase) {
      Alert.alert(
        'Insufficient Balance',
        `You need ₹${total.toFixed(2)} but only have ₹${walletBalance.toFixed(2)} in your wallet.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Money', onPress: () => navigation.navigate('WalletTopUp') },
        ]
      );
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Purchase ${items.length} course(s) for ₹${total.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            setProcessing(true);
            const failedCourses = [];
            const successfulCourses = [];
            
            try {
              // Purchase each course
              for (const item of items) {
                try {
                  const response = await api.post(`/api/courses/${item._id}/purchase`);
                  if (response.status >= 200 && response.status < 300) {
                    successfulCourses.push(item.title);
                  } else {
                    failedCourses.push({ title: item.title, error: response.data?.error || 'Unknown error' });
                  }
                } catch (e) {
                  console.error(`Failed to purchase course ${item._id}:`, e);
                  const errorMsg = e.response?.data?.error || e.message || 'Purchase failed';
                  failedCourses.push({ title: item.title, error: errorMsg });
                }
              }

              // Refresh wallet balance
              await loadWalletBalance();
              
              // Show appropriate message based on results
              if (failedCourses.length === 0) {
                // All successful
                Alert.alert('Success', 'All courses purchased successfully!', [
                  {
                    text: 'OK',
                    onPress: () => {
                      clear();
                      navigation.navigate('Courses');
                    },
                  },
                ]);
              } else if (successfulCourses.length > 0) {
                // Partial success
                Alert.alert(
                  'Partial Success',
                  `${successfulCourses.length} course(s) purchased successfully.\n\nFailed:\n${failedCourses.map(f => `• ${f.title}: ${f.error}`).join('\n')}`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Remove successful courses from cart
                        items.forEach(item => {
                          if (successfulCourses.includes(item.title)) {
                            remove(item._id);
                          }
                        });
                      },
                    },
                  ]
                );
              } else {
                // All failed
                Alert.alert(
                  'Purchase Failed',
                  `Failed to purchase courses:\n${failedCourses.map(f => `• ${f.title}: ${f.error}`).join('\n')}`
                );
              }
            } catch (e) {
              console.error('Checkout error:', e);
              Alert.alert('Error', e.response?.data?.error || e.message || 'Failed to complete purchase');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <HeaderBar onSearch={() => {}} onCart={() => {}} onProfile={() => navigation.navigate('Profile')} />
      <View className="flex-1 px-4 pt-4">
        <Text className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-3">Cart</Text>
        
        {/* Wallet Balance */}
        <View className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-emerald-700 dark:text-emerald-300 mb-1">Wallet Balance</Text>
            <Text className="text-xl font-bold text-emerald-600 dark:text-emerald-400">₹{walletBalance.toFixed(2)}</Text>
          </View>
          {!canPurchase && (
            <Pressable
              onPress={() => navigation.navigate('WalletTopUp')}
              className="bg-emerald-600 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-semibold">Add Money</Text>
            </Pressable>
          )}
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            <View className="py-12 items-center">
              <MaterialCommunityIcons name="cart-outline" size={64} color="#9CA3AF" />
              <Text className="text-neutral-500 dark:text-neutral-400 mt-4 text-lg">Your cart is empty</Text>
              <Button
                title="Browse Courses"
                onPress={() => navigation.navigate('Courses')}
                className="mt-4"
              />
            </View>
          }
          renderItem={({ item }) => (
            <View className="flex-row items-center justify-between bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3 mb-2" style={{ shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:0.06, shadowRadius:16, elevation:3 }}>
              <View className="flex-1 pr-3">
                <Text className="text-base font-semibold text-neutral-900 dark:text-white" numberOfLines={2}>{item.title}</Text>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">₹{item.price?.toFixed(2) || '0.00'}</Text>
              </View>
              <Pressable onPress={() => remove(item._id)} accessibilityLabel="Remove">
                <MaterialCommunityIcons name="delete-outline" size={22} color="#EF4444" />
              </Pressable>
            </View>
          )}
          ListFooterComponent={
            items.length > 0 ? (
              <View className="mt-4 mb-6">
                <View className="bg-white dark:bg-neutral-900 rounded-2xl p-4 mb-4" style={{ shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:4, elevation:3 }}>
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-base text-neutral-600 dark:text-neutral-400">Subtotal</Text>
                    <Text className="text-base font-semibold text-neutral-900 dark:text-white">₹{total.toFixed(2)}</Text>
                  </View>
                  <View className="h-px bg-neutral-200 dark:bg-neutral-800 my-2" />
                  <View className="flex-row justify-between items-center">
                    <Text className="text-lg font-bold text-neutral-900 dark:text-white">Total</Text>
                    <Text className="text-lg font-bold text-emerald-600 dark:text-emerald-400">₹{total.toFixed(2)}</Text>
                  </View>
                </View>
                
                {!canPurchase && (
                  <View className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 mb-4">
                    <Text className="text-yellow-800 dark:text-yellow-300 text-sm text-center">
                      Insufficient balance. Add ₹{(total - walletBalance).toFixed(2)} more to your wallet.
                    </Text>
                  </View>
                )}

                <Button
                  title={processing ? 'Processing...' : `Purchase (₹${total.toFixed(2)})`}
                  onPress={handleCheckout}
                  disabled={processing || !canPurchase || items.length === 0}
                  className="mb-2"
                />
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}
