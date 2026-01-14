import React from 'react';
import { Link } from 'react-router-dom';
import { getCurrentExhibitions, getPastExhibitions, getUpcomingExhibitions } from '../data';
import { useTheme } from '../../App';

const Exhibitions: React.FC = () => {
  const current = getCurrentExhibitions();
  const upcoming = getUpcomingExhibitions();
  const past = getPastExhibitions();
  const { isDarkMode } = useTheme();

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
        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Exhibitions
          </h1>
          <p className={`text-lg max-w-2xl ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
            Curated presentations of work that demands attention.
          </p>
        </header>

        {current.length > 0 && (
          <section className="mb-20">
            <h2 className={`text-sm font-medium uppercase tracking-wide mb-8 ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
              Current
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {current.map(exhibition => (
                <Link
                  key={exhibition.id}
                  to={`/exhibitions/${exhibition.slug}`}
                  className="group block"
                >
                  <div className={`aspect-[16/10] mb-6 overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-[#f5f5f5]'}`}>
                    {exhibition.coverImageUrl && (
                      <img
                        src={exhibition.coverImageUrl}
                        alt={exhibition.title}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-2 group-hover:text-[#E85D35] transition-colors">
                    {exhibition.title}
                  </h3>
                  {exhibition.subtitle && (
                    <p className={`mb-2 ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>{exhibition.subtitle}</p>
                  )}
                  <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
                    {formatDate(exhibition.startDate)}
                    {exhibition.endDate && ` — ${formatDate(exhibition.endDate)}`}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section className="mb-20">
            <h2 className={`text-sm font-medium uppercase tracking-wide mb-8 ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
              Upcoming
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {upcoming.map(exhibition => (
                <div key={exhibition.id} className="block">
                  <div className={`aspect-[16/10] mb-6 overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-[#f5f5f5]'}`}>
                    {exhibition.coverImageUrl && (
                      <img
                        src={exhibition.coverImageUrl}
                        alt={exhibition.title}
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-2">
                    {exhibition.title}
                  </h3>
                  {exhibition.subtitle && (
                    <p className={`mb-2 ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>{exhibition.subtitle}</p>
                  )}
                  <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
                    Opens {formatDate(exhibition.startDate)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <h2 className={`text-sm font-medium uppercase tracking-wide mb-8 ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
              Past
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {past.map(exhibition => (
                <Link
                  key={exhibition.id}
                  to={`/exhibitions/${exhibition.slug}`}
                  className="group block"
                >
                  <div className={`aspect-[16/10] mb-4 overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-[#f5f5f5]'}`}>
                    {exhibition.coverImageUrl && (
                      <img
                        src={exhibition.coverImageUrl}
                        alt={exhibition.title}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <h3 className="text-lg font-medium mb-1 group-hover:text-[#E85D35] transition-colors">
                    {exhibition.title}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
                    {formatDate(exhibition.startDate)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {current.length === 0 && upcoming.length === 0 && past.length === 0 && (
          <div className="text-center py-24">
            <p className={`mb-4 ${isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]'}`}>No exhibitions yet.</p>
            <Link to="/collection" className="text-[#E85D35] hover:underline">
              View the collection
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exhibitions;
