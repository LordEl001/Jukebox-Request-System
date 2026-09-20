import React from 'react';
import { Song } from '../types';
import { Plus, Minus, Clock } from 'lucide-react';

interface SongCardProps {
  song: Song;
  isQueuedByMe: boolean;
  queuedByOtherName: string | null;
  isRecent: boolean;
  onRequestSong: (song: Song) => void;
  onRemoveSong: (songId: string) => void;
}

export const SongCard = React.memo<SongCardProps>(({
  song,
  isQueuedByMe,
  queuedByOtherName,
  isRecent,
  onRequestSong,
  onRemoveSong,
}) => {
  const trackFormatted = song.trackNumber < 10 ? `0${song.trackNumber}` : `${song.trackNumber}`;

  return (
    <div
      className="group relative flex items-center justify-between p-3.5 sm:p-4.5 bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-2xl sm:rounded-3xl transition-all duration-150 shadow-sm gap-3 min-w-0"
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 76px',
      }}
    >
      {/* Left info */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-1 flex-1">
        {/* Track # */}
        <span className="font-mono text-white/30 text-xs sm:text-sm shrink-0 font-bold w-6 sm:w-7">
          {trackFormatted}
        </span>

        <div className="min-w-0 flex-1 space-y-1">
          {/* Artist Name & New Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-tight text-white/50 truncate">
              {song.artist}
            </p>
            {isRecent && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F27D26] bg-[#F27D26]/15 px-2 py-0.5 rounded-full border border-[#F27D26]/30 shrink-0">
                NEW
              </span>
            )}
          </div>

          {/* Song Title */}
          <p className={`text-sm sm:text-base font-bold truncate ${song.badgeColor?.titleColor || 'text-white'}`}>
            {song.title}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex items-center gap-2 shrink-0">
        {isQueuedByMe ? (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
              Queued by You
            </span>
            <button
              onClick={() => onRemoveSong(song.id)}
              title="Remove your request from Queue"
              className="flex items-center gap-1.5 px-3.5 sm:px-4.5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition-all duration-150 active:scale-95 shrink-0 whitespace-nowrap shadow-sm"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
              <span>Remove</span>
            </button>
          </div>
        ) : queuedByOtherName ? (
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 bg-amber-500/10 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-amber-500/20 flex items-center gap-1.5 max-w-[120px] xs:max-w-[170px] sm:max-w-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Queued by {queuedByOtherName}</span>
            </span>
          </div>
        ) : (
          <button
            onClick={() => onRequestSong(song)}
            title="Add to Queue"
            className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-500/25 transition-all duration-150 active:scale-95 shrink-0 whitespace-nowrap min-w-[76px] sm:min-w-[88px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add</span>
          </button>
        )}
      </div>
    </div>
  );
});

SongCard.displayName = 'SongCard';
