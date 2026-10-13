import type { Sighting } from '../types';

const API_URL =
  'https://api.apify.com/v2/datasets/9LOx5y1hbpyXDXRR3/items?signature=MC4xNzkzMDQwOTI1OTg3LjFCMHJtbVJIZU9FQ0VUWFFFS1Q5TA&format=json&clean=true';
const ISS_API_URL = 'https://api.wheretheiss.at/v1/satellites/25544';

export type IssPosition = {
  latitude: number;
  longitude: number;
};

type ApifyRecord = {
  schema_version?: string;
  sighting_id?: string;
  sighting_url?: string;
  occurred_date?: string;
  reported_date?: string;
  posted_date?: string;
  duration?: string;
  number_of_observers?: number;
  observer_type?: string;
  city?: string;
  state?: string;
  country?: string;
  location_details?: string;
  shape?: string;
  color?: string;
  estimated_size?: string;
  estimated_speed?: string;
  viewed_from?: string;
  direction_from_viewer?: string;
  angle_of_elevation?: string;
  closest_distance?: string;
  characteristics?: string[];
  summary?: string;
  narrative?: string;
  has_media?: string;
  explanation?: string;
  tier?: string;
  scraped_at?: string;
};

const DAY = 86_400_000;

export function markerColor(timestamp: string, now = Date.now()) {
  const age = now - new Date(timestamp).getTime();
  if (age < 7 * DAY) return '#FF4D4F';
  if (age < 30 * DAY) return '#FFD23F';
  return '#3D8BFF';
}

export async function getIssPosition(): Promise<IssPosition> {
  const response = await fetch(ISS_API_URL);
  if (!response.ok) {
    throw new Error(`ISS position request failed: ${response.status}`);
  }

  const data: Partial<IssPosition> = await response.json();
  if (
    typeof data.latitude !== 'number' ||
    typeof data.longitude !== 'number' ||
    !Number.isFinite(data.latitude) ||
    !Number.isFinite(data.longitude) ||
    data.latitude < -90 ||
    data.latitude > 90 ||
    data.longitude < -180 ||
    data.longitude > 180
  ) {
    throw new Error('Unexpected response format from ISS position API');
  }

  return { latitude: data.latitude, longitude: data.longitude };
}

const CITY_COORDS: Record<string, [number, number]> = {
  'bardsea': [54.17, -3.08],
  'coventry': [52.40, -1.51],
  'ballialakhminia-iii': [25.41, 86.15],
  'kinder': [30.48, -92.85],
  'chester': [40.30, -121.23],
  'ulverston': [54.19, -3.09],
  'lion-sur-mer': [49.30, -0.31],
  'fayetteville': [35.15, -86.57],
  'south salt lake': [40.71, -111.88],
  'croydon': [-37.79, 145.28],
  'hadspen': [-41.50, 147.06],
  'lake in the hills': [42.18, -88.33],
  'peoria': [40.69, -89.58],
  'sparks': [39.53, -119.75],
  'san francisco': [37.77, -122.41],
  'rapid city': [44.08, -103.23],
  'old landing': [37.58, -83.74],
  'lee': [43.29, -75.52],
  'trawalla': [-37.43, 143.43],
  'johnson city': [30.27, -98.41],
  'warragul': [-38.16, 145.93],
  'mason city': [43.15, -93.20],
  'somerville': [30.34, -96.53],
  'long beach': [40.58, -73.65],
  'port charlotte': [26.97, -82.09],
};

const STATE_COORDS: Record<string, [number, number]> = {
  al: [32.8, -86.8], ak: [61.3, -152.4], az: [34.0, -111.0], ar: [34.9, -92.3], ca: [36.7, -119.4],
  co: [39.5, -105.7], ct: [41.6, -72.7], de: [39.0, -75.5], fl: [27.6, -81.5], ga: [32.1, -82.9],
  hi: [19.8, -155.5], id: [44.0, -114.7], il: [40.6, -89.3], in: [40.2, -86.1], ia: [41.8, -93.0],
  ks: [38.5, -98.0], ky: [37.8, -84.2], la: [30.5, -91.5], me: [45.2, -69.4], md: [39.0, -76.6],
  ma: [42.4, -71.3], mi: [44.3, -84.5], mn: [46.7, -94.6], ms: [32.3, -89.3], mo: [37.9, -91.8],
  mt: [46.8, -110.3], ne: [41.4, -99.9], nv: [38.8, -116.4], nh: [43.1, -71.5], nj: [40.0, -74.5],
  nm: [34.5, -105.8], ny: [43.0, -75.0], nc: [35.7, -79.0], nd: [47.5, -100.0], oh: [40.4, -82.9],
  ok: [35.5, -97.5], or: [43.8, -120.5], pa: [41.2, -77.1], ri: [41.5, -71.4], sc: [33.8, -81.1],
  sd: [43.9, -99.9], tn: [35.5, -86.5], tx: [31.9, -99.9], ut: [39.3, -111.6], vt: [44.0, -72.7],
  va: [37.4, -78.6], wa: [47.7, -120.7], wv: [38.5, -80.4], wi: [43.7, -88.7], wy: [43.0, -107.2],
  england: [52.5, -1.5], normandy: [49.18, -0.37], bihar: [25.09, 85.31], victoria: [-37.4, 144.7], tasmania: [-41.4, 147.1],
};

const COUNTRY_COORDS: Record<string, [number, number]> = {
  usa: [39.8, -98.5],
  'united kingdom': [54.0, -2.5],
  france: [46.6, 2.2],
  india: [22.0, 78.9],
  australia: [-25.2, 133.7],
  canada: [56.1, -106.3],
};

function getCoords(record: ApifyRecord, index: number): [number, number] {
  const cityKey = (record.city || '').toLowerCase().trim();
  if (CITY_COORDS[cityKey]) return CITY_COORDS[cityKey];

  const stateKey = (record.state || '').toLowerCase().trim();
  if (STATE_COORDS[stateKey]) {
    const [baseLat, baseLng] = STATE_COORDS[stateKey];
    return [
      parseFloat((baseLat + Math.sin(index + 1) * 0.4).toFixed(4)),
      parseFloat((baseLng + Math.cos(index + 1) * 0.4).toFixed(4)),
    ];
  }

  const countryKey = (record.country || '').toLowerCase().trim();
  if (COUNTRY_COORDS[countryKey]) {
    const [baseLat, baseLng] = COUNTRY_COORDS[countryKey];
    return [
      parseFloat((baseLat + Math.sin(index + 1) * 1.5).toFixed(4)),
      parseFloat((baseLng + Math.cos(index + 1) * 1.5).toFixed(4)),
    ];
  }

  return [
    parseFloat((37.09 + Math.sin(index + 1) * 3).toFixed(4)),
    parseFloat((-95.71 + Math.cos(index + 1) * 6).toFixed(4)),
  ];
}

function parseDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString();
  const match = dateStr.match(/(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?))?/);
  if (match) {
    const [, date, time] = match;
    const isoLike = time ? (time.length === 5 ? `${date}T${time}:00` : `${date}T${time}`) : `${date}T00:00:00`;
    const parsed = new Date(isoLike);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  const fallback = new Date(dateStr);
  return !Number.isNaN(fallback.getTime()) ? fallback.toISOString() : new Date().toISOString();
}

function stripHtml(input?: string): string {
  if (!input) return 'No description reported.';
  return (
    input
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim() || 'No description reported.'
  );
}

export function toSighting(record: ApifyRecord, index: number): Sighting {
  const [latitude, longitude] = getCoords(record, index);
  const timestamp = parseDate(record.occurred_date || record.reported_date || record.posted_date);
  const locationParts = [record.city, record.state].filter(Boolean);
  const location = locationParts.length > 0 ? locationParts.join(', ') : (record.country || 'Unknown');
  const shape = record.shape ? record.shape.charAt(0).toUpperCase() + record.shape.slice(1) : 'Unidentified';
  const descriptionText = record.narrative || record.summary || `${shape} object reported.`;

  return {
    id: record.sighting_id ? String(record.sighting_id) : `nuforc-${index}`,
    latitude,
    longitude,
    timestamp,
    location,
    country: record.country || 'Unknown',
    description: stripHtml(descriptionText),
    objectType: shape,
    duration: record.duration || 'Unknown',
    witnesses: typeof record.number_of_observers === 'number' ? record.number_of_observers : 1,
    confidence: 'Unverified',
    source: record.sighting_url || 'https://nuforc.org',
    direction: record.direction_from_viewer || 'Not reported',
  };
}

let cache: Promise<Sighting[]> | null = null;

export function getAtlasSightings(): Promise<Sighting[]> {
  if (!cache) {
    cache = (async () => {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Apify dataset request failed: ${response.status}`);
      }
      const data: ApifyRecord[] = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Unexpected response format from Apify dataset');
      }

      return data
        .map((record, index) => toSighting(record, index))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    })().catch((error) => {
      cache = null;
      throw error;
    });
  }
  return cache;
}
