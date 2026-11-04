import * as Astronomy from 'astronomy-engine';
import type { Coordinates } from './location';

export type SkyObject = {
  id: string;
  name: string;
  kind: string;
  detail: string;
  azimuth: number;
  altitude: number;
  magnitude: number;
};

const PLANETS = [
  Astronomy.Body.Mercury,
  Astronomy.Body.Venus,
  Astronomy.Body.Mars,
  Astronomy.Body.Jupiter,
  Astronomy.Body.Saturn,
  Astronomy.Body.Uranus,
  Astronomy.Body.Neptune,
];

const STARS = [
  { body: Astronomy.Body.Star1, name: 'Sirius', ra: 6.75248, dec: -16.7161, magnitude: -1.46 },
  { body: Astronomy.Body.Star2, name: 'Canopus', ra: 6.3992, dec: -52.6957, magnitude: -0.74 },
  { body: Astronomy.Body.Star3, name: 'Arcturus', ra: 14.261, dec: 19.1825, magnitude: -0.05 },
  { body: Astronomy.Body.Star4, name: 'Vega', ra: 18.61565, dec: 38.7837, magnitude: 0.03 },
  { body: Astronomy.Body.Star5, name: 'Capella', ra: 5.27815, dec: 45.998, magnitude: 0.08 },
  { body: Astronomy.Body.Star6, name: 'Betelgeuse', ra: 5.91953, dec: 7.4071, magnitude: 0.42 },
  { body: Astronomy.Body.Star7, name: 'Rigel', ra: 5.2423, dec: -8.2016, magnitude: 0.13 },
  { body: Astronomy.Body.Star8, name: 'Polaris', ra: 2.5303, dec: 89.2641, magnitude: 1.98 },
];

const AU_KM = 149_597_870.7;
const EARTH_RADIUS_KM = 6371;

export type SpacePoint = { longitude: number; latitude: number; distance: number };

// Converts a J2000 geocentric vector (AU) to Earth-fixed longitude/latitude plus distance in Earth radii.
export function toSpacePoint(vector: Astronomy.Vector, date: Date): SpacePoint {
  const time = Astronomy.MakeTime(date);
  const equator = Astronomy.EquatorFromVector(Astronomy.RotateVector(Astronomy.Rotation_EQJ_EQD(time), vector));
  const longitude = ((((equator.ra - Astronomy.SiderealTime(time)) * 15 + 180) % 360) + 360) % 360 - 180;
  return { longitude, latitude: equator.dec, distance: (equator.dist * AU_KM) / EARTH_RADIUS_KM };
}

export function getMoonPoint(date = new Date()): SpacePoint {
  return toSpacePoint(Astronomy.GeoVector(Astronomy.Body.Moon, date, true), date);
}

export function getSkyObjects(coordinates: Coordinates, date = new Date()): SkyObject[] {
  const observer = new Astronomy.Observer(coordinates.latitude, coordinates.longitude, coordinates.altitude);
  const objects: SkyObject[] = [];

  const addObject = (body: Astronomy.Body, name: string, kind: string, magnitude: number, detail: string) => {
    const equator = Astronomy.Equator(body, date, observer, true, true);
    const horizon = Astronomy.Horizon(date, observer, equator.ra, equator.dec, 'normal');
    if (horizon.altitude > 0) {
      objects.push({
        id: body,
        name,
        kind,
        detail,
        azimuth: horizon.azimuth,
        altitude: horizon.altitude,
        magnitude,
      });
    }
  };

  const moon = Astronomy.Illumination(Astronomy.Body.Moon, date);
  addObject(
    Astronomy.Body.Moon,
    'Moon',
    'Natural satellite',
    moon.mag,
    `${Math.round(moon.phase_fraction * 100)}% illuminated`,
  );

  for (const planet of PLANETS) {
    const illumination = Astronomy.Illumination(planet, date);
    addObject(planet, planet, 'Planet', illumination.mag, 'Current calculated position');
  }

  STARS.forEach((star) => {
    Astronomy.DefineStar(star.body, star.ra, star.dec, 1000);
    addObject(star.body, star.name, 'Star', star.magnitude, 'Bright star');
  });

  return objects.sort((a, b) => b.altitude - a.altitude);
}
