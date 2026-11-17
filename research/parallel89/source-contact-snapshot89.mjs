/**
 * Snapshot a synchronous, source-indexed BVH contact sample before another
 * skinned pose or registration candidate may reuse its mutable Set/object.
 *
 * This is evidence-integrity protection, NOT contact clearance, a geometry
 * correction, a consumer 3D admission, or a substitute for swept collision.
 * Source triangle pair keys remain in memory, never in returned public receipts.
 */
export function snapshotOriginalSkirtBvhContact89(sample) {
  if (!sample || !Number.isSafeInteger(sample.count) || sample.count < 0 ||
      !(sample.pairs instanceof Set) || sample.pairs.size !== sample.count ||
      !Number.isFinite(sample.maxDepth) || sample.maxDepth < 0 ||
      sample.trueOriginalSkirtTriangleIndexStable !== true ||
      sample.trueOriginalBodyTriangleIndexStable !== true ||
      sample.originalFaceSourceResolution !==
        'BVH_INDIRECT_RESOLVED_ORIGINAL_TRIANGLE_INDICES') return null;
  const copiedPairs = new Set();
  for (const id of sample.pairs) {
    if (typeof id !== 'string' ||
        !/^(0|[1-9][0-9]*)\|(0|[1-9][0-9]*)$/.test(id)) return null;
    copiedPairs.add(id);
  }
  return Object.freeze({
    count: sample.count,
    pairs: copiedPairs,
    maxDepth: sample.maxDepth,
    trueOriginalSkirtTriangleIndexStable: true,
    trueOriginalBodyTriangleIndexStable: true,
    originalFaceSourceResolution:
      'BVH_INDIRECT_RESOLVED_ORIGINAL_TRIANGLE_INDICES'
  });
}
