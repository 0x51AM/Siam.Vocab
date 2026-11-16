import { WikimediaImage } from '../types';

const CACHE_KEY = 'siamvocab_wiki_cache_v1';

interface CacheStore {
  [query: string]: WikimediaImage | null;
}

function loadCache(): CacheStore {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(cache: CacheStore) {
  try {
    const keys = Object.keys(cache);
    if (keys.length > 400) {
      // Keep recent 300 entries
      const trimmed: CacheStore = {};
      keys.slice(-300).forEach((k) => {
        trimmed[k] = cache[k];
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch {
    // Ignore storage quota errors
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function buildWikimediaSearchQuery(
  germanWord: string,
  englishMeaning?: string,
  customHint?: string
): string {
  if (customHint && customHint.trim()) return customHint.trim();
  const cleanEnglish = (englishMeaning || '')
    .replace(/\(.*?\)/g, '')
    .replace(/here:\s*/i, '')
    .replace(/^to\s+/i, '')
    .split('/')[0]
    .trim();

  if (cleanEnglish && cleanEnglish.length >= 2) {
    return cleanEnglish;
  }

  return germanWord
    .replace(/\(.*?\)/g, '')
    .replace(/\|/g, '')
    .trim();
}

export async function searchWikimediaPhotos(
  query: string,
  limit = 6
): Promise<WikimediaImage[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
  endpoint.searchParams.set('action', 'query');
  endpoint.searchParams.set('generator', 'search');
  endpoint.searchParams.set('gsrnamespace', '6');
  endpoint.searchParams.set('gsrsearch', `${cleanQuery} filetype:bitmap`);
  endpoint.searchParams.set('gsrlimit', String(Math.max(limit * 2, 12)));
  endpoint.searchParams.set('prop', 'imageinfo');
  endpoint.searchParams.set('iiprop', 'url|extmetadata|mime');
  endpoint.searchParams.set('iiurlwidth', '640');
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('origin', '*');

  const response = await fetch(endpoint.toString());
  if (!response.ok) {
    throw new Error(`Wikimedia API error: ${response.status}`);
  }
  const data = await response.json();
  const pages = data?.query?.pages;
  if (!pages) return [];

  const results: WikimediaImage[] = [];
  const entries = Object.values(pages) as Array<{
    title?: string;
    index?: number;
    imageinfo?: Array<{
      url?: string;
      thumburl?: string;
      descriptionurl?: string;
      mime?: string;
      extmetadata?: {
        Artist?: { value?: string };
        LicenseShortName?: { value?: string };
        LicenseUrl?: { value?: string };
      };
    }>;
  }>;

  entries.sort((a, b) => (a.index ?? 999) - (b.index ?? 999));

  for (const page of entries) {
    const info = page.imageinfo?.[0];
    if (!info || !info.thumburl) continue;
    const mime = info.mime || '';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) continue;

    const title = (page.title || '').replace(/^File:/i, '');
    // Skip obvious text scans, maps, icons, or flags unless explicitly searched
    if (/(scan|page|diagram|map|logo|icon|flag_of|coat_of_arms)/i.test(title)) {
      continue;
    }

    const artistRaw = info.extmetadata?.Artist?.value || 'Wikimedia Commons contributor';
    const licenseRaw = info.extmetadata?.LicenseShortName?.value || 'CC / Public Domain';
    const licenseUrl = info.extmetadata?.LicenseUrl?.value;

    results.push({
      url: info.url || info.thumburl,
      thumbUrl: info.thumburl,
      title,
      author: stripHtml(artistRaw).slice(0, 80) || 'Wikimedia Commons',
      license: stripHtml(licenseRaw).slice(0, 50) || 'CC License',
      licenseUrl,
      pageUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(title)}`,
      fetchedAt: new Date().toISOString(),
    });

    if (results.length >= limit) break;
  }

  return results;
}

export async function fetchBestWikimediaPhoto(
  query: string,
  useCache = true
): Promise<WikimediaImage | null> {
  const key = query.toLowerCase().trim();
  if (!key) return null;

  if (useCache) {
    const cache = loadCache();
    if (key in cache) {
      return cache[key];
    }
  }

  try {
    const photos = await searchWikimediaPhotos(query, 4);
    const best = photos[0] || null;
    const cache = loadCache();
    cache[key] = best;
    saveCache(cache);
    return best;
  } catch {
    return null;
  }
}
