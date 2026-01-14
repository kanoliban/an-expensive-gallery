import type { ArtworkDimensions, Currency } from '../types/gallery';

/**
 * Format price with confidence. No "Price on request" cowardice.
 * The number is the number.
 */
export function formatPrice(price: number, currency: Currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Format dimensions in standard art notation.
 * Height x Width (x Depth) in/cm
 */
export function formatDimensions(dimensions: ArtworkDimensions): string {
  const { height, width, depth, unit } = dimensions;

  if (depth) {
    return `${height} × ${width} × ${depth} ${unit}`;
  }

  return `${height} × ${width} ${unit}`;
}

/**
 * Format date for exhibition display
 */
export function formatExhibitionDates(startDate: string, endDate?: string): string {
  const start = new Date(startDate);
  const startFormatted = start.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (!endDate) {
    return `${startFormatted} – Ongoing`;
  }

  const end = new Date(endDate);
  const endFormatted = end.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `${startFormatted} – ${endFormatted}`;
}
