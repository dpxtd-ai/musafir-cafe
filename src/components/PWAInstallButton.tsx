import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already installed and running standalone, hide the prompt
  if (isInstalled && !justInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 4000);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // General instructions for desktop/other browsers
      setShowIOSGuide(true);
    }
  };

  if (justInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span>Installed!</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        type="button"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/90 text-xs font-semibold transition-all hover:shadow-xs active:scale-95 cursor-pointer"
        title="Install Musafir Cafe app on your device"
      >
        <Download className="w-3.5 h-3.5 text-teal-700" />
        <span>Install App</span>
      </button>

      {/* Guided installation modal for iOS Safari and other browsers */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-stone-200 relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-teal-800 text-amber-300 flex items-center justify-center shadow-xs">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-stone-900">
                  Install Musafir Cafe
                </h3>
                <p className="text-[11px] text-stone-500">Fast access from your home screen</p>
              </div>
            </div>

            <div className="space-y-3 py-2 text-xs text-stone-600">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <Share2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <span>
                      1. Tap the <strong>Share</strong> button in your Safari navigation bar.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <PlusSquare className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <span>
                      2. Scroll down and select <strong>"Add to Home Screen"</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      3. Tap <strong>"Add"</strong> in the top right corner.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <Download className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <span>
                      1. In your browser menu, look for <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <Smartphone className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <span>
                      2. Enjoy instant ordering with offline menu caching and fast access!
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-teal-800 py-2.5 text-xs font-semibold text-white hover:bg-teal-900 transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
