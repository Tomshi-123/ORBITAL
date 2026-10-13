const LUNAR_DISTANCE_KM = 384400;
const CACHE_MS = 60 * 60 * 1000;
const MAX_OBJECTS = 6;

export type Asteroid = {
  id: string;
  name: string;
  missLd: number;
  speedLdPerDay: number;
  approachMs: number;
  hazardous: boolean;
  diameterM: number;
  // NeoWs gives no direction, so the flyby plane angle is derived from the id.
  angle: number;
};

type NeoFeed = {
  near_earth_objects: Record<string, {
    id: string;
    name: string;
    is_potentially_hazardous_asteroid: boolean;
    estimated_diameter: { meters: { estimated_diameter_max: number } };
    close_approach_data: {
      epoch_date_close_approach: number;
      miss_distance: { lunar: string };
      relative_velocity: { kilometers_per_second: string };
    }[];
  }[]>;
};

let cache: { at: number; items: Asteroid[] } | null = null;
let inflight: Promise<Asteroid[]> | null = null;

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

function hashAngle(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ((h % 3600) / 3600) * Math.PI * 2;
}

async function fetchAsteroids(): Promise<Asteroid[]> {
  const now = Date.now();
  const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${isoDay(now - 86400000)}&end_date=${isoDay(now + 86400000)}&api_key=DEMO_KEY`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`NeoWs ${response.status}`);
  const feed = (await response.json()) as NeoFeed;
  const items = Object.values(feed.near_earth_objects).flat().flatMap((neo): Asteroid[] => {
    const approach = neo.close_approach_data[0];
    if (!approach) return [];
    const missLd = Number(approach.miss_distance.lunar);
    const speed = Number(approach.relative_velocity.kilometers_per_second);
    if (!Number.isFinite(missLd) || !Number.isFinite(speed)) return [];
    return [{
      id: neo.id,
      name: neo.name.replace(/[()]/g, '').trim(),
      missLd,
      speedLdPerDay: (speed * 86400) / LUNAR_DISTANCE_KM,
      approachMs: approach.epoch_date_close_approach,
      hazardous: neo.is_potentially_hazardous_asteroid,
      diameterM: neo.estimated_diameter.meters.estimated_diameter_max,
      angle: hashAngle(neo.id),
    }];
  });
  return items.sort((a, b) => a.missLd - b.missLd).slice(0, MAX_OBJECTS);
}

export async function getAsteroids(): Promise<Asteroid[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.items;
  if (!inflight) {
    inflight = fetchAsteroids()
      .then((items) => { cache = { at: Date.now(), items }; return items; })
      .catch((error) => { if (cache) return cache.items; throw error; })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

// Position in lunar distances in the flyby plane: x along the closest-approach direction, y along the velocity.
export function asteroidPlanePosition(a: Asteroid, atMs: number, offsetLd = 0) {
  const along = ((atMs - a.approachMs) / 86400000) * a.speedLdPerDay + offsetLd;
  const cos = Math.cos(a.angle);
  const sin = Math.sin(a.angle);
  return { x: a.missLd * cos - along * sin, y: a.missLd * sin + along * cos };
}
