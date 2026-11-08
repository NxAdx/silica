// Silica — High Performance Offline SQLite Media Store
import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { MediaItem, Collection, Tag } from '../types';

interface MediaState {
  hasPermission: boolean;
  isLoading: boolean;
  recentItems: MediaItem[];
  featuredCollections: Collection[];
  recentCollections: Collection[];
  tripCollections: Collection[];
  customCollections: Collection[];
  allTags: Tag[];
  sortOrder: 'date_desc' | 'date_asc' | 'size_desc';

  initDB: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  loadMedia: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<boolean>;
  deleteMediaItems: (ids: string[]) => Promise<void>;
  createCollection: (name: string, coverUri?: string) => Promise<void>;
  setSortOrder: (order: 'date_desc' | 'date_asc' | 'size_desc') => void;
  addTagToPhoto: (photoId: string, tag: string) => Promise<void>;
  removeTagFromPhoto: (photoId: string, tag: string) => Promise<void>;
  getCollectionItems: (collectionId: string) => MediaItem[];
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('silica.db');
  }
  return dbInstance;
}

// Initial Curated Seed Collections matching Screen 1 (docs/ui design (1).jpg)
const INITIAL_FEATURED: Collection[] = [
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
];

const INITIAL_RECENT_COLLECTIONS: Collection[] = [
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
];

const INITIAL_TRIP_COLLECTIONS: Collection[] = [
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
  {
    id: 'trip-3',
    name: 'Kyoto Sanctuary',
    dateLabel: 'May 2025',
    count: 420,
    storageSize: '2.9GB',
    coverUri: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
    type: 'trips',
  },
];

// Curated 12 Gallery Photos for the 3-column squircle grid matching Screen 2
const SEED_GALLERY_PHOTOS: MediaItem[] = [
  {
    id: 'img-1',
    uri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
    filename: 'Silica_001.jpg',
    width: 2400,
    height: 3200,
    creationTime: 1730000000000,
    modificationTime: 1730000000000,
    mediaType: 'photo',
    fileSize: 2400000,
    formattedSize: '2.4 MB',
    isFavorite: false,
  },
  {
    id: 'img-2',
    uri: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&q=80',
    filename: 'Silica_002.jpg',
    width: 2400,
    height: 3200,
    creationTime: 1730000002000, // Burst candidate
    modificationTime: 1730000002000,
    mediaType: 'photo',
    fileSize: 2380000,
    formattedSize: '2.3 MB',
    isFavorite: true,
  },
  {
    id: 'img-3',
    uri: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
    filename: 'Silica_003.jpg',
    width: 2400,
    height: 3200,
    creationTime: 1730000003000, // Burst candidate
    modificationTime: 1730000003000,
    mediaType: 'photo',
    fileSize: 2410000,
    formattedSize: '2.4 MB',
    isFavorite: false,
  },
  {
    id: 'img-4',
    uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
    filename: 'Silica_004.jpg',
    width: 2400,
    height: 3200,
    creationTime: 1729900000000,
    modificationTime: 1729900000000,
    mediaType: 'photo',
    fileSize: 3100000,
    formattedSize: '3.1 MB',
    isFavorite: false,
  },
  {
    id: 'img-5',
    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
    filename: 'Silica_005.jpg',
    width: 2400,
    height: 3200,
    creationTime: 1729800000000,
    modificationTime: 1729800000000,
    mediaType: 'photo',
    fileSize: 2800000,
    formattedSize: '2.8 MB',
    isFavorite: true,
  },
  {
    id: 'img-6',
    uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    filename: 'Silica_006.jpg',
    width: 2400,
    height: 3200,
    creationTime: 1729700000000,
    modificationTime: 1729700000000,
    mediaType: 'photo',
    fileSize: 2100000,
    formattedSize: '2.1 MB',
    isFavorite: false,
  },
  {
    id: 'img-7',
    uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
    filename: 'Silica_007.jpg',
    width: 2400,
    height: 3200,
    creationTime: 1729600000000,
    modificationTime: 1729600000000,
    mediaType: 'photo',
    fileSize: 4200000,
    formattedSize: '4.2 MB',
    isFavorite: false,
  },
  {
    id: 'img-8',
    uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    filename: 'Silica_008.jpg',
    width: 2400,
    height: 3200,
    creationTime: 1729500000000,
    modificationTime: 1729500000000,
    mediaType: 'photo',
    fileSize: 3400000,
    formattedSize: '3.4 MB',
    isFavorite: false,
  },
  {
    id: 'img-9',
    uri: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
    filename: 'Silica_009.jpg',
    width: 2400,
    height: 3200,
    creationTime: 1729400000000,
    modificationTime: 1729400000000,
    mediaType: 'photo',
    fileSize: 2900000,
    formattedSize: '2.9 MB',
    isFavorite: false,
  },
  {
    id: 'img-10',
    uri: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
    filename: 'Silica_010.jpg',
    width: 2400,
    height: 3200,
    creationTime: 1729300000000,
    modificationTime: 1729300000000,
    mediaType: 'photo',
    fileSize: 3800000,
    formattedSize: '3.8 MB',
    isFavorite: false,
  },
  {
    id: 'img-11',
    uri: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
    filename: 'Silica_011.jpg',
    width: 2400,
    height: 3200,
    creationTime: 1729200000000,
    modificationTime: 1729200000000,
    mediaType: 'photo',
    fileSize: 2600000,
    formattedSize: '2.6 MB',
    isFavorite: true,
  },
  {
    id: 'img-12',
    uri: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
    filename: 'Silica_012.jpg',
    width: 2400,
    height: 3200,
    creationTime: 1729100000000,
    modificationTime: 1729100000000,
    mediaType: 'photo',
    fileSize: 4500000,
    formattedSize: '4.5 MB',
    isFavorite: false,
  },
];

export const useMediaStore = create<MediaState>((set, get) => ({
  hasPermission: false,
  isLoading: true,
  recentItems: SEED_GALLERY_PHOTOS,
  featuredCollections: INITIAL_FEATURED,
  recentCollections: INITIAL_RECENT_COLLECTIONS,
  tripCollections: INITIAL_TRIP_COLLECTIONS,
  customCollections: [],
  allTags: [
    { id: 'tag-1', name: 'Portraits', count: 48 },
    { id: 'tag-2', name: 'Landscape', count: 120 },
    { id: 'tag-3', name: 'Architecture', count: 35 },
  ],
  sortOrder: 'date_desc',

  initDB: async () => {
    try {
      const db = getDb();
      db.execSync(`
        CREATE TABLE IF NOT EXISTS photo_metadata (
          id TEXT PRIMARY KEY,
          uri TEXT,
          filename TEXT,
          width INTEGER,
          height INTEGER,
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
        CREATE TABLE IF NOT EXISTS custom_collections (
          id TEXT PRIMARY KEY,
          name TEXT,
          cover_uri TEXT,
          created_at INTEGER
        );
      `);

      // Sync existing favorites from SQLite
      const favRows = db.getAllSync<{ id: string; is_favorite: number }>(
        'SELECT id, is_favorite FROM photo_metadata WHERE is_favorite = 1;'
      );
      const favMap = new Map(favRows.map((r) => [r.id, r.is_favorite === 1]));

      set((state) => ({
        recentItems: state.recentItems.map((item) => ({
          ...item,
          isFavorite: favMap.has(item.id) ? favMap.get(item.id) : item.isFavorite,
        })),
        isLoading: false,
      }));
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
        const db = getDb();
        const favRows = db.getAllSync<{ id: string }>(
          'SELECT id FROM photo_metadata WHERE is_favorite = 1;'
        );
        const favIds = new Set(favRows.map((r) => r.id));

        const vaultRows = db.getAllSync<{ id: string }>(
          'SELECT id FROM photo_metadata WHERE is_vault = 1;'
        );
        const vaultIds = new Set(vaultRows.map((r) => r.id));

        const items: MediaItem[] = assets
          .filter((a) => !vaultIds.has(a.id))
          .map((a) => ({
            id: a.id,
            uri: a.uri,
            filename: a.filename,
            width: a.width,
            height: a.height,
            creationTime: a.creationTime,
            modificationTime: a.modificationTime,
            duration: a.duration,
            mediaType: a.mediaType === 'video' ? 'video' : 'photo',
            isFavorite: favIds.has(a.id),
          }));

        set({ recentItems: items });
      }
    } catch (e) {
      console.warn('[MediaStore] loadMedia error (falling back to curated seed):', e);
    }
  },

  toggleFavorite: async (id: string) => {
    try {
      Haptics.selectionAsync();
      const db = getDb();
      const current = db.getFirstSync<{ is_favorite: number }>(
        'SELECT is_favorite FROM photo_metadata WHERE id = ?;',
        [id]
      );
      const next = current?.is_favorite === 1 ? 0 : 1;

      db.runSync(
        `INSERT INTO photo_metadata (id, is_favorite, created_at)
         VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET is_favorite = excluded.is_favorite;`,
        [id, next, Date.now()]
      );

      set((state) => ({
        recentItems: state.recentItems.map((item) =>
          item.id === id ? { ...item, isFavorite: next === 1 } : item
        ),
      }));

      return next === 1;
    } catch (e) {
      console.warn('[MediaStore] toggleFavorite error:', e);
      return false;
    }
  },

  deleteMediaItems: async (ids: string[]) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const db = getDb();
      const idSet = new Set(ids);

      for (const id of ids) {
        db.runSync('DELETE FROM photo_metadata WHERE id = ?;', [id]);
        db.runSync('DELETE FROM photo_tags WHERE photo_id = ?;', [id]);
      }

      set((state) => ({
        recentItems: state.recentItems.filter((item) => !idSet.has(item.id)),
      }));
    } catch (e) {
      console.warn('[MediaStore] deleteMediaItems error:', e);
    }
  },

  createCollection: async (name: string, coverUri?: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const db = getDb();
      const id = `col-${Date.now()}`;
      const defaultCover =
        coverUri ||
        get().recentItems[0]?.uri ||
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80';

      db.runSync(
        'INSERT INTO custom_collections (id, name, cover_uri, created_at) VALUES (?, ?, ?, ?);',
        [id, name, defaultCover, Date.now()]
      );

      const newCol: Collection = {
        id,
        name,
        dateLabel: 'Today',
        count: 0,
        storageSize: '0 MB',
        coverUri: defaultCover,
        type: 'custom',
      };

      set((state) => ({
        customCollections: [newCol, ...state.customCollections],
      }));
    } catch (e) {
      console.warn('[MediaStore] createCollection error:', e);
    }
  },

  setSortOrder: (order) => {
    Haptics.selectionAsync();
    set((state) => {
      const sorted = [...state.recentItems];
      if (order === 'date_desc') {
        sorted.sort((a, b) => b.creationTime - a.creationTime);
      } else if (order === 'date_asc') {
        sorted.sort((a, b) => a.creationTime - b.creationTime);
      } else if (order === 'size_desc') {
        sorted.sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));
      }
      return { sortOrder: order, recentItems: sorted };
    });
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

  getCollectionItems: (collectionId: string) => {
    return get().recentItems;
  },
}));
