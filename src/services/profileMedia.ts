import { ProfileMedia } from '@/src/types';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_DURATION_MS = 15_000;

export type UploadStage =
  | 'picking'
  | 'compressing'
  | 'uploading'
  | 'complete';

export interface UploadProgress {
  stage: UploadStage;
  progress: number;
}

const getFileExtension = (asset: ImagePicker.ImagePickerAsset, fallbackType: 'image' | 'video') => {
  const name = asset.fileName || '';
  const nameExt = name.includes('.') ? name.split('.').pop() : null;
  if (nameExt) return nameExt.toLowerCase();

  if (asset.mimeType?.includes('/')) {
    const mimeExt = asset.mimeType.split('/').pop();
    if (mimeExt) return mimeExt.toLowerCase();
  }

  return fallbackType === 'video' ? 'mp4' : 'jpg';
};

const getFileSize = async (uri: string, fallback?: number) => {
  if (typeof fallback === 'number') return fallback;
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && typeof info.size === 'number' ? info.size : 0;
};

const fetchBlob = async (uri: string) => {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('We could not read that file. Please try another one.');
  }
  return response.blob();
};

const validateVideo = async (
  asset: ImagePicker.ImagePickerAsset
) => {
  const originalSize = await getFileSize(asset.uri, asset.fileSize);

  if ((asset.duration || 0) > MAX_VIDEO_DURATION_MS) {
    throw new Error('Please choose a video that is 15 seconds or shorter.');
  }

  if (originalSize > MAX_VIDEO_BYTES) {
    throw new Error('Please choose a shorter or lower quality video (max 25 MB).');
  }

  return {
    uri: asset.uri,
    size: originalSize,
    shouldCleanup: false,
  };
};

const validateImage = async (asset: ImagePicker.ImagePickerAsset) => {
  const originalSize = await getFileSize(asset.uri, asset.fileSize);

  if (originalSize > MAX_IMAGE_BYTES) {
    throw new Error('Please choose an image under 5 MB.');
  }

  return originalSize;
};

export const requestMediaLibraryPermission = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return permission.granted;
};

export const pickProfileMedia = async () => {
  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    quality: 0.85,
    videoMaxDuration: 15,
    allowsEditing: false,
    presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
  });
};

export const uploadProfileMedia = async ({
  userId,
  asset,
  slot,
  onProgress,
}: {
  userId: string;
  asset: ImagePicker.ImagePickerAsset;
  slot: number;
  onProgress?: (progress: UploadProgress) => void;
}): Promise<ProfileMedia> => {
  const type = asset.type === 'video' ? 'video' : 'image';
  let processedUri = asset.uri;
  let processedSize = await getFileSize(asset.uri, asset.fileSize);
  let cleanupUri: string | null = null;

  try {
    if (type === 'video') {
      const processed = await validateVideo(asset);
      processedUri = processed.uri;
      processedSize = processed.size;
      cleanupUri = processed.shouldCleanup ? processed.uri : null;
    } else {
      processedSize = await validateImage(asset);
    }

    onProgress?.({ stage: 'uploading', progress: 0 });

    const ext = getFileExtension(asset, type);
    const path = `${userId}/media-${slot + 1}.${ext}`;
    const blob = await fetchBlob(processedUri);
    const contentType = asset.mimeType || (type === 'video' ? 'video/mp4' : 'image/jpeg');

    onProgress?.({ stage: 'uploading', progress: 0.35 });

    const { error } = await supabase.storage.from('avatars').upload(path, blob, {
      contentType,
      upsert: true,
    });

    if (error) throw error;

    onProgress?.({ stage: 'uploading', progress: 0.9 });

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const remoteUrl = data.publicUrl;
    onProgress?.({ stage: 'complete', progress: 1 });

    return {
      id: `media-${slot + 1}`,
      uri: remoteUrl,
      remoteUrl,
      type,
      fileName: asset.fileName || undefined,
      mimeType: asset.mimeType || undefined,
      fileSize: processedSize,
      durationMs: asset.duration,
    };
  } catch (error) {
    console.error('Profile media upload failed:', error);
    if (error instanceof Error) throw error;
    throw new Error('We could not upload that file. Please try again.');
  } finally {
    if (cleanupUri) {
      await FileSystem.deleteAsync(cleanupUri, { idempotent: true }).catch(() => {});
    }
  }
};
