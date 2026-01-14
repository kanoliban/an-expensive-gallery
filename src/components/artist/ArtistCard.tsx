import React from 'react';
import { Link } from 'react-router-dom';
import type { Artist } from '../../types/gallery';
import { useTheme } from '../../../App';

interface ArtistCardProps {
  artist: Artist;
  className?: string;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, className = '' }) => {
  const { isDarkMode } = useTheme();

  return (
    <Link
      to={`/artists/${artist.slug}`}
      className={`group block ${className}`}
    >
      <div className={`relative aspect-[3/4] overflow-hidden mb-4 ${isDarkMode ? 'bg-white/5' : 'bg-[#f5f5f5]'}`}>
        {artist.portraitUrl && (
          <img
            src={artist.portraitUrl}
            alt={artist.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-medium group-hover:text-[#E85D35] transition-colors">
          {artist.name}
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
          {artist.nationality && `${artist.nationality}`}
          {artist.birthYear && `, b. ${artist.birthYear}`}
        </p>
        {artist.basedIn && (
          <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>Based in {artist.basedIn}</p>
        )}
      </div>
    </Link>
  );
};

export default ArtistCard;
