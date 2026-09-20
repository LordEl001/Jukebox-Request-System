import React, { useRef, useCallback } from 'react';

export const ALPHABET_INDEX = [
  '#',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

interface AlphabetSeekBarProps {
  availableLetters: Set<string>;
  activeLetter: string | null;
  onLetterSelect: (letter: string, isDragging: boolean) => void;
  onDragEnd: () => void;
}

export const AlphabetSeekBar: React.FC<AlphabetSeekBarProps> = ({
  availableLetters,
  activeLetter,
  onLetterSelect,
  onDragEnd,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef<boolean>(false);
  const lastLetterRef = useRef<string | null>(null);

  const getLetterFromY = useCallback((clientY: number): string | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.height === 0) return null;

    const relativeY = clientY - rect.top;
    const clampedY = Math.max(0, Math.min(rect.height - 1, relativeY));
    const index = Math.floor((clampedY / rect.height) * ALPHABET_INDEX.length);
    const safeIndex = Math.max(0, Math.min(ALPHABET_INDEX.length - 1, index));
    return ALPHABET_INDEX[safeIndex];
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    isInteractingRef.current = true;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback for browsers that don't support pointer capture
    }

    const letter = getLetterFromY(e.clientY);
    if (letter) {
      lastLetterRef.current = letter;
      onLetterSelect(letter, false);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteractingRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const letter = getLetterFromY(e.clientY);
    if (letter && letter !== lastLetterRef.current) {
      lastLetterRef.current = letter;
      onLetterSelect(letter, true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isInteractingRef.current) {
      isInteractingRef.current = false;
      lastLetterRef.current = null;
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe fallback
      }
      onDragEnd();
    }
  };

  const handlePointerCancel = () => {
    if (isInteractingRef.current) {
      isInteractingRef.current = false;
      lastLetterRef.current = null;
      onDragEnd();
    }
  };

  return (
    <div
      ref={containerRef}
      id="alphabet-seek-bar"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className="flex flex-col justify-between items-center h-full max-h-[680px] w-8 sm:w-9 py-2.5 sm:py-3 px-1 bg-black/75 hover:bg-black/90 backdrop-blur-xl border border-white/15 hover:border-amber-400/40 rounded-full shadow-2xl select-none touch-none cursor-pointer transition-all z-20 group"
      title="Quick Jump (Drag or Tap letter)"
      aria-label="Alphabetical seek index"
    >
      {ALPHABET_INDEX.map((letter) => {
        const isAvailable = availableLetters.has(letter);
        const isActive = activeLetter === letter;

        return (
          <button
            key={letter}
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onLetterSelect(letter, false);
              onDragEnd();
            }}
            className={`w-full flex items-center justify-center min-h-[15px] sm:min-h-[18px] text-[9px] sm:text-[11px] font-mono leading-none font-extrabold transition-all duration-100 rounded-full my-[0.5px] pointer-events-auto ${
              isActive
                ? 'bg-amber-400 text-black font-black scale-135 shadow-lg shadow-amber-400/60 py-0.5 z-10'
                : isAvailable
                ? 'text-white/80 hover:text-amber-400 hover:scale-130'
                : 'text-white/20 hover:text-white/40'
            }`}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
};
