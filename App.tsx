import React, { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import GalleryTunnel from './components/GalleryTunnel';
import Collection from './src/pages/Collection';
import ArtworkDetail from './src/pages/ArtworkDetail';
import ArtistsIndex from './src/pages/ArtistsIndex';
import ArtistDetail from './src/pages/ArtistDetail';
import About from './src/pages/About';
import Inquire from './src/pages/Inquire';
import Exhibitions from './src/pages/Exhibitions';
import ExhibitionDetail from './src/pages/ExhibitionDetail';
import Explore from './src/pages/Explore';
import { getFeaturedArtworks, getAllArtworks } from './src/data';
import gsap from 'gsap';

// Theme context for sharing across routes
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// Layout wrapper with navigation and footer
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-700 ${isDarkMode ? 'bg-[#050505] text-white selection:bg-orange-900 selection:text-orange-100' : 'bg-white text-slate-900 selection:bg-orange-100 selection:text-orange-900'} overflow-hidden`}>
      <Navigation isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <main>
        {children}
      </main>
      <footer className={`fixed bottom-4 right-6 text-[10px] pointer-events-none z-50 transition-colors duration-500 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
        <p>&copy; {new Date().getFullYear()} An Expensive Gallery</p>
      </footer>
    </div>
  );
};

// Home page with tunnel - displays gallery artworks
const Home: React.FC = () => {
  const { isDarkMode } = useTheme();
  const artworks = getAllArtworks();
  return <GalleryTunnel isDarkMode={isDarkMode} artworks={artworks} />;
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    gsap.config({
      autoSleep: 60,
      force3D: true,
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <BrowserRouter>
        <Routes>
          {/* Explore page - full-screen immersive, no navigation */}
          <Route path="/explore" element={<Explore />} />

          {/* All other routes with standard layout */}
          <Route path="*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/collection" element={<Collection />} />
                <Route path="/work/:id" element={<ArtworkDetail />} />
                <Route path="/artists" element={<ArtistsIndex />} />
                <Route path="/artists/:slug" element={<ArtistDetail />} />
                <Route path="/exhibitions" element={<Exhibitions />} />
                <Route path="/exhibitions/:slug" element={<ExhibitionDetail />} />
                <Route path="/about" element={<About />} />
                <Route path="/inquire" element={<Inquire />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
};

export default App;
