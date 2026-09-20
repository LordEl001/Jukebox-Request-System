import React from 'react';
import { Song, QueueItem, PatronTab } from '../types';
import { Search, Plus, Minus, MessageSquare, Music2, Radio, Clock, Disc, User, Edit2, Sparkles } from 'lucide-react';
import { AlphabetSeekBar, ALPHABET_INDEX } from './AlphabetSeekBar';
import { SongCard } from './SongCard';

interface PatronViewProps {
  songs: Song[];
  queue: QueueItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: PatronTab;
  onTabChange: (tab: PatronTab) => void;
  onRequestSong: (song: Song) => void;
  onRemoveSong: (songId: string) => void;
  onOpenCommentModal: () => void;
  patronDisplayName: string;
  onChangeDisplayName: () => void;
}

// Helper to determine alphabetical group letter
const getSongInitialLetter = (song: Song): string => {
  const source = (song.artist || song.title || '').trim();
  if (!source) return '#';
  const char = source.charAt(0).toUpperCase();
  return /^[A-Z]$/.test(char) ? char : '#';
};

export const PatronView: React.FC<PatronViewProps> = ({
  songs,
  queue,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  onRequestSong,
  onRemoveSong,
  onOpenCommentModal,
  patronDisplayName,
  onChangeDisplayName,
}) => {
  const [showRecentOnly, setShowRecentOnly] = React.useState(false);

  // Dedicated song list container ref
  const listContainerRef = React.useRef<HTMLDivElement>(null);
  const [activeLetter, setActiveLetter] = React.useState<string | null>(null);
  const [floatingLetter, setFloatingLetter] = React.useState<string | null>(null);
  const floatingTimeoutRef = React.useRef<number | null>(null);
  const scrollRafRef = React.useRef<number | null>(null);
  const letterOffsetsRef = React.useRef<{ letter: string; top: number }[]>([]);
  const activeLetterRef = React.useRef<string | null>(null);

  const currentlyPlaying = React.useMemo(() => queue.find((q) => q.status === 'playing'), [queue]);
  const upNextItem = React.useMemo(
    () => queue.find((q) => q.status === 'next') || (queue.length > 1 ? queue[1] : undefined),
    [queue]
  );

  // Pre-calculate fast O(1) queue lookups so card renders are instant and skip O(N) searches
  const queueStatusMap = React.useMemo(() => {
    const map = new Map<string, { isQueuedByMe: boolean; queuedByOtherName: string | null }>();
    for (const item of queue) {
      const isQueuedByMe = item.requestedBy === patronDisplayName;
      map.set(item.song.id, {
        isQueuedByMe,
        queuedByOtherName: isQueuedByMe ? null : (item.requestedBy || 'Guest'),
      });
    }
    return map;
  }, [queue, patronDisplayName]);

  // Compute recent songs pool
  const recentSongsPool = React.useMemo(() => {
    const songsWithTimestamp = songs.filter((s) => typeof s.addedAt === 'number' && s.addedAt > 0);
    if (songsWithTimestamp.length > 0) {
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recent24h = songsWithTimestamp.filter((s) => s.addedAt! >= twentyFourHoursAgo);
      if (recent24h.length > 0) {
        return recent24h;
      }
      // Fallback: top 25 newest additions
      const sortedNewest = [...songsWithTimestamp].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
      return sortedNewest.slice(0, 25);
    }
    // Fallback if no timestamps available
    return songs.slice(-25);
  }, [songs]);

  const recentSongIds = React.useMemo(() => new Set(recentSongsPool.map((s) => s.id)), [recentSongsPool]);

  // Filter songs based on recentOnly toggle and search query
  const baseSongs = showRecentOnly ? songs.filter((s) => recentSongIds.has(s.id)) : songs;

  const filteredSongs = React.useMemo(() => {
    return baseSongs
      .filter((song) => {
        const matchesSearch =
          song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => {
        const artistCompare = a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base', numeric: true });
        if (artistCompare !== 0) return artistCompare;
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true });
      });
  }, [baseSongs, searchQuery]);

  // Compute available letters, letter song counts, and grouped structures
  const { availableLetters, letterCounts, groupedSongs } = React.useMemo(() => {
    const lettersSet = new Set<string>();
    const counts: Record<string, number> = {};
    const groups: { letter: string; songs: Song[] }[] = [];

    let currentLetter = '';
    let currentGroup: Song[] = [];

    filteredSongs.forEach((song) => {
      const letter = getSongInitialLetter(song);
      lettersSet.add(letter);
      counts[letter] = (counts[letter] || 0) + 1;

      if (letter !== currentLetter) {
        if (currentGroup.length > 0) {
          groups.push({ letter: currentLetter, songs: currentGroup });
        }
        currentLetter = letter;
        currentGroup = [song];
      } else {
        currentGroup.push(song);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ letter: currentLetter, songs: currentGroup });
    }

    return { availableLetters: lettersSet, letterCounts: counts, groupedSongs: groups };
  }, [filteredSongs]);

  // Measure letter group relative offset positions once when grouped songs change (0 forced reflows during scroll)
  const measureLetterOffsets = React.useCallback(() => {
    const container = listContainerRef.current;
    if (!container) return;

    const offsets: { letter: string; top: number }[] = [];
    groupedSongs.forEach((group) => {
      const el = document.getElementById(`letter-group-${group.letter}`);
      if (el) {
        offsets.push({ letter: group.letter, top: el.offsetTop });
      }
    });
    letterOffsetsRef.current = offsets;
  }, [groupedSongs]);

  React.useEffect(() => {
    const timer = window.requestAnimationFrame(measureLetterOffsets);
    window.addEventListener('resize', measureLetterOffsets);
    return () => {
      window.cancelAnimationFrame(timer);
      window.removeEventListener('resize', measureLetterOffsets);
    };
  }, [measureLetterOffsets]);

  // Scroll to targeted letter strictly inside the song list container without affecting page scroll
  const handleLetterSelect = React.useCallback(
    (letter: string, isDragging: boolean = false) => {
      const container = listContainerRef.current;
      if (!container) return;

      activeLetterRef.current = letter;
      setActiveLetter(letter);
      setFloatingLetter(letter);

      if (floatingTimeoutRef.current) {
        window.clearTimeout(floatingTimeoutRef.current);
        floatingTimeoutRef.current = null;
      }

      if (!isDragging) {
        floatingTimeoutRef.current = window.setTimeout(() => {
          setFloatingLetter(null);
        }, 1200);
      }

      // Find best matching target letter (exact match or nearest available letter)
      let targetLetter = letter;
      if (!availableLetters.has(targetLetter) && availableLetters.size > 0) {
        const alphabetIndex = ALPHABET_INDEX.indexOf(letter);
        const forwardMatch = ALPHABET_INDEX.slice(alphabetIndex).find((l) => availableLetters.has(l));
        const backwardMatch = [...ALPHABET_INDEX.slice(0, alphabetIndex)].reverse().find((l) => availableLetters.has(l));
        targetLetter = forwardMatch || backwardMatch || letter;
      }

      const targetEl = document.getElementById(`letter-group-${targetLetter}`);
      if (targetEl) {
        container.scrollTo({
          top: targetEl.offsetTop,
          behavior: isDragging ? 'auto' : 'smooth',
        });
      }
    },
    [availableLetters]
  );

  const handleDragEnd = React.useCallback(() => {
    if (floatingTimeoutRef.current) {
      window.clearTimeout(floatingTimeoutRef.current);
    }
    floatingTimeoutRef.current = window.setTimeout(() => {
      setFloatingLetter(null);
    }, 1000);
  }, []);

  // Fast, rAF-throttled active letter indicator with zero DOM reflows
  const handleListScroll = React.useCallback(() => {
    if (scrollRafRef.current !== null) return;

    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const container = listContainerRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop;
      const offsets = letterOffsetsRef.current;
      if (offsets.length === 0) return;

      let currentVisible: string = offsets[0].letter;
      for (let i = offsets.length - 1; i >= 0; i--) {
        if (scrollTop >= offsets[i].top - 30) {
          currentVisible = offsets[i].letter;
          break;
        }
      }

      if (currentVisible && currentVisible !== activeLetterRef.current) {
        activeLetterRef.current = currentVisible;
        setActiveLetter(currentVisible);
      }
    });
  }, []);

  return (
    <div className="relative pb-6 sm:pb-8 space-y-4 sm:space-y-5 w-full max-w-full overflow-x-hidden">
      {/* Patron Name Bar */}
      <div className="flex items-center justify-between p-3.5 sm:p-4.5 bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl gap-3 min-w-0 shadow-md">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-[#F27D26]/15 text-[#F27D26] border border-[#F27D26]/30 shrink-0 shadow-sm">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-widest text-white/50 block truncate">
              Requesting as
            </span>
            <span className="text-sm sm:text-base font-extrabold text-white block truncate">
              {patronDisplayName || 'Guest Patron'}
            </span>
          </div>
        </div>
        <button
          onClick={onChangeDisplayName}
          className="flex items-center gap-2 px-3.5 sm:px-4.5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all duration-200 active:scale-95 shrink-0 whitespace-nowrap shadow-sm"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Name</span>
        </button>
      </div>

      {/* Search Input & Filter Bar */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 sm:left-4.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
          <input
            type="text"
            id="song-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for artist or track..."
            className="w-full bg-white/5 border border-white/15 focus:border-amber-400/50 rounded-2xl sm:rounded-3xl py-3.5 sm:py-4 pl-12 sm:pl-14 pr-16 text-base sm:text-base text-white placeholder:text-white/30 focus:outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs sm:text-sm font-bold text-white/50 hover:text-white bg-white/10 rounded-full transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Controls: Recent Updates Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Recent Updates Toggle Button */}
            <button
              id="recent-updates-toggle-btn"
              onClick={() => setShowRecentOnly(!showRecentOnly)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black tracking-wider transition-all duration-200 border flex items-center gap-2.5 shrink-0 shadow-md active:scale-95 ${
                showRecentOnly
                  ? 'bg-[#F27D26] text-black border-[#F27D26] shadow-lg shadow-[#F27D26]/25'
                  : 'bg-white/5 hover:bg-white/10 text-[#F27D26] border-[#F27D26]/30 hover:border-[#F27D26]/60'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${showRecentOnly ? 'text-black' : 'text-[#F27D26]'}`} />
              <span>Recent Updates</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                  showRecentOnly ? 'bg-black/20 text-black' : 'bg-[#F27D26]/20 text-[#F27D26]'
                }`}
              >
                {recentSongsPool.length}
              </span>
            </button>

            {showRecentOnly && (
              <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full">
                <span>Viewing newly uploaded songs (A-Z)</span>
                <button
                  onClick={() => setShowRecentOnly(false)}
                  className="underline font-extrabold text-white hover:text-amber-300 ml-1"
                >
                  Show All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dual Tab Bar: Song Catalog and Live Queue (Read-Only) */}
      <div className="flex border border-white/15 bg-[#111111]/90 p-1.5 sm:p-2 rounded-full shadow-xl">
        <button
          id="tab-catalog-btn"
          onClick={() => onTabChange('catalog')}
          className={`flex-1 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 sm:gap-2.5 ${
            activeTab === 'catalog'
              ? 'bg-white/15 text-white shadow-lg border border-white/20'
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <Music2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-green-400" />
          <span>Catalog</span>
          <span className="text-xs px-2.5 py-0.5 sm:py-1 bg-black/50 text-white/70 rounded-full font-mono font-bold">
            {filteredSongs.length}
          </span>
        </button>

        <button
          id="tab-queue-btn"
          onClick={() => onTabChange('queue')}
          className={`flex-1 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 sm:gap-2.5 ${
            activeTab === 'queue'
              ? 'bg-white/15 text-white shadow-lg border border-white/20'
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <Radio className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-green-400" />
          <span>Live Queue</span>
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 sm:py-1 bg-green-500/20 text-green-400 rounded-full font-mono font-bold">
            {queue.length}
          </span>
        </button>
      </div>

      {/* TAB CONTENT 1: SONG CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-3">
          {filteredSongs.length === 0 ? (
            <div className="py-14 text-center bg-white/5 border border-white/5 rounded-3xl p-6">
              <Disc className="w-12 h-12 text-white/20 mx-auto mb-3 animate-spin-slow" />
              <p className="text-base text-white/80 font-bold">
                {showRecentOnly ? 'No recent updates match your current filter' : 'No songs match your filter'}
              </p>
              <p className="text-xs sm:text-sm text-white/40 mt-1 max-w-md mx-auto">
                {showRecentOnly
                  ? 'Try clearing the recent updates filter or searching for a different track.'
                  : 'Try searching for a different title or artist name.'}
              </p>
              <button
                onClick={() => {
                  setShowRecentOnly(false);
                  onSearchChange('');
                }}
                className="mt-4 px-5 py-2.5 text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/15 active:scale-95"
              >
                Reset Filters & Show All
              </button>
            </div>
          ) : (
            <div className="relative">
              {/* Dedicated Independent Scroll Container for Songs */}
              <div
                ref={listContainerRef}
                id="song-list-scroll-container"
                onScroll={handleListScroll}
                className="space-y-4 h-[calc(100vh-270px)] sm:h-[calc(100vh-260px)] min-h-[560px] sm:min-h-[680px] overflow-y-auto overscroll-contain pr-10 sm:pr-12 pb-20 sm:pb-24 no-scrollbar transform-gpu"
                style={{ willChange: 'scroll-position' }}
              >
                {groupedSongs.map((group) => (
                  <div
                    key={`group-${group.letter}`}
                    id={`letter-group-${group.letter}`}
                    data-letter-group={group.letter}
                    className="space-y-2.5"
                  >
                    {/* Sticky Letter Section Divider */}
                    <div className="sticky top-0 z-10 py-2 px-3.5 sm:px-4 bg-[#141414] border border-white/10 rounded-2xl shadow-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                        <span className="font-black text-sm sm:text-base text-amber-400 font-mono tracking-wider">
                          {group.letter}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-white/50 font-bold">
                        {group.songs.length} {group.songs.length === 1 ? 'track' : 'tracks'}
                      </span>
                    </div>

                    {/* Songs in this letter group */}
                    <div className="space-y-2.5">
                      {group.songs.map((song) => {
                        const status = queueStatusMap.get(song.id);
                        return (
                          <SongCard
                            key={song.id}
                            song={song}
                            isQueuedByMe={status?.isQueuedByMe || false}
                            queuedByOtherName={status?.queuedByOtherName || null}
                            isRecent={recentSongIds.has(song.id)}
                            onRequestSong={onRequestSong}
                            onRemoveSong={onRemoveSong}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Alphabetical Seek Bar docked to the right edge */}
              <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-auto">
                <AlphabetSeekBar
                  availableLetters={availableLetters}
                  activeLetter={activeLetter}
                  onLetterSelect={handleLetterSelect}
                  onDragEnd={handleDragEnd}
                />
              </div>

              {/* Floating Overlay Badge indicator */}
              {floatingLetter && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none transition-all duration-150 animate-in zoom-in-75 fade-in">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 p-3 rounded-3xl bg-black/90 backdrop-blur-2xl border-2 border-amber-400/90 shadow-2xl shadow-amber-400/50 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl sm:text-5xl font-black text-amber-400 font-mono leading-none">
                      {floatingLetter}
                    </span>
                    <span className="text-xs text-white/80 font-sans font-extrabold mt-1.5 uppercase tracking-wider truncate max-w-full">
                      {letterCounts[floatingLetter] !== undefined
                        ? `${letterCounts[floatingLetter]} ${letterCounts[floatingLetter] === 1 ? 'track' : 'tracks'}`
                        : 'No matches'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: LIVE QUEUE (READ-ONLY) */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Read-Only & Fair-Play Notice Header */}
          <div className="p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500/10 via-white/5 to-white/5 border border-amber-500/20 text-xs sm:text-sm space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-extrabold text-amber-400 uppercase tracking-wider text-xs sm:text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Fair-Play Queue Algorithm Active</span>
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest font-mono bg-black/50 px-2.5 py-1 rounded-full border border-white/10">
                Round-Robin
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed pl-5">
              Requests are dynamically interleaved by guest so everyone gets their 1st song played before 2nd requests repeat.
            </p>
          </div>

          {/* Stage Spotlight: Now Playing & Up Next in Rotation */}
          {(currentlyPlaying || upNextItem) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {currentlyPlaying && (
                <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-green-950/40 via-[#111111] to-[#111111] border border-green-500/30 flex items-center gap-3.5 shadow-lg">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/20 text-green-400 border border-green-500/30 flex items-center justify-center shrink-0">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded-full border border-green-500/20 inline-block mb-1">
                      Now Playing
                    </span>
                    <p className="text-sm sm:text-base font-extrabold text-white truncate">
                      {currentlyPlaying.song.title}
                    </p>
                    <p className="text-xs text-white/60 truncate mt-0.5">
                      {currentlyPlaying.song.artist} • <span className="text-green-400 font-bold">{currentlyPlaying.requestedBy}</span>
                    </p>
                  </div>
                </div>
              )}

              {upNextItem && (
                <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#F27D26]/15 via-[#111111] to-[#111111] border border-[#F27D26]/30 flex items-center gap-3.5 shadow-lg">
                  <div className="w-12 h-12 rounded-2xl bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F27D26] bg-[#F27D26]/10 px-2.5 py-0.5 rounded-full border border-[#F27D26]/20 inline-block mb-1">
                      Up Next in Rotation
                    </span>
                    <p className="text-sm sm:text-base font-extrabold text-white truncate">
                      {upNextItem.song.title}
                    </p>
                    <p className="text-xs text-white/60 truncate mt-0.5">
                      {upNextItem.song.artist} • <span className="text-[#F27D26] font-bold">{upNextItem.requestedBy}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {queue.length === 0 ? (
            <div className="py-14 text-center bg-white/5 border border-white/5 rounded-3xl p-6">
              <p className="text-base text-white/80 font-bold">The queue is currently empty!</p>
              <p className="text-xs sm:text-sm text-white/40 mt-1">Be the first to request a song from the catalog.</p>
              <button
                onClick={() => onTabChange('catalog')}
                className="mt-4 px-6 py-2.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider bg-green-500 text-black rounded-full hover:bg-green-400 transition-all shadow-lg shadow-green-500/25 active:scale-95"
              >
                Browse Song Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((item, index) => {
                const isPlaying = item.status === 'playing';
                const isNext = item.status === 'next';

                return (
                  <div
                    key={`patron-queue-${item.queueId}-${index}`}
                    className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all shadow-sm ${
                      isPlaying
                        ? 'bg-gradient-to-r from-green-950/30 via-[#111111] to-[#111111] border-green-500/40 ring-1 ring-green-500/20'
                        : isNext
                        ? 'bg-white/5 border-[#F27D26]/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                        {/* Position / Playing status icon */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs sm:text-sm font-bold shrink-0 shadow-sm ${
                            isPlaying
                              ? 'bg-green-500 text-black'
                              : isNext
                              ? 'bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/30'
                              : 'bg-white/10 text-white/50 border border-white/15'
                          }`}
                        >
                          {isPlaying ? (
                            <Radio className="w-5 h-5 animate-pulse" />
                          ) : (
                            <span>{index + 1 < 10 ? `0${index + 1}` : index + 1}</span>
                          )}
                        </div>

                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] sm:text-xs uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-full ${
                                isPlaying
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : isNext
                                  ? 'bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/30'
                                  : 'bg-white/10 text-white/50 border border-white/15'
                              }`}
                            >
                              {isPlaying ? 'NOW PLAYING' : isNext ? 'NEXT UP' : 'QUEUED'}
                            </span>
                            <span className="text-xs text-white/40 flex items-center gap-1 font-mono">
                              <Clock className="w-3.5 h-3.5" /> {item.requestedAt}
                            </span>
                          </div>

                          <h4 className={`text-sm sm:text-base font-bold truncate ${item.song.badgeColor.titleColor}`}>
                            {item.song.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-white/50 truncate">{item.song.artist}</p>

                          {item.note && (
                            <p className="text-xs sm:text-sm text-white/80 italic bg-black/50 px-3.5 py-1.5 rounded-xl border border-white/10 mt-1">
                              "{item.note}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/40 block">
                          Req by
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-green-400 block truncate max-w-[120px] sm:max-w-[150px]">
                          {item.requestedBy}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom-Right Action Button (FAB) for "Send Comment" */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          id="fab-send-comment"
          onClick={onOpenCommentModal}
          className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/30"
          title="Send Comment to Host"
        >
          <MessageSquare className="w-7 h-7 fill-black" />
        </button>
      </div>
    </div>
  );
};
