import React, { useEffect, useRef, useState } from 'react';

interface TrimmedImageProps {
  src: string;
  alt: string;
  className?: string;
  threshold?: number;
}

/**
 * Image component that automatically trims white/near-white borders.
 * Uses canvas to detect and crop whitespace from image edges.
 */
const TrimmedImage: React.FC<TrimmedImageProps> = ({
  src,
  alt,
  className = '',
  threshold = 250,
}) => {
  const [trimmedSrc, setTrimmedSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const trimmed = trimWhiteBorders(img, threshold);
      setTrimmedSrc(trimmed);
      setIsLoading(false);
    };

    img.onerror = () => {
      // Fallback to original image on error
      setTrimmedSrc(src);
      setIsLoading(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, threshold]);

  if (isLoading) {
    return <div className={className} />;
  }

  return (
    <img
      src={trimmedSrc || src}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
};

/**
 * Trims white/near-white borders from an image.
 * Scans edges to find content bounds and returns a data URL of the cropped image.
 */
function trimWhiteBorders(img: HTMLImageElement, threshold: number): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    // Fallback: return original
    canvas.width = img.width;
    canvas.height = img.height;
    const fallbackCtx = canvas.getContext('2d');
    if (fallbackCtx) {
      fallbackCtx.drawImage(img, 0, 0);
    }
    return canvas.toDataURL('image/jpeg', 0.92);
  }

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  const isWhitish = (r: number, g: number, b: number): boolean => {
    return r >= threshold && g >= threshold && b >= threshold;
  };

  const getPixel = (x: number, y: number): [number, number, number, number] => {
    const idx = (y * width + x) * 4;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  };

  // Scan for content bounds
  let top = 0;
  let bottom = height - 1;
  let left = 0;
  let right = width - 1;

  // Find top edge (scan from top)
  topScan: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(x, y);
      if (!isWhitish(r, g, b)) {
        top = y;
        break topScan;
      }
    }
  }

  // Find bottom edge (scan from bottom)
  bottomScan: for (let y = height - 1; y >= top; y--) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(x, y);
      if (!isWhitish(r, g, b)) {
        bottom = y;
        break bottomScan;
      }
    }
  }

  // Find left edge (scan from left)
  leftScan: for (let x = 0; x < width; x++) {
    for (let y = top; y <= bottom; y++) {
      const [r, g, b] = getPixel(x, y);
      if (!isWhitish(r, g, b)) {
        left = x;
        break leftScan;
      }
    }
  }

  // Find right edge (scan from right)
  rightScan: for (let x = width - 1; x >= left; x--) {
    for (let y = top; y <= bottom; y++) {
      const [r, g, b] = getPixel(x, y);
      if (!isWhitish(r, g, b)) {
        right = x;
        break rightScan;
      }
    }
  }

  // Calculate trimmed dimensions with small padding
  const padding = 2;
  const trimLeft = Math.max(0, left - padding);
  const trimTop = Math.max(0, top - padding);
  const trimRight = Math.min(width - 1, right + padding);
  const trimBottom = Math.min(height - 1, bottom + padding);

  const trimmedWidth = trimRight - trimLeft + 1;
  const trimmedHeight = trimBottom - trimTop + 1;

  // Only trim if we found significant borders (at least 3px on any side)
  const minTrimThreshold = 3;
  const hasBorders =
    trimLeft > minTrimThreshold ||
    trimTop > minTrimThreshold ||
    width - 1 - trimRight > minTrimThreshold ||
    height - 1 - trimBottom > minTrimThreshold;

  if (!hasBorders || trimmedWidth <= 0 || trimmedHeight <= 0) {
    // No significant borders found, return original
    return canvas.toDataURL('image/jpeg', 0.92);
  }

  // Create trimmed canvas
  const trimmedCanvas = document.createElement('canvas');
  trimmedCanvas.width = trimmedWidth;
  trimmedCanvas.height = trimmedHeight;

  const trimmedCtx = trimmedCanvas.getContext('2d');
  if (!trimmedCtx) {
    return canvas.toDataURL('image/jpeg', 0.92);
  }

  trimmedCtx.drawImage(
    canvas,
    trimLeft,
    trimTop,
    trimmedWidth,
    trimmedHeight,
    0,
    0,
    trimmedWidth,
    trimmedHeight
  );

  return trimmedCanvas.toDataURL('image/jpeg', 0.92);
}

export default TrimmedImage;
