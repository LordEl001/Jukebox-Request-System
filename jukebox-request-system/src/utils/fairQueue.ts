import { QueueItem } from '../types';

/**
 * Calculates a fair-play queue using a Round-Robin algorithm by user.
 * 
 * Algorithm:
 * 1. Preserves currently playing track (status === 'playing') at position 0 if present.
 * 2. Determines user rotation order for pending items based on:
 *    a. Is the user currently on stage (playingItem)? If yes, placed at end of current rotation round.
 *    b. Has the user sang before in history (completedQueue)? Ordered by lastSangTime ascending (earliest sang first; never sang = 0).
 *    c. Tie-breaker: Earliest arrival timestamp of their first pending request.
 * 3. Interleaves requests round-robin: 1st song for each user in rotation order, then 2nd song for each user, etc.
 * 4. Assigns status: position 0 => 'playing', position 1 => 'next', remaining => 'queued'.
 */
export function calculateFairQueue(
  rawQueue: QueueItem[],
  completedQueue: QueueItem[] = []
): QueueItem[] {
  if (!rawQueue || rawQueue.length === 0) {
    return [];
  }

  // Find currently playing track if any
  const playingItem = rawQueue.find((item) => item.status === 'playing');
  const pendingItems = rawQueue.filter((item) => item.status !== 'playing');

  if (pendingItems.length === 0) {
    return playingItem ? [{ ...playingItem, status: 'playing' }] : [];
  }

  // Build a map of when each user last completed a track (from completedQueue)
  const userLastSangTime: Record<string, number> = {};
  completedQueue.forEach((item, index) => {
    const user = item.requestedBy ? item.requestedBy.trim() : 'Guest Patron';
    const ts = item.timestamp || Date.now() - index * 60000;
    if (!userLastSangTime[user] || ts > userLastSangTime[user]) {
      userLastSangTime[user] = ts;
    }
  });

  // Current singer (if a song is actively playing)
  const currentSinger = playingItem && playingItem.requestedBy
    ? playingItem.requestedBy.trim()
    : null;

  // Group pending requests by user
  const userGroups: Record<string, QueueItem[]> = {};
  const usersWithPending: string[] = [];

  for (const item of pendingItems) {
    const user = item.requestedBy ? item.requestedBy.trim() : 'Guest Patron';
    if (!userGroups[user]) {
      userGroups[user] = [];
      usersWithPending.push(user);
    }
    userGroups[user].push(item);
  }

  // Determine user rotation order among users with pending requests
  usersWithPending.sort((uA, uB) => {
    // 1. Current singer penalty (the person currently on stage goes last in rotation)
    if (currentSinger) {
      if (uA === currentSinger && uB !== currentSinger) return 1;
      if (uB === currentSinger && uA !== currentSinger) return -1;
    }

    // 2. Last sang timestamp (0 if never sang)
    const sangA = userLastSangTime[uA] || 0;
    const sangB = userLastSangTime[uB] || 0;
    if (sangA !== sangB) {
      return sangA - sangB; // Smaller timestamp = sang longer ago (or never) = higher priority
    }

    // 3. Earliest arrival timestamp of pending request
    const firstReqA = userGroups[uA][0]?.timestamp || 0;
    const firstReqB = userGroups[uB][0]?.timestamp || 0;
    return firstReqA - firstReqB;
  });

  // Interleave round-robin across users in rotation order
  const reorderedPending: QueueItem[] = [];
  let round = 0;
  let hasMore = true;

  while (hasMore) {
    hasMore = false;
    for (const user of usersWithPending) {
      if (round < userGroups[user].length) {
        reorderedPending.push(userGroups[user][round]);
        if (round + 1 < userGroups[user].length) {
          hasMore = true;
        }
      }
    }
    round++;
  }

  // Assemble full queue
  const fullList = playingItem ? [playingItem, ...reorderedPending] : reorderedPending;

  // Re-assign statuses cleanly
  return fullList.map((item, idx) => ({
    ...item,
    status: idx === 0 ? 'playing' : idx === 1 ? 'next' : 'queued',
  }));
}
