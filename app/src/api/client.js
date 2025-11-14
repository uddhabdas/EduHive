import axios from 'axios';
import { Platform } from 'react-native';

// Resolve API base URL for device/emulator usage
function getBaseURL() {
  // Prefer explicit env var for physical devices
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  // Android emulator uses a special loopback to host
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000';
  // iOS simulator / web defaults to localhost
  return 'http://localhost:4000';
}

export const api = axios.create({
  baseURL: getBaseURL(),
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}
