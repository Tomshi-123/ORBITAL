import type { Article, CameraSource, CelestialEvent, Launch, Sighting } from './types';

const sightingSeeds = [
  ['Phoenix, Arizona', 'United States', 33.45, -112.07, 'Unknown aerial lights moving silently across the horizon.', 'Light formation', '3 min', 2, 'Medium', 'Public report archive', 'North-east'],
  ['Osaka, Japan', 'Japan', 34.69, 135.50, 'Bright point of light changing direction above the city.', 'Bright light', '5 min', 1, 'Low', 'Community report', 'East'],
  ['Reykjavik, Iceland', 'Iceland', 64.15, -21.94, 'A steady light was visible before fading from view.', 'Unidentified light', '2 min', 3, 'Unverified', 'Community report', 'South'],
  ['Santiago, Chile', 'Chile', -33.45, -70.67, 'Witnesses described a silent object moving above the hills.', 'Aerial object', '4 min', 2, 'Medium', 'Public report archive', 'West'],
  ['Oslo, Norway', 'Norway', 59.91, 10.75, 'Several lights were reported near the evening cloud line.', 'Light formation', '6 min', 4, 'Low', 'Community report', 'North-west'],
  ['Melbourne, Australia', 'Australia', -37.81, 144.96, 'A reflective object appeared to move against the wind.', 'Reflective object', '1 min', 1, 'Unverified', 'Community report', 'South-east'],
  ['Lima, Peru', 'Peru', -12.05, -77.04, 'A distant light was seen crossing the night sky.', 'Bright light', '2 min', 2, 'Low', 'Public report archive', 'North'],
  ['Toronto, Canada', 'Canada', 43.65, -79.38, 'Witnesses reported a pulsing light above the lake.', 'Pulsing light', '7 min', 3, 'Medium', 'Community report', 'East'],
  ['Cape Town, South Africa', 'South Africa', -33.92, 18.42, 'A stationary light disappeared after several minutes.', 'Unidentified light', '4 min', 1, 'Unverified', 'Community report', 'North'],
  ['Lisbon, Portugal', 'Portugal', 38.72, -9.14, 'A fast-moving point of light left no visible trail.', 'Aerial object', '1 min', 2, 'Low', 'Public report archive', 'South-west'],
];

export const sightings: Sighting[] = Array.from({ length: 30 }, (_, index) => {
  const seed = sightingSeeds[index % sightingSeeds.length];
  const timestamp = new Date(Date.now() - index * 23 * 60_000).toISOString();
  return {
    id: `sample-${String(index + 1).padStart(2, '0')}`,
    location: String(seed[0]),
    country: String(seed[1]),
    latitude: Number(seed[2]) + ((index % 3) - 1) * 0.07,
    longitude: Number(seed[3]) + ((index % 5) - 2) * 0.08,
    description: String(seed[4]),
    objectType: String(seed[5]),
    duration: String(seed[6]),
    witnesses: Number(seed[7]),
    confidence: seed[8] as Sighting['confidence'],
    source: String(seed[9]),
    direction: String(seed[10]),
    timestamp,
  };
});

export const articles: Article[] = [
  { id: 'space-01', headline: 'A new observatory maps the quiet glow between galaxies', source: 'Orbital Journal', category: 'Astronomy', summary: 'Researchers are refining how we observe faint structures in the deep universe.', publishedAt: '18 min ago', kind: 'space' },
  { id: 'space-02', headline: 'Lunar mission teams complete their next systems review', source: 'Mission Desk', category: 'Moon', summary: 'The latest review focused on communications and navigation systems.', publishedAt: '42 min ago', kind: 'space' },
  { id: 'space-03', headline: 'What the latest exoplanet survey can — and cannot — tell us', source: 'Sky & Science', category: 'Exoplanets', summary: 'A look at the evidence behind recent atmospheric measurements.', publishedAt: '1 hr ago', kind: 'space' },
  { id: 'space-04', headline: 'Solar activity outlook: what skywatchers should know this week', source: 'Space Weather Center', category: 'Space Science', summary: 'Forecasters explain current conditions and the uncertainty in aurora predictions.', publishedAt: '2 hr ago', kind: 'space' },
  { id: 'space-05', headline: 'A closer look at the latest images from a distant nebula', source: 'Deep Field', category: 'James Webb', summary: 'New observations reveal layers of dust and star formation.', publishedAt: '3 hr ago', kind: 'space' },
  { id: 'space-06', headline: 'How mission control prepares for a launch window', source: 'Launch Notes', category: 'Missions', summary: 'Teams track weather, spacecraft readiness and range conditions.', publishedAt: '5 hr ago', kind: 'space' },
  { id: 'space-07', headline: 'A small asteroid passes safely by Earth', source: 'Sky & Science', category: 'Asteroids', summary: 'The object was tracked by several observatories during its flyby.', publishedAt: '6 hr ago', kind: 'space' },
  { id: 'space-08', headline: 'The next generation of Earth-observing satellites', source: 'Orbital Journal', category: 'Earth', summary: 'New instruments aim to improve long-term climate measurements.', publishedAt: 'Yesterday', kind: 'space' },
  { id: 'space-09', headline: 'A field guide to spotting Jupiter after dusk', source: 'Night Watch', category: 'Astronomy', summary: 'When and where to look for the bright planet this month.', publishedAt: 'Yesterday', kind: 'space' },
  { id: 'space-10', headline: 'International teams share a new deep-space data set', source: 'Mission Desk', category: 'Discoveries', summary: 'The release gives researchers a more complete view of the target region.', publishedAt: '2 days ago', kind: 'space' },
  { id: 'uap-01', headline: 'Review panel publishes its latest public meeting summary', source: 'Public Records Desk', category: 'Government reports', summary: 'The summary lists topics discussed and the records still under review.', publishedAt: '26 min ago', kind: 'uap' },
  { id: 'uap-02', headline: 'Researchers outline a framework for evaluating sighting reports', source: 'Open Research', category: 'Scientific research', summary: 'The proposed framework separates witness accounts from instrument data.', publishedAt: '1 hr ago', kind: 'uap' },
  { id: 'uap-03', headline: 'A regional report archive adds historical case documents', source: 'Archive Notes', category: 'Historical cases', summary: 'Newly indexed material includes dates, locations and original sources.', publishedAt: '2 hr ago', kind: 'uap' },
  { id: 'uap-04', headline: 'Aviation safety brief stresses careful incident reporting', source: 'Aviation Review', category: 'Aviation incidents', summary: 'The brief focuses on clear timelines and preserving sensor context.', publishedAt: '4 hr ago', kind: 'uap' },
  { id: 'uap-05', headline: 'What public UAP databases record — and what they leave out', source: 'Open Research', category: 'Investigations', summary: 'An explainer on the limits and biases of crowd-sourced reporting.', publishedAt: '6 hr ago', kind: 'uap' },
  { id: 'uap-06', headline: 'Newly released documents add context to a historic case', source: 'Public Records Desk', category: 'Government reports', summary: 'The documents provide additional chronology, not a final explanation.', publishedAt: 'Yesterday', kind: 'uap' },
  { id: 'uap-07', headline: 'Scientists call for consistent standards in observation data', source: 'Open Research', category: 'Scientific research', summary: 'Better metadata can help compare reports without overclaiming certainty.', publishedAt: 'Yesterday', kind: 'uap' },
  { id: 'uap-08', headline: 'A local investigation checks a cluster of night-sky reports', source: 'Field Notes', category: 'Investigations', summary: 'The team compared timestamps with flight paths and satellite passes.', publishedAt: 'Yesterday', kind: 'uap' },
  { id: 'uap-09', headline: 'Military sighting records: how to read the public summaries', source: 'Aviation Review', category: 'Military sightings', summary: 'A guide to terminology, redactions and source provenance.', publishedAt: '2 days ago', kind: 'uap' },
  { id: 'uap-10', headline: 'Historical observers describe an unusual light display', source: 'Archive Notes', category: 'Historical cases', summary: 'The account remains a report; the available evidence is incomplete.', publishedAt: '3 days ago', kind: 'uap' },
];

const launchTime = (daysFromNow: number) => new Date(Date.now() + daysFromNow * 86_400_000).toISOString();

export const launches: Launch[] = [
  { id: 'launch-01', mission: 'Aurora Pathfinder', rocket: 'Nova-3', provider: 'Northstar Launch', location: 'Cape Canaveral, Florida', launchAt: launchTime(0.18), missionType: 'Earth observation', status: 'Scheduled' },
  { id: 'launch-02', mission: 'Lunar Relay 2', rocket: 'Atlas Meridian', provider: 'International Launch Group', location: 'Vandenberg, California', launchAt: launchTime(1.4), missionType: 'Lunar communications', status: 'Scheduled' },
  { id: 'launch-03', mission: 'Ocean Watch 8', rocket: 'Ariane 7', provider: 'Arianespace', location: 'Kourou, French Guiana', launchAt: launchTime(3), missionType: 'Earth observation', status: 'Scheduled' },
  { id: 'launch-04', mission: 'Horizon Cargo Demo', rocket: 'Falcon 9', provider: 'SpaceX', location: 'Kennedy Space Center, Florida', launchAt: launchTime(5), missionType: 'Cargo resupply', status: 'Scheduled' },
  { id: 'launch-05', mission: 'PolarLink Cluster', rocket: 'Electron', provider: 'Rocket Lab', location: 'Mahia, New Zealand', launchAt: launchTime(8), missionType: 'Communications', status: 'Scheduled' },
  { id: 'launch-06', mission: 'ExoSurvey Pathfinder', rocket: 'Vega-C', provider: 'Arianespace', location: 'Kourou, French Guiana', launchAt: launchTime(12), missionType: 'Science', status: 'Scheduled' },
  { id: 'launch-07', mission: 'Deep Space Test Flight', rocket: 'Starship', provider: 'Orbital Test Program', location: 'Boca Chica, Texas', launchAt: launchTime(17), missionType: 'Test flight', status: 'Scheduled' },
  { id: 'launch-08', mission: 'WeatherSat North', rocket: 'H3', provider: 'JAXA', location: 'Tanegashima, Japan', launchAt: launchTime(24), missionType: 'Weather satellite', status: 'Scheduled' },
];

const eventNames = [
  ['Perseid meteor shower', 'Meteor shower', 'Peak activity may be visible after midnight under dark skies.'],
  ['ISS visible pass', 'Satellite pass', 'A bright pass is forecast for northern Europe.'],
  ['Full Moon', 'Moon phase', 'The Moon will be fully illuminated at this time.'],
  ['Jupiter and Moon conjunction', 'Conjunction', 'Look toward the eastern horizon before dawn.'],
  ['Orionid meteor shower', 'Meteor shower', 'Best viewed away from city lights in the pre-dawn hours.'],
  ['Partial lunar eclipse', 'Lunar eclipse', 'Visibility depends on local horizon and weather conditions.'],
  ['New Moon', 'Moon phase', 'Dark skies provide a good window for deep-sky observing.'],
  ['Asteroid 2026 QX flyby', 'Asteroid flyby', 'A small near-Earth object will pass at a safe distance.'],
  ['Venus at greatest elongation', 'Planet', 'Venus will be prominent in the evening sky.'],
  ['Leonid meteor shower', 'Meteor shower', 'Rates vary; observers should allow time for dark adaptation.'],
];

export const celestialEvents: CelestialEvent[] = eventNames.map(([name, kind, description], index) => ({
  id: `event-${index + 1}`,
  name,
  kind,
  description,
  date: new Date(Date.now() + (index + 1) * 2.2 * 86_400_000).toISOString(),
  visibility: index % 2 === 0 ? 'Northern Europe' : 'Global, weather permitting',
}));

export const cameras: CameraSource[] = [
  { id: 'cam-01', name: 'Earth from orbit', category: 'Earth', location: 'Low Earth orbit', source: 'Demo stream slot', available: false },
  { id: 'cam-02', name: 'Station exterior', category: 'ISS', location: 'International Space Station', source: 'Demo stream slot', available: false },
  { id: 'cam-03', name: 'Launch pad overview', category: 'Launch pads', location: 'Kennedy Space Center, Florida', source: 'Demo stream slot', available: false },
  { id: 'cam-04', name: 'Southern sky survey', category: 'Observatories', location: 'Atacama Desert, Chile', source: 'Demo stream slot', available: false },
  { id: 'cam-05', name: 'Deep field monitor', category: 'Deep space', location: 'Remote observatory network', source: 'Demo stream slot', available: false },
];
