import React, { useState } from 'react';
import { Music, Plus, X, Disc } from 'lucide-react';
import { Song } from '../types';

interface AddSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSong: (songData: Omit<Song, 'id' | 'trackNumber' | 'badgeColor'>) => void;
}

export const AddSongModal: React.FC<AddSongModalProps> = ({
  isOpen,
  onClose,
  onAddSong,
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [duration, setDuration] = useState('3:30');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;

    onAddSong({
      title: title.trim(),
      artist: artist.trim(),
      duration: duration.trim() || '3:30',
    });

    setTitle('');
    setArtist('');
    setDuration('3:30');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl sm:rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-green-500/10 text-green-400 border border-green-500/20">
              <Disc className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white">
                Add Song to Catalog
              </h2>
              <p className="text-xs text-white/50">Manual song entry for host library</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4.5 pt-1">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-widest text-white/50 mb-2">
              Song Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Last Last, Calm Down, Superstition"
              className="w-full bg-white/5 border border-white/15 rounded-2xl px-4.5 py-3.5 text-base sm:text-sm text-white placeholder-white/25 focus:outline-none focus:border-green-400 transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-widest text-white/50 mb-2">
              Artist Name *
            </label>
            <input
              type="text"
              required
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. Burna Boy, Rema, Stevie Wonder"
              className="w-full bg-white/5 border border-white/15 rounded-2xl px-4.5 py-3.5 text-base sm:text-sm text-white placeholder-white/25 focus:outline-none focus:border-green-400 transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-widest text-white/50 mb-2">
              Duration
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="3:30"
              className="w-full bg-white/5 border border-white/15 rounded-2xl px-4.5 py-3.5 text-base sm:text-sm text-white placeholder-white/25 focus:outline-none focus:border-green-400 transition-all font-mono shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 sm:py-4 px-5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 sm:py-4 px-5 rounded-full bg-green-500 hover:bg-green-400 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-green-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              <span>Add Song</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
