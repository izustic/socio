import { useState } from 'react';
import { uploadChatMedia } from '@/src/services/supabase';
import { tx } from '@/src/utils/localization';

interface MediaUploadOptions {
  circleId: string;
  messageId: string;
  maxSize?: {
    image: number; // bytes
    video: number; // bytes
    audio: number; // bytes
  };
}

export function useMediaUpload(options: MediaUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const maxSize = {
    image: 5 * 1024 * 1024, // 5MB
    video: 50 * 1024 * 1024, // 50MB
    audio: 10 * 1024 * 1024, // 10MB
    ...options.maxSize,
  };

  const validateMedia = (uri: string, type: 'image' | 'video' | 'audio') => {
    // TODO: Implement media validation
    // This would check file size, format, etc.
    return true;
  };

  const uploadMedia = async (uri: string, type: 'image' | 'video' | 'audio') => {
    if (!validateMedia(uri, type)) {
      setError(tx("upload.invalidMedia"));
      return null;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const downloadUrl = await uploadChatMedia(
        options.circleId,
        options.messageId,
        uri,
        type
      );
      
      setProgress(100);
      return downloadUrl;
    } catch (error) {
      console.error('Upload error:', error);
      setError(tx("upload.mediaFailed"));
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
    uploadMedia,
    uploading,
    progress,
    error,
    reset,
    maxSize,
  };
}
