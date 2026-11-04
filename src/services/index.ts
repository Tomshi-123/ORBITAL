import type { Article, CelestialEvent, Launch } from '../types';
import { getUpcomingLaunches } from './launches';
import { getSpaceNews } from './spaceNews';
import { getCelestialEvents } from './celestialEvents';
import type { Coordinates } from './location';

export interface OrbitalDataSource {
  getArticles(kind?: Article['kind']): Promise<Article[]>;
  getLaunches(): Promise<Launch[]>;
  getCelestialEvents(coordinates?: Coordinates): Promise<CelestialEvent[]>;
}

export const dataSource: OrbitalDataSource = {
  async getArticles() {
    const articles = await getSpaceNews();
    return articles.map((article) => ({
      id: String(article.id),
      headline: article.title,
      source: article.site,
      category: 'Spaceflight',
      summary: article.summary,
      publishedAt: article.publishedAt,
      kind: 'space',
    }));
  },
  getLaunches: getUpcomingLaunches,
  async getCelestialEvents(coordinates) { return getCelestialEvents(coordinates); },
};
