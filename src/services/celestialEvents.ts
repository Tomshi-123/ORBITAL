import * as Astronomy from 'astronomy-engine';
import type { CelestialEvent } from '../types';
import type { Coordinates } from './location';

const EVENT_WINDOW_DAYS = 365 * 2;
const MOON_PHASES = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'];
const SEASONS = [
  ['March equinox', 'Seasonal marker'],
  ['June solstice', 'Seasonal marker'],
  ['September equinox', 'Seasonal marker'],
  ['December solstice', 'Seasonal marker'],
] as const;

function makeEvent(id: string, name: string, kind: string, date: Date, description: string, visibility: string): CelestialEvent {
  return { id, name, kind, date: date.toISOString(), description, visibility };
}

function eclipseName(kind: Astronomy.EclipseKind, solar: boolean): string {
  if (solar) {
    if (kind === Astronomy.EclipseKind.Total) return 'Total solar eclipse';
    if (kind === Astronomy.EclipseKind.Annular) return 'Annular solar eclipse';
    return 'Partial solar eclipse';
  }
  if (kind === Astronomy.EclipseKind.Total) return 'Total lunar eclipse';
  if (kind === Astronomy.EclipseKind.Partial) return 'Partial lunar eclipse';
  return 'Penumbral lunar eclipse';
}

function lunarEclipses(start: Date, end: Date, coordinates?: Coordinates): CelestialEvent[] {
  const events: CelestialEvent[] = [];
  let eclipse = Astronomy.SearchLunarEclipse(start);
  while (eclipse.peak.date <= end) {
    const observer = coordinates
      ? new Astronomy.Observer(coordinates.latitude, coordinates.longitude, coordinates.altitude)
      : null;
    const moonEquator = observer
      ? Astronomy.Equator(Astronomy.Body.Moon, eclipse.peak, observer, true, true)
      : null;
    const altitude = observer && moonEquator
      ? Astronomy.Horizon(eclipse.peak, observer, moonEquator.ra, moonEquator.dec).altitude
      : null;
    const visibility = altitude == null
      ? 'Global event; local visibility varies'
      : `Moon altitude at peak: ${altitude.toFixed(1)}° here`;
    events.push(makeEvent(
      `lunar-eclipse-${eclipse.peak.date.toISOString()}`,
      eclipseName(eclipse.kind, false),
      'Lunar eclipse',
      eclipse.peak.date,
      `${Math.round(eclipse.obscuration * 100)}% of the Moon enters Earth’s umbra at peak. Times are calculated in UTC.`,
      visibility,
    ));
    eclipse = Astronomy.NextLunarEclipse(eclipse.peak);
  }
  return events;
}

function solarEclipses(start: Date, end: Date, coordinates?: Coordinates): CelestialEvent[] {
  const events: CelestialEvent[] = [];
  if (coordinates) {
    const observer = new Astronomy.Observer(coordinates.latitude, coordinates.longitude, coordinates.altitude);
    let eclipse = Astronomy.SearchLocalSolarEclipse(start, observer);
    while (eclipse.peak.time.date <= end) {
      const visible = [eclipse.partial_begin, eclipse.peak, eclipse.partial_end]
        .some((phase) => phase.altitude > 0);
      if (visible) {
        events.push(makeEvent(
          `local-solar-eclipse-${eclipse.peak.time.date.toISOString()}`,
          eclipseName(eclipse.kind, true),
          'Solar eclipse',
          eclipse.peak.time.date,
          `${Math.round(eclipse.obscuration * 100)}% of the Sun is obscured at peak. Times are calculated for your location.`,
          'At least part of the eclipse occurs above your horizon',
        ));
      }
      eclipse = Astronomy.NextLocalSolarEclipse(eclipse.peak.time, observer);
    }
    return events;
  }

  let eclipse = Astronomy.SearchGlobalSolarEclipse(start);
  while (eclipse.peak.date <= end) {
    events.push(makeEvent(
      `solar-eclipse-${eclipse.peak.date.toISOString()}`,
      eclipseName(eclipse.kind, true),
      'Solar eclipse',
      eclipse.peak.date,
      'An eclipse occurs somewhere on Earth. Local visibility depends on the eclipse path and time of day.',
      'Global event; local visibility varies',
    ));
    eclipse = Astronomy.NextGlobalSolarEclipse(eclipse.peak);
  }
  return events;
}

export function getCelestialEvents(coordinates?: Coordinates, now = new Date()): CelestialEvent[] {
  const end = new Date(now.getTime() + EVENT_WINDOW_DAYS * 86_400_000);
  const events: CelestialEvent[] = [];

  let phase = Astronomy.SearchMoonQuarter(now);
  while (phase.time.date <= end && events.length < 24) {
    const name = MOON_PHASES[phase.quarter];
    events.push(makeEvent(
      `moon-phase-${phase.time.date.toISOString()}`,
      name,
      'Moon phase',
      phase.time.date,
      `${name} calculated from the current lunar ephemeris. Event time is UTC.`,
      'Worldwide; local viewing depends on daylight and weather',
    ));
    phase = Astronomy.NextMoonQuarter(phase);
  }

  for (const year of [now.getUTCFullYear(), now.getUTCFullYear() + 1, now.getUTCFullYear() + 2]) {
    const season = Astronomy.Seasons(year);
    const times = [season.mar_equinox, season.jun_solstice, season.sep_equinox, season.dec_solstice];
    times.forEach((time, index) => {
      if (time.date > now && time.date <= end) {
        events.push(makeEvent(
          `season-${time.date.toISOString()}`,
          SEASONS[index][0],
          SEASONS[index][1],
          time.date,
          'Exact equinox or solstice time calculated from the solar ephemeris. Event time is UTC.',
          'Global event',
        ));
      }
    });
  }

  events.push(...lunarEclipses(now, end, coordinates), ...solarEclipses(now, end, coordinates));
  return events
    .filter((event) => new Date(event.date) > now)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}
