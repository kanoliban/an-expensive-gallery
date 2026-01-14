import React from 'react';
import { Link } from 'react-router-dom';
import type { Artwork, Artist } from '../../types/gallery';
import PriceDisplay from './PriceDisplay';
import TrimmedImage from './TrimmedImage';
import { useTheme } from '../../../App';

interface ArtworkCardProps {
  artwork: Artwork;
  artist?: Artist;
  showArtist?: boolean;
  className?: string;
}

const ArtworkCard: React.FC<ArtworkCardProps> = ({
  artwork,
  artist,
  showArtist = true,
  className = '',
}) => {
  const { isDarkMode } = useTheme();
  const primaryImage = artwork.images[0];

  return (
    <Link
      to={`/work/${artwork.id}`}
      className={`group block ${className}`}
    >
      <div className={`relative aspect-[4/5] overflow-hidden mb-4 ${isDarkMode ? 'bg-white/5' : 'bg-[#f5f5f5]'}`}>
        {primaryImage && (
          <TrimmedImage
            src={primaryImage.url}
            alt={primaryImage.alt || artwork.title}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {artwork.status !== 'available' && (
          <div className={`absolute inset-0 flex items-center justify-center ${isDarkMode ? 'bg-black/60' : 'bg-white/60'}`}>
            <span className={`text-sm font-medium tracking-wide uppercase ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
              {artwork.status === 'sold' ? 'Sold' : artwork.status === 'on_hold' ? 'On Hold' : 'Not for Sale'}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {showArtist && artist && (
          <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>{artist.name}</p>
        )}
        <h3 className="text-base font-medium group-hover:text-[#E85D35] transition-colors">
          <span className="italic">{artwork.title}</span>
          {artwork.year && <span className="not-italic">, {artwork.year}</span>}
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>{artwork.medium}</p>
        <div className="pt-2">
          <PriceDisplay
            price={artwork.price}
            currency={artwork.currency}
            status={artwork.status}
            size="sm"
          />
        </div>
      </div>
    </Link>
  );
};

export default ArtworkCard;
