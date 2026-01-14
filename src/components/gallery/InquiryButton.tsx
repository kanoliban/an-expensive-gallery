import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../App';

interface InquiryButtonProps {
  artworkId: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Galleries don't have shopping carts. You inquire.
 */
const InquiryButton: React.FC<InquiryButtonProps> = ({
  artworkId,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const { isDarkMode } = useTheme();
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  const variantClasses = {
    primary: isDarkMode
      ? 'bg-white text-black hover:bg-white/90'
      : 'bg-[#0F0F0F] text-white hover:bg-[#1a1a1a]',
    secondary: isDarkMode
      ? 'bg-transparent border border-white text-white hover:bg-white hover:text-black'
      : 'bg-transparent border border-[#0F0F0F] text-[#0F0F0F] hover:bg-[#0F0F0F] hover:text-white',
  };

  return (
    <Link
      to={`/inquire?artwork=${artworkId}`}
      className={`inline-flex items-center justify-center font-medium transition-colors duration-200 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      Inquire
    </Link>
  );
};

export default InquiryButton;
