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
