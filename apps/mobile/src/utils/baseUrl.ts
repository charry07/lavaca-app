import { Platform } from 'react-native';
import Constants from 'expo-constants';

export function getBaseUrl(): string {
  // Extract the dev machine's IP from Expo Go (works on both iOS & Android physical devices)
  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3001`;
    }
  }

  // Fallback: Android emulator uses 10.0.2.2 to reach host machine
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';

  return 'http://localhost:3001';
}
