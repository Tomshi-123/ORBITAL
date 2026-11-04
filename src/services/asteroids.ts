import * as Astronomy from 'astronomy-engine';
import { toSpacePoint, type SpacePoint } from './sky';

const LUNAR_DISTANCE_KM = 384400;
const CACHE_MS = 60 * 60 * 1000;
const MAX_OBJECTS = 6;
const GAUSS_DEG_PER_DAY = 0.9856076686;
const UNIX_EPOCH_JD = 2440587.5;

export type OrbitElements = {
  epochJd: number;
  e: number;
  a: number;
  i: number;
  om: number;
  w: number;
  ma: number;
};

export type Asteroid = {
  id: string;
  name: string;
  missLd: number;
  speedLdPerDay: number;
  approachMs: number;
  hazardous: boolean;
  diameterM: number;
  orbit?: OrbitElements;
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

async function fetchOrbit(id: string): Promise<OrbitElements | undefined> {
  try {
    const response = await fetch(`https://ssd-api.jpl.nasa.gov/sbdb.api?spk=${encodeURIComponent(id)}&full-prec=1`);
    if (!response.ok) return undefined;
    const data = await response.json() as { orbit?: { epoch?: string; elements?: { name: string; value: string }[] } };
    const value = (name: string) => Number(data.orbit?.elements?.find((el) => el.name === name)?.value);
    const orbit = { epochJd: Number(data.orbit?.epoch), e: value('e'), a: value('a'), i: value('i'), om: value('om'), w: value('w'), ma: value('ma') };
    return Object.values(orbit).every(Number.isFinite) && orbit.a > 0 && orbit.e < 1 ? orbit : undefined;
  } catch {
    return undefined;
  }
}

export function asteroidGeoVector(orbit: OrbitElements, date: Date): Astronomy.Vector {
  const rad = Math.PI / 180;
  const jd = date.getTime() / 86_400_000 + UNIX_EPOCH_JD;
  const meanAnomaly = (orbit.ma + (GAUSS_DEG_PER_DAY / Math.pow(orbit.a, 1.5)) * (jd - orbit.epochJd)) * rad;
  let ea = meanAnomaly;
  for (let n = 0; n < 30; n += 1) ea -= (ea - orbit.e * Math.sin(ea) - meanAnomaly) / (1 - orbit.e * Math.cos(ea));
  const x = orbit.a * (Math.cos(ea) - orbit.e);
  const y = orbit.a * Math.sqrt(1 - orbit.e * orbit.e) * Math.sin(ea);
  const [cw, sw, ci, si, co, so] = [Math.cos(orbit.w * rad), Math.sin(orbit.w * rad), Math.cos(orbit.i * rad), Math.sin(orbit.i * rad), Math.cos(orbit.om * rad), Math.sin(orbit.om * rad)];
  const x1 = x * cw - y * sw;
  const y1 = x * sw + y * cw;
  const time = Astronomy.MakeTime(date);
  const ecliptic = new Astronomy.Vector(x1 * co - y1 * ci * so, x1 * so + y1 * ci * co, y1 * si, time);
  const helio = Astronomy.RotateVector(Astronomy.Rotation_ECL_EQJ(), ecliptic);
  const earth = Astronomy.HelioVector(Astronomy.Body.Earth, time);
  return new Astronomy.Vector(helio.x - earth.x, helio.y - earth.y, helio.z - earth.z, time);
}

// Two-body position from the orbital elements, as longitude/latitude plus distance in Earth radii.
export function asteroidPoint(orbit: OrbitElements, date = new Date()): SpacePoint {
  return toSpacePoint(asteroidGeoVector(orbit, date), date);
}

// Path of the asteroid relative to Earth (not around the Sun) a few days either side of now.
export function asteroidTrack(orbit: OrbitElements, date = new Date(), daysEachSide = 10, samples = 40): SpacePoint[] {
  return Array.from({ length: samples + 1 }, (_, index) => {
    const at = new Date(date.getTime() + ((index / samples) * 2 - 1) * daysEachSide * 86_400_000);
    return toSpacePoint(asteroidGeoVector(orbit, at), date);
  });
}

async function fetchAsteroids(): Promise<Asteroid[]> {
  const now = Date.now();
  const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${isoDay(now - 86400000)}&end_date=${isoDay(now + 86400000)}&api_key=${process.env.EXPO_PUBLIC_NASA_API_KEY || 'DEMO_KEY'}`;
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
    }];
  });
  const closest = items.sort((a, b) => a.missLd - b.missLd).slice(0, MAX_OBJECTS);
  const orbits = await Promise.all(closest.map((asteroid) => fetchOrbit(asteroid.id)));
  return closest.map((asteroid, index) => ({ ...asteroid, orbit: orbits[index] }));
}

export async function getAsteroids(): Promise<Asteroid[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.items;
  if (!inflight) {
    inflight = fetchAsteroids()
      .then((items) => { cache = { at: Date.now(), items }; return items; })
      .finally(() => { inflight = null; });
  }
  return inflight;
}
