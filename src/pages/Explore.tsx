import React from 'react';
import { getAllArtworks } from '../data';
import ExploreGallery from '../../components/ExploreGallery';
import { useTheme } from '../../App';

const Explore: React.FC = () => {
  const { isDarkMode } = useTheme();
  const artworks = getAllArtworks();

  return <ExploreGallery isDarkMode={isDarkMode} artworks={artworks} />;
};

export default Explore;
