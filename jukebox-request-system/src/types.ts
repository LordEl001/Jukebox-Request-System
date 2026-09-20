export interface Song {
  id: string;
  trackNumber: number;
  title: string;
  artist: string;
  duration: string;
  addedAt?: number;
  badgeColor?: {
    bg: string;
    text: string;
    border: string;
    titleColor: string;
  };
}

export interface QueueItem {
  queueId: string;
  song: Song;
  requestedBy: string;
  note?: string;
  status: 'playing' | 'next' | 'queued' | 'played' | 'completed';
  requestedAt: string;
  timestamp?: number;
}

export type PatronTab = 'catalog' | 'queue';
export type ViewMode = 'patron' | 'host';

export interface Comment {
  id: string;
  author: string;
  message: string;
  tag: string;
  timestamp: string;
}
