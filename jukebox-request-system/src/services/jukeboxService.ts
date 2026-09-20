import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  deleteField,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Song, QueueItem, Comment } from '../types';
import { MOCK_SONGS, MOCK_INITIAL_QUEUE, MOCK_COMMENTS, DEFAULT_SONG_STYLE } from '../data/mockData';

// Collection references
const SONGS_COLLECTION = 'songs';
const QUEUE_COLLECTION = 'queue';
const COMMENTS_COLLECTION = 'comments';
const SETTINGS_COLLECTION = 'settings';
const HOST_CONFIG_DOC = 'host_config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Real-Time Songs Subscription
 */
export function subscribeSongs(onUpdate: (songs: Song[]) => void) {
  const songsRef = collection(db, SONGS_COLLECTION);

  return onSnapshot(
    songsRef,
    async (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
        return;
      }

      // Filter out legacy mock song IDs if present
      const sampleIds = new Set(['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10']);
      const sampleDocs = snapshot.docs.filter((d) => sampleIds.has(d.id));

      if (sampleDocs.length > 0) {
        try {
          const batch = writeBatch(db);
          sampleDocs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        } catch (err) {
          console.warn('Could not auto-purge legacy sample songs:', err);
        }
      }

      const validDocs = snapshot.docs.filter((d) => !sampleIds.has(d.id));

      // Strip legacy 'genre' field from any existing documents in Firestore database
      const docsWithGenre = validDocs.filter((d) => d.data().genre !== undefined);
      if (docsWithGenre.length > 0) {
        try {
          const cleanBatch = writeBatch(db);
          docsWithGenre.forEach((d) => {
            cleanBatch.update(d.ref, { genre: deleteField() });
          });
          cleanBatch.commit().catch((e) => console.warn('Could not clean genre from database:', e));
        } catch (err) {
          console.warn('Batch error cleaning genre field:', err);
        }
      }

      const songs: Song[] = validDocs.map((docSnap, idx) => {
        const data = docSnap.data();

        return {
          id: data.id || docSnap.id,
          artist: data.artist_name || data.artist || 'Unknown Artist',
          title: data.song_title || data.title || 'Untitled',
          duration: data.duration || '3:30',
          trackNumber: data.trackNumber || idx + 1,
          addedAt: data.addedAt || data.timestamp || 0,
          badgeColor: DEFAULT_SONG_STYLE,
        };
      });

      // Sort songs alphabetically by Artist (A-Z), then by Song Title (A-Z)
      songs.sort((a, b) => {
        const artistCompare = a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base', numeric: true });
        if (artistCompare !== 0) return artistCompare;
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true });
      });

      // Assign sequential trackNumber based on alphabetical artist position
      songs.forEach((s, idx) => {
        s.trackNumber = idx + 1;
      });

      onUpdate(songs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, SONGS_COLLECTION);
    }
  );
}

/**
 * Real-Time Queue Subscription
 */
export function subscribeQueue(
  songsList: Song[],
  onUpdate: (queue: QueueItem[]) => void
) {
  const queueRef = collection(db, QUEUE_COLLECTION);

  return onSnapshot(
    queueRef,
    async (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
        return;
      }

      // Filter out legacy mock queue IDs if present
      const sampleQueueIds = new Set(['q1', 'q2', 'q3', 'q4']);
      const sampleDocs = snapshot.docs.filter((d) => sampleQueueIds.has(d.id));

      if (sampleDocs.length > 0) {
        try {
          const batch = writeBatch(db);
          sampleDocs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        } catch (err) {
          console.warn('Could not auto-purge legacy sample queue:', err);
        }
      }

      const validDocs = snapshot.docs.filter((d) => !sampleQueueIds.has(d.id));

      const songsMap = new Map<string, Song>();
      songsList.forEach((s) => songsMap.set(s.id, s));

      const queueItems: QueueItem[] = validDocs.map((docSnap) => {
        const data = docSnap.data();

        // Find associated song
        const song = songsMap.get(data.song_id) || {
          id: data.song_id || 'unknown',
          title: data.song_title || 'Unknown Song',
          artist: data.artist_name || 'Unknown Artist',
          duration: '3:30',
          trackNumber: 1,
          badgeColor: DEFAULT_SONG_STYLE,
        };

        const dateObj = data.timestamp ? new Date(data.timestamp) : new Date();
        const formattedTime = dateObj.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        return {
          queueId: data.queue_id || docSnap.id,
          song,
          requestedBy: data.user_name || 'Guest Patron',
          note: data.note || undefined,
          status: data.status || 'queued',
          requestedAt: formattedTime,
          timestamp: data.timestamp || Date.now(),
        } as QueueItem & { timestamp?: number };
      });

      onUpdate(queueItems);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, QUEUE_COLLECTION);
    }
  );
}

/**
 * Real-Time Comments Subscription
 */
export function subscribeComments(onUpdate: (comments: Comment[]) => void) {
  const commentsRef = collection(db, COMMENTS_COLLECTION);

  return onSnapshot(
    commentsRef,
    async (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
        return;
      }

      // Filter out legacy mock comment IDs if present
      const sampleCommentIds = new Set(['c1', 'c2']);
      const sampleDocs = snapshot.docs.filter((d) => sampleCommentIds.has(d.id));

      if (sampleDocs.length > 0) {
        try {
          const batch = writeBatch(db);
          sampleDocs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        } catch (err) {
          console.warn('Could not auto-purge legacy sample comments:', err);
        }
      }

      const validDocs = snapshot.docs.filter((d) => !sampleCommentIds.has(d.id));

      const commentsList: Comment[] = validDocs.map((docSnap) => {
        const data = docSnap.data();
        const dateObj = data.timestamp ? new Date(data.timestamp) : new Date();
        const formattedTime = dateObj.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        return {
          id: data.id || docSnap.id,
          author: data.user_name || 'Anonymous',
          message: data.message || '',
          tag: data.tag || 'General',
          timestamp: formattedTime,
          rawTimestamp: data.timestamp || 0,
        } as Comment & { rawTimestamp?: number };
      });

      // Sort newest comments first
      commentsList.sort((a, b) => ((b as any).rawTimestamp || 0) - ((a as any).rawTimestamp || 0));
      onUpdate(commentsList);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COMMENTS_COLLECTION);
    }
  );
}

// ---------------------------------------------------------------------------
// Firestore Mutation Helpers
// ---------------------------------------------------------------------------

/** Add a single song to the songs collection */
export async function dbAddSong(song: Song) {
  try {
    const songDocRef = doc(db, SONGS_COLLECTION, song.id);
    await setDoc(songDocRef, {
      id: song.id,
      artist_name: song.artist,
      song_title: song.title,
      duration: song.duration,
      trackNumber: song.trackNumber,
      addedAt: song.addedAt || Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SONGS_COLLECTION}/${song.id}`);
  }
}

/** Bulk import songs into songs collection */
export async function dbBulkImportSongs(songs: Song[]) {
  try {
    const batch = writeBatch(db);
    const now = Date.now();
    songs.forEach((song, i) => {
      const ref = doc(db, SONGS_COLLECTION, song.id);
      batch.set(ref, {
        id: song.id,
        artist_name: song.artist,
        song_title: song.title,
        duration: song.duration,
        trackNumber: song.trackNumber,
        addedAt: song.addedAt || (now + i), // offset slightly so bulk upload order is preserved if needed
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, SONGS_COLLECTION);
  }
}

/** Clear all songs from catalog */
export async function dbClearCatalog() {
  try {
    const snapshot = await getDocs(collection(db, SONGS_COLLECTION));
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, SONGS_COLLECTION);
  }
}

/** Add song request to queue collection */
export async function dbRequestSong(song: Song, userName: string) {
  const queueId = `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  try {
    const queueDocRef = doc(db, QUEUE_COLLECTION, queueId);

    await setDoc(queueDocRef, {
      queue_id: queueId,
      user_name: userName || 'Guest Patron',
      song_id: song.id,
      timestamp: Date.now(),
      status: 'queued',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${QUEUE_COLLECTION}/${queueId}`);
  }
}

/** Remove song request from queue */
export async function dbRemoveQueueItem(queueId: string) {
  try {
    await deleteDoc(doc(db, QUEUE_COLLECTION, queueId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${QUEUE_COLLECTION}/${queueId}`);
  }
}

/** Update status of queue item (playing, next, queued, played, skipped) */
export async function dbUpdateQueueStatus(queueId: string, status: string) {
  try {
    await updateDoc(doc(db, QUEUE_COLLECTION, queueId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${QUEUE_COLLECTION}/${queueId}`);
  }
}

/** Batch update multiple queue items (for reordering or Fair-Play updates) */
export async function dbBatchUpdateQueue(items: { queueId: string; status: string; timestamp?: number }[]) {
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const ref = doc(db, QUEUE_COLLECTION, item.queueId);
      const updateData: any = { status: item.status };
      if (item.timestamp !== undefined) {
        updateData.timestamp = item.timestamp;
      }
      batch.update(ref, updateData);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, QUEUE_COLLECTION);
  }
}

/** Add new comment */
export async function dbAddComment(comment: { author: string; message: string; tag: string }) {
  const id = `c-${Date.now()}`;
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, id);

    await setDoc(commentRef, {
      id,
      user_name: comment.author,
      message: comment.message,
      tag: comment.tag || 'General',
      timestamp: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COMMENTS_COLLECTION}/${id}`);
  }
}

/** Delete comment */
export async function dbDeleteComment(commentId: string) {
  try {
    await deleteDoc(doc(db, COMMENTS_COLLECTION, commentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COMMENTS_COLLECTION}/${commentId}`);
  }
}

export interface HostConfig {
  pin?: string;
  venueName?: string;
  updatedAt?: number;
}

/** Subscribe to Host Settings & Config (PIN/Password, Venue Name) */
export function subscribeHostConfig(onUpdate: (config: HostConfig) => void) {
  const configRef = doc(db, SETTINGS_COLLECTION, HOST_CONFIG_DOC);

  return onSnapshot(
    configRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          pin: data.pin,
          venueName: data.venue_name ?? data.venueName ?? '',
          updatedAt: data.updatedAt,
        });
      }
    },
    (error) => {
      console.warn('Error fetching host config, using local fallback:', error);
    }
  );
}

/** Subscribe to Host Config (PIN/Password) - legacy helper */
export function subscribeHostPin(onUpdate: (pin: string) => void) {
  const configRef = doc(db, SETTINGS_COLLECTION, HOST_CONFIG_DOC);

  return onSnapshot(
    configRef,
    (docSnap) => {
      if (docSnap.exists() && docSnap.data().pin) {
        onUpdate(docSnap.data().pin);
      }
    },
    (error) => {
      console.warn('Error fetching host config, using local PIN fallback:', error);
    }
  );
}

/** Update Venue / Location Name in Firestore */
export async function dbUpdateVenueName(venueName: string) {
  try {
    const configRef = doc(db, SETTINGS_COLLECTION, HOST_CONFIG_DOC);
    await setDoc(configRef, { venue_name: venueName.trim(), updatedAt: Date.now() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/${HOST_CONFIG_DOC}`);
  }
}

/** Clear all completed/played history from queue */
export async function dbClearCompletedHistory() {
  try {
    const snapshot = await getDocs(collection(db, QUEUE_COLLECTION));
    const batch = writeBatch(db);
    let count = 0;
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === 'played' || data.status === 'completed') {
        batch.delete(docSnap.ref);
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, QUEUE_COLLECTION);
  }
}

/** Update Host Config PIN/Password in Firestore */
export async function dbUpdateHostPin(newPin: string) {
  try {
    const configRef = doc(db, SETTINGS_COLLECTION, HOST_CONFIG_DOC);
    await setDoc(configRef, { pin: newPin, updatedAt: Date.now() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/${HOST_CONFIG_DOC}`);
  }
}
