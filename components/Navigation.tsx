import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface NavigationProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const navLinks = [
  { label: 'Explore', href: '/explore' },
  { label: 'Collection', href: '/collection' },
  { label: 'Artists', href: '/artists' },
  { label: 'Exhibitions', href: '/exhibitions' },
  { label: 'About', href: '/about' },
];

const Navigation: React.FC<NavigationProps> = ({ isDarkMode, toggleTheme }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 md:px-12 flex justify-between items-center bg-transparent pointer-events-none">
      {/* Logo */}
      <Link
        to="/"
        className={`text-xl pointer-events-auto cursor-pointer transition-colors duration-500 italic ${isDarkMode ? 'text-white' : 'text-black'}`}
        style={{ fontFamily: '"Cormorant Garamond", serif' }}
      >
        An Expensive Gallery
      </Link>

      {/* Center Links & Toggle - Desktop */}
      <div className="hidden md:flex items-center gap-4 bg-white/0 backdrop-blur-[2px] px-6 py-2 rounded-full pointer-events-auto">
        <div className="flex items-center gap-8 mr-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-black'}`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
      </div>

      {/* Desktop CTA */}
      <div className="hidden md:block pointer-events-auto">
        <Link
          to="/inquire"
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1 group ${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-900'}`}
        >
          Inquire <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>

      {/* Mobile Menu Button & Dropdown */}
      <div ref={menuRef} className="md:hidden pointer-events-auto relative">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`p-2 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-black'}`}
          aria-label="Menu"
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="19" cy="12" r="2"/>
            </svg>
          )}
        </button>

        {mobileMenuOpen && (
          <div
            className={`absolute top-full right-0 mt-2 py-3 min-w-[180px] shadow-lg ${isDarkMode ? 'bg-white' : 'bg-black'}`}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-5 py-2.5 text-sm font-medium transition-colors ${isDarkMode ? 'text-black/70 hover:text-black hover:bg-black/5' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                {link.label}
              </Link>
            ))}

            <div className={`my-2 border-t ${isDarkMode ? 'border-black/10' : 'border-white/20'}`} />

            <button
              onClick={() => {
                toggleTheme();
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${isDarkMode ? 'text-black/70 hover:text-black hover:bg-black/5' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              {isDarkMode ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  Dark Mode
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                  Light Mode
                </>
              )}
            </button>

            <div className={`my-2 border-t ${isDarkMode ? 'border-black/10' : 'border-white/20'}`} />

            <Link
              to="/inquire"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-5 py-2.5 text-sm font-medium transition-colors ${isDarkMode ? 'text-[#E85D35] hover:bg-black/5' : 'text-[#E85D35] hover:bg-white/10'}`}
            >
              Inquire →
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;