// Silica — Secure Biometric & PIN Photo Vault Store
import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { MediaItem } from '../types';

const VAULT_PIN_KEY = 'silica_vault_pin';

interface VaultState {
  isUnlocked: boolean;
  hasCustomPin: boolean;
  vaultItems: MediaItem[];
  isLoading: boolean;

  checkHasPin: () => Promise<boolean>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  authenticateWithBiometrics: () => Promise<boolean>;
  lockVault: () => void;
  loadVaultItems: () => Promise<void>;
  addToVault: (item: MediaItem) => Promise<void>;
  removeFromVault: (id: string) => Promise<void>;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('silica.db');
  }
  return dbInstance;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  isUnlocked: false,
  hasCustomPin: false,
  vaultItems: [],
  isLoading: false,

  checkHasPin: async () => {
    try {
      const pin = await SecureStore.getItemAsync(VAULT_PIN_KEY);
      const exists = Boolean(pin && pin.length >= 4);
      set({ hasCustomPin: exists });
      return exists;
    } catch {
      return false;
    }
  },

  setPin: async (pin: string) => {
    try {
      await SecureStore.setItemAsync(VAULT_PIN_KEY, pin);
      set({ hasCustomPin: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.warn('[VaultStore] Failed to save PIN:', e);
    }
  },

  verifyPin: async (inputPin: string) => {
    try {
      const stored = await SecureStore.getItemAsync(VAULT_PIN_KEY);
      // Default initial PIN is 0000 if none is set
      const targetPin = stored || '0000';
      if (inputPin === targetPin) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        set({ isUnlocked: true });
        await get().loadVaultItems();
        return true;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    } catch {
      return false;
    }
  },

  authenticateWithBiometrics: async () => {
    try {
      Haptics.selectionAsync();
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback to PIN
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Silica Secret Vault',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        set({ isUnlocked: true });
        await get().loadVaultItems();
        return true;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    } catch (e) {
      console.warn('[VaultStore] Biometric auth error:', e);
      return false;
    }
  },

  lockVault: () => {
    Haptics.selectionAsync();
    set({ isUnlocked: false, vaultItems: [] });
  },

  loadVaultItems: async () => {
    set({ isLoading: true });
    try {
      const db = getDb();
      const rows = db.getAllSync<{
        id: string;
        uri: string;
        filename: string;
        width: number;
        height: number;
        file_size: number;
        created_at: number;
      }>('SELECT * FROM photo_metadata WHERE is_vault = 1 ORDER BY created_at DESC;');

      const items: MediaItem[] = rows.map((r) => ({
        id: r.id,
        uri: r.uri || '',
        filename: r.filename || 'Protected Photo',
        width: r.width || 1200,
        height: r.height || 1600,
        fileSize: r.file_size || 0,
        formattedSize: r.file_size
          ? `${(r.file_size / (1024 * 1024)).toFixed(1)} MB`
          : undefined,
        creationTime: r.created_at || Date.now(),
        modificationTime: r.created_at || Date.now(),
        mediaType: 'photo',
        isVault: true,
      }));

      set({ vaultItems: items, isLoading: false });
    } catch (e) {
      console.warn('[VaultStore] loadVaultItems error:', e);
      set({ isLoading: false });
    }
  },

  addToVault: async (item: MediaItem) => {
    try {
      const db = getDb();
      db.runSync(
        `INSERT INTO photo_metadata 
          (id, uri, filename, width, height, is_vault, created_at, file_size) 
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET is_vault = 1;`,
        [
          item.id,
          item.uri,
          item.filename,
          item.width,
          item.height,
          item.creationTime,
          item.fileSize || 0,
        ]
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await get().loadVaultItems();
    } catch (e) {
      console.warn('[VaultStore] addToVault error:', e);
    }
  },

  removeFromVault: async (id: string) => {
    try {
      const db = getDb();
      db.runSync('UPDATE photo_metadata SET is_vault = 0 WHERE id = ?;', [id]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await get().loadVaultItems();
    } catch (e) {
      console.warn('[VaultStore] removeFromVault error:', e);
    }
  },
}));
