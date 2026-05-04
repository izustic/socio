import { useState } from 'react';
import { uploadAvatar } from '@/src/services/supabase';

interface ImageUploadOptions {
  maxSize?: number; // bytes, default 5MB
  allowedFormats?: string[];
  maxItems?: number;
}

export function useImageUpload(options: ImageUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
  const allowedFormats = options.allowedFormats || ['jpg', 'jpeg', 'png', 'webp'];
  const maxItems = options.maxItems || 5;

  const validateImage = (uri: string) => {
    // TODO: Implement image validation
    // This would check file size, format, dimensions, etc.
    return true;
  };

  const uploadImages = async (userId: string, imageUris: string[]) => {
    if (imageUris.length > maxItems) {
      setError(`Maximum ${maxItems} images allowed`);
      return null;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const uploadPromises = imageUris.map(async (uri, index) => {
        if (!validateImage(uri)) {
          throw new Error(`Invalid image at index ${index}`);
        }

        const downloadUrl = await uploadAvatar(userId, uri);
        setProgress(((index + 1) / imageUris.length) * 100);
        return downloadUrl;
      });

      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Image upload error:', error);
      setError('Failed to upload images');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadSingleImage = async (userId: string, imageUri: string) => {
    if (!validateImage(imageUri)) {
      setError('Invalid image file');
      return null;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const downloadUrl = await uploadAvatar(userId, imageUri);
      setProgress(100);
      return downloadUrl;
    } catch (error) {
      console.error('Single image upload error:', error);
      setError('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setUploading(false);
    setProgress(0);
    setError(null);
  };

  return {
    uploadImages,
    uploadSingleImage,
    uploading,
    progress,
    error,
    reset,
    maxSize,
    allowedFormats,
    maxItems,
  };
}
