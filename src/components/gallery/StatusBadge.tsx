import React from 'react';
import type { ArtworkStatus } from '../../types/gallery';
import { useTheme } from '../../../App';

interface StatusBadgeProps {
  status: ArtworkStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const { isDarkMode } = useTheme();

  const statusConfig: Record<ArtworkStatus, { label: string; classes: string }> = {
    available: {
      label: 'Available',
      classes: isDarkMode ? 'bg-white text-black' : 'bg-[#0F0F0F] text-white',
    },
    sold: {
      label: 'Sold',
      classes: 'bg-[#6B6B6B] text-white',
    },
    on_hold: {
      label: 'On Hold',
      classes: 'bg-[#E85D35] text-white',
    },
    not_for_sale: {
      label: 'Not for Sale',
      classes: isDarkMode
        ? 'bg-transparent border border-white/40 text-white/60'
        : 'bg-transparent border border-[#6B6B6B] text-[#6B6B6B]',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-medium tracking-wide uppercase ${config.classes} ${className}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
