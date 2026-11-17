/**
 * Snapshot a synchronous, source-indexed BVH contact sample before another
 * skinned pose or registration candidate may reuse its mutable Set/object.
 *
 * This is evidence-integrity protection, NOT contact clearance, a geometry
 * correction, a consumer 3D admission, or a substitute for swept collision.
 * Source triangle pair keys remain in memory, never in returned public receipts.
 */
// Caller must supply the original anatomical body face count.  The authentic
// Commons-0043 skirt has 576 indexed faces (six bands x 48 sectors x two faces).
// A syntactically valid but out-of-range index must never pass any of the five
// original/candidate pose checks, including the two intermediate poses.
export function snapshotOriginalSkirtBvhContact89(
  sample, {bodyFaceCount, skirtFaceCount = 576} = {}
) {
  if (!Number.isSafeInteger(bodyFaceCount) || bodyFaceCount < 1000 ||
      bodyFaceCount > 500000 || skirtFaceCount !== 576 ||
      !sample || !Number.isSafeInteger(sample.count) || sample.count < 0 ||
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
    const [skirtIndex, bodyIndex] = id.split('|').map(Number);
    if (!Number.isSafeInteger(skirtIndex) || skirtIndex >= skirtFaceCount ||
        !Number.isSafeInteger(bodyIndex) || bodyIndex >= bodyFaceCount) return null;
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
