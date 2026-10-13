const AURORA_URL = 'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json';
const CACHE_TTL_MS = 20 * 60_000;
const CELL_DEG = 3;
// Cells below this probability (%) are not drawn.
const MIN_PROBABILITY = 5;

export type AuroraCell = { latitude: number; longitude: number; intensity: 0 | 1 | 2 };
export type AuroraForecast = { cells: AuroraCell[]; forecastTime?: string };

type AuroraResponse = { 'Forecast Time'?: string; coordinates?: [number, number, number][] };

function intensityOf(probability: number): AuroraCell['intensity'] {
  if (probability >= 20) return 2;
  if (probability >= 10) return 1;
  return 0;
}

// Collapses the 1-degree grid into coarse cells holding the strongest value in each.
export function toAuroraCells(coordinates: [number, number, number][]): AuroraCell[] {
  const best = new Map<number, number>();
  const cols = 360 / CELL_DEG;
  for (const [lon, lat, value] of coordinates) {
    if (value < MIN_PROBABILITY) continue;
    const key = Math.floor((lat + 90) / CELL_DEG) * cols + Math.floor((((lon % 360) + 360) % 360) / CELL_DEG);
    if (value > (best.get(key) ?? 0)) best.set(key, value);
  }
  return Array.from(best, ([key, value]) => {
    const longitude = (key % cols) * CELL_DEG + CELL_DEG / 2;
    return {
      latitude: Math.floor(key / cols) * CELL_DEG - 90 + CELL_DEG / 2,
      longitude: longitude > 180 ? longitude - 360 : longitude,
      intensity: intensityOf(value),
    };
  });
}

let cache: { at: number; data: AuroraForecast } | null = null;
let inflight: Promise<AuroraForecast> | null = null;

export function getAuroraForecast(): Promise<AuroraForecast> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return Promise.resolve(cache.data);
  if (!inflight) {
    inflight = (async () => {
      const response = await fetch(AURORA_URL);
      if (!response.ok) throw new Error(`Aurora forecast request failed: ${response.status}`);
      const json: AuroraResponse = await response.json();
      if (!Array.isArray(json.coordinates)) throw new Error('Unexpected response format from NOAA aurora forecast');
      const data = { cells: toAuroraCells(json.coordinates), forecastTime: json['Forecast Time'] };
      cache = { at: Date.now(), data };
      return data;
    })().catch((error) => {
      // Fall back to the last good forecast rather than dropping the layer.
      if (cache) return cache.data;
      throw error;
    }).finally(() => { inflight = null; });
  }
  return inflight;
}
