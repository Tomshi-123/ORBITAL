import type { Sighting } from '../types';

const BASE = 'https://theuapatlas.com/api/export?format=json&from=2010&to=2026';
// The API returns oldest first, so the newest records are fetched from the tail.
const NEWEST_COUNT = 5000;

type AtlasRecord = {
  id: string;
  datetime: string;
  lat: number | null;
  lng: number | null;
  shape: string | null;
  durationSec: number | null;
  country: string | null;
  sourceUrl?: string;
};

type AtlasResponse = { total: number; records: AtlasRecord[] };

const DAY = 86_400_000;

export function markerColor(timestamp: string, now = Date.now()) {
  const age = now - new Date(timestamp).getTime();
  if (age < 7 * DAY) return '#FF4D4F';
  if (age < 30 * DAY) return '#FFD23F';
  return '#3D8BFF';
}

function formatDuration(seconds: number | null) {
  if (seconds == null) return 'Unknown';
  if (seconds < 60) return `${seconds} sec`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  return `${(seconds / 3600).toFixed(1)} h`;
}

function toSighting(record: AtlasRecord): Sighting | null {
  if (record.lat == null || record.lng == null || Number.isNaN(new Date(record.datetime).getTime())) return null;
  const shape = record.shape ? record.shape.charAt(0).toUpperCase() + record.shape.slice(1) : 'Unknown';
  return {
    id: record.id,
    latitude: record.lat,
    longitude: record.lng,
    timestamp: record.datetime,
    location: `${record.country ?? 'Unknown'} · ${record.lat.toFixed(2)}°, ${record.lng.toFixed(2)}°`,
    country: record.country ?? 'Unknown',
    description: `${shape} object reported. The original report text is held by the source.`,
    objectType: shape,
    duration: formatDuration(record.durationSec),
    witnesses: 0,
    confidence: 'Unverified',
    source: record.sourceUrl ?? 'The UAP Atlas',
    direction: 'Not reported',
  };
}

async function fetchJson(url: string): Promise<AtlasResponse> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`UAP Atlas request failed: ${response.status}`);
  return response.json();
}

let cache: Promise<Sighting[]> | null = null;

export function getAtlasSightings(): Promise<Sighting[]> {
  if (!cache) {
    cache = (async () => {
      const head = await fetchJson(`${BASE}&limit=1`);
      const offset = Math.max(0, head.total - NEWEST_COUNT);
      const data = await fetchJson(`${BASE}&limit=${NEWEST_COUNT}&offset=${offset}`);
      return data.records
        .map(toSighting)
        .filter((item): item is Sighting => item !== null)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    })().catch((error) => { cache = null; throw error; });
  }
  return cache;
}
