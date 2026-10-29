export type Confidence = 'High' | 'Medium' | 'Low' | 'Unverified';

export type Sighting = {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  location: string;
  country: string;
  description: string;
  objectType: string;
  duration: string;
  witnesses: number;
  confidence: Confidence;
  source: string;
  direction: string;
};

export type Article = {
  id: string;
  headline: string;
  source: string;
  category: string;
  summary: string;
  publishedAt: string;
  kind: 'space' | 'uap';
};

export type Launch = {
  id: string;
  mission: string;
  rocket: string;
  provider: string;
  location: string;
  launchAt: string;
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
