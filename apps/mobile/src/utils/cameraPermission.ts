import { Camera } from 'expo-camera';

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await Camera.requestCameraPermissionsAsync();
  return status === 'granted';
}
