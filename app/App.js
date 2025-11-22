import 'react-native-gesture-handler';
import './tailwind.css';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useThemeMode } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import { CartProvider } from './src/context/CartContext';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { token } = useAuth();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <>
          <Stack.Screen name="Explore" component={require('./src/screens/ExploreScreen').default} options={{ headerShown: false }} />
          <Stack.Screen name="Courses" component={require('./src/screens/CoursesScreen').default} />
          <Stack.Screen name="CourseDetail" component={require('./src/screens/CourseDetailScreen').default} />
          <Stack.Screen name="Profile" component={require('./src/screens/ProfileScreen').default} />
          <Stack.Screen name="EditProfile" component={require('./src/screens/EditProfileScreen').default} />
          <Stack.Screen name="Settings" component={require('./src/screens/SettingsScreen').default} />
          <Stack.Screen name="Cart" component={require('./src/screens/CartScreen').default} />
          <Stack.Screen name="AboutCourse" component={require('./src/screens/AboutCourseScreen').default} />
          <Stack.Screen name="Wallet" component={require('./src/screens/WalletScreen').default} />
          <Stack.Screen name="WalletTopUp" component={require('./src/screens/WalletTopUpScreen').default} />
          <Stack.Screen name="MyCourses" component={require('./src/screens/MyCoursesScreen').default} />
          <Stack.Screen name="Home" component={HomeScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

function ThemedNav() {
  const { effective } = useThemeMode();
  return (
    <View style={{ flex: 1, backgroundColor: effective === 'dark' ? '#000' : '#fff' }}>
      <NavigationContainer theme={effective === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigator />
        <StatusBar style={effective === 'dark' ? 'light' : 'dark'} />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CartProvider>
          <SafeAreaProvider>
            <ThemedNav />
          </SafeAreaProvider>
        </CartProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
