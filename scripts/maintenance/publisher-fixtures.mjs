import { feeds } from './test-data.mjs';

export { feeds };

export function publisherExport(feed, now, label = 'Publisher fixture') {
  const look = (category, color) => ({
    category, color, label, audiences: ['All'], occasions: ['Casual'],
    seasons: ['Spring', 'Summer', 'Fall', 'Winter']
  });
  return {
    format: 'fashion-directions/v1',
    rights: { credit: feed.publication, license: feed.license },
    entries: [{
      canonical_url: new URL('/article', feed.url).href,
      headline: label + ' ' + feed.publication,
      published: new Date(now - 86400000).toISOString(),
      looks: feed.id === 'first'
        ? [look('tee', 'black'), look('denim-trousers', 'blue')]
        : [look('sneaker', 'white')]
    }]
  };
}
