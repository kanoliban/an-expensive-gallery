import React from 'react';
import { Link } from 'react-router-dom';
import { getGalleryInfo } from '../data';
import { useTheme } from '../../App';

const About: React.FC = () => {
  const gallery = getGalleryInfo();
  const { isDarkMode } = useTheme();

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto md:max-w-2xl">
        <header className="mb-16 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            About
          </h1>
        </header>

        <div className="space-y-16">
          <section className="text-center">
            <h2 className="text-2xl font-bold tracking-tight mb-6">The Gallery</h2>
            <p className="text-lg leading-relaxed mb-6 text-pretty">
              {gallery.description}
            </p>
            <p
              className={`text-lg leading-relaxed italic text-pretty ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              {gallery.philosophy}
            </p>
          </section>

          <section className="text-center">
            <h2 className="text-2xl font-bold tracking-tight mb-6">The Approach</h2>
            <div className="space-y-6 text-lg leading-relaxed">
              <p className="text-pretty">
                We show prices because the work has value. No "price on request" —
                that's a conversation about money disguised as discretion.
                The number is the number.
              </p>
              <p
                className={`italic text-pretty ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}
                style={{ fontFamily: '"Cormorant Garamond", serif' }}
              >
                Every artist here was chosen because their work deserves to be seen
                and valued. Not because of their followers, their gallery representation,
                or their auction results. Because the work speaks.
              </p>
            </div>
          </section>

          {gallery.curatorName && (
            <section className="text-center">
              <h2 className="text-2xl font-bold tracking-tight mb-6">The Curator</h2>
              <p className="text-2xl font-medium mb-4">{gallery.curatorName}</p>
              {gallery.curatorBio && (
                <p
                  className={`text-lg leading-relaxed italic text-pretty ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}
                  style={{ fontFamily: '"Cormorant Garamond", serif' }}
                >
                  {gallery.curatorBio}
                </p>
              )}
            </section>
          )}

          <section className="text-center">
            <h2 className="text-2xl font-bold tracking-tight mb-6">Contact</h2>
            <div className="space-y-4">
              {gallery.contact.email && (
                <p>
                  <span className={isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}>Email: </span>
                  <a
                    href={`mailto:${gallery.contact.email}`}
                    className="hover:text-[#E85D35] transition-colors"
                  >
                    {gallery.contact.email}
                  </a>
                </p>
              )}
              {gallery.contact.location && (
                <p>
                  <span className={isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}>Location: </span>
                  <span>{gallery.contact.location}</span>
                </p>
              )}
            </div>
          </section>

          <section className={`pt-8 border-t text-center ${isDarkMode ? 'border-white/10' : 'border-[#e5e5e5]'}`}>
            <p
              className={`mb-6 italic text-pretty ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              Interested in a specific work?
            </p>
            <Link
              to="/inquire"
              className={`inline-flex items-center px-6 py-3 font-medium transition-colors ${
                isDarkMode
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-[#0F0F0F] text-white hover:bg-[#1a1a1a]'
              }`}
            >
              Make an Inquiry
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
