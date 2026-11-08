// Silica — Offline Image Editing Service using expo-image-manipulator
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';

export interface EditActions {
  rotate?: number; // 90, 180, 270
  flip?: 'horizontal' | 'vertical';
  crop?: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
}

export async function rotatePhoto(
  uri: string,
  degrees: number = 90
): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ rotate: degrees }],
    { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

export async function flipPhoto(
  uri: string,
  orientation: 'horizontal' | 'vertical'
): Promise<string> {
  const flipAction =
    orientation === 'horizontal'
      ? ImageManipulator.FlipType.Horizontal
      : ImageManipulator.FlipType.Vertical;

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ flip: flipAction }],
    { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

export async function cropPhoto(
  uri: string,
  cropArea: { originX: number; originY: number; width: number; height: number }
): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ crop: cropArea }],
    { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

export async function saveEditedPhotoToLibrary(uri: string): Promise<MediaLibrary.Asset | null> {
  try {
    const asset = await MediaLibrary.createAssetAsync(uri);
    return asset;
  } catch (e) {
    console.warn('[ImageEditService] Failed to save asset to MediaLibrary:', e);
    return null;
  }
}
