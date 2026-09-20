import React, { useState } from 'react';
import { User, Sparkles, Music } from 'lucide-react';

interface DisplayNameModalProps {
  isOpen: boolean;
  initialName: string;
  onSaveName: (name: string) => void;
  onClose?: () => void;
}

export const DisplayNameModal: React.FC<DisplayNameModalProps> = ({
  isOpen,
  initialName,
  onSaveName,
  onClose,
}) => {
  const [nameInput, setNameInput] = useState(initialName);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim() || 'Guest Patron';
    onSaveName(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl sm:rounded-[32px] p-6 sm:p-8 shadow-2xl shadow-black/90 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/20 flex items-center justify-center shadow-inner">
            <User className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white flex items-center justify-center gap-2">
            <span>Enter Your Display Name</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-xs mx-auto">
            This name will be attached to your requested songs and direct notes on the host stage screen.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-widest text-white/50 mb-2">
              Display Name or Table #
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Table 4 - Alex, Sarah M., DJ Fan..."
                className="w-full bg-white/5 border border-white/15 rounded-2xl px-4.5 py-3.5 text-base sm:text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F27D26] transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 sm:py-4 px-5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3.5 sm:py-4 px-5 rounded-full bg-[#F27D26] hover:bg-[#F27D26]/90 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#F27D26]/25 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4.5 h-4.5 fill-black" />
              <span>Continue</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
