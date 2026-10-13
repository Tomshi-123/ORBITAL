import type { Launch } from '../types';

export type LonLat = [number, number];

const ISS_INCLINATION = 51.6;
const TIANGONG_INCLINATION = 41.5;

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (radians: number) => (radians * 180) / Math.PI;

// Estimated orbital inclination; the launch API does not publish it.
export function estimateInclination(launch: Launch): number | null {
  const lat = Math.abs(launch.padLatitude ?? 0);
  if (launch.station === 'ISS') return ISS_INCLINATION;
  if (launch.station === 'Tiangong') return TIANGONG_INCLINATION;

  switch (launch.orbitAbbrev) {
    case 'LEO': return Math.max(lat, 53);
    case 'SSO': return 97.8;
    case 'PO': return 90;
    case 'GTO': return Math.max(lat, 27);
    case 'GEO': return 0;
    default: return null;
  }
}

function destination(lat: number, lon: number, bearing: number, distance: number): LonLat {
  const phi = rad(lat);
  const lambda = rad(lon);
  const phi2 = Math.asin(Math.sin(phi) * Math.cos(distance) + Math.cos(phi) * Math.sin(distance) * Math.cos(bearing));
  const lambda2 = lambda + Math.atan2(
    Math.sin(bearing) * Math.sin(distance) * Math.cos(phi),
    Math.cos(distance) - Math.sin(phi) * Math.sin(phi2),
  );
  return [((deg(lambda2) + 540) % 360) - 180, deg(phi2)];
}

export function orbitGroundTrack(launch: Launch): LonLat[] | null {
  if (launch.padLatitude == null || launch.padLongitude == null) return null;
  const inclination = estimateInclination(launch);
  if (inclination == null) return null;

  const lat = launch.padLatitude;
  const lon = launch.padLongitude;
  const reachable = inclination > 90
    ? Math.min(inclination, 180 - Math.abs(lat))
    : Math.max(inclination, Math.abs(lat));
  const ratio = Math.max(-1, Math.min(1, Math.cos(rad(reachable)) / Math.cos(rad(lat))));
  const bearing = Math.asin(ratio);

  return Array.from({ length: 73 }, (_, step) => destination(lat, lon, bearing, rad(step * 5)));
}
