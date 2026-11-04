import {createHash} from 'node:crypto';

function verifyBox(box) {
  const {x, y, width, height} = box ?? {};
  if (![x, y, width, height].every(Number.isFinite) ||
      x < 0 || y < 0 || width <= 0 || height <= 0 ||
      x + width > 1.00000001 || y + height > 1.00000001) {
    throw new Error('Invalid normalized visible-region box');
  }
}

export function boxIoU(a, b) {
  verifyBox(a);
  verifyBox(b);
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  const intersection = width * height;
  return intersection / (a.width * a.height + b.width * b.height - intersection);
}

export function verifySource(row, bytes, metadata) {
  if (metadata.format !== 'jpeg' || metadata.width !== row.width ||
      metadata.height !== row.height || bytes.length !== row.bytes ||
      createHash('sha256').update(bytes).digest('hex') !== row.sha256) {
    throw new Error('Locked JPEG identity mismatch: ' + row.id);
  }
}

export function scorePhoto(expected, {status, proposals}, threshold = 0.5) {
  if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) {
    throw new Error('Invalid box IoU threshold');
  }
  if (status !== 'completed' && status !== 'failed') {
    throw new Error('Missing inference status');
  }
  if (!Array.isArray(expected) || !Array.isArray(proposals)) {
    throw new Error('Missing annotations or proposals');
  }
  for (const region of [...expected, ...proposals]) verifyBox(region.box);

  // A failed run never receives credit for partial proposals.
  const observed = status === 'completed' ? proposals : [];
  const candidates = expected.map(region => observed
    .map((proposal, index) => ({index, iou: boxIoU(region.box, proposal.box)}))
    .filter(({index, iou}) => observed[index].family === region.family && iou >= threshold)
    .sort((a, b) => b.iou - a.iou || a.index - b.index));
  const owners = new Map();

  // Find a maximum-cardinality one-to-one match. Reassign an earlier match
  // when doing so allows another instance of the same class to be matched.
  function assign(expectedIndex, visited) {
    for (const {index} of candidates[expectedIndex]) {
      if (visited.has(index)) continue;
      visited.add(index);
      if (!owners.has(index) || assign(owners.get(index), visited)) {
        owners.set(index, expectedIndex);
        return true;
      }
    }
    return false;
  }

  expected.forEach((_, index) => assign(index, new Set()));
  const matches = [...owners].map(([proposal, annotation]) => ({
    proposal, annotation, boxIoU: boxIoU(observed[proposal].box, expected[annotation].box),
  }));
  const matchedAnnotations = new Set(owners.values());
  return {
    status, matches,
    expectedCount: expected.length,
    proposalCount: observed.length,
    discardedPartialProposals: proposals.length - observed.length,
    missed: expected.flatMap((_, index) => matchedAnnotations.has(index) ? [] : [index]),
    unmatched: observed.flatMap((proposal, index) => {
      if (owners.has(index)) return [];
      const overlaps = expected.filter(region => boxIoU(region.box, proposal.box) >= threshold);
      const reason = overlaps.some(region => region.family === proposal.family)
        ? 'duplicate' : overlaps.length ? 'class-mismatch' : 'unmatched-region';
      return [{index, reason}];
    }),
  };
}

export function summarizePhotos(scores) {
  const totals = {
    photos: scores.length, failedPhotos: 0, expected: 0, proposed: 0,
    truePositives: 0, falsePositives: 0, falseNegatives: 0,
  };
  for (const score of scores) {
    totals.failedPhotos += Number(score.status === 'failed');
    totals.expected += score.expectedCount;
    totals.proposed += score.proposalCount;
    totals.truePositives += score.matches.length;
    totals.falsePositives += score.unmatched.length;
    totals.falseNegatives += score.missed.length;
  }
  return {
    ...totals,
    precision: totals.proposed ? totals.truePositives / totals.proposed : null,
    recall: totals.expected ? totals.truePositives / totals.expected : null,
    maskIoU: null,
  };
}
