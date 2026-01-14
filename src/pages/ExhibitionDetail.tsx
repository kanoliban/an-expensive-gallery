import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getExhibitionBySlug, getArtworkById, getArtistById } from '../data';
import ArtworkCard from '../components/gallery/ArtworkCard';
import { useTheme } from '../../App';

const ExhibitionDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isDarkMode } = useTheme();
  const exhibition = slug ? getExhibitionBySlug(slug) : undefined;

  if (!exhibition) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-medium mb-4">Exhibition not found</h1>
          <Link to="/exhibitions" className="text-[#E85D35] hover:underline">
            View all exhibitions
          </Link>
        </div>
      </div>
    );
  }

  const artworks = exhibition.artworkIds
    .map(id => getArtworkById(id))
    .filter((a): a is NonNullable<typeof a> => a !== undefined);

  const artists = exhibition.artistIds
    .map(id => getArtistById(id))
    .filter((a): a is NonNullable<typeof a> => a !== undefined);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-16">
          <Link
            to="/exhibitions"
            className={`text-sm transition-colors mb-6 inline-block ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-[#6B6B6B] hover:text-[#0F0F0F]'}`}
          >
            ← All Exhibitions
          </Link>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            {exhibition.title}
          </h1>

          {exhibition.subtitle && (
            <p className={`text-xl mb-6 ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>{exhibition.subtitle}</p>
          )}

          <p className={isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}>
            {formatDate(exhibition.startDate)}
            {exhibition.endDate && ` — ${formatDate(exhibition.endDate)}`}
          </p>
        </header>

        {/* Cover Image */}
        {exhibition.coverImageUrl && (
          <div className={`aspect-[21/9] mb-16 overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-[#f5f5f5]'}`}>
            <img
              src={exhibition.coverImageUrl}
              alt={exhibition.title}
              className="size-full object-cover"
            />
          </div>
        )}

        {/* Curator Statement */}
        <section className="max-w-3xl mb-20">
          <h2 className={`text-sm font-medium uppercase tracking-wide mb-6 ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
            Curatorial Statement
          </h2>
          <div className="space-y-6">
            {exhibition.curatorStatement.split('\n\n').map((paragraph, i) => (
              <p key={i} className="text-lg leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {/* Featured Artists */}
        {artists.length > 0 && (
          <section className="mb-20">
            <h2 className={`text-sm font-medium uppercase tracking-wide mb-6 ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
              Featured Artists
            </h2>
            <div className="flex flex-wrap gap-4">
              {artists.map(artist => (
                <Link
                  key={artist.id}
                  to={`/artists/${artist.slug}`}
                  className={`px-4 py-2 transition-colors text-sm ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-[#f5f5f5] hover:bg-[#e5e5e5]'}`}
                >
                  {artist.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Works in Exhibition */}
        {artworks.length > 0 && (
          <section>
            <h2 className={`text-sm font-medium uppercase tracking-wide mb-8 ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
              Works in Exhibition
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {artworks.map(artwork => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  artist={getArtistById(artwork.artistId)}
                  showArtist
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ExhibitionDetail;
