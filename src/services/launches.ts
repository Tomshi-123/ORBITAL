import type { Launch } from '../types';

const LAUNCHES_API_URL = 'https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=20';

type SpaceDevsStatus = {
  id?: number;
  name?: string;
  abbrev?: string;
  description?: string;
};

type SpaceDevsLaunchItem = {
  id: string;
  url?: string;
  name?: string;
  status?: SpaceDevsStatus;
  net?: string;
  window_start?: string;
  window_end?: string;
  rocket?: {
    configuration?: {
      name?: string;
      family?: string;
      full_name?: string;
    };
  };
  mission?: {
    name?: string;
    type?: string;
    description?: string;
    orbit?: {
      name?: string;
      abbrev?: string;
    };
  };
  pad?: {
    name?: string;
    latitude?: string | number;
    longitude?: string | number;
    location?: {
      name?: string;
      country_code?: string;
    };
  };
  launch_service_provider?: {
    name?: string;
    type?: string;
  };
};

type SpaceDevsResponse = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: SpaceDevsLaunchItem[];
};

function mapLaunchStatus(status?: SpaceDevsStatus): Launch['status'] {
  const abbrev = status?.abbrev?.toLowerCase() ?? '';
  const name = status?.name?.toLowerCase() ?? '';

  if (abbrev === 'success' || name.includes('success')) return 'Completed';
  if (abbrev === 'failure' || name.includes('failure') || abbrev === 'partial failure') return 'Completed';
  if (abbrev === 'hold' || name.includes('hold') || name.includes('delayed')) return 'Delayed';
  if (name.includes('scrub') || name.includes('cancelled')) return 'Scrubbed';
  if (name.includes('in flight') || name.includes('launched')) return 'Launched';
  return 'Scheduled';
}

function detectStation(text: string): Launch['station'] {
  if (/shenzhou|tianzhou|mengzhou/i.test(text)) return 'Tiangong';
  if (/progress|\bcrs\b|cygnus|crew-|axiom|\bax-\d|soyuz ms|htv|dream chaser|starliner|\biss\b/i.test(text)) return 'ISS';
  return undefined;
}

function toCoordinate(value?: string | number): number | undefined {
  const parsed = typeof value === 'number' ? value : parseFloat(value ?? '');
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function toLaunch(item: SpaceDevsLaunchItem): Launch {
  const mission = item.mission?.name || item.name || 'Orbital Mission';
  const rocket = item.rocket?.configuration?.name || 'Launch Vehicle';
  const provider = item.launch_service_provider?.name || 'Space Agency';
  const location = item.pad?.location?.name || item.pad?.name || 'Unknown Pad';
  const launchAt = item.net || item.window_start || new Date().toISOString();
  const missionType = item.mission?.type || 'Spaceflight';
  const status = mapLaunchStatus(item.status);

  return {
    id: item.id,
    mission,
    rocket,
    provider,
    location,
    launchAt,
    missionType,
    status,
    padLatitude: toCoordinate(item.pad?.latitude),
    padLongitude: toCoordinate(item.pad?.longitude),
    orbitName: item.mission?.orbit?.name,
    orbitAbbrev: item.mission?.orbit?.abbrev,
    station: detectStation(`${item.name ?? ''} ${mission} ${item.mission?.description ?? ''}`),
  };
}

let cache: Promise<Launch[]> | null = null;

export function getUpcomingLaunches(): Promise<Launch[]> {
  if (!cache) {
    cache = (async () => {
      const response = await fetch(LAUNCHES_API_URL);
      if (!response.ok) {
        throw new Error(`The Space Devs request failed: ${response.status}`);
      }
      const data: SpaceDevsResponse = await response.json();
      if (!Array.isArray(data.results)) {
        throw new Error('Unexpected response format from The Space Devs');
      }

      return data.results.map(toLaunch);
    })().catch((error) => {
      cache = null;
      throw error;
    });
  }
  return cache;
}
