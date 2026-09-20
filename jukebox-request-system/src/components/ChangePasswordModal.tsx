import React, { useState } from 'react';
import { KeyRound, Check, AlertCircle, Eye, EyeOff, X } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPin: string;
  onChangePin: (newPin: string) => Promise<void>;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentPin,
  onChangePin,
}) => {
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPins, setShowPins] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate current PIN
    if (oldPinInput.trim() !== currentPin) {
      setErrorMsg('Current Host PIN is incorrect.');
      return;
    }

    // Validate new PIN length
    if (newPinInput.trim().length < 4) {
      setErrorMsg('New PIN must be at least 4 characters long.');
      return;
    }

    // Validate confirmation
    if (newPinInput.trim() !== confirmPinInput.trim()) {
      setErrorMsg('New PIN and confirmation do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onChangePin(newPinInput.trim());
      setSuccessMsg('Host PIN updated successfully!');
      setTimeout(() => {
        setSuccessMsg(null);
        setOldPinInput('');
        setNewPinInput('');
        setConfirmPinInput('');
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg('Failed to update host PIN. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-sm bg-[#111111] border border-white/10 rounded-3xl sm:rounded-[32px] p-6 sm:p-8 shadow-2xl space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-all active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/20 flex items-center justify-center shadow-inner">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white">
            Change Host Password
          </h2>
          <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
            Set a new access PIN code for DJ & Host stage controls.
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 bg-green-500/20 border border-green-500/40 text-green-300 text-xs sm:text-sm rounded-2xl flex items-center gap-2.5 font-bold">
            <Check className="w-4.5 h-4.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4.5">
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-widest text-white/50 mb-2">
                Current Host PIN
              </label>
              <div className="relative">
                <input
                  type={showPins ? 'text' : 'password'}
                  required
                  value={oldPinInput}
                  onChange={(e) => {
                    setOldPinInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Enter current PIN"
                  className="w-full font-mono text-base sm:text-sm bg-white/5 border border-white/15 rounded-2xl px-4.5 py-3.5 text-white placeholder-white/25 focus:outline-none focus:border-[#F27D26] transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-widest text-white/50 mb-2">
                New Host PIN
              </label>
              <div className="relative">
                <input
                  type={showPins ? 'text' : 'password'}
                  required
                  value={newPinInput}
                  onChange={(e) => {
                    setNewPinInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="New PIN (min. 4 chars)"
                  className="w-full font-mono text-base sm:text-sm bg-white/5 border border-white/15 rounded-2xl px-4.5 py-3.5 text-white placeholder-white/25 focus:outline-none focus:border-[#F27D26] transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-widest text-white/50 mb-2">
                Confirm New Host PIN
              </label>
              <div className="relative">
                <input
                  type={showPins ? 'text' : 'password'}
                  required
                  value={confirmPinInput}
                  onChange={(e) => {
                    setConfirmPinInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Repeat new PIN"
                  className="w-full font-mono text-base sm:text-sm bg-white/5 border border-white/15 rounded-2xl px-4.5 py-3.5 text-white placeholder-white/25 focus:outline-none focus:border-[#F27D26] transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Toggle show/hide PIN */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setShowPins(!showPins)}
                className="text-white/50 hover:text-white flex items-center gap-2 text-xs font-bold transition-colors active:scale-95"
              >
                {showPins ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showPins ? 'Hide PIN characters' : 'Show PIN characters'}</span>
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs sm:text-sm rounded-2xl flex items-center gap-2.5 font-bold">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3.5 sm:py-4 px-5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3.5 sm:py-4 px-5 rounded-full bg-[#F27D26] hover:bg-[#F27D26]/90 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#F27D26]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              <span>{isSubmitting ? 'Saving...' : 'Save New PIN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
