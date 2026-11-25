import { makeCandidate } from './trends.mjs';

const maxBytes = 128 * 1024;
const taxonomy = new Map([
  ['tee', ['top', 'T-shirt']],
  ['denim-trousers', ['bottom', 'Jeans']],
  ['sneaker', ['shoes', 'Sneakers']]
]);

// Translate a versioned, locally supplied publisher export. No I/O or live source binding.
export function adaptPublisherFeed(feed, body) {
  if (typeof body !== 'string' || Buffer.byteLength(body) > maxBytes) {
    throw Error('invalid-publisher-body');
  }
  const envelope = JSON.parse(body);
  if (envelope?.format !== 'fashion-directions/v1' ||
      envelope.rights?.license !== feed.license ||
      envelope.rights.credit !== feed.publication ||
      !Array.isArray(envelope.entries) || envelope.entries.length < 1 || envelope.entries.length > 3) {
    throw Error('invalid-publisher-envelope');
  }
  return {
    schema_version: 1,
    license: feed.license,
    articles: envelope.entries.map(entry => {
      if (!Array.isArray(entry?.looks) || entry.looks.length < 1 || entry.looks.length > 3) {
        throw Error('invalid-publisher-entry');
      }
      return {
        url: entry.canonical_url,
        title: entry.headline,
        published_at: entry.published,
        directions: entry.looks.map(look => {
          const mapped = taxonomy.get(look?.category);
          if (!mapped) throw Error('unsupported-publisher-category');
          const [slot, type] = mapped;
          return {
            slot, type, label: look.label, color: look.color,
            audiences: look.audiences, occasions: look.occasions, seasons: look.seasons
          };
        })
      };
    })
  };
}

// Preflight uses the same cross-source rules as the scheduled job.
export function validatePublisherBatch(feeds, bodies, now) {
  if (!Array.isArray(bodies) || bodies.length !== feeds.length) throw Error('incomplete-publisher-batch');
  return makeCandidate(feeds, feeds.map((feed, index) => adaptPublisherFeed(feed, bodies[index])), now);
}
