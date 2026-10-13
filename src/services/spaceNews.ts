export type SpaceNewsArticle = {
  id: number;
  title: string;
  summary: string;
  url: string;
  imageUrl: string | null;
  site: string;
  publishedAt: string;
};

type SpaceNewsResponse = {
  results: {
    id: number;
    title: string;
    summary: string;
    url: string;
    image_url: string | null;
    news_site: string;
    published_at: string;
  }[];
};

const NEWS_URL = 'https://api.spaceflightnewsapi.net/v4/articles/?limit=8';
const CACHE_MS = 15 * 60 * 1000;

let cache: { at: number; items: SpaceNewsArticle[] } | null = null;
let inflight: Promise<SpaceNewsArticle[]> | null = null;

async function fetchNews() {
  const response = await fetch(NEWS_URL);
  if (!response.ok) throw new Error(`Spaceflight News ${response.status}`);
  const data = (await response.json()) as SpaceNewsResponse;
  return data.results.map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.summary,
    url: item.url,
    imageUrl: item.image_url,
    site: item.news_site,
    publishedAt: item.published_at,
  }));
}

export async function getSpaceNews() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.items;
  if (!inflight) {
    inflight = fetchNews()
      .then((items) => {
        cache = { at: Date.now(), items };
        return items;
      })
      .catch((error) => {
        if (cache) return cache.items;
        throw error;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}
