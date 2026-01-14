import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getArtworkById, getArtistById } from '../data';
import { useTheme } from '../../App';

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const Inquire: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { isDarkMode } = useTheme();
  const artworkId = searchParams.get('artwork');
  const artwork = artworkId ? getArtworkById(artworkId) : undefined;
  const artist = artwork ? getArtistById(artwork.artistId) : undefined;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: artwork
      ? `I'm interested in "${artwork.title}" by ${artist?.name || 'the artist'}.`
      : '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would submit to Formspree or similar
    console.log('Inquiry submitted:', { ...formData, artworkId });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Thank you for your inquiry
          </h1>
          <p className={`text-lg mb-8 ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
            We'll be in touch shortly.
          </p>
          <Link
            to="/collection"
            className="text-[#E85D35] hover:underline"
          >
            Continue browsing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-2xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Inquire
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
            Interested in a work? Tell us about yourself and we'll be in touch.
          </p>
        </header>

        {artwork && artist && (
          <div className={`mb-12 p-6 ${isDarkMode ? 'bg-white/5' : 'bg-[#f5f5f5]'}`}>
            <p className={`text-sm mb-2 ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>Inquiring about:</p>
            <Link
              to={`/work/${artwork.id}`}
              className="hover:text-[#E85D35] transition-colors"
            >
              <span className="font-medium">{artist.name}</span>
              <span className="mx-2">—</span>
              <span className="italic">{artwork.title}</span>
              {artwork.year && <span>, {artwork.year}</span>}
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border transition-colors focus:outline-none ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 focus:border-white/30 text-white'
                  : 'border-[#e5e5e5] focus:border-[#0F0F0F]'
              }`}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border transition-colors focus:outline-none ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 focus:border-white/30 text-white'
                  : 'border-[#e5e5e5] focus:border-[#0F0F0F]'
              }`}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">
              Phone <span className={isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}>(optional)</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-4 py-3 border transition-colors focus:outline-none ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 focus:border-white/30 text-white'
                  : 'border-[#e5e5e5] focus:border-[#0F0F0F]'
              }`}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              value={formData.message}
              onChange={handleChange}
              className={`w-full px-4 py-3 border transition-colors focus:outline-none resize-none ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 focus:border-white/30 text-white'
                  : 'border-[#e5e5e5] focus:border-[#0F0F0F]'
              }`}
            />
          </div>

          <button
            type="submit"
            className={`w-full px-6 py-4 font-medium transition-colors ${
              isDarkMode
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-[#0F0F0F] text-white hover:bg-[#1a1a1a]'
            }`}
          >
            Send Inquiry
          </button>
        </form>
      </div>
    </div>
  );
};

export default Inquire;
