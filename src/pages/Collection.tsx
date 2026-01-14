import React, { useState } from 'react';
import { getAllArtworks, getAllArtists, getArtistById } from '../data';
import ArtworkCard from '../components/gallery/ArtworkCard';
import type { ArtworkStatus } from '../types/gallery';
import { useTheme } from '../../App';

type FilterStatus = 'all' | ArtworkStatus;

const Collection: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const { isDarkMode } = useTheme();
  const artworks = getAllArtworks();
  const artists = getAllArtists();

  const filteredArtworks = statusFilter === 'all'
    ? artworks
    : artworks.filter(a => a.status === statusFilter);

  const statusOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All Works' },
    { value: 'available', label: 'Available' },
    { value: 'sold', label: 'Sold' },
  ];

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Collection
          </h1>
          <p className={`text-lg max-w-2xl ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
            Works by artists who deserve to be known. Prices displayed because the work has value.
          </p>
        </header>

        <div className="flex gap-4 mb-12">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === option.value
                  ? isDarkMode ? 'bg-white text-black' : 'bg-[#0F0F0F] text-white'
                  : isDarkMode ? 'bg-transparent text-white/60 hover:text-white' : 'bg-transparent text-[#6B6B6B] hover:text-[#0F0F0F]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredArtworks.map(artwork => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              artist={getArtistById(artwork.artistId)}
              showArtist
            />
          ))}
        </div>

        {filteredArtworks.length === 0 && (
          <div className="text-center py-24">
            <p className={isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}>No works match this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collection;
