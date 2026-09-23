import React from 'react';
import { Home, Utensils, Sparkles, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { OrderType } from '../types/cafe';
import heroImage from '../assets/images/musafir_cafe_hero_1790180312054.jpg';

interface OrderTypeSelectionProps {
  onSelect: (type: OrderType) => void;
}

export const OrderTypeSelection: React.FC<OrderTypeSelectionProps> = ({ onSelect }) => {
  return (
    <div className="space-y-6">
      {/* Hero Banner Card */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-stone-200/80 bg-stone-900 text-white">
        <div className="relative h-48 sm:h-56 w-full overflow-hidden">
          <img
            src={heroImage}
            alt="Musafir Cafe Ambiance"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-85 hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold tracking-wider uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fresh Flavors · Artisanal Chai & Bites</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-50">
              Musafir Cafe
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-lg">
              Every cup tells a story, every bite is a journey. Crafted with passion, served fresh.
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Message & Prompt */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-50 text-teal-800 mb-3">
          <span className="text-2xl">👋</span>
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-900 mb-2">
          Welcome to Musafir Cafe!
        </h2>
        <p className="text-stone-600 text-sm sm:text-base max-w-md mx-auto mb-6">
          How would you like to experience Musafir Cafe today? Choose an ordering option to begin.
        </p>

        {/* Order Choice Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
          {/* Home Delivery */}
          <button
            onClick={() => onSelect('Home Delivery')}
            className="group flex flex-col items-center p-5 rounded-xl border-2 border-stone-200 hover:border-teal-700 bg-stone-50/50 hover:bg-teal-50/40 text-left transition-all duration-200 hover:shadow-md cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-700 text-white flex items-center justify-center text-2xl mb-3 shadow-sm group-hover:scale-110 transition-transform">
              <Home className="w-7 h-7 text-amber-100" />
            </div>
            <span className="font-semibold text-base text-stone-900 group-hover:text-teal-900">
              🏠 Home Delivery
            </span>
            <span className="text-xs text-stone-500 text-center mt-1">
              Piping hot snacks & brews delivered straight to your address
            </span>
            <div className="mt-4 w-full py-2 px-3 rounded-lg bg-teal-800 text-white text-xs font-semibold text-center group-hover:bg-teal-700 transition-colors">
              Select Home Delivery
            </div>
          </button>

          {/* Dine-In */}
          <button
            onClick={() => onSelect('Dine-in')}
            className="group flex flex-col items-center p-5 rounded-xl border-2 border-stone-200 hover:border-teal-700 bg-stone-50/50 hover:bg-teal-50/40 text-left transition-all duration-200 hover:shadow-md cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-stone-800 text-white flex items-center justify-center text-2xl mb-3 shadow-sm group-hover:scale-110 transition-transform">
              <Utensils className="w-7 h-7 text-amber-200" />
            </div>
            <span className="font-semibold text-base text-stone-900 group-hover:text-teal-900">
              🍽️ Dine-In
            </span>
            <span className="text-xs text-stone-500 text-center mt-1">
              Order directly to your table at the cafe for swift table service
            </span>
            <div className="mt-4 w-full py-2 px-3 rounded-lg bg-stone-900 text-white text-xs font-semibold text-center group-hover:bg-teal-800 transition-colors">
              Select Dine-In
            </div>
          </button>
        </div>

        {/* Cafe Guarantee Badges */}
        <div className="mt-6 pt-6 border-t border-stone-100 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-700" />
            <span>Avg. Prep Time: 15-20 Mins</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>100% Hygienic Kitchen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-teal-700" />
            <span>Live Webhook Tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
};
