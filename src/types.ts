// Silica Data Types & Schema Models

export interface MediaItem {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  creationTime: number;
  modificationTime: number;
  duration?: number;
  mediaType: 'photo' | 'video';
  fileSize?: number;
  formattedSize?: string;
  tags?: string[];
  isFavorite?: boolean;
  collectionId?: string;
  isVault?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  dateLabel: string;
  count: number;
  storageSize: string;
  coverUri: string;
  percentage?: string;
  type: 'recent' | 'trips' | 'custom' | 'featured';
}

export interface Tag {
  id: string;
  name: string;
  count: number;
}

