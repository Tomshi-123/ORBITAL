import { articles, celestialEvents, launches, sightings } from '../mock-data';
import type { Article, CelestialEvent, Launch, Sighting } from '../types';
import { getAtlasSightings } from './uapAtlas';
import { getUpcomingLaunches } from './launches';

export interface OrbitalDataSource {
  getSightings(): Promise<Sighting[]>;
  getArticles(kind?: Article['kind']): Promise<Article[]>;
  getLaunches(): Promise<Launch[]>;
  getCelestialEvents(): Promise<CelestialEvent[]>;
}

export const mockDataSource: OrbitalDataSource = {
  async getSightings() { return sightings; },
  async getArticles(kind) { return kind ? articles.filter((article) => article.kind === kind) : articles; },
  async getLaunches() { return launches; },
  async getCelestialEvents() { return celestialEvents; },
};

// Replace this adapter with real providers when API credentials and data sources are ready.
export const dataSource: OrbitalDataSource = {
  ...mockDataSource,
  getSightings: () => getAtlasSightings().catch(() => []),
  getLaunches: () => getUpcomingLaunches().catch(() => launches),
};

