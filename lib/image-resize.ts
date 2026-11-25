/**
 * Center-crops an image file to a square and resizes it to `size` px,
 * returning a compact JPEG data URL suitable for storing in the database.
 */
export async function resizeImageToDataUrl(file: File, size = 256, quality = 0.85): Promise<string> {
  if (!/^image\/(jpeg|png|webp|gif|heic|heif)$/i.test(file.type)) {
    throw new Error('Please choose a JPG, PNG or WebP image.');
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('That image is too large (max 15 MB).');
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Couldn't read that image."));
      el.src = url;
    });

    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image processing is not supported in this browser.');
    ctx.fillStyle = '#ffffff'; // flatten transparent PNGs onto white
    ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
