import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';
import * as MediaLibrary from 'expo-media-library';
import { MediaItem, Collection, Tag } from '../types';

interface MediaState {
  hasPermission: boolean;
  isLoading: boolean;
  recentItems: MediaItem[];
  featuredCollections: Collection[];
  recentCollections: Collection[];
  tripCollections: Collection[];
  allTags: Tag[];

  initDB: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  loadMedia: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addTagToPhoto: (photoId: string, tag: string) => Promise<void>;
  removeTagFromPhoto: (photoId: string, tag: string) => Promise<void>;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('silica.db');
  }
  return dbInstance;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  hasPermission: false,
  isLoading: true,
  recentItems: [],
  featuredCollections: [
    {
      id: 'feat-1',
      name: 'Autumn Portrait',
      dateLabel: '25 Oct 2025',
      count: 526,
      storageSize: '2.6GB',
      coverUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
      percentage: '16%',
      type: 'featured',
    },
    {
      id: 'feat-2',
      name: 'Studio Lighting',
      dateLabel: '12 Sept 2025',
      count: 122,
      storageSize: '1.2GB',
      coverUri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
      percentage: '24%',
      type: 'featured',
    },
  ],
  recentCollections: [
    {
      id: 'rec-1',
      name: 'Today',
      dateLabel: 'Today',
      count: 62,
      storageSize: '520MB',
      coverUri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',
      type: 'recent',
    },
    {
      id: 'rec-2',
      name: '24 Oct 2025',
      dateLabel: '24 Oct 2025',
      count: 24,
      storageSize: '312MB',
      coverUri: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80',
      type: 'recent',
    },
    {
      id: 'rec-3',
      name: '23 Oct 2025',
      dateLabel: '23 Oct 2025',
      count: 120,
      storageSize: '1.2GB',
      coverUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
      type: 'recent',
    },
  ],
  tripCollections: [
    {
      id: 'trip-1',
      name: 'Himalayas',
      dateLabel: 'September 2025',
      count: 562,
      storageSize: '3.8GB',
      coverUri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
      type: 'trips',
    },
    {
      id: 'trip-2',
      name: 'Coastal Road',
      dateLabel: 'August 2025',
      count: 310,
      storageSize: '2.1GB',
      coverUri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
      type: 'trips',
    },
  ],
  allTags: [],

  initDB: async () => {
    try {
      const db = getDb();
      db.execSync(`
        CREATE TABLE IF NOT EXISTS photo_metadata (
          id TEXT PRIMARY KEY,
          is_favorite INTEGER DEFAULT 0,
          is_vault INTEGER DEFAULT 0,
          custom_collection_id TEXT,
          created_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS photo_tags (
          photo_id TEXT,
          tag TEXT,
          PRIMARY KEY (photo_id, tag)
        );
      `);
      set({ isLoading: false });
    } catch (e) {
      console.warn('[MediaStore] initDB error:', e);
      set({ isLoading: false });
    }
  },

  requestPermission: async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      const granted = status === 'granted';
      set({ hasPermission: granted });
      if (granted) {
        await get().loadMedia();
      }
      return granted;
    } catch (e) {
      console.warn('[MediaStore] requestPermission error:', e);
      return false;
    }
  },

  loadMedia: async () => {
    try {
      const { assets } = await MediaLibrary.getAssetsAsync({
        first: 100,
        sortBy: MediaLibrary.SortBy.creationTime,
        mediaType: [MediaLibrary.MediaType.photo],
      });

      if (assets.length > 0) {
        const items: MediaItem[] = assets.map((a) => ({
          id: a.id,
          uri: a.uri,
          filename: a.filename,
          width: a.width,
          height: a.height,
          creationTime: a.creationTime,
          modificationTime: a.modificationTime,
          duration: a.duration,
          mediaType: a.mediaType === 'video' ? 'video' : 'photo',
        }));
        set({ recentItems: items });
      }
    } catch (e) {
      console.warn('[MediaStore] loadMedia error:', e);
    }
  },

  toggleFavorite: async (id: string) => {
    try {
      const db = getDb();
      const current = db.getFirstSync<{ is_favorite: number }>(
        'SELECT is_favorite FROM photo_metadata WHERE id = ?;',
        [id]
      );
      const next = current?.is_favorite === 1 ? 0 : 1;
      db.runSync(
        'INSERT OR REPLACE INTO photo_metadata (id, is_favorite, created_at) VALUES (?, ?, ?);',
        [id, next, Date.now()]
      );
    } catch (e) {
      console.warn('[MediaStore] toggleFavorite error:', e);
    }
  },

  addTagToPhoto: async (photoId: string, tag: string) => {
    try {
      const db = getDb();
      db.runSync(
        'INSERT OR IGNORE INTO photo_tags (photo_id, tag) VALUES (?, ?);',
        [photoId, tag.trim().toLowerCase()]
      );
    } catch (e) {
      console.warn('[MediaStore] addTagToPhoto error:', e);
    }
  },

  removeTagFromPhoto: async (photoId: string, tag: string) => {
    try {
      const db = getDb();
      db.runSync(
        'DELETE FROM photo_tags WHERE photo_id = ? AND tag = ?;',
        [photoId, tag.trim().toLowerCase()]
      );
    } catch (e) {
      console.warn('[MediaStore] removeTagFromPhoto error:', e);
    }
  },
}));
