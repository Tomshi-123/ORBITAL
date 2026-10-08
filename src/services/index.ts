import { articles, cameras, celestialEvents, launches, sightings } from '../mock-data';
import type { Article, CameraSource, CelestialEvent, Launch, Sighting } from '../types';
import { getAtlasSightings } from './uapAtlas';

export interface OrbitalDataSource {
  getSightings(): Promise<Sighting[]>;
  getArticles(kind?: Article['kind']): Promise<Article[]>;
  getLaunches(): Promise<Launch[]>;
  getCelestialEvents(): Promise<CelestialEvent[]>;
  getCameras(): Promise<CameraSource[]>;
}

export const mockDataSource: OrbitalDataSource = {
  async getSightings() { return sightings; },
  async getArticles(kind) { return kind ? articles.filter((article) => article.kind === kind) : articles; },
  async getLaunches() { return launches; },
  async getCelestialEvents() { return celestialEvents; },
  async getCameras() { return cameras; },
};

// Replace this adapter with real providers when API credentials and data sources are ready.
export const dataSource: OrbitalDataSource = {
  ...mockDataSource,
  getSightings: () => getAtlasSightings().catch(() => []),
};
