import { degreesLat, degreesLong, eciToGeodetic, gstime, propagate, twoline2satrec, type SatRec } from 'satellite.js';

const TLE_API_URL = 'https://tle.ivanstanojevic.me/api/tle/';
const PAGE_SIZE = 100;
// The catalogue holds ~25 000 objects, sorted by popularity; we load the most popular ones.
const PAGES = 5;
// The API rejects bursts of parallel requests, so pages are fetched one at a time.
const RETRY_DELAY_MS = 1_500;

export type SatelliteTrack = { id: string; name: string; satrec: SatRec };
export type SatellitePosition = { id: string; name: string; latitude: number; longitude: number; altitudeKm: number };

type TleMember = { satelliteId?: number; name?: string; line1?: string; line2?: string };

async function fetchPage(page: number, attempt = 0): Promise<SatelliteTrack[]> {
  const response = await fetch(`${TLE_API_URL}?page-size=${PAGE_SIZE}&page=${page}`);
  if (!response.ok) {
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
      return fetchPage(page, attempt + 1);
    }
    throw new Error(`TLE request failed: ${response.status}`);
  }
  const data: { member?: TleMember[] } = await response.json();
  if (!Array.isArray(data.member)) throw new Error('Unexpected response format from TLE API');

  return data.member.flatMap((item) => {
    if (!item.line1 || !item.line2) return [];
    try {
      return [{ id: String(item.satelliteId ?? item.name), name: item.name ?? 'Satellite', satrec: twoline2satrec(item.line1, item.line2) }];
    } catch {
      return [];
    }
  });
}

let cache: Promise<SatelliteTrack[]> | null = null;

export function getSatelliteTracks(onProgress?: (tracks: SatelliteTrack[]) => void): Promise<SatelliteTrack[]> {
  if (!cache) {
    cache = (async () => {
      const tracks: SatelliteTrack[] = [];
      for (let page = 1; page <= PAGES; page += 1) {
        try {
          tracks.push(...(await fetchPage(page)));
          onProgress?.([...tracks]);
        } catch (error) {
          console.error(`Satellite page ${page} failed`, error);
        }
      }
      if (tracks.length === 0) throw new Error('No satellite data could be loaded');
      return tracks;
    })().catch((error) => {
      cache = null;
      throw error;
    });
  }
  return cache;
}

export function propagateSatellites(tracks: SatelliteTrack[], date = new Date()): SatellitePosition[] {
  const gmst = gstime(date);
  return tracks.flatMap(({ id, name, satrec }) => {
    const result = propagate(satrec, date);
    if (!result || !result.position) return [];
    const geo = eciToGeodetic(result.position, gmst);
    const latitude = degreesLat(geo.latitude);
    const longitude = degreesLong(geo.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    return [{ id, name, latitude, longitude, altitudeKm: geo.height }];
  });
}
