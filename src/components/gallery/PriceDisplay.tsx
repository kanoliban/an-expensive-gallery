import React from 'react';
import type { ArtworkStatus, Currency } from '../../types/gallery';
import { formatPrice } from '../../utils/format';
import { useTheme } from '../../../App';

interface PriceDisplayProps {
  price: number;
  currency: Currency;
  status: ArtworkStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Displays artwork price with confidence.
 * No "Price on request" cowardice. The number is the number.
 */
const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  currency,
  status,
  size = 'md',
  className = '',
}) => {
  const { isDarkMode } = useTheme();
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl font-medium tracking-tight',
  };

  const baseClasses = `tabular-nums ${sizeClasses[size]} ${className}`;
  const mutedClasses = isDarkMode ? 'text-white/60' : 'text-[#6B6B6B]';

  if (status === 'sold') {
    return <span className={`${baseClasses} ${mutedClasses}`}>SOLD</span>;
  }

  if (status === 'on_hold') {
    return <span className={`${baseClasses} ${mutedClasses}`}>ON HOLD</span>;
  }

  if (status === 'not_for_sale') {
    return <span className={`${baseClasses} ${mutedClasses}`}>NOT FOR SALE</span>;
  }

  // Available - show price with confidence
  return (
    <span className={baseClasses}>
      {formatPrice(price, currency)}
    </span>
  );
};

export default PriceDisplay;
