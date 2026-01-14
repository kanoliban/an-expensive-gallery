import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArtworkById, getArtistById, getArtworksByArtist } from '../data';
import { formatDimensions } from '../utils/format';
import PriceDisplay from '../components/gallery/PriceDisplay';
import InquiryButton from '../components/gallery/InquiryButton';
import ArtworkCard from '../components/gallery/ArtworkCard';
import { useTheme } from '../../App';

const ArtworkDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isDarkMode } = useTheme();
  const artwork = id ? getArtworkById(id) : undefined;
  const artist = artwork ? getArtistById(artwork.artistId) : undefined;

  if (!artwork) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-medium mb-4">Work not found</h1>
          <Link to="/collection" className="text-[#E85D35] hover:underline">
            Return to collection
          </Link>
        </div>
      </div>
    );
  }

  const primaryImage = artwork.images[0];
  const otherWorks = artist
    ? getArtworksByArtist(artist.id).filter(a => a.id !== artwork.id).slice(0, 4)
    : [];

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className={`aspect-square ${isDarkMode ? 'bg-white/5' : 'bg-[#f5f5f5]'}`}>
            {primaryImage && (
              <img
                src={primaryImage.url}
                alt={primaryImage.alt || artwork.title}
                className="size-full object-contain"
              />
            )}
          </div>

          <div className="lg:py-8">
            {artist && (
              <Link
                to={`/artists/${artist.slug}`}
                className={`mb-2 block transition-colors ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-[#6B6B6B] hover:text-[#0F0F0F]'}`}
              >
                {artist.name}
              </Link>
            )}

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              <span className="italic">{artwork.title}</span>
              {artwork.year && <span className="not-italic">, {artwork.year}</span>}
            </h1>

            <div className="space-y-4 mt-8 mb-12">
              <div>
                <span className={`text-sm block mb-1 ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>Medium</span>
                <span>{artwork.medium}</span>
              </div>

              <div>
                <span className={`text-sm block mb-1 ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>Dimensions</span>
                <span>{formatDimensions(artwork.dimensions)}</span>
              </div>

              <div>
                <span className={`text-sm block mb-1 ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>Price</span>
                <PriceDisplay
                  price={artwork.price}
                  currency={artwork.currency}
                  status={artwork.status}
                  size="lg"
                />
              </div>
            </div>

            {artwork.status === 'available' && (
              <InquiryButton artworkId={artwork.id} size="lg" />
            )}

            {artwork.status === 'sold' && (
              <p className={isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}>
                This work has found its home.{' '}
                <Link to="/collection" className="text-[#E85D35] hover:underline">
                  View available works
                </Link>
              </p>
            )}

            {artwork.status === 'on_hold' && (
              <p className={isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}>
                This work is currently on hold.{' '}
                <Link to={`/inquire?artwork=${artwork.id}`} className="text-[#E85D35] hover:underline">
                  Join waitlist
                </Link>
              </p>
            )}
          </div>
        </div>

        {otherWorks.length > 0 && artist && (
          <section className="mt-24">
            <h2 className="text-2xl font-bold tracking-tight mb-8">
              More by {artist.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {otherWorks.map(work => (
                <ArtworkCard
                  key={work.id}
                  artwork={work}
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

export default ArtworkDetail;
