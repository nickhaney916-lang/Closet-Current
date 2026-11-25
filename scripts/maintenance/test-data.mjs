// Synthetic public-feed documents. No external URLs are fetched by these fixtures.
export const feeds = [
  { id: 'first', publisherGroup: 'group-one', publication: 'Fixture One', url: 'https://fashion-one.example/feed', license: 'CC0-1.0' },
  { id: 'second', publisherGroup: 'group-two', publication: 'Fixture Two', url: 'https://fashion-two.example/feed', license: 'CC-BY-4.0' }
];

export function documentFor(feed, now, label = 'First release') {
  const direction = (slot, type, color) => ({
    slot, type, label, color, audiences: ['All'], occasions: ['Casual'], seasons: ['Fall', 'Winter', 'Spring', 'Summer']
  });
  return {
    schema_version: 1, license: feed.license,
    articles: [{
      url: new URL('/article', feed.url).href,
      title: label + ' ' + feed.publication,
      published_at: new Date(now - 86400000).toISOString(),
      directions: feed.id === 'first' ? [direction('top', 'T-shirt', 'black'), direction('bottom', 'Jeans', 'blue')]
        : [direction('shoes', 'Sneakers', 'white')]
    }]
  };
}
