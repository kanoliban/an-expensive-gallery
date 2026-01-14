import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArtistBySlug, getArtworksByArtist } from '../data';
import ArtworkCard from '../components/gallery/ArtworkCard';
import { useTheme } from '../../App';

const ArtistDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isDarkMode } = useTheme();
  const artist = slug ? getArtistBySlug(slug) : undefined;

  if (!artist) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-medium mb-4">Artist not found</h1>
          <Link to="/artists" className="text-[#E85D35] hover:underline">
            View all artists
          </Link>
        </div>
      </div>
    );
  }

  const artworks = getArtworksByArtist(artist.id);

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-24">
          <div className="lg:col-span-1">
            {artist.portraitUrl && (
              <div className={`aspect-[3/4] mb-8 ${isDarkMode ? 'bg-white/5' : 'bg-[#f5f5f5]'}`}>
                <img
                  src={artist.portraitUrl}
                  alt={artist.name}
                  className="size-full object-cover"
                />
              </div>
            )}

            <div className={`space-y-2 text-sm ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
              {artist.nationality && (
                <p>{artist.nationality}{artist.birthYear && `, b. ${artist.birthYear}`}</p>
              )}
              {artist.basedIn && <p>Based in {artist.basedIn}</p>}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">
              {artist.name}
            </h1>

            {artist.biography && (
              <div className="mb-12">
                <p className="text-lg leading-relaxed">
                  {artist.biography}
                </p>
              </div>
            )}

            {artist.artistStatement && (
              <div className="border-l-2 border-[#E85D35] pl-6">
                <p className={`italic leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
                  "{artist.artistStatement}"
                </p>
              </div>
            )}
          </div>
        </div>

        {artworks.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-8">
              Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {artworks.map(artwork => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  artist={artist}
                  showArtist={false}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ArtistDetail;
