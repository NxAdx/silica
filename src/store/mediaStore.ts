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

export function formatDateLabel(rawTimestamp: number): string {
  let ts = rawTimestamp;
  if (!ts || ts <= 0) {
    ts = Date.now();
  } else if (ts < 10000000000) {
    // MediaStore timestamp in seconds
    ts = ts * 1000;
  }
  const date = new Date(ts);
  if (date.getFullYear() < 2000) {
    return 'Recent';
  }
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

export function buildCollectionsFromItems(items: MediaItem[]): {
  recentCollections: Collection[];
  featured: Collection[];
} {
  const dateGroups = new Map<string, MediaItem[]>();
  for (const item of items) {
    const dateKey = formatDateLabel(item.creationTime);
    const group = dateGroups.get(dateKey) || [];
    group.push(item);
    dateGroups.set(dateKey, group);
  }

  const totalDeviceBytes = items.reduce((sum, i) => sum + (i.fileSize || 0), 0);
  const recentCollections: Collection[] = [];

  dateGroups.forEach((groupItems, dateLabel) => {
    const groupBytes = groupItems.reduce((sum, i) => sum + (i.fileSize || 0), 0);
    const pct =
      totalDeviceBytes > 0
        ? `${Math.max(1, Math.round((groupBytes / totalDeviceBytes) * 100))}%`
        : '10%';

    recentCollections.push({
      id: `date-${dateLabel.replace(/\s+/g, '-').toLowerCase()}`,
      name: dateLabel,
      dateLabel,
      count: groupItems.length,
      storageSize: formatBytes(groupBytes),
      coverUri: groupItems[0]?.uri || '',
      avatarUri: groupItems.length > 1 ? groupItems[1]?.uri : groupItems[0]?.uri,
      percentage: pct,
      type: 'recent',
    });
  });

  const featured: Collection[] = [];
  if (recentCollections.length >= 2) {
    featured.push({
      ...recentCollections[0],
      id: `feat-${recentCollections[0].id}`,
      type: 'featured',
      percentage: recentCollections[0].percentage || '16%',
    });
    featured.push({
      ...recentCollections[1],
      id: `feat-${recentCollections[1].id}`,
      type: 'featured',
      percentage: recentCollections[1].percentage || '24%',
    });
  } else if (recentCollections.length === 1) {
    featured.push({
      ...recentCollections[0],
      id: `feat-${recentCollections[0].id}`,
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
        avatarUri: items[0]?.uri,
        percentage: '50%',
        type: 'featured',
      });
    }
  }

  return { recentCollections, featured };
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
        CREATE TABLE IF NOT EXISTS cached_media (
          id TEXT PRIMARY KEY,
          uri TEXT NOT NULL,
          filename TEXT,
          width INTEGER,
          height INTEGER,
          file_size INTEGER DEFAULT 0,
          creation_time INTEGER,
          modification_time INTEGER,
          duration REAL,
          media_type TEXT,
          album_id TEXT
        );
        CREATE TABLE IF NOT EXISTS cached_albums (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          cover_uri TEXT,
          count INTEGER DEFAULT 0,
          storage_size TEXT,
          album_id TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_photo_tags_tag ON photo_tags(tag);
        CREATE INDEX IF NOT EXISTS idx_photo_metadata_vault ON photo_metadata(is_vault);
        CREATE INDEX IF NOT EXISTS idx_cached_media_creation ON cached_media(creation_time DESC);
        CREATE INDEX IF NOT EXISTS idx_cached_media_album ON cached_media(album_id);
      `);

      // 1. Load custom collections
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

      // 2. Load all tags
      const tagRows = db.getAllSync<{ tag: string; count: number }>(
        'SELECT tag, COUNT(*) as count FROM photo_tags GROUP BY tag ORDER BY count DESC;'
      );
      const loadedTags: Tag[] = tagRows.map((t, idx) => ({
        id: `tag-${idx}`,
        name: t.tag,
        count: t.count,
      }));

      // 3. Load cached albums
      const cachedAlbumRows = db.getAllSync<{
        id: string;
        name: string;
        cover_uri: string;
        count: number;
        storage_size: string;
        album_id: string;
      }>('SELECT * FROM cached_albums ORDER BY count DESC;');

      const loadedAlbums: Collection[] = cachedAlbumRows.map((a) => ({
        id: a.id,
        name: a.name,
        dateLabel: `${a.count} photos`,
        count: a.count,
        storageSize: a.storage_size || '0 MB',
        coverUri: a.cover_uri || '',
        type: 'album',
        albumId: a.album_id,
      }));

      // 4. INSTANT CACHE WARMING: Load cached_media from SQLite
      const cachedMediaRows = db.getAllSync<{
        id: string;
        uri: string;
        filename: string;
        width: number;
        height: number;
        file_size: number;
        creation_time: number;
        modification_time: number;
        duration: number;
        media_type: string;
        album_id: string;
      }>('SELECT * FROM cached_media ORDER BY creation_time DESC;');

      const favRows = db.getAllSync<{ id: string }>(
        'SELECT id FROM photo_metadata WHERE is_favorite = 1;'
      );
      const favIds = new Set(favRows.map((r) => r.id));

      const vaultRows = db.getAllSync<{ id: string }>(
        'SELECT id FROM photo_metadata WHERE is_vault = 1;'
      );
      const vaultIds = new Set(vaultRows.map((r) => r.id));

      const tagItemRows = db.getAllSync<{ photo_id: string; tag: string }>(
        'SELECT photo_id, tag FROM photo_tags;'
      );
      const tagMap = new Map<string, string[]>();
      for (const t of tagItemRows) {
        const list = tagMap.get(t.photo_id) || [];
        list.push(t.tag);
        tagMap.set(t.photo_id, list);
      }

      if (cachedMediaRows.length > 0) {
        const items: MediaItem[] = cachedMediaRows
          .filter((r) => !vaultIds.has(r.id))
          .map((r) => ({
            id: r.id,
            uri: r.uri,
            filename: r.filename,
            width: r.width,
            height: r.height,
            creationTime: r.creation_time,
            modificationTime: r.modification_time,
            duration: r.duration,
            mediaType: r.media_type === 'video' ? 'video' : 'photo',
            fileSize: r.file_size || 2.5 * 1024 * 1024,
            formattedSize: formatBytes(r.file_size || 2.5 * 1024 * 1024),
            isFavorite: favIds.has(r.id),
            albumId: r.album_id,
            tags: tagMap.get(r.id) || [],
          }));

        const { recentCollections, featured } = buildCollectionsFromItems(items);

        set({
          recentItems: items,
          recentCollections,
          featuredCollections: featured,
          albumCollections: loadedAlbums,
          customCollections: loadedCustom,
          allTags: loadedTags,
          hasPermission: true,
          isLoading: false,
        });
      } else {
        set({
          albumCollections: loadedAlbums,
          customCollections: loadedCustom,
          allTags: loadedTags,
          isLoading: false,
        });
      }
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
    // Only set isLoading if we don't have any cached items yet to avoid screen blinking
    if (get().recentItems.length === 0) {
      set({ isLoading: true });
    }

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

      // Build album cover map in O(N) memory lookup without making 50 IPC round-trips
      const albumCoverMap = new Map<string, string>();
      for (const a of visibleAssets) {
        if (a.albumId && !albumCoverMap.has(a.albumId)) {
          albumCoverMap.set(a.albumId, a.uri);
        }
      }

      const items: MediaItem[] = visibleAssets.map((a) => {
        // Accurate size estimation: JPEG compressed ~0.35 bytes/pixel
        const estSize = Math.max(1024 * 50, Math.round((a.width || 1920) * (a.height || 1080) * 0.35));
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

      // 2. Compute date groups and hero cards
      const { recentCollections, featured } = buildCollectionsFromItems(items);

      // 3. Query Device Albums (Folders)
      let albumCollections: Collection[] = [];
      try {
        const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
        albumCollections = albums
          .filter((alb) => alb.assetCount > 0)
          .map((alb) => {
            const coverUri = albumCoverMap.get(alb.id) || items[0]?.uri || '';
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
          });
      } catch (albErr) {
        console.warn('[MediaStore] Error fetching albums:', albErr);
      }

      // 4. Synchronously persist to SQLite cache inside a transaction
      try {
        db.withTransactionSync(() => {
          db.runSync('DELETE FROM cached_media;');
          const stmt = db.prepareSync(
            `INSERT OR REPLACE INTO cached_media (
              id, uri, filename, width, height, file_size, creation_time, modification_time, duration, media_type, album_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
          );
          try {
            for (const a of visibleAssets) {
              const estSize = Math.max(1024 * 50, Math.round((a.width || 1920) * (a.height || 1080) * 0.35));
              stmt.executeSync([
                a.id,
                a.uri,
                a.filename,
                a.width,
                a.height,
                estSize,
                a.creationTime,
                a.modificationTime,
                a.duration || 0,
                a.mediaType === 'video' ? 'video' : 'photo',
                a.albumId || '',
              ]);
            }
          } finally {
            stmt.finalizeSync();
          }

          if (albumCollections.length > 0) {
            db.runSync('DELETE FROM cached_albums;');
            const albStmt = db.prepareSync(
              `INSERT OR REPLACE INTO cached_albums (
                id, name, cover_uri, count, storage_size, album_id
              ) VALUES (?, ?, ?, ?, ?, ?);`
            );
            try {
              for (const alb of albumCollections) {
                albStmt.executeSync([
                  alb.id,
                  alb.name,
                  alb.coverUri,
                  alb.count,
                  alb.storageSize,
                  alb.albumId || '',
                ]);
              }
            } finally {
              albStmt.finalizeSync();
            }
          }
        });
      } catch (persistErr) {
        console.warn('[MediaStore] Error caching media to SQLite:', persistErr);
      }

      set({
        recentItems: items,
        recentCollections,
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
    const { recentItems, albumAssetsMap } = get();

    // 1. All photos
    if (collectionId === 'all' || collectionId === 'feat-all') {
      return recentItems;
    }

    // 2. Favorites
    if (collectionId === 'favorites') {
      return recentItems.filter((i) => i.isFavorite);
    }

    // 3. Check if date collection
    if (collectionId.startsWith('date-') || collectionId.startsWith('feat-')) {
      const cleaned = collectionId.replace('feat-', '').replace('date-', '');
      const filtered = recentItems.filter((item) => {
        const itemDateKey = formatDateLabel(item.creationTime)
          .replace(/\s+/g, '-')
          .toLowerCase();
        return itemDateKey === cleaned;
      });
      return filtered;
    }

    // 4. Check if device album (folder)
    if (collectionId.startsWith('album-')) {
      const albumId = collectionId.replace('album-', '');
      if (albumAssetsMap && albumAssetsMap[albumId] && albumAssetsMap[albumId].length > 0) {
        return albumAssetsMap[albumId];
      }
      const filtered = recentItems.filter((item) => item.albumId === albumId);
      if (filtered.length > 0) return filtered;

      // Query from SQLite cached_media directly
      try {
        const db = getDb();
        const cached = db.getAllSync<{
          id: string;
          uri: string;
          filename: string;
          width: number;
          height: number;
          file_size: number;
          creation_time: number;
          modification_time: number;
          duration: number;
          media_type: string;
          album_id: string;
        }>('SELECT * FROM cached_media WHERE album_id = ? ORDER BY creation_time DESC;', [albumId]);
        if (cached.length > 0) {
          return cached.map((r) => ({
            id: r.id,
            uri: r.uri,
            filename: r.filename,
            width: r.width,
            height: r.height,
            creationTime: r.creation_time,
            modificationTime: r.modification_time,
            duration: r.duration,
            mediaType: r.media_type === 'video' ? 'video' : 'photo',
            fileSize: r.file_size || 2.5 * 1024 * 1024,
            formattedSize: formatBytes(r.file_size || 2.5 * 1024 * 1024),
            isFavorite: false,
            albumId: r.album_id,
            tags: [],
          }));
        }
      } catch {}
      return [];
    }

    // 5. Check if custom collection
    const customMatches = recentItems.filter((item) => item.collectionId === collectionId);
    if (customMatches.length > 0) return customMatches;

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
