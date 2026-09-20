import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import newLogo from '../NEW-LOGO.png';

interface HostAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: () => void;
  hostPin?: string;
}

export const HostAuthModal: React.FC<HostAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticate,
  hostPin = '1234',
}) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = pinInput.trim();
    if (cleanInput === hostPin) {
      setError(false);
      setPinInput('');
      onAuthenticate();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-sm bg-[#111111] border border-white/10 rounded-3xl sm:rounded-[32px] p-6 sm:p-8 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-2.5">
          <div className="relative w-auto max-w-[220px] h-16 sm:h-20 mx-auto px-4 py-2 rounded-2xl overflow-hidden bg-black/50 border border-[#F27D26]/40 shadow-xl flex items-center justify-center">
            <img
              src={newLogo}
              alt="Logo"
              className="h-full w-auto max-w-full object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-1.5 right-1.5 p-1.5 bg-[#F27D26] text-black rounded-xl shadow">
              <Lock className="w-3 h-3 stroke-[2.5]" />
            </div>
          </div>
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white">
            Host Passcode Required
          </h2>
          <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
            Enter host pin code to access stage queue controls & console.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold uppercase tracking-widest text-white/50">
                Host PIN {hostPin === '1234' ? '(Default: 1234)' : '(Custom Set)'}
              </label>
            </div>
            <input
              type="password"
              autoFocus
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                if (error) setError(false);
              }}
              placeholder="Enter Host PIN"
              className="w-full text-center tracking-[0.3em] font-mono text-xl bg-white/5 border border-white/15 focus:border-[#F27D26] rounded-2xl px-5 py-3.5 sm:py-4 text-white placeholder-white/25 focus:outline-none transition-all shadow-inner"
            />
            {error && (
              <p className="text-xs sm:text-sm text-rose-400 font-bold flex items-center justify-center gap-1.5 mt-2.5 text-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Incorrect Host PIN. Please try again.</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 sm:py-4 px-5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 sm:py-4 px-5 rounded-full bg-[#F27D26] hover:bg-[#F27D26]/90 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#F27D26]/25 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Unlock</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
