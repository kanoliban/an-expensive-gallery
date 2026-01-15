import type { Artist, Artwork, Exhibition, GalleryInfo } from '../types/gallery';

import artistsData from './artists.json';
import artworksData from './artworks.json';
import exhibitionsData from './exhibitions.json';
import galleryData from './gallery.json';

// Type assertions at the boundary
export const artists: Artist[] = artistsData as Artist[];
export const artworks: Artwork[] = artworksData as Artwork[];
export const exhibitions: Exhibition[] = exhibitionsData as Exhibition[];
export const gallery: GalleryInfo = galleryData as GalleryInfo;

// Artist queries
export function getArtistById(id: string): Artist | undefined {
  return artists.find(a => a.id === id);
}

export function getArtistBySlug(slug: string): Artist | undefined {
  return artists.find(a => a.slug === slug);
}

export function getFeaturedArtists(): Artist[] {
  return artists.filter(a => a.featured);
}

export function getAllArtists(): Artist[] {
  // Flahn Manly (artist-004) should always appear first
  return [...artists].sort((a, b) => {
    if (a.id === 'artist-004') return -1;
    if (b.id === 'artist-004') return 1;
    return 0;
  });
}

// Artwork queries
export function getArtworkById(id: string): Artwork | undefined {
  return artworks.find(a => a.id === id);
}

export function getArtworksByArtist(artistId: string): Artwork[] {
  return artworks
    .filter(a => a.artistId === artistId)
    .sort((a, b) => a.order - b.order);
}

export function getFeaturedArtworks(limit?: number): Artwork[] {
  const featured = artworks
    .filter(a => a.featured)
    .sort((a, b) => a.order - b.order);
  return limit ? featured.slice(0, limit) : featured;
}

export function getAvailableArtworks(): Artwork[] {
  return artworks.filter(a => a.status === 'available');
}

export function getAllArtworks(): Artwork[] {
  // Sort by order field, with Flahn Manly's works (artist-004) prioritized first
  return [...artworks].sort((a, b) => {
    // Flahn's works come first
    if (a.artistId === 'artist-004' && b.artistId !== 'artist-004') return -1;
    if (b.artistId === 'artist-004' && a.artistId !== 'artist-004') return 1;
    // Then sort by order
    return a.order - b.order;
  });
}

// Exhibition queries
export function getExhibitionById(id: string): Exhibition | undefined {
  return exhibitions.find(e => e.id === id);
}

export function getExhibitionBySlug(slug: string): Exhibition | undefined {
  return exhibitions.find(e => e.slug === slug);
}

export function getCurrentExhibitions(): Exhibition[] {
  return exhibitions.filter(e => e.status === 'current');
}

export function getPastExhibitions(): Exhibition[] {
  return exhibitions.filter(e => e.status === 'past');
}

export function getUpcomingExhibitions(): Exhibition[] {
  return exhibitions.filter(e => e.status === 'upcoming');
}

// Combined queries
export function getArtworkWithArtist(artworkId: string): { artwork: Artwork; artist: Artist } | undefined {
  const artwork = getArtworkById(artworkId);
  if (!artwork) return undefined;

  const artist = getArtistById(artwork.artistId);
  if (!artist) return undefined;

  return { artwork, artist };
}

export function getExhibitionWithDetails(exhibitionId: string): {
  exhibition: Exhibition;
  artworks: Artwork[];
  artists: Artist[];
} | undefined {
  const exhibition = getExhibitionById(exhibitionId);
  if (!exhibition) return undefined;

  const exhibitionArtworks = exhibition.artworkIds
    .map(id => getArtworkById(id))
    .filter((a): a is Artwork => a !== undefined);

  const exhibitionArtists = exhibition.artistIds
    .map(id => getArtistById(id))
    .filter((a): a is Artist => a !== undefined);

  return {
    exhibition,
    artworks: exhibitionArtworks,
    artists: exhibitionArtists,
  };
}

// Gallery info
export function getGalleryInfo(): GalleryInfo {
  return gallery;
}
