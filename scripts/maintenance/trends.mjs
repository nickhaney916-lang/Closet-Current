import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
const { normalizeTrendLibrary, safeTrendURL } = require('../../public/trend-library.js');
const types = runInNewContext(readFileSync(new URL('../../public/taxonomy.js', import.meta.url), 'utf8') + '\nclothingSchema.types');
const slots = {
  top: [...types.Tops, ...types.Dresses], bottom: types.Bottoms, layer: types.Outerwear,
  shoes: types.Shoes, bag: ['Bag'], accessory: types.Accessories, finish: types.Accessories
};
export const week = 7 * 86400000;
export const digest = (text) => createHash('sha256').update(text).digest('hex');
const labels = {
  audiences: ['Women', 'Men', 'All'],
  occasions: ['Casual', 'Work', 'Dinner', 'Active'],
  seasons: ['Spring', 'Summer', 'Fall', 'Winter']
};
const rights = ['CC0-1.0', 'CC-BY-4.0'];
const validText = (value, limit) => typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= limit && !/[\x00-\x1f\x7f]/.test(value);
const key = (value) => validText(value, 48) && /^[a-z0-9-]+$/.test(value);

export function validateFeeds(feeds) {
  if (!Array.isArray(feeds) || feeds.length < 2 || feeds.length > 10 ||
      new Set(feeds.map(feed => feed?.publisherGroup)).size < 2 ||
      new Set(feeds.map(feed => feed?.id)).size !== feeds.length ||
      new Set(feeds.map(feed => new URL(feed.url).hostname.replace(/^www\./, ''))).size !== feeds.length) {
    throw Error('invalid-feed-policy');
  }
  for (const feed of feeds) {
    if (!key(feed.id) || !key(feed.publisherGroup) || !validText(feed.publication, 80) ||
        !safeTrendURL(feed.url) || !rights.includes(feed.license)) throw Error('invalid-feed-policy');
  }
}

export function makeCandidate(feeds, documents, now) {
  validateFeeds(feeds);
  const updated = new Date(now).toISOString();
  const sources = [];
  const directions = [];
  const articleUrls = new Set();
  for (const [index, feed] of feeds.entries()) {
    const document = documents[index];
    if (document?.schema_version !== 1 || document.license !== feed.license ||
        !Array.isArray(document.articles) || document.articles.length < 1 || document.articles.length > 3) {
      throw Error('invalid-feed-document');
    }
    for (const article of document.articles) {
      const url = safeTrendURL(article.url);
      const published = Date.parse(article.published_at);
      if (!url || new URL(url).origin !== new URL(feed.url).origin || articleUrls.has(url) ||
          !validText(article.title, 150) || !Number.isFinite(published) || published > now ||
          now - published > 8 * week || new Date(published).toISOString() !== article.published_at ||
          !Array.isArray(article.directions) || article.directions.length < 1 || article.directions.length > 3) {
        throw Error('invalid-source-article');
      }
      articleUrls.add(url);
      const sourceId = `${feed.id}-${sources.length + 1}`;
      sources.push({ id: sourceId, title: article.title, publication: feed.publication, url,
        published_at: article.published_at, checked_at: updated, license: feed.license });
      for (const direction of article.directions) {
        if (!Object.hasOwn(slots, direction.slot) || !slots[direction.slot].includes(direction.type) ||
            !validText(direction.label, 80) || !validText(direction.color, 40) ||
            Object.keys(labels).some(field => !Array.isArray(direction[field]) ||
              !direction[field].length || direction[field].some(value => !labels[field].includes(value)))) {
          throw Error('invalid-trend-direction');
        }
        directions.push({
          id: `${sourceId}-${directions.length + 1}`, source_id: sourceId, slot: direction.slot,
          type: direction.type, label: direction.label, color: direction.color,
          audiences: [...new Set(direction.audiences)], occasions: [...new Set(direction.occasions)],
          seasons: [...new Set(direction.seasons)],
          reason: `Trend reference from ${feed.publication}.`
        });
      }
    }
  }
  const identities = directions.map(d => JSON.stringify([d.slot, d.type, d.color.toLowerCase(), d.audiences.toSorted(), d.occasions.toSorted(), d.seasons.toSorted()]));
  if (new Set(identities).size !== identities.length) throw Error('duplicate-trend-directions');
  const data = { schema_version: 1, updated_at: updated, next_refresh_at: new Date(now + week).toISOString(),
    sources, directions, products: [], retailers: [] };
  const normalized = normalizeTrendLibrary(data);
  if (normalized.sources.length !== sources.length || normalized.directions.length !== directions.length) {
    throw Error('incompatible-trend-library');
  }
  return data;
}

export async function fetchDocument(feed) {
  const response = await fetch(feed.url, {
    redirect: 'error', signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json' }
  });
  if (!response.ok || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) {
    await response.body?.cancel();
    throw Error('feed-unavailable');
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > 128 * 1024) throw Error('feed-too-large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function verifyStored(payload, version) {
  if (digest(payload) !== version) throw Error('trend-digest-mismatch');
  const data = JSON.parse(payload);
  normalizeTrendLibrary(data);
  return data;
}
