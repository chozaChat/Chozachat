// Image compression utility with subscription-based limits

export interface CompressionLimits {
  maxUploadSize: number; // in MB
  maxCompressedSize: number; // in KB
}

export const SUBSCRIPTION_LIMITS = {
  base: {
    messages: { maxUploadSize: 5, maxCompressedSize: 75 },
    stickers: { maxUploadSize: 5, maxCompressedSize: 50 }
  },
  boost: {
    messages: { maxUploadSize: 10, maxCompressedSize: 100 },
    stickers: { maxUploadSize: 10, maxCompressedSize: 75 }
  },
  ultra: {
    messages: { maxUploadSize: 15, maxCompressedSize: 150 },
    stickers: { maxUploadSize: 15, maxCompressedSize: 100 }
  }
};

export async function compressImage(
  file: File,
  targetSizeKB: number,
  type: 'messages' | 'stickers' = 'messages'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      // For stickers, limit to 512x512 max
      // For messages, limit to 1920x1920 max
      const maxDimension = type === 'stickers' ? 512 : 1920;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Binary search for optimal quality
      let quality = 0.9;
      let attempts = 0;
      const maxAttempts = 10;

      const tryCompress = (q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const sizeKB = blob.size / 1024;

            // If within 10% of target or close enough, use it
            if (sizeKB <= targetSizeKB * 1.1 || attempts >= maxAttempts) {
              resolve(blob);
            } else if (sizeKB > targetSizeKB) {
              // Too large, reduce quality
              attempts++;
              quality = q * 0.8;
              tryCompress(quality);
            } else {
              // Too small, increase quality slightly
              attempts++;
              quality = Math.min(q * 1.1, 0.95);
              tryCompress(quality);
            }
          },
          'image/jpeg',
          q
        );
      };

      tryCompress(quality);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    reader.readAsDataURL(file);
  });
}

export function getSubscriptionTier(subscription?: {
  tier: 'boost' | 'ultra' | null;
  expiresAt?: string;
}): 'base' | 'boost' | 'ultra' {
  if (!subscription?.tier) return 'base';

  // Check if subscription is expired
  if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) {
    return 'base';
  }

  return subscription.tier;
}

export function getLimits(
  subscriptionTier: 'base' | 'boost' | 'ultra',
  type: 'messages' | 'stickers'
): CompressionLimits {
  return SUBSCRIPTION_LIMITS[subscriptionTier][type];
}
