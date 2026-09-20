/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PatronTab, ViewMode, QueueItem, Song, Comment } from './types';
import { DEFAULT_SONG_STYLE } from './data/mockData';
import { calculateFairQueue } from './utils/fairQueue';
import { Header } from './components/Header';
import { PatronView } from './components/PatronView';
import { HostView } from './components/HostView';
import { SendCommentModal } from './components/SendCommentModal';
import { DisplayNameModal } from './components/DisplayNameModal';
import { HostAuthModal } from './components/HostAuthModal';
import {
  subscribeSongs,
  subscribeQueue,
  subscribeComments,
  subscribeHostConfig,
  dbAddSong,
  dbBulkImportSongs,
  dbClearCatalog,
  dbRequestSong,
  dbRemoveQueueItem,
  dbUpdateQueueStatus,
  dbBatchUpdateQueue,
  dbAddComment,
  dbDeleteComment,
  dbUpdateHostPin,
  dbUpdateVenueName,
  dbClearCompletedHistory,
} from './services/jukeboxService';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('patron');
  const [activeTab, setActiveTab] = useState<PatronTab>('catalog');
  const [searchQuery, setSearchQuery] = useState('');

  const [songs, setSongs] = useState<Song[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [completedQueue, setCompletedQueue] = useState<QueueItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  // Venue / Location Name State (persisted & synced with Firestore)
  const [venueName, setVenueName] = useState<string>(() => {
    return localStorage.getItem('venueName') || '';
  });

  // Host Authentication State & Custom PIN
  const [hostPin, setHostPin] = useState<string>(() => {
    return localStorage.getItem('hostPin') || '1234';
  });
  const [isHostAuthenticated, setIsHostAuthenticated] = useState<boolean>(false);
  const [isHostAuthModalOpen, setIsHostAuthModalOpen] = useState<boolean>(false);

  // Patron Display Name State & LocalStorage
  const [patronDisplayName, setPatronDisplayName] = useState<string>(() => {
    return localStorage.getItem('patronDisplayName') || '';
  });
  const [isDisplayNameModalOpen, setIsDisplayNameModalOpen] = useState<boolean>(() => {
    return !localStorage.getItem('patronDisplayName');
  });

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isHostMenuOpen, setIsHostMenuOpen] = useState(false);

  // 1. Subscribe to Songs in Real-Time
  useEffect(() => {
    const unsubscribe = subscribeSongs((updatedSongs) => {
      setSongs(updatedSongs);
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Queue in Real-Time
  useEffect(() => {
    const unsubscribe = subscribeQueue(songs, (rawQueue) => {
      const active = rawQueue.filter(
        (item) => item.status !== 'played' && item.status !== ('completed' as any)
      );
      const completed = rawQueue.filter(
        (item) => item.status === 'played' || item.status === ('completed' as any)
      );

      // Apply Fair-Play queue calculation to active queue items
      const fairQueue = calculateFairQueue(active, completed);
      setQueue(fairQueue);
      setCompletedQueue(completed);

      // Automatically sync Fair-Play status assignments to Firestore if out of sync
      const needsSync = fairQueue.some((item) => {
        const rawDoc = active.find((r) => r.queueId === item.queueId);
        return !rawDoc || rawDoc.status !== item.status;
      });

      if (needsSync && fairQueue.length > 0) {
        dbBatchUpdateQueue(
          fairQueue.map((item) => ({
            queueId: item.queueId,
            status: item.status,
          }))
        ).catch((err) => console.warn('Fair-Play status auto-sync:', err));
      }
    });

    return () => unsubscribe();
  }, [songs]);

  // 3. Subscribe to Comments in Real-Time
  useEffect(() => {
    const unsubscribe = subscribeComments((updatedComments) => {
      setComments(updatedComments);
    });
    return () => unsubscribe();
  }, []);

  // 4. Subscribe to Host Settings & Config (PIN and Venue Location) in Real-Time
  useEffect(() => {
    const unsubscribe = subscribeHostConfig((config) => {
      if (config.pin) {
        setHostPin(config.pin);
        localStorage.setItem('hostPin', config.pin);
      }
      if (config.venueName !== undefined) {
        setVenueName(config.venueName);
        localStorage.setItem('venueName', config.venueName);
      }
    });
    return () => unsubscribe();
  }, []);

  // Change Host PIN handler
  const handleChangeHostPin = async (newPin: string) => {
    setHostPin(newPin);
    localStorage.setItem('hostPin', newPin);
    await dbUpdateHostPin(newPin);
  };

  // Change Venue / Location handler
  const handleChangeVenueName = async (newVenue: string) => {
    setVenueName(newVenue);
    localStorage.setItem('venueName', newVenue);
    await dbUpdateVenueName(newVenue);
  };

  // Toggle View Mode with Password Guard for Host Mode
  const handleToggleViewMode = (mode: ViewMode) => {
    if (mode === 'host' && !isHostAuthenticated) {
      setIsHostAuthModalOpen(true);
    } else {
      setViewMode(mode);
    }
  };

  const handleHostAuthenticated = () => {
    setIsHostAuthenticated(true);
    setViewMode('host');
    setIsHostAuthModalOpen(false);
  };

  const handleLockConsole = () => {
    setIsHostAuthenticated(false);
    setViewMode('patron');
    setIsHostMenuOpen(false);
  };

  // Save display name handler
  const handleSaveDisplayName = (name: string) => {
    setPatronDisplayName(name);
    localStorage.setItem('patronDisplayName', name);
    setIsDisplayNameModalOpen(false);
  };

  // Add a single song manually to catalog in Firestore
  const handleAddSong = async (songData: Omit<Song, 'id' | 'trackNumber' | 'badgeColor'>) => {
    const newSong: Song = {
      ...songData,
      id: `s-new-${Date.now()}`,
      trackNumber: songs.length + 1,
      badgeColor: DEFAULT_SONG_STYLE,
    };
    await dbAddSong(newSong);
  };

  // Bulk import CSV songs to catalog in Firestore
  const handleImportSongs = async (newSongs: Song[]) => {
    await dbBulkImportSongs(newSongs);
  };

  // Clear entire song catalog in Firestore
  const handleClearCatalog = async () => {
    await dbClearCatalog();
  };

  // Request song from catalog into live queue in Firestore
  const handleRequestSong = React.useCallback(async (song: Song) => {
    if (!patronDisplayName) {
      setIsDisplayNameModalOpen(true);
      return;
    }

    await dbRequestSong(song, patronDisplayName || 'Guest Patron');
  }, [patronDisplayName]);

  // Remove song from queue - patrons can only remove their own requests
  const handleRemoveSongFromQueue = React.useCallback(async (songId: string) => {
    const targetItem = queue.find(
      (item) => item.song.id === songId && item.requestedBy === patronDisplayName
    );
    if (targetItem) {
      await dbRemoveQueueItem(targetItem.queueId);
    }
  }, [queue, patronDisplayName]);

  // Complete / Played track handler
  const handleCompleteTrack = async (queueId: string) => {
    // 1. Mark completed track in Firestore
    await dbUpdateQueueStatus(queueId, 'played');

    // 2. Predict next Fair-Play queue advancement and sync statuses in Firestore
    const target = queue.find((q) => q.queueId === queueId);
    if (target) {
      const remainingActive = queue.filter((q) => q.queueId !== queueId);
      const updatedCompleted = [{ ...target, status: 'played' as const }, ...completedQueue];
      const newFairQueue = calculateFairQueue(remainingActive, updatedCompleted);
      if (newFairQueue.length > 0) {
        await dbBatchUpdateQueue(
          newFairQueue.map((item) => ({
            queueId: item.queueId,
            status: item.status,
          }))
        );
      }
    }
  };

  // Skip track handler
  const handleSkipTrack = async (queueId: string) => {
    await dbRemoveQueueItem(queueId);
    const remainingActive = queue.filter((q) => q.queueId !== queueId);
    const newFairQueue = calculateFairQueue(remainingActive, completedQueue);
    if (newFairQueue.length > 0) {
      await dbBatchUpdateQueue(
        newFairQueue.map((item) => ({
          queueId: item.queueId,
          status: item.status,
        }))
      );
    }
  };

  // Reorder queue handler (up/down)
  const handleReorderQueue = (queueId: string, direction: 'up' | 'down') => {
    setQueue((prev) => {
      const playingItem = prev.find((i) => i.status === 'playing');
      const queueList = prev.filter((i) => i.status !== 'playing');

      const index = queueList.findIndex((i) => i.queueId === queueId);
      if (index === -1) return prev;

      const newQueueList = [...queueList];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newQueueList.length) return prev;

      const temp = newQueueList[index];
      newQueueList[index] = newQueueList[targetIndex];
      newQueueList[targetIndex] = temp;

      const fullList = playingItem ? [playingItem, ...newQueueList] : newQueueList;

      return fullList.map((item, idx) => ({
        ...item,
        status: idx === 0 ? 'playing' : idx === 1 ? 'next' : 'queued',
      }));
    });
  };

  // Clear completed play list history for daily reset
  const handleClearHistory = async () => {
    await dbClearCompletedHistory();
  };

  // Handle comment submit
  const handleAddComment = async (newComment: { author: string; message: string; tag: string }) => {
    await dbAddComment(newComment);
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    await dbDeleteComment(commentId);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f4f4f4] font-sans antialiased selection:bg-white selection:text-black w-full max-w-full overflow-x-hidden">
      {/* Top Sticky Header */}
      <Header
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        onOpenHostMenu={() => setIsHostMenuOpen(true)}
        queueCount={queue.length}
        venueName={venueName}
      />

      {/* Main View Container */}
      <main className="max-w-4xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-5 pb-6 sm:pb-8 w-full max-w-full overflow-x-hidden">
        {viewMode === 'patron' ? (
          <PatronView
            songs={songs}
            queue={queue}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onRequestSong={handleRequestSong}
            onRemoveSong={handleRemoveSongFromQueue}
            onOpenCommentModal={() => setIsCommentModalOpen(true)}
            patronDisplayName={patronDisplayName}
            onChangeDisplayName={() => setIsDisplayNameModalOpen(true)}
          />
        ) : (
          <HostView
            queue={queue}
            completedQueue={completedQueue}
            comments={comments}
            onCompleteTrack={handleCompleteTrack}
            onSkipTrack={handleSkipTrack}
            onReorderQueue={handleReorderQueue}
            onDeleteComment={handleDeleteComment}
            onAddSong={handleAddSong}
            onImportSongs={handleImportSongs}
            onClearCatalog={handleClearCatalog}
            onClearHistory={handleClearHistory}
            catalogCount={songs.length}
            isHostMenuOpen={isHostMenuOpen}
            onOpenHostMenu={() => setIsHostMenuOpen(true)}
            onCloseHostMenu={() => setIsHostMenuOpen(false)}
            onLockConsole={handleLockConsole}
            hostPin={hostPin}
            onChangeHostPin={handleChangeHostPin}
            venueName={venueName}
            onChangeVenueName={handleChangeVenueName}
          />
        )}
      </main>

      {/* Send Comment Modal */}
      <SendCommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        onSubmitComment={handleAddComment}
        defaultAuthor={patronDisplayName}
      />

      {/* Display Name Modal */}
      <DisplayNameModal
        isOpen={isDisplayNameModalOpen}
        initialName={patronDisplayName}
        onSaveName={handleSaveDisplayName}
        onClose={patronDisplayName ? () => setIsDisplayNameModalOpen(false) : undefined}
      />

      {/* Host Password Auth Modal */}
      <HostAuthModal
        isOpen={isHostAuthModalOpen}
        onClose={() => setIsHostAuthModalOpen(false)}
        onAuthenticate={handleHostAuthenticated}
        hostPin={hostPin}
      />
    </div>
  );
}
