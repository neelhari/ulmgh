/**
 * Client-Side Image Compressor
 * Resizes and compresses images in the browser before network upload.
 * Works natively on Android, iOS, Windows, Mac (Chrome, Safari, Firefox, Edge, WebViews).
 * 
 * @param {File} file - The file selected from input
 * @param {object} [options]
 * @param {number} [options.maxDimension=1600] - Maximum width or height in pixels
 * @param {number} [options.quality=0.85] - JPEG quality between 0 and 1
 * @param {number} [options.maxSizeMB=1.0] - Files below this size are skipped without processing
 * @returns {Promise<File>} - Compressed File object, or original if already small / non-image
 */
export async function compressImage(file, options = {}) {
  if (!file || !(file instanceof File)) return file;

  // Only compress images, skip SVGs, GIFs (to preserve animations), and documents (PDFs)
  if (!file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  const {
    maxDimension = 1600,
    quality = 0.85,
    maxSizeMB = 1.0,
  } = options;

  // If already under maxSizeMB (e.g. 1MB), skip compression to save CPU
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file); // Fallback to original on error
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(file); // Fallback to original on error
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // If dimensions are within maxDimension and file is reasonably sized, return
        if (width <= maxDimension && height <= maxDimension && file.size <= 2 * 1024 * 1024) {
          return resolve(file);
        }

        // Calculate aspect-ratio-preserving dimensions
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        // High quality bicubic resampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // If compression didn't save bytes, return original
              return resolve(file);
            }

            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
