import React, { useState, useRef, useEffect } from 'react';
import { QueueItem, Comment, Song } from '../types';
import {
  CheckCircle2,
  SkipForward,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Radio,
  Sliders,
  MessageSquare,
  Play,
  Pause,
  Lock,
  Unlock,
  Volume2,
  Trash2,
  X,
  Upload,
  Plus,
  FileSpreadsheet,
  Check,
  Music,
  History,
  Sparkles,
  KeyRound,
  RotateCcw,
  MapPin
} from 'lucide-react';
import { AddSongModal } from './AddSongModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { parseSongsCSV } from '../utils/csvParser';

interface HostViewProps {
  queue: QueueItem[];
  completedQueue?: QueueItem[];
  comments: Comment[];
  onCompleteTrack: (queueId: string) => void;
  onSkipTrack: (queueId: string) => void;
  onReorderQueue: (queueId: string, direction: 'up' | 'down') => void;
  onDeleteComment?: (commentId: string) => void;
  onAddSong: (songData: Omit<Song, 'id' | 'trackNumber' | 'badgeColor'>) => void;
  onImportSongs: (newSongs: Song[]) => void;
  onClearCatalog: () => void;
  onClearHistory?: () => void;
  catalogCount: number;
  isHostMenuOpen: boolean;
  onOpenHostMenu: () => void;
  onCloseHostMenu: () => void;
  onLockConsole: () => void;
  hostPin: string;
  onChangeHostPin: (newPin: string) => Promise<void>;
  venueName?: string;
  onChangeVenueName?: (newVenue: string) => Promise<void>;
}

export const HostView: React.FC<HostViewProps> = ({
  queue,
  completedQueue = [],
  comments,
  onCompleteTrack,
  onSkipTrack,
  onReorderQueue,
  onDeleteComment,
  onAddSong,
  onImportSongs,
  onClearCatalog,
  onClearHistory,
  catalogCount,
  isHostMenuOpen,
  onOpenHostMenu,
  onCloseHostMenu,
  onLockConsole,
  hostPin,
  onChangeHostPin,
  venueName = '',
  onChangeVenueName,
}) => {
  const [queueLocked, setQueueLocked] = useState(false);
  const [autoAccept, setAutoAccept] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isResetHistoryConfirmOpen, setIsResetHistoryConfirmOpen] = useState(false);

  // Venue / Location Name State
  const [venueInput, setVenueInput] = useState(venueName || '');
  const [isSavingVenue, setIsSavingVenue] = useState(false);
  const [venueSavedNotice, setVenueSavedNotice] = useState(false);

  useEffect(() => {
    setVenueInput(venueName || '');
  }, [venueName]);

  const handleSaveVenue = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!onChangeVenueName) return;
    setIsSavingVenue(true);
    try {
      await onChangeVenueName(venueInput);
      setVenueSavedNotice(true);
      setTimeout(() => setVenueSavedNotice(false), 2500);
    } catch (err) {
      console.error('Failed to save venue name:', err);
    } finally {
      setIsSavingVenue(false);
    }
  };

  const handleClearVenue = async () => {
    setVenueInput('');
    if (!onChangeVenueName) return;
    setIsSavingVenue(true);
    try {
      await onChangeVenueName('');
      setVenueSavedNotice(true);
      setTimeout(() => setVenueSavedNotice(false), 2500);
    } catch (err) {
      console.error('Failed to clear venue name:', err);
    } finally {
      setIsSavingVenue(false);
    }
  };

  // CSV Import State
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentlyPlaying = queue.find((q) => q.status === 'playing');
  const upcomingQueue = queue.filter((q) => q.status !== 'playing');
  const upNextItem = queue.find((q) => q.status === 'next') || upcomingQueue[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      if (csvText) {
        const parsed = parseSongsCSV(csvText, catalogCount);
        if (parsed.length > 0) {
          onImportSongs(parsed);
          setImportNotice(`Successfully imported ${parsed.length} songs into catalog!`);
          setTimeout(() => setImportNotice(null), 4000);
        } else {
          setImportNotice('No valid songs found in CSV. Expected headers: artist_name, song_title');
          setTimeout(() => setImportNotice(null), 4000);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadSampleCSV = () => {
    const sampleContent = `artist_name,song_title,duration\nBurna Boy,City Boys,3:20\nTaylor Swift,Anti-Hero,3:20\nQueen,Bohemian Rhapsody,5:55\nDrake,God's Plan,3:18\nStevie Wonder,Superstition,4:00`;
    const blob = new Blob([sampleContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_song_catalog.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-full overflow-x-hidden">
      {/* Host Control Top Banner */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={onOpenHostMenu}
              className="p-2.5 sm:p-3 rounded-2xl bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/30 hover:bg-[#F27D26]/20 transition-all flex items-center gap-2 shrink-0 active:scale-95 shadow-sm"
              title="Open Host Menu Drawer"
            >
              <Sliders className="w-5 h-5 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider hidden sm:inline-block">
                Host Menu
              </span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-widest text-white truncate">
                  Host DJ Admin
                </h2>
                <span className="text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 uppercase tracking-wider shrink-0">
                  Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/50 mt-1 truncate">
                Catalog: <span className="text-white font-bold">{catalogCount} songs</span> • Live Stage Controls
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2.5 sm:pt-0 border-t sm:border-0 border-white/10">
            <button
              onClick={() => setIsAddSongModalOpen(true)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-black bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-500/25 transition-all shrink-0 active:scale-95 uppercase tracking-wider"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Song</span>
            </button>

            <button
              onClick={() => setIsClearConfirmOpen(true)}
              disabled={catalogCount === 0}
              title="Delete All Songs in Catalog"
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-extrabold bg-rose-500/15 hover:bg-rose-500/25 disabled:opacity-40 disabled:pointer-events-none text-rose-400 border border-rose-500/30 transition-all shrink-0 active:scale-95 uppercase tracking-wider"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all shrink-0 active:scale-95 shadow-sm ${
                isPlaying
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-green-500/10'
                  : 'bg-white/10 text-white/50 hover:text-white border border-white/15'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Live' : 'Paused'}</span>
            </button>

            <button
              onClick={() => setIsChangePasswordModalOpen(true)}
              className="p-2.5 sm:p-3 rounded-full bg-[#F27D26]/10 hover:bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/30 transition-all shrink-0 active:scale-95 shadow-sm"
              title="Change Host Password / PIN"
            >
              <KeyRound className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={onLockConsole}
              className="p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-rose-500/20 text-white/60 hover:text-rose-400 border border-white/15 transition-all shrink-0 active:scale-95 shadow-sm"
              title="Lock Host Console"
            >
              <Lock className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Editable Current Location / Venue Name Card */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
        <form onSubmit={handleSaveVenue} className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
              <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span>Current Location / Venue Name</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <span>Live Title Preview:</span>
              <span className="text-amber-400 font-extrabold">
                {venueInput.trim() ? `Live @ ${venueInput.trim()}` : 'D Afrogenie Karaoke'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30 pointer-events-none" />
              <input
                type="text"
                id="host-venue-name-input"
                value={venueInput}
                onChange={(e) => setVenueInput(e.target.value)}
                placeholder="e.g. The Velvet Lounge, Rumors Bar, Stage A..."
                className="w-full bg-black/50 border border-white/15 focus:border-amber-400/50 rounded-2xl py-3.5 pl-11 pr-4 text-base sm:text-sm text-white placeholder:text-white/30 focus:outline-none transition-all shadow-inner"
              />
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="submit"
                id="save-venue-btn"
                disabled={isSavingVenue}
                className="flex-1 sm:flex-none px-6 py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95 transition-all"
              >
                {venueSavedNotice ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{isSavingVenue ? 'Saving...' : 'Save Venue'}</span>
                  </>
                )}
              </button>

              {venueInput && (
                <button
                  type="button"
                  onClick={handleClearVenue}
                  title="Reset to default title"
                  className="px-4 py-3.5 bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs sm:text-sm font-bold rounded-2xl border border-white/10 transition-all active:scale-95"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Slide-over Host Drawer Menu */}
      {isHostMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#111111] border-l border-white/10 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2 text-[#F27D26] font-extrabold text-sm uppercase tracking-wider">
                  <Sliders className="w-4 h-4" />
                  <span>DJ Admin Settings</span>
                </div>
                <button
                  onClick={onCloseHostMenu}
                  className="p-1.5 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Notification Banner */}
              {importNotice && (
                <div className="p-3 bg-green-500/20 border border-green-500/40 text-green-300 text-xs rounded-2xl flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{importNotice}</span>
                </div>
              )}

              {/* CSV Bulk Catalog Upload Section */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                  <FileSpreadsheet className="w-4 h-4 text-green-400" />
                  <span>CSV Bulk Catalog Upload</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Upload a CSV file containing <code className="text-green-400 font-mono">artist_name, song_title</code> to bulk import tracks.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all"
                  >
                    <Upload className="w-4 h-4 stroke-[2.5]" />
                    <span>Upload CSV</span>
                  </button>

                  <button
                    onClick={handleDownloadSampleCSV}
                    className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-bold rounded-xl border border-white/10 transition-all"
                    title="Download Sample CSV Template"
                  >
                    Sample
                  </button>
                </div>
              </div>

              {/* Venue / Location Settings Section in Drawer */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>Venue / Location</span>
                  </div>
                  <span className="text-[10px] text-amber-400/80 font-mono uppercase">Header Title</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Set the current venue to display <code className="text-amber-400 font-mono">Live @ [Venue Name]</code> in the live view.
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={venueInput}
                    onChange={(e) => setVenueInput(e.target.value)}
                    placeholder="e.g. The Velvet Lounge"
                    className="w-full bg-black/40 border border-white/15 focus:border-amber-400/50 rounded-xl py-2 px-3 text-base sm:text-xs text-white placeholder:text-white/30 focus:outline-none transition-all"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveVenue()}
                      disabled={isSavingVenue}
                      className="flex-1 py-2 px-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-amber-400/20 transition-all"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{venueSavedNotice ? 'Saved!' : 'Save Venue'}</span>
                    </button>
                    {venueInput && (
                      <button
                        type="button"
                        onClick={handleClearVenue}
                        className="py-2 px-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-semibold rounded-xl border border-white/10 transition-all"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Manual Add Song Action */}
              <button
                onClick={() => {
                  onCloseHostMenu();
                  setIsAddSongModalOpen(true);
                }}
                className="w-full p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold text-white flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="w-4 h-4 text-green-400" />
                  <span>Add Single Song Manually</span>
                </div>
                <span className="text-[10px] text-white/40 uppercase font-mono">Catalog</span>
              </button>

              {/* Clear Entire Catalog Action */}
              <button
                onClick={() => {
                  setIsClearConfirmOpen(true);
                }}
                disabled={catalogCount === 0}
                className="w-full p-3.5 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 disabled:pointer-events-none border border-rose-500/20 rounded-2xl text-xs font-bold text-rose-400 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Delete All Catalog Songs</span>
                </div>
                <span className="text-[10px] text-rose-300/60 uppercase font-mono">{catalogCount} songs</span>
              </button>

              {/* Change Host Password Action */}
              <button
                onClick={() => {
                  onCloseHostMenu();
                  setIsChangePasswordModalOpen(true);
                }}
                className="w-full p-3.5 bg-[#F27D26]/10 hover:bg-[#F27D26]/20 border border-[#F27D26]/30 rounded-2xl text-xs font-bold text-[#F27D26] flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 text-[#F27D26]" />
                  <span>Change Host Password / PIN</span>
                </div>
                <span className="text-[10px] text-[#F27D26]/70 uppercase font-mono">Security</span>
              </button>

              {/* Reset for the Day (Clear History) Action */}
              <button
                onClick={() => {
                  onCloseHostMenu();
                  setIsResetHistoryConfirmOpen(true);
                }}
                disabled={completedQueue.length === 0}
                className="w-full p-3.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 disabled:opacity-40 disabled:pointer-events-none rounded-2xl text-xs font-bold text-amber-400 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Reset for the Day (Clear History)</span>
                </div>
                <span className="text-[10px] text-amber-300/70 uppercase font-mono">{completedQueue.length} played</span>
              </button>

              {/* Toggles */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <p className="font-bold text-white">Auto-Accept Requests</p>
                    <p className="text-[10px] text-white/40">Interleave via Fair-Play algorithm</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoAccept}
                    onChange={(e) => setAutoAccept(e.target.checked)}
                    className="w-4 h-4 accent-[#F27D26] rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <p className="font-bold text-white">Stage Speaker Output</p>
                    <p className="text-[10px] text-white/40 font-mono">Main Speakers 1/2</p>
                  </div>
                  <Volume2 className="w-4 h-4 text-green-400" />
                </div>
              </div>

              {/* Comment Inbox Panel in Drawer */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#F27D26]" />
                    <span>Patron Messages ({comments.length})</span>
                  </div>
                </div>

                {comments.length === 0 ? (
                  <p className="text-xs text-white/30 italic p-3 bg-white/5 rounded-xl">
                    No active patron messages.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {comments.map((comm) => (
                      <div
                        key={`drawer-comment-${comm.id}`}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#F27D26]">{comm.author}</span>
                          {onDeleteComment && (
                            <button
                              onClick={() => onDeleteComment(comm.id)}
                              className="text-white/30 hover:text-rose-400 transition-colors p-0.5"
                              title="Dismiss Message"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-white/80">{comm.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <button
                onClick={onLockConsole}
                className="w-full py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-bold rounded-full text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Console</span>
              </button>
              <button
                onClick={onCloseHostMenu}
                className="w-full py-3 bg-white text-black font-bold rounded-full text-xs uppercase tracking-wider hover:bg-white/90 transition-colors shadow-lg"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Spotlight Box: Now Playing & Up Next in Rotation */}
      {(currentlyPlaying || upNextItem) && (
        <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Now Playing Spotlight */}
          {currentlyPlaying ? (
            <div className="bg-gradient-to-br from-green-950/40 via-[#111111] to-[#111111] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-green-500/30 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[11px] font-extrabold uppercase text-green-400 tracking-widest flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                    <Radio className="w-4 h-4 animate-pulse" />
                    Now Playing on Stage
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-white/50 font-bold">{currentlyPlaying.song.duration}</span>
                </div>

                <div className="space-y-1.5 min-w-0 mb-5">
                  <p className="text-lg sm:text-2xl font-black tracking-tight text-white truncate">
                    {currentlyPlaying.song.title}
                  </p>
                  <p className="text-xs sm:text-sm text-white/70 truncate">
                    {currentlyPlaying.song.artist}
                  </p>
                  <p className="text-xs sm:text-sm text-white/50 pt-1 truncate">
                    Singer: <span className="text-green-400 font-bold">{currentlyPlaying.requestedBy}</span>
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2.5 pt-4 border-t border-white/10">
                <button
                  id="complete-current-btn"
                  onClick={() => onCompleteTrack(currentlyPlaying.queueId)}
                  className="flex-1 py-3 sm:py-3.5 rounded-full bg-green-500 hover:bg-green-400 text-black font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 active:scale-95 transition-all shrink-0"
                  title="Mark Completed"
                >
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                  <span>Played / Done</span>
                </button>

                <button
                  id="skip-current-btn"
                  onClick={() => onSkipTrack(currentlyPlaying.queueId)}
                  className="px-4 sm:px-6 py-3 sm:py-3.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
                  title="Skip Track"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Skip</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl sm:rounded-3xl p-6 border border-white/10 flex flex-col items-center justify-center text-center">
              <Radio className="w-10 h-10 text-white/20 mb-2" />
              <p className="text-sm text-white/60 font-bold">No Song Currently Playing</p>
              <p className="text-xs text-white/40 mt-0.5">Select a song from the queue to start performance.</p>
            </div>
          )}

          {/* Up Next in Fair Play Rotation Spotlight */}
          {upNextItem ? (
            <div className="bg-gradient-to-br from-[#F27D26]/15 via-[#111111] to-[#111111] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-[#F27D26]/30 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[11px] font-extrabold uppercase text-[#F27D26] tracking-widest flex items-center gap-2 bg-[#F27D26]/10 px-3 py-1.5 rounded-full border border-[#F27D26]/20">
                    <Sparkles className="w-4 h-4" />
                    Up Next in Rotation
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-white/50 font-bold">{upNextItem.song.duration}</span>
                </div>

                <div className="space-y-1.5 min-w-0 mb-5">
                  <p className="text-lg sm:text-2xl font-black tracking-tight text-white truncate">
                    {upNextItem.song.title}
                  </p>
                  <p className="text-xs sm:text-sm text-white/70 truncate">
                    {upNextItem.song.artist}
                  </p>
                  <p className="text-xs sm:text-sm text-white/50 pt-1 truncate">
                    Singer: <span className="text-[#F27D26] font-bold">{upNextItem.requestedBy}</span>
                  </p>
                </div>
              </div>

              {/* Quick Actions for Up Next */}
              <div className="flex items-center gap-2.5 pt-4 border-t border-white/10">
                <button
                  onClick={() => onCompleteTrack(upNextItem.queueId)}
                  className="flex-1 py-3 sm:py-3.5 rounded-full bg-white/15 hover:bg-white/20 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 border border-white/20 active:scale-95 transition-all shrink-0 shadow-md"
                  title="Mark Done"
                >
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  <span>Start Now</span>
                </button>

                <button
                  onClick={() => onSkipTrack(upNextItem.queueId)}
                  className="px-4 sm:px-6 py-3 sm:py-3.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
                  title="Skip Track"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Skip</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl sm:rounded-3xl p-6 border border-white/10 flex flex-col items-center justify-center text-center">
              <Sparkles className="w-10 h-10 text-white/20 mb-2" />
              <p className="text-sm text-white/60 font-bold">No Up Next Song</p>
              <p className="text-xs text-white/40 mt-0.5">Queue is ready for new patron requests.</p>
            </div>
          )}
        </div>
      )}

      {/* Queue Control Panel */}
      <div className="space-y-3.5 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase text-white/50 tracking-[0.2em] flex items-center gap-2.5">
            <span>Upcoming Stage Queue</span>
            <span className="font-mono text-white/80 bg-white/10 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {upcomingQueue.length} TRACKS
            </span>
          </h3>
          <span className="text-xs text-white/40 font-mono">Fair-Play Interleaved</span>
        </div>

        {upcomingQueue.length === 0 ? (
          <div className="py-10 sm:py-12 text-center bg-white/5 border border-white/5 rounded-2xl sm:rounded-3xl p-6">
            <p className="text-sm sm:text-base text-white/70 font-semibold">No upcoming songs in queue.</p>
            <p className="text-xs sm:text-sm text-white/40 mt-1">Patrons can add tracks from the catalog!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingQueue.map((item, idx) => {
              const isUpNext = idx === 0;

              return (
                <div
                  key={`upcoming-${item.queueId}`}
                  className={`flex items-center justify-between p-3.5 sm:p-4.5 rounded-2xl sm:rounded-3xl transition-all gap-3 min-w-0 shadow-sm ${
                    isUpNext
                      ? 'bg-gradient-to-r from-[#F27D26]/10 via-[#111111] to-[#111111] border border-[#F27D26]/40 shadow-md'
                      : 'bg-white/5 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Left details */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-1 flex-1">
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => onReorderQueue(item.queueId, 'up')}
                        disabled={idx === 0}
                        className="text-white/30 hover:text-white disabled:opacity-20 transition-all p-1 hover:bg-white/10 rounded-lg active:scale-95"
                        title="Move Up"
                      >
                        <ChevronUp className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                      </button>
                      <button
                        onClick={() => onReorderQueue(item.queueId, 'down')}
                        disabled={idx === upcomingQueue.length - 1}
                        className="text-white/30 hover:text-white disabled:opacity-20 transition-all p-1 hover:bg-white/10 rounded-lg active:scale-95"
                        title="Move Down"
                      >
                        <ChevronDown className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                      </button>
                    </div>

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {isUpNext && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/30">
                            UP NEXT
                          </span>
                        )}
                        <p className="text-sm sm:text-base font-bold text-white truncate">{item.song.title}</p>
                      </div>
                      <p className="text-xs text-white/50 truncate">
                        {item.song.artist} • Req by <span className="text-green-400 font-bold">{item.requestedBy}</span>
                      </p>
                    </div>
                  </div>

                {/* Right Actions: DONE / SKIP Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    onClick={() => onCompleteTrack(item.queueId)}
                    className="px-3.5 sm:px-4.5 py-2 sm:py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl sm:rounded-2xl transition-all border border-green-500/30 flex items-center gap-1.5 shrink-0 active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Done</span>
                  </button>

                  <button
                    onClick={() => onSkipTrack(item.queueId)}
                    className="px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-xl sm:rounded-2xl transition-all border border-rose-500/30 flex items-center gap-1.5 shrink-0 active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Skip</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Completed History List */}
      {completedQueue.length > 0 && (
        <div className="space-y-3.5 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-extrabold uppercase text-white/50 tracking-[0.2em] flex items-center gap-2.5">
              <History className="w-4 h-4 text-green-400" />
              <span>Completed Played History</span>
              <span className="font-mono text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded-full text-xs font-bold border border-green-500/20">
                {completedQueue.length}
              </span>
            </h3>

            <button
              onClick={() => setIsResetHistoryConfirmOpen(true)}
              className="px-3.5 sm:px-4.5 py-2 text-xs sm:text-sm font-black uppercase tracking-wider bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl sm:rounded-2xl border border-amber-500/30 transition-all flex items-center gap-2 active:scale-95"
              title="Clear History / Reset for the Day"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear History / Reset Day</span>
            </button>
          </div>

          <div className="space-y-2">
            {completedQueue.map((item, idx) => (
              <div
                key={`completed-${item.queueId}-${idx}`}
                className="p-3.5 sm:p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between text-xs sm:text-sm opacity-60"
              >
                <div>
                  <p className="font-bold text-white line-through">{item.song.title}</p>
                  <p className="text-xs text-white/50">{item.song.artist} • Req by {item.requestedBy}</p>
                </div>
                <span className="text-[11px] text-green-400 font-extrabold uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                  Played
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patron Comments Inbox Main Section */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <h3 className="text-xs font-extrabold uppercase text-white/50 tracking-[0.2em] flex items-center gap-2.5">
          <MessageSquare className="w-4 h-4 text-[#F27D26]" />
          <span>Patron Comments & Requests Inbox</span>
          <span className="font-mono text-[#F27D26] bg-[#F27D26]/10 px-2.5 py-0.5 rounded-full text-xs font-bold border border-[#F27D26]/20">
            {comments.length}
          </span>
        </h3>

        {comments.length === 0 ? (
          <p className="text-xs sm:text-sm text-white/40 italic p-5 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/5">
            No active comments from patrons.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {comments.map((comm) => (
              <div
                key={`inbox-comment-${comm.id}`}
                className="p-4 sm:p-5 bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl space-y-2 relative group hover:border-white/20 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-extrabold text-[#F27D26]">{comm.author}</span>
                  <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 font-bold uppercase tracking-wider">
                    {comm.tag}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed">{comm.message}</p>
                <div className="flex items-center justify-between text-xs text-white/40 pt-1.5 font-mono">
                  <span>{comm.timestamp}</span>
                  {onDeleteComment && (
                    <button
                      onClick={() => onDeleteComment(comm.id)}
                      className="text-white/50 hover:text-rose-400 transition-colors flex items-center gap-1.5 bg-white/5 hover:bg-rose-500/10 px-3 py-1.5 rounded-xl border border-white/10 font-sans text-xs font-bold active:scale-95"
                      title="Dismiss Message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Dismiss</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear Catalog Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#111111] border border-rose-500/30 rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3.5 text-rose-400">
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <Trash2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">Delete Entire Catalog?</h3>
                <p className="text-xs text-white/50">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-white/70 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
              You are about to remove all <strong className="text-rose-400 font-bold">{catalogCount} songs</strong> from the active jukebox catalog. Patrons will no longer see these songs available for request.
            </p>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => setIsClearConfirmOpen(false)}
                className="flex-1 py-3.5 px-4 bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm rounded-full border border-white/10 transition-all active:scale-95 uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearCatalog();
                  setIsClearConfirmOpen(false);
                  setImportNotice('All songs deleted from catalog.');
                  setTimeout(() => setImportNotice(null), 4000);
                }}
                className="flex-1 py-3.5 px-4 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs sm:text-sm rounded-full shadow-lg shadow-rose-500/20 transition-all active:scale-95 uppercase tracking-wider"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Song Modal */}
      <AddSongModal
        isOpen={isAddSongModalOpen}
        onClose={() => setIsAddSongModalOpen(false)}
        onAddSong={onAddSong}
      />

      {/* Change Host Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentPin={hostPin}
        onChangePin={onChangeHostPin}
      />

      {/* Reset History / Daily Reset Confirmation Modal */}
      {isResetHistoryConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111111] border border-amber-500/30 rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-4.5 text-center relative shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <RotateCcw className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                Reset History for the Day?
              </h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                This will clear all <strong className="text-amber-400 font-bold">{completedQueue.length} completed tracks</strong> from the played history list for a new event night. Upcoming queued songs and catalog will remain untouched.
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setIsResetHistoryConfirmOpen(false)}
                className="flex-1 py-3.5 px-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearHistory?.();
                  setIsResetHistoryConfirmOpen(false);
                }}
                className="flex-1 py-3.5 px-4 rounded-full bg-amber-500 hover:bg-amber-600 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
