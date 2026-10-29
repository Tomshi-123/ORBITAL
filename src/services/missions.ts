const ASTROS_URL = 'http://api.open-notify.org/astros.json';
const LL2_URL = 'https://ll.thespacedevs.com/2.2.0';
const ASTRONAUTS_URL = `${LL2_URL}/astronaut/?in_space=true&mode=detailed&limit=50`;
const EXPEDITIONS_URL = `${LL2_URL}/expedition/?mode=detailed&ordering=-start&limit=20`;
const STATIONS_URL = `${LL2_URL}/spacestation/?limit=50`;
const SPACECRAFT_URL = `${LL2_URL}/spacecraft/?in_space=true&mode=detailed&limit=50`;

export const REFRESH_MS = 5 * 60 * 1000;
// Launch Library's free tier allows only ~15 requests/hour, so its endpoints are cached longer than the refresh interval.
const ASTROS_TTL_MS = 4 * 60 * 1000;
const LL2_TTL_MS = 20 * 60 * 1000;

export type CrewMember = { id: number; name: string; role: string };
export type CrewMission = {
  id: number;
  name: string;
  crew: CrewMember[];
  crewCount: number;
  spacecraft: string[];
  destination: string;
  status: string;
};
export type ActiveSpacecraft = {
  id: number;
  name: string;
  type: string;
  agency: string;
  mission: string;
  timeInSpace: string | null;
  status: string;
};
export type ActiveStation = {
  id: number;
  name: string;
  orbit: string;
  crewCount: number;
  status: string;
  occupied: boolean;
};
export type PeopleInSpace = { total: number; byCraft: Record<string, number> };

export type MissionControlData = {
  people: PeopleInSpace | null;
  missions: CrewMission[] | null;
  spacecraft: ActiveSpacecraft[] | null;
  stations: ActiveStation[] | null;
  errors: Partial<Record<'people' | 'missions' | 'spacecraft' | 'stations', string>>;
  updatedAt: number;
};

type Named = { name?: string };
type LaunchRef = { id?: string; name?: string; net?: string; mission?: Named | null };
type RawSpacecraft = {
  id: number;
  name: string;
  time_in_space?: string | null;
  status?: Named;
  spacecraft_config?: { type?: Named; agency?: Named | null };
  flights?: { launch?: LaunchRef; mission_end?: string | null }[];
};
type RawAstronaut = { id: number; flights?: { id?: string }[] };
type RawExpedition = {
  id: number;
  name: string;
  end?: string | null;
  spacestation?: Named | null;
  crew?: { id: number; role?: { role?: string }; astronaut?: { id: number; name: string } }[];
};
type RawStation = {
  id: number;
  name: string;
  orbit?: string;
  status?: Named;
  deorbited?: string | null;
  active_expeditions?: { id: number }[];
};

type Entry = { at: number; data: unknown };
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

// Serves fresh cache, de-duplicates concurrent calls, and falls back to stale data when a request fails (e.g. rate limiting).
function cachedFetch<T>(url: string, ttl: number, parse: (json: any) => T): Promise<T> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.data as T);
  const pending = inflight.get(url);
  if (pending) return pending as Promise<T>;

  const request = (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${new URL(url).host} responded ${response.status}`);
      const data = parse(await response.json());
      cache.set(url, { at: Date.now(), data });
      return data;
    } catch (error) {
      if (hit) return hit.data as T;
      throw error;
    } finally {
      inflight.delete(url);
    }
  })();
  inflight.set(url, request);
  return request;
}

function results<T>(json: any): T[] {
  if (!Array.isArray(json?.results)) throw new Error('Unexpected response format from Launch Library');
  return json.results;
}

export function formatDuration(iso?: string | null): string | null {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?/.exec(iso ?? '');
  if (!match) return null;
  const [days, hours, minutes] = [match[1], match[2], match[3]].map((part) => Number(part ?? 0));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0 || minutes > 0) return `${hours}h ${minutes}m`;
  return null;
}

function currentFlight(craft: RawSpacecraft) {
  return (craft.flights ?? []).reduce<NonNullable<RawSpacecraft['flights']>[number] | null>((latest, flight) => {
    if (!latest) return flight;
    return Date.parse(flight.launch?.net ?? '') > Date.parse(latest.launch?.net ?? '') ? flight : latest;
  }, null);
}

function loadPeople(): Promise<PeopleInSpace> {
  return cachedFetch(ASTROS_URL, ASTROS_TTL_MS, (json) => {
    if (!Array.isArray(json?.people) || typeof json.number !== 'number') throw new Error('Unexpected response format from Open Notify');
    const byCraft: Record<string, number> = {};
    for (const person of json.people as { craft: string }[]) byCraft[person.craft] = (byCraft[person.craft] ?? 0) + 1;
    return { total: json.number, byCraft };
  });
}

export async function getMissionControl(): Promise<MissionControlData> {
  const [peopleResult, astronautsResult, expeditionsResult, stationsResult, spacecraftResult] = await Promise.allSettled([
    loadPeople(),
    cachedFetch(ASTRONAUTS_URL, LL2_TTL_MS, results<RawAstronaut>),
    cachedFetch(EXPEDITIONS_URL, LL2_TTL_MS, results<RawExpedition>),
    cachedFetch(STATIONS_URL, LL2_TTL_MS, results<RawStation>),
    cachedFetch(SPACECRAFT_URL, LL2_TTL_MS, results<RawSpacecraft>),
  ]);

  const errors: MissionControlData['errors'] = {};
  const reason = (result: PromiseRejectedResult) => (result.reason instanceof Error ? result.reason.message : 'Request failed');

  const rawSpacecraft = spacecraftResult.status === 'fulfilled' ? spacecraftResult.value : null;
  const spacecraft: ActiveSpacecraft[] | null = rawSpacecraft
    ? rawSpacecraft.map((craft) => {
      const launch = currentFlight(craft)?.launch;
      return {
        id: craft.id,
        name: craft.name,
        type: craft.spacecraft_config?.type?.name ?? 'Unknown',
        agency: craft.spacecraft_config?.agency?.name ?? 'Unknown',
        mission: launch?.mission?.name ?? launch?.name ?? 'Not available',
        timeInSpace: formatDuration(craft.time_in_space),
        status: craft.status?.name ?? 'Unknown',
      };
    })
    : null;
  if (spacecraftResult.status === 'rejected') errors.spacecraft = reason(spacecraftResult);

  // Maps a launch id to the spacecraft that is currently in space after flying on it.
  const craftByLaunch = new Map<string, string>();
  rawSpacecraft?.forEach((craft) => {
    const launchId = currentFlight(craft)?.launch?.id;
    if (launchId) craftByLaunch.set(launchId, craft.name);
  });
  const craftByAstronaut = new Map<number, string[]>();
  if (astronautsResult.status === 'fulfilled') {
    astronautsResult.value.forEach((astronaut) => {
      const names = (astronaut.flights ?? []).flatMap((flight) => craftByLaunch.get(flight.id ?? '') ?? []);
      craftByAstronaut.set(astronaut.id, names);
    });
  }

  const activeExpeditions = expeditionsResult.status === 'fulfilled'
    ? expeditionsResult.value.filter((expedition) => !expedition.end || Date.parse(expedition.end) > Date.now())
    : null;
  const missions: CrewMission[] | null = activeExpeditions
    ? activeExpeditions.map((expedition) => {
      const crew = (expedition.crew ?? []).flatMap((member) => member.astronaut
        ? [{ id: member.id, name: member.astronaut.name, role: member.role?.role ?? 'Crew' }]
        : []);
      const craft = new Set<string>();
      (expedition.crew ?? []).forEach((member) => craftByAstronaut.get(member.astronaut?.id ?? -1)?.forEach((name) => craft.add(name)));
      return {
        id: expedition.id,
        name: expedition.name,
        crew,
        crewCount: crew.length,
        spacecraft: [...craft],
        destination: expedition.spacestation?.name ?? 'Unknown',
        status: 'Active',
      };
    })
    : null;
  if (expeditionsResult.status === 'rejected') errors.missions = reason(expeditionsResult);

  const stations: ActiveStation[] | null = stationsResult.status === 'fulfilled'
    ? stationsResult.value
      .filter((station) => station.status?.name === 'Active' && !station.deorbited)
      .map((station) => {
        const expeditionIds = new Set((station.active_expeditions ?? []).map((expedition) => expedition.id));
        const crewCount = (missions ?? []).filter((mission) => expeditionIds.has(mission.id)).reduce((sum, mission) => sum + mission.crewCount, 0);
        return {
          id: station.id,
          name: station.name,
          orbit: station.orbit ?? 'Unknown',
          crewCount,
          status: station.status?.name ?? 'Unknown',
          occupied: expeditionIds.size > 0,
        };
      })
    : null;
  if (stationsResult.status === 'rejected') errors.stations = reason(stationsResult);

  let people: PeopleInSpace | null = peopleResult.status === 'fulfilled' ? peopleResult.value : null;
  if (!people && missions) {
    // Open Notify is down; derive the headcount from the current expeditions instead.
    people = { total: missions.reduce((sum, mission) => sum + mission.crewCount, 0), byCraft: {} };
  }
  if (!people && peopleResult.status === 'rejected') errors.people = reason(peopleResult);

  return { people, missions, spacecraft, stations, errors, updatedAt: Date.now() };
}
