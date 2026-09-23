import React from 'react';
import { Coffee, UtensilsCrossed } from 'lucide-react';
import { OrderType } from '../types/cafe';

interface HeaderProps {
  orderType?: OrderType | null;
  onReset?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  orderType,
  onReset
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all no-print">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Zone */}
        <button
          onClick={onReset}
          className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-800 text-amber-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-stone-900 group-hover:text-teal-800 transition-colors">
              Musafir Cafe
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs text-stone-500 font-medium tracking-wide uppercase">
              Online Ordering
            </span>
          </div>
        </button>

        {/* Center / Status Zone */}
        {orderType && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200/60">
            <UtensilsCrossed className="w-3.5 h-3.5 text-teal-700" />
            <span>Mode: <strong className="text-stone-900">{orderType}</strong></span>
          </div>
        )}
      </div>
    </header>
  );
};

