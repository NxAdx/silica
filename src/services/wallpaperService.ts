// Silica — Offline Wallpaper Management Service
import { Platform, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Haptics from 'expo-haptics';

export interface WallpaperOptions {
  uri: string;
  filename?: string;
}

export async function setAsWallpaper({ uri, filename }: WallpaperOptions): Promise<boolean> {
  try {
    Haptics.selectionAsync();

    if (Platform.OS === 'android') {
      try {
        // Standard Android Intent for setting wallpaper
        await IntentLauncher.startActivityAsync('android.intent.action.ATTACH_DATA', {
          data: uri,
          type: 'image/*',
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return true;
      } catch (intentErr) {
        // Fallback to system sharing sheet with wallpaper option
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/jpeg',
            dialogTitle: 'Set as Wallpaper',
          });
          return true;
        }
      }
    } else {
      // iOS / other platforms: Use system share sheet which includes "Use as Wallpaper"
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Set as Wallpaper',
        });
        return true;
      }
    }

    Alert.alert('Notice', 'Wallpaper chooser is not available on this platform.');
    return false;
  } catch (error) {
    console.warn('[WallpaperService] Failed to set wallpaper:', error);
    Alert.alert('Error', 'Unable to launch wallpaper selector.');
    return false;
  }
}

