import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import { api } from '../api/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ErrorBanner from '../components/ErrorBanner';

export default function WalletScreen({ navigation }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setError(null);
      const [balanceRes, transactionsRes] = await Promise.all([
        api.get('/api/wallet/balance'),
        api.get('/api/wallet/transactions'),
      ]);
      setBalance(balanceRes.data.balance || 0);
      setTransactions(transactionsRes.data || []);
    } catch (e) {
      console.error('Failed to load wallet data:', e);
      setError('Failed to load wallet information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return '#10B981'; // green
      case 'pending':
        return '#F59E0B'; // yellow
      case 'rejected':
        return '#EF4444'; // red
      default:
        return '#6B7280'; // gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'check-circle';
      case 'pending':
        return 'clock-outline';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={['top', 'left', 'right']}>
      <HeaderBar onSearch={() => {}} onCart={() => navigation.navigate('Cart')} onProfile={() => navigation.navigate('Profile')} />
      <ErrorBanner message={error} />
      
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-6 pb-8">
          {/* Wallet Balance Card - Enhanced */}
          <View 
            className="rounded-3xl p-6 mb-6 overflow-hidden" 
            style={{ 
              backgroundColor: '#10B981',
              shadowColor: '#000', 
              shadowOffset: { width: 0, height: 8 }, 
              shadowOpacity: 0.15, 
              shadowRadius: 16, 
              elevation: 8 
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white/90 text-sm font-medium mb-1">Available Balance</Text>
                <Text className="text-white text-5xl font-extrabold">₹{balance.toFixed(2)}</Text>
              </View>
              <View 
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <MaterialCommunityIcons name="wallet" size={32} color="#FFFFFF" />
              </View>
            </View>
            <Pressable
              onPress={() => navigation.navigate('WalletTopUp')}
              className="bg-white rounded-xl py-3 px-4 items-center justify-center mt-2"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
            >
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="plus-circle" size={20} color="#10B981" />
                <Text className="text-emerald-600 font-bold text-base ml-2">Add Money</Text>
              </View>
            </Pressable>
          </View>

          {/* Quick Actions - Enhanced */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-neutral-900 dark:text-white mb-3 px-1">Quick Actions</Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => navigation.navigate('WalletTopUp')}
                className="flex-1 bg-white dark:bg-neutral-900 rounded-2xl p-5 items-center"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 }}
              >
                <View className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-full items-center justify-center mb-3">
                  <MaterialCommunityIcons name="plus-circle" size={28} color="#10B981" />
                </View>
                <Text className="text-neutral-900 dark:text-white font-bold text-base">Add Money</Text>
                <Text className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">Top up wallet</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('Courses')}
                className="flex-1 bg-white dark:bg-neutral-900 rounded-2xl p-5 items-center"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 }}
              >
                <View className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mb-3">
                  <MaterialCommunityIcons name="book-open-variant" size={28} color="#3B82F6" />
                </View>
                <Text className="text-neutral-900 dark:text-white font-bold text-base">Browse</Text>
                <Text className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">Explore courses</Text>
              </Pressable>
            </View>
          </View>

          {/* Transaction History - Enhanced */}
          <View className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 }}>
            <View className="px-5 py-5 border-b border-neutral-200 dark:border-neutral-800">
              <Text className="text-xl font-bold text-neutral-900 dark:text-white">Transaction History</Text>
              <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
              </Text>
            </View>
            
            {loading ? (
              <View className="p-12 items-center">
                <MaterialCommunityIcons name="loading" size={32} color="#9CA3AF" />
                <Text className="text-neutral-500 dark:text-neutral-400 mt-4">Loading transactions...</Text>
              </View>
            ) : transactions.length === 0 ? (
              <View className="p-12 items-center">
                <View className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full items-center justify-center mb-4">
                  <MaterialCommunityIcons name="wallet-outline" size={40} color="#9CA3AF" />
                </View>
                <Text className="text-neutral-700 dark:text-neutral-300 font-semibold text-base mt-2">No transactions yet</Text>
                <Text className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm text-center px-8">
                  Add money to your wallet to start purchasing courses
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('WalletTopUp')}
                  className="mt-6 bg-emerald-600 rounded-xl px-6 py-3"
                >
                  <Text className="text-white font-bold">Add Money Now</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                {transactions.map((tx, index) => (
                  <Pressable
                    key={tx._id}
                    className={`px-5 py-4 ${index < transactions.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-800' : ''} flex-row items-center justify-between`}
                    style={{ backgroundColor: tx.status === 'pending' ? 'rgba(245, 158, 11, 0.05)' : 'transparent' }}
                  >
                    <View className="flex-1 flex-row items-center">
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center mr-4"
                        style={{ backgroundColor: getStatusColor(tx.status) + '15' }}
                      >
                        <MaterialCommunityIcons
                          name={tx.type === 'credit' ? 'arrow-down-bold' : 'arrow-up-bold'}
                          size={22}
                          color={getStatusColor(tx.status)}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-neutral-900 dark:text-white">
                          {tx.type === 'credit' ? 'Money Added' : 'Course Purchase'}
                        </Text>
                        <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                        {tx.status === 'pending' && tx.utrNumber && (
                          <View className="flex-row items-center mt-1">
                            <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                              UTR: <Text className="font-mono">{tx.utrNumber}</Text>
                            </Text>
                          </View>
                        )}
                        <View className="flex-row items-center mt-2">
                          <MaterialCommunityIcons
                            name={getStatusIcon(tx.status)}
                            size={14}
                            color={getStatusColor(tx.status)}
                          />
                          <Text
                            className="text-xs ml-1.5 font-semibold capitalize"
                            style={{ color: getStatusColor(tx.status) }}
                          >
                            {tx.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className="items-end ml-3">
                      <Text
                        className={`text-xl font-extrabold ${
                          tx.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

