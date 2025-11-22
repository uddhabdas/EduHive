import axios from 'axios';
import { Platform } from 'react-native';

// Resolve API base URL for device/emulator usage
function getBaseURL() {
  // Production server URL
  const PRODUCTION_URL = 'https://eduhive-server.onrender.com';
  
  // Prefer explicit env var for physical devices
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  
  // Use production URL by default
  return PRODUCTION_URL;
  
  // Development fallbacks (commented out for production)
  // if (Platform.OS === 'android') return 'http://10.0.2.2:4000';
  // return 'http://localhost:4000';
}

export const api = axios.create({
  baseURL: getBaseURL(),
  // Ensure axios throws errors for status codes >= 400
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  },
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}
