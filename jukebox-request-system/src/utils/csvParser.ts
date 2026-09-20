import { Song } from '../types';
import { DEFAULT_SONG_STYLE } from '../data/mockData';

/**
 * Parses raw CSV content text into Song objects.
 * Expected CSV Headers (case-insensitive):
 * artist_name (or artist), song_title (or title/song), duration (optional)
 */
export function parseSongsCSV(csvContent: string, currentCatalogLength: number): Song[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Parse header line
  const headerLine = lines[0].toLowerCase();
  const headers = parseCSVLine(headerLine);

  const artistIdx = headers.findIndex((h) => h.includes('artist'));
  const titleIdx = headers.findIndex((h) => h.includes('title') || h.includes('song'));
  const durationIdx = headers.findIndex((h) => h.includes('duration') || h.includes('time'));

  const parsedSongs: Song[] = [];
  const startLineIndex = (artistIdx !== -1 || titleIdx !== -1) ? 1 : 0;

  for (let i = startLineIndex; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 2) continue;

    const artistVal = (artistIdx !== -1 && cols[artistIdx]) ? cols[artistIdx] : cols[0] || 'Unknown Artist';
    const titleVal = (titleIdx !== -1 && cols[titleIdx]) ? cols[titleIdx] : cols[1] || 'Untitled Track';
    const durationVal = (durationIdx !== -1 && cols[durationIdx]) ? cols[durationIdx] : '3:30';

    const trackNumber = currentCatalogLength + parsedSongs.length + 1;

    parsedSongs.push({
      id: `s-csv-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
      trackNumber,
      artist: artistVal.trim(),
      title: titleVal.trim(),
      badgeColor: DEFAULT_SONG_STYLE,
      duration: durationVal.trim(),
    });
  }

  return parsedSongs;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
