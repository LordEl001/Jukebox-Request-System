import React from 'react';
import { ViewMode } from '../types';
import { Menu, User, ShieldCheck, Radio } from 'lucide-react';
import newLogo from '../NEW-LOGO-s.png';

interface HeaderProps {
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  onOpenHostMenu?: () => void;
  queueCount: number;
  venueName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onToggleViewMode,
  onOpenHostMenu,
  queueCount,
  venueName = '',
}) => {
  const trimmedVenue = venueName.trim();

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 py-3.5 sm:py-4 transition-colors w-full overflow-hidden shadow-lg">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 min-w-0">
        {/* Left branding */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {viewMode === 'host' && (
            <button
              onClick={onOpenHostMenu}
              id="host-hamburger-btn"
              aria-label="Host Menu"
              className="p-2 sm:p-2.5 -ml-1 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all md:hidden shrink-0 border border-white/10"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="relative inline-block w-36 xs:w-44 sm:w-64 max-w-full rounded-2xl bg-black/40 border border-white/15 shadow-xl shrink-0 overflow-hidden">
              <img
                src={newLogo}
                alt="Logo"
                className="w-full h-auto block"
                referrerPolicy="no-referrer"
              />
              <span className="absolute top-1.5 right-1.5 w-2.5 sm:w-3 h-2.5 sm:h-3 bg-green-400 rounded-full ring-2 ring-[#050505] animate-pulse z-10" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-extrabold tracking-wider text-sm sm:text-base text-white break-words leading-snug">
                  {trimmedVenue ? (
                    <>
                      <span className="text-white/80 font-semibold mr-1">Live @</span>
                      <span className="text-amber-400">{trimmedVenue}</span>
                    </>
                  ) : (
                    <>
                      D Afrogenie <span className="text-amber-400">Karaoke</span>
                    </>
                  )}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 shrink-0">
                  <Radio className="w-3 h-3 animate-pulse" /> Live Jukebox
                </span>
              </div>
              <p className="text-xs text-white/50 hidden sm:block break-words leading-tight mt-1">
                {trimmedVenue ? `${trimmedVenue} • ` : ''}{queueCount} tracks in queue
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Toggle & Mobile Location Badge Stack */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center bg-black/60 p-1.5 rounded-full border border-white/15 shadow-inner">
            <button
              id="view-mode-patron-btn"
              onClick={() => onToggleViewMode('patron')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 active:scale-95 ${
                viewMode === 'patron'
                  ? 'bg-white/20 text-white border border-white/25 shadow-lg'
                  : 'text-white/50 hover:text-white/90'
              }`}
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span>Patron</span>
            </button>
            <button
              id="view-mode-host-btn"
              onClick={() => onToggleViewMode('host')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 active:scale-95 ${
                viewMode === 'host'
                  ? 'bg-[#F27D26]/25 text-[#F27D26] border border-[#F27D26]/50 shadow-lg'
                  : 'text-white/50 hover:text-white/90'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span>Host</span>
            </button>
          </div>

          {/* Location badge stacked directly below toggle buttons on mobile */}
          <div
            id="mobile-venue-location-badge"
            className="flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/70 border border-amber-400/40 text-[11px] font-bold text-amber-400 shadow-sm max-w-[220px] break-words text-right justify-end leading-tight"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0 self-center" />
            <span className="text-white/70 font-semibold shrink-0">Live @</span>
            <span className="text-amber-400 font-extrabold break-words">
              {trimmedVenue || 'Karaoke'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
