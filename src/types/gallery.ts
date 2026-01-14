export interface Artist {
  id: string;
  slug: string;
  name: string;
  birthYear?: number;
  nationality?: string;
  basedIn?: string;
  biography: string;
  artistStatement?: string;
  portraitUrl?: string;
  websiteUrl?: string;
  instagramHandle?: string;
  featured: boolean;
  createdAt: string;
}

export interface ArtworkImage {
  url: string;
  alt: string;
  isPrimary: boolean;
  aspectRatio: number;
}

export interface ArtworkDimensions {
  height: number;
  width: number;
  depth?: number;
  unit: 'in' | 'cm';
}

export type ArtworkStatus = 'available' | 'sold' | 'on_hold' | 'not_for_sale';
export type Currency = 'USD' | 'EUR' | 'GBP';

export interface Artwork {
  id: string;
  artistId: string;
  title: string;
  year: number;
  medium: string;
  dimensions: ArtworkDimensions;
  price: number;
  currency: Currency;
  status: ArtworkStatus;
  images: ArtworkImage[];
  description?: string;
  provenance?: string;
  exhibitionHistory?: string[];
  featured: boolean;
  order: number;
}

export type ExhibitionStatus = 'upcoming' | 'current' | 'past';

export interface Exhibition {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  curatorStatement: string;
  startDate: string;
  endDate?: string;
  coverImageUrl: string;
  artworkIds: string[];
  artistIds: string[];
  pressRelease?: string;
  status: ExhibitionStatus;
}

export interface GalleryInfo {
  name: string;
  tagline: string;
  description: string;
  philosophy: string;
  curatorName: string;
  curatorBio: string;
  contact: {
    email: string;
    phone?: string;
    location?: string;
  };
  socialLinks: {
    instagram?: string;
    twitter?: string;
  };
}

export interface Inquiry {
  id: string;
  artworkId?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'closed';
}
