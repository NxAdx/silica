// Silica — High Performance Real-Device SQLite Media Store (Zero Dummy Images)
import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { MediaItem, Collection, Tag } from '../types';

interface MediaState {
  hasPermission: boolean;
  permissionStatus: MediaLibrary.PermissionStatus | 'undetermined';
  isLoading: boolean;
  recentItems: MediaItem[];
  featuredCollections: Collection[];
  recentCollections: Collection[];
  albumCollections: Collection[];
  albumAssetsMap: Record<string, MediaItem[]>;
  customCollections: Collection[];
  allTags: Tag[];
  sortOrder: 'date_desc' | 'date_asc' | 'size_desc' | 'name_asc';
  searchQuery: string;

  initDB: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  loadMedia: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  getFilteredItems: () => MediaItem[];
  toggleFavorite: (id: string) => Promise<boolean>;
  deleteMediaItems: (ids: string[]) => Promise<void>;
  createCollection: (name: string, coverUri?: string) => Promise<void>;
  addPhotosToCollection: (collectionId: string, photoIds: string[]) => Promise<void>;
  setSortOrder: (order: 'date_desc' | 'date_asc' | 'size_desc' | 'name_asc') => void;
  addTagToPhoto: (photoId: string, tag: string) => Promise<void>;
  removeTagFromPhoto: (photoId: string, tag: string) => Promise<void>;
  getPhotoTags: (photoId: string) => string[];
  getCollectionItems: (collectionId: string) => MediaItem[];
  loadAlbumAssets: (albumId: string) => Promise<MediaItem[]>;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('silica.db');
  }
  return dbInstance;
}

export function formatDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  hasPermission: false,
  permissionStatus: 'undetermined',
  isLoading: true,
  recentItems: [],
  featuredCollections: [],
  recentCollections: [],
  albumCollections: [],
  albumAssetsMap: {},
  customCollections: [],
  allTags: [],
  sortOrder: 'date_desc',
  searchQuery: '',

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
          file_size INTEGER DEFAULT 0,
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
        CREATE INDEX IF NOT EXISTS idx_photo_tags_tag ON photo_tags(tag);
        CREATE INDEX IF NOT EXISTS idx_photo_metadata_vault ON photo_metadata(is_vault);
      `);

      // Load custom collections
      const customRows = db.getAllSync<{
        id: string;
        name: string;
        cover_uri: string;
        created_at: number;
      }>('SELECT * FROM custom_collections ORDER BY created_at DESC;');

      const loadedCustom: Collection[] = customRows.map((r) => ({
        id: r.id,
        name: r.name,
        dateLabel: formatDateLabel(r.created_at),
        count: 0,
        storageSize: '0 MB',
        coverUri: r.cover_uri || '',
        type: 'custom',
      }));

      // Load all tags
      const tagRows = db.getAllSync<{ tag: string; count: number }>(
        'SELECT tag, COUNT(*) as count FROM photo_tags GROUP BY tag ORDER BY count DESC;'
      );
      const loadedTags: Tag[] = tagRows.map((t, idx) => ({
        id: `tag-${idx}`,
        name: t.tag,
        count: t.count,
      }));

      set({
        customCollections: loadedCustom,
        allTags: loadedTags,
        isLoading: false,
      });
    } catch (e) {
      console.warn('[MediaStore] initDB error:', e);
      set({ isLoading: false });
    }
  },

  requestPermission: async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      const granted = status === MediaLibrary.PermissionStatus.GRANTED;
      set({ hasPermission: granted, permissionStatus: status });
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
    set({ isLoading: true });
    try {
      // 1. Query real assets from the device
      const { assets } = await MediaLibrary.getAssetsAsync({
        first: 1000,
        sortBy: MediaLibrary.SortBy.creationTime,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
      });

      const db = getDb();

      // Query favorites, vault items, and tags from SQLite
      const favRows = db.getAllSync<{ id: string }>(
        'SELECT id FROM photo_metadata WHERE is_favorite = 1;'
      );
      const favIds = new Set(favRows.map((r) => r.id));

      const vaultRows = db.getAllSync<{ id: string }>(
        'SELECT id FROM photo_metadata WHERE is_vault = 1;'
      );
      const vaultIds = new Set(vaultRows.map((r) => r.id));

      const tagRows = db.getAllSync<{ photo_id: string; tag: string }>(
        'SELECT photo_id, tag FROM photo_tags;'
      );
      const tagMap = new Map<string, string[]>();
      for (const t of tagRows) {
        const list = tagMap.get(t.photo_id) || [];
        list.push(t.tag);
        tagMap.set(t.photo_id, list);
      }

      // Filter out hidden vault photos
      const visibleAssets = assets.filter((a) => !vaultIds.has(a.id));

      const items: MediaItem[] = visibleAssets.map((a) => {
        // Estimate size if not available (~2.5MB per photo)
        const estSize = 2.5 * 1024 * 1024;
        return {
          id: a.id,
          uri: a.uri,
          filename: a.filename,
          width: a.width,
          height: a.height,
          creationTime: a.creationTime,
          modificationTime: a.modificationTime,
          duration: a.duration,
          mediaType: a.mediaType === 'video' ? 'video' : 'photo',
          fileSize: estSize,
          formattedSize: formatBytes(estSize),
          isFavorite: favIds.has(a.id),
          albumId: a.albumId,
          tags: tagMap.get(a.id) || [],
        };
      });

      // 2. Group real photos by Date Clusters (for Home Carousels & Hero Cards)
      const dateGroups = new Map<string, MediaItem[]>();
      for (const item of items) {
        const dateKey = formatDateLabel(item.creationTime);
        const group = dateGroups.get(dateKey) || [];
        group.push(item);
        dateGroups.set(dateKey, group);
      }

      const totalDeviceBytes = items.reduce((sum, i) => sum + (i.fileSize || 0), 0);

      const generatedRecentCollections: Collection[] = [];
      dateGroups.forEach((groupItems, dateLabel) => {
        const groupBytes = groupItems.reduce((sum, i) => sum + (i.fileSize || 0), 0);
        const pct =
          totalDeviceBytes > 0
            ? `${Math.max(1, Math.round((groupBytes / totalDeviceBytes) * 100))}%`
            : '10%';

        generatedRecentCollections.push({
          id: `date-${dateLabel.replace(/\s+/g, '-').toLowerCase()}`,
          name: dateLabel,
          dateLabel,
          count: groupItems.length,
          storageSize: formatBytes(groupBytes),
          coverUri: groupItems[0]?.uri || '',
          percentage: pct,
          type: 'recent',
        });
      });

      // 3. Featured Hero Cards: Pick rich date clusters or highlights
      const featured: Collection[] = [];
      if (generatedRecentCollections.length >= 2) {
        featured.push({
          ...generatedRecentCollections[0],
          id: `feat-${generatedRecentCollections[0].id}`,
          type: 'featured',
          percentage: generatedRecentCollections[0].percentage || '16%',
        });
        featured.push({
          ...generatedRecentCollections[1],
          id: `feat-${generatedRecentCollections[1].id}`,
          type: 'featured',
          percentage: generatedRecentCollections[1].percentage || '24%',
        });
      } else if (generatedRecentCollections.length === 1) {
        featured.push({
          ...generatedRecentCollections[0],
          id: `feat-${generatedRecentCollections[0].id}`,
          type: 'featured',
          percentage: '100%',
        });
        if (items.length > 1) {
          featured.push({
            id: 'feat-all',
            name: 'Highlights',
            dateLabel: 'Highlights',
            count: items.length,
            storageSize: formatBytes(totalDeviceBytes),
            coverUri: items[1]?.uri || items[0]?.uri || '',
            percentage: '50%',
            type: 'featured',
          });
        }
      }

      // 4. Query Real Device Albums (Folders like Camera, Screenshots, WhatsApp, Downloads)
      let albumCollections: Collection[] = [];
      try {
        const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
        albumCollections = await Promise.all(
          albums
            .filter((alb) => alb.assetCount > 0)
            .map(async (alb) => {
              const albumAssets = await MediaLibrary.getAssetsAsync({
                album: alb,
                first: 1,
                sortBy: MediaLibrary.SortBy.creationTime,
              });
              const coverUri = albumAssets.assets[0]?.uri || items[0]?.uri || '';
              const estAlbumBytes = alb.assetCount * 2.5 * 1024 * 1024;
              return {
                id: `album-${alb.id}`,
                name: alb.title,
                dateLabel: `${alb.assetCount} photos`,
                count: alb.assetCount,
                storageSize: formatBytes(estAlbumBytes),
                coverUri,
                type: 'album',
                albumId: alb.id,
              };
            })
        );
      } catch (albErr) {
        console.warn('[MediaStore] Error fetching albums:', albErr);
      }

      set({
        recentItems: items,
        recentCollections: generatedRecentCollections,
        featuredCollections: featured,
        albumCollections,
        isLoading: false,
      });
    } catch (e) {
      console.warn('[MediaStore] loadMedia error:', e);
      set({ isLoading: false });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  getFilteredItems: () => {
    const { recentItems, searchQuery, sortOrder } = get();
    let filtered = [...recentItems];

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        // Match filename
        if (item.filename?.toLowerCase().includes(q)) return true;
        // Match date label
        const dateStr = formatDateLabel(item.creationTime).toLowerCase();
        if (dateStr.includes(q)) return true;
        // Match tags
        if (item.tags?.some((t) => t.toLowerCase().includes(q))) return true;
        return false;
      });
    }

    if (sortOrder === 'date_desc') {
      filtered.sort((a, b) => b.creationTime - a.creationTime);
    } else if (sortOrder === 'date_asc') {
      filtered.sort((a, b) => a.creationTime - b.creationTime);
    } else if (sortOrder === 'size_desc') {
      filtered.sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));
    } else if (sortOrder === 'name_asc') {
      filtered.sort((a, b) => (a.filename || '').localeCompare(b.filename || ''));
    }

    return filtered;
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

      // Also request system deletion from device library if possible
      try {
        await MediaLibrary.deleteAssetsAsync(ids);
      } catch (delErr) {
        console.warn('[MediaStore] MediaLibrary delete error:', delErr);
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
      const defaultCover = coverUri || get().recentItems[0]?.uri || '';

      db.runSync(
        'INSERT INTO custom_collections (id, name, cover_uri, created_at) VALUES (?, ?, ?, ?);',
        [id, name, defaultCover, Date.now()]
      );

      const newCol: Collection = {
        id,
        name,
        dateLabel: 'Folder',
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

  addPhotosToCollection: async (collectionId: string, photoIds: string[]) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const db = getDb();
      for (const id of photoIds) {
        db.runSync(
          `INSERT INTO photo_metadata (id, custom_collection_id, created_at)
           VALUES (?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET custom_collection_id = excluded.custom_collection_id;`,
          [id, collectionId, Date.now()]
        );
      }
      set((state) => ({
        recentItems: state.recentItems.map((item) =>
          photoIds.includes(item.id)
            ? { ...item, collectionId }
            : item
        ),
      }));
    } catch (e) {
      console.warn('[MediaStore] addPhotosToCollection error:', e);
    }
  },

  setSortOrder: (order) => {
    Haptics.selectionAsync();
    set({ sortOrder: order });
  },

  addTagToPhoto: async (photoId: string, tag: string) => {
    const cleanTag = tag.trim().toLowerCase().replace(/^#/, '');
    if (!cleanTag) return;
    try {
      const db = getDb();
      db.runSync(
        'INSERT OR IGNORE INTO photo_tags (photo_id, tag) VALUES (?, ?);',
        [photoId, cleanTag]
      );

      // Refresh tags in state
      const tagRows = db.getAllSync<{ tag: string; count: number }>(
        'SELECT tag, COUNT(*) as count FROM photo_tags GROUP BY tag ORDER BY count DESC;'
      );
      const updatedTags: Tag[] = tagRows.map((t, idx) => ({
        id: `tag-${idx}`,
        name: t.tag,
        count: t.count,
      }));

      set((state) => ({
        allTags: updatedTags,
        recentItems: state.recentItems.map((i) => {
          if (i.id === photoId) {
            const curTags = i.tags || [];
            return {
              ...i,
              tags: curTags.includes(cleanTag) ? curTags : [...curTags, cleanTag],
            };
          }
          return i;
        }),
      }));
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

      set((state) => ({
        recentItems: state.recentItems.map((i) => {
          if (i.id === photoId) {
            return {
              ...i,
              tags: (i.tags || []).filter((t) => t !== tag),
            };
          }
          return i;
        }),
      }));
    } catch (e) {
      console.warn('[MediaStore] removeTagFromPhoto error:', e);
    }
  },

  getPhotoTags: (photoId: string) => {
    const item = get().recentItems.find((i) => i.id === photoId);
    return item?.tags || [];
  },

  getCollectionItems: (collectionId: string) => {
    const { recentItems, albumAssetsMap, customCollections } = get();

    // 1. Favorites
    if (collectionId === 'favorites') {
      return recentItems.filter((i) => i.isFavorite);
    }

    // 2. Check if date collection
    if (collectionId.startsWith('date-') || collectionId.startsWith('feat-')) {
      const cleaned = collectionId.replace('feat-', '').replace('date-', '');
      const filtered = recentItems.filter((item) => {
        const itemDateKey = formatDateLabel(item.creationTime)
          .replace(/\s+/g, '-')
          .toLowerCase();
        return itemDateKey === cleaned;
      });
      if (filtered.length > 0) return filtered;
    }

    // 3. Check if device album (folder)
    if (collectionId.startsWith('album-')) {
      const albumId = collectionId.replace('album-', '');
      if (albumAssetsMap && albumAssetsMap[albumId] && albumAssetsMap[albumId].length > 0) {
        return albumAssetsMap[albumId];
      }
      const filtered = recentItems.filter((item) => item.albumId === albumId);
      if (filtered.length > 0) return filtered;
    }

    // 4. Check if custom collection
    const customMatches = recentItems.filter((item) => item.collectionId === collectionId);
    if (customMatches.length > 0) return customMatches;

    // Fallback
    return recentItems;
  },

  loadAlbumAssets: async (albumId: string) => {
    try {
      const albumAssets = await MediaLibrary.getAssetsAsync({
        album: albumId,
        first: 500,
        sortBy: MediaLibrary.SortBy.creationTime,
      });
      const db = getDb();
      const vaultRows = db.getAllSync<{ id: string }>('SELECT id FROM photo_metadata WHERE is_vault = 1;');
      const vaultIds = new Set(vaultRows.map((r) => r.id));
      const favRows = db.getAllSync<{ id: string }>('SELECT id FROM photo_metadata WHERE is_favorite = 1;');
      const favIds = new Set(favRows.map((r) => r.id));
      const tagRows = db.getAllSync<{ photo_id: string; tag: string }>('SELECT photo_id, tag FROM photo_tags;');
      const tagMap = new Map<string, string[]>();
      for (const t of tagRows) {
        const list = tagMap.get(t.photo_id) || [];
        list.push(t.tag);
        tagMap.set(t.photo_id, list);
      }
      const mapped: MediaItem[] = albumAssets.assets
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
          fileSize: 2.5 * 1024 * 1024,
          formattedSize: formatBytes(2.5 * 1024 * 1024),
          isFavorite: favIds.has(a.id),
          albumId: albumId,
          tags: tagMap.get(a.id) || [],
        }));

      set((state) => ({
        albumAssetsMap: {
          ...state.albumAssetsMap,
          [albumId]: mapped,
        },
      }));
      return mapped;
    } catch (e) {
      console.warn('[MediaStore] loadAlbumAssets error:', e);
      return [];
    }
  },
}));
