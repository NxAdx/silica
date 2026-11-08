// Silica — Biometric Secret Vault Store
import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { MediaItem } from '../types';

interface VaultState {
  isUnlocked: boolean;
  vaultItems: MediaItem[];
  isLoading: boolean;

  authenticate: () => Promise<boolean>;
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
  vaultItems: [],
  isLoading: false,

  authenticate: async () => {
    try {
      Haptics.selectionAsync();
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback for emulators or devices without hardware lock
        set({ isUnlocked: true });
        await get().loadVaultItems();
        return true;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Silica Secret Vault',
        fallbackLabel: 'Use Device PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        set({ isUnlocked: true });
        await get().loadVaultItems();
        return true;
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return false;
      }
    } catch (e) {
      console.warn('[VaultStore] Authentication error:', e);
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
        created_at: number;
      }>('SELECT * FROM photo_metadata WHERE is_vault = 1 ORDER BY created_at DESC;');

      const items: MediaItem[] = rows.map((r) => ({
        id: r.id,
        uri: r.uri || '',
        filename: r.filename || 'Vault Photo',
        width: r.width || 1200,
        height: r.height || 1600,
        creationTime: r.created_at || Date.now(),
        modificationTime: r.created_at || Date.now(),
        mediaType: 'photo',
        isVault: true,
      }));

      // Seed with 2 demo vault items if empty
      if (items.length === 0) {
        const demoItems: MediaItem[] = [
          {
            id: 'vault-demo-1',
            uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80',
            filename: 'Personal_Document_1.jpg',
            width: 1200,
            height: 1600,
            creationTime: Date.now() - 86400000,
            modificationTime: Date.now() - 86400000,
            mediaType: 'photo',
            isVault: true,
          },
          {
            id: 'vault-demo-2',
            uri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
            filename: 'Secret_Notes.jpg',
            width: 1200,
            height: 1600,
            creationTime: Date.now() - 172800000,
            modificationTime: Date.now() - 172800000,
            mediaType: 'photo',
            isVault: true,
          },
        ];
        set({ vaultItems: demoItems, isLoading: false });
        return;
      }

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
        `INSERT OR REPLACE INTO photo_metadata 
          (id, uri, filename, width, height, is_vault, created_at) 
         VALUES (?, ?, ?, ?, ?, 1, ?);`,
        [item.id, item.uri, item.filename, item.width, item.height, Date.now()]
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

