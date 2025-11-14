import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      {user ? (
        <Text style={styles.subtitle}>Logged in as: {user.email}</Text>
      ) : (
        <Text style={styles.subtitle}>Fetching user...</Text>
      )}

      <View style={{ height: 16 }} />

      {/* Placeholder banner or remove this section */}

      <View style={{ height: 16 }} />
      <Button title="Logout" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 8 },
});
