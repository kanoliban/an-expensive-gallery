import React from 'react';
import { getAllArtists } from '../data';
import ArtistCard from '../components/artist/ArtistCard';
import { useTheme } from '../../App';

const ArtistsIndex: React.FC = () => {
  const artists = getAllArtists();
  const { isDarkMode } = useTheme();

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Artists
          </h1>
          <p className={`text-lg max-w-2xl ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
            The unheard of greats. Artists whose work speaks for itself.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {artists.map(artist => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArtistsIndex;
