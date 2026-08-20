export interface OptimizationOptions {
  format?: "webp" | "jpeg" | "png" | "original";
  quality?: number; // 0.1 to 1.0 (default: 0.85)
  maxWidth?: number;
  maxHeight?: number;
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface OptimizationResult {
  blob: Blob;
  fileName: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  reductionPercent: number;
}

/**
 * Calculates scaled dimensions ensuring values are clamped to original max dimensions
 * and preserves aspect ratio when requested.
 */
export function calculateScaledDimensions(
  origWidth: number,
  origHeight: number,
  targetWidth?: number,
  targetHeight?: number,
  maintainAspectRatio = true,
): { width: number; height: number } {
  if (!origWidth || !origHeight || origWidth <= 0 || origHeight <= 0) {
    return { width: 1, height: 1 };
  }

  let w = targetWidth && targetWidth > 0 ? Math.min(Math.round(targetWidth), origWidth) : origWidth;
  let h = targetHeight && targetHeight > 0 ? Math.min(Math.round(targetHeight), origHeight) : origHeight;

  if (maintainAspectRatio) {
    const ratio = origWidth / origHeight;
    if (targetWidth && (!targetHeight || targetHeight >= origHeight)) {
      w = Math.min(Math.round(targetWidth), origWidth);
      h = Math.round(w / ratio);
    } else if (targetHeight && (!targetWidth || targetWidth >= origWidth)) {
      h = Math.min(Math.round(targetHeight), origHeight);
      w = Math.round(h * ratio);
    } else if (targetWidth && targetHeight) {
      const widthScale = targetWidth / origWidth;
      const heightScale = targetHeight / origHeight;
      const scale = Math.min(widthScale, heightScale, 1.0);
      w = Math.round(origWidth * scale);
      h = Math.round(origHeight * scale);
    }
  }

  return {
    width: Math.max(1, Math.min(w, origWidth)),
    height: Math.max(1, Math.min(h, origHeight)),
  };
}

/**
 * Normalizes output file name with appropriate extension for the converted format.
 */
export function getOptimizedFileName(originalName: string, format: "webp" | "jpeg" | "png" | "original"): string {
  const cleanName = originalName.replace(/\.[^/.]+$/, "");
  if (format === "webp") return `${cleanName}.webp`;
  if (format === "jpeg") return `${cleanName}.jpg`;
  if (format === "png") return `${cleanName}.png`;
  return originalName;
}

/**
 * Formats reduction percentage cleanly.
 */
export function calculateReduction(originalBytes: number, optimizedBytes: number): number {
  if (originalBytes <= 0 || optimizedBytes >= originalBytes) return 0;
  return Math.round(((originalBytes - optimizedBytes) / originalBytes) * 100);
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Validates and clamps a crop box within original image boundaries.
 */
export function clampCropRect(crop: CropRect, imageWidth: number, imageHeight: number): CropRect {
  const x = Math.max(0, Math.min(Math.round(crop.x), imageWidth - 1));
  const y = Math.max(0, Math.min(Math.round(crop.y), imageHeight - 1));
  const width = Math.max(1, Math.min(Math.round(crop.width), imageWidth - x));
  const height = Math.max(1, Math.min(Math.round(crop.height), imageHeight - y));
  return { x, y, width, height };
}

/**
 * Calculates initial crop rectangle based on a target aspect ratio preset.
 * Preset ratios: "1:1" | "16:9" | "4:3" | "3:2" | "21:9" | "free"
 */
export function getPresetCropRect(imageWidth: number, imageHeight: number, ratioPreset: string): CropRect {
  if (ratioPreset === "free" || !ratioPreset) {
    return { x: 0, y: 0, width: imageWidth, height: imageHeight };
  }

  const parts = ratioPreset.split(":").map(Number);
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1]) || parts[1] <= 0) {
    return { x: 0, y: 0, width: imageWidth, height: imageHeight };
  }

  const targetRatio = parts[0] / parts[1];
  const imageRatio = imageWidth / imageHeight;

  let width: number;
  let height: number;

  if (imageRatio > targetRatio) {
    // Image is wider than target ratio: scale by height
    height = imageHeight;
    width = Math.round(height * targetRatio);
  } else {
    // Image is taller than target ratio: scale by width
    width = imageWidth;
    height = Math.round(width / targetRatio);
  }

  const x = Math.round((imageWidth - width) / 2);
  const y = Math.round((imageHeight - height) / 2);

  return clampCropRect({ x, y, width, height }, imageWidth, imageHeight);
}

