/**
 * Compress an image file to a base64 JPEG data URL.
 * Mobile cameras shoot 4-15 MB photos which exceed our 10 MB API
 * payload limit after base64 encoding. Payment screenshots only need
 * to be readable, not photographic — so we downscale to ~1600px max
 * dimension at 80% JPEG quality. Typical 8 MB iPhone photo → 200-500 KB.
 */
export function compressImage(file, opts = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    mimeType = 'image/jpeg'
  } = opts;

  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));
    if (!file.type || !file.type.startsWith('image/')) {
      return reject(new Error('Not an image file'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        // White background so transparent PNGs don't go black after JPEG conversion
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Approximate the byte size of a base64 data URL (decoded payload).
 */
export function base64ByteSize(dataUrl) {
  if (typeof dataUrl !== 'string') return 0;
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const padding = (b64.match(/=+$/) || [''])[0].length;
  return Math.floor((b64.length * 3) / 4) - padding;
}
