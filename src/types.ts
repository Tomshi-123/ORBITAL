export type Article = {
  id: string;
  headline: string;
  source: string;
  category: string;
  summary: string;
  publishedAt: string;
  kind: 'space';
};

export type Launch = {
  id: string;
  mission: string;
  rocket: string;
  provider: string;
  location: string;
  launchAt: string | null;
  missionType: string;
  status: 'Scheduled' | 'Delayed' | 'Scrubbed' | 'Launched' | 'Completed';
  padLatitude?: number;
  padLongitude?: number;
  orbitName?: string;
  orbitAbbrev?: string;
  station?: 'ISS' | 'Tiangong';
};

export type CelestialEvent = {
  id: string;
  name: string;
  kind: string;
  date: string;
  visibility: string;
  description: string;
};
