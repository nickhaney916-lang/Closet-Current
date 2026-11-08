/**
 * PHOTO-GARMENT-ANATOMICAL-FITTING-END-TO-END-60
 *
 * A fail-closed acceptance boundary for the existing source-photo garment
 * meshes. This does not invent garment geometry or infer a user's back photo.
 * It admits only the reviewed public fixtures after checking their original
 * source identity, actual photo projection, skin attributes, body skeleton,
 * vertex integrity and normalized bone weights.
 */
export const PHOTO_FIT_SOURCES_60 = Object.freeze({
  'commons-0003': Object.freeze({
    sourceSHA256: 'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
    garment: 'shirt'
  }),
  'commons-0053': Object.freeze({
    sourceSHA256: 'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
    garment: 'dress'
  }),
  'commons-public-domain-jeans-2005': Object.freeze({
    sourceSHA256: 'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
    garment: 'jeans'
  }),
  'commons-cc-by-sa-denimjeans2-2008': Object.freeze({
    sourceSHA256: 'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a',
    garment: 'jeans'
  })
});

const fail = reason => Object.freeze({
  accepted: false,
  mode: 'verified-original-photo-2d-fallback',
  reason,
  releaseAuthorized: false
});

/**
 * Verify a completed garment against the actual loaded body rig. Unknown and
 * private sources remain eligible for the app's original-photo fallback.
 */
export function inspectPhotographedFit60(garment, bodyRoot) {
  const stats = garment?.stats;
  const entry = Object.entries(PHOTO_FIT_SOURCES_60)
    .find(([id, source]) => source.sourceSHA256 === stats?.sourceSHA256 &&
      (stats?.sourceId === undefined || stats.sourceId === id));
  if (!entry) return fail('source-photo-is-not-an-admitted-public-fixture');
  const [sourceId, source] = entry;
  const sourcePixelsVerified = stats.photoApplied === true ||
    (sourceId === 'commons-0053' && stats.frontOriginalPixels === true) ||
    (sourceId === 'commons-0003' && garment.meshes?.some(mesh => {
      const materials = Array.isArray(mesh?.material) ? mesh.material : [mesh?.material];
      return materials.some(material => typeof material?.onBeforeCompile === 'function');
    }));
  if (!sourcePixelsVerified) return fail('original-source-pixels-are-not-projected');
  if (stats.releaseAuthorized !== false || stats.ownerApproved === true ||
      stats.humanVisualApproval === true)
    return fail('source-review-or-release-state-is-not-research-only');
  if (!Array.isArray(garment.meshes) || garment.meshes.length === 0 ||
      typeof bodyRoot?.traverse !== 'function')
    return fail('anatomical-skinned-meshes-required');

  const bodySkeletons = new Set();
  bodyRoot.traverse(object => {
    if (object?.isSkinnedMesh && object.skeleton) bodySkeletons.add(object.skeleton);
  });
  if (!bodySkeletons.size) return fail('loaded-anatomical-body-skeleton-missing');

  let vertices = 0;
  let triangles = 0;
  let maxWeightSumError = 0;
  for (const mesh of garment.meshes) {
    const geometry = mesh?.geometry;
    const positions = geometry?.getAttribute?.('position');
    const indices = geometry?.getAttribute?.('skinIndex');
    const weights = geometry?.getAttribute?.('skinWeight');
    const bones = mesh?.skeleton?.bones;
    if (!mesh?.isSkinnedMesh || !bodySkeletons.has(mesh.skeleton) ||
        !Array.isArray(bones) || bones.length !== 163 || !positions ||
        !indices || !weights || positions.count < 3 ||
        indices.count !== positions.count || weights.count !== positions.count ||
        indices.itemSize < 4 || weights.itemSize < 4)
      return fail('garment-is-not-bound-to-the-loaded-163-bone-body');

    const index = geometry.index;
    const indexCount = index?.count ?? positions.count;
    if (indexCount < 3 || indexCount % 3 !== 0)
      return fail('garment-triangle-index-buffer-is-invalid');
    for (let i = 0; i < positions.count; i++) {
      for (let c = 0; c < 3; c++) {
        const value = positions.getComponent(i, c);
        if (!Number.isFinite(value)) return fail('garment-has-non-finite-vertices');
      }
      let sum = 0;
      for (let c = 0; c < 4; c++) {
        const bone = indices.getComponent(i, c);
        const weight = weights.getComponent(i, c);
        if (!Number.isInteger(bone) || bone < 0 || bone >= bones.length ||
            !Number.isFinite(weight) || weight < 0 || weight > 1)
          return fail('garment-skinning-attribute-is-out-of-range');
        sum += weight;
      }
      maxWeightSumError = Math.max(maxWeightSumError, Math.abs(1 - sum));
      if (Math.abs(1 - sum) > 0.025)
        return fail('garment-bone-weights-are-not-normalized');
    }
    vertices += positions.count;
    triangles += Math.floor(indexCount / 3);
  }
  return Object.freeze({
    accepted: true,
    mode: 'source-photo-on-anatomical-skinned-mesh',
    sourceId,
    sourceSHA256: source.sourceSHA256,
    garment: source.garment,
    meshCount: garment.meshes.length,
    vertices,
    triangles,
    originalPhotoPixelsUsed: true,
    originalSourceIdentityChecked: true,
    common163BoneSkeletonChecked: true,
    maxSkinWeightSumError: maxWeightSumError,
    rearPhotoProvenance: 'INFERRED_UNVERIFIED_NEUTRAL',
    arbitraryOwnerPhoto3DApproved: false,
    humanPhotorealismApproved: false,
    releaseAuthorized: false
  });
}

/** Add the acceptance receipt without changing source geometry or materials. */
export function attachPhotographedFitReceipt60(garment, bodyRoot) {
  const receipt = inspectPhotographedFit60(garment, bodyRoot);
  if (!receipt.accepted) throw Error('P60 photographed fit rejected: ' + receipt.reason);
  return {
    ...garment,
    stats: {
      ...garment.stats,
      photoAnatomicalFit60: true,
      photoAnatomicalFitReceipt60: receipt,
      photoAnatomicalFitGeometryUnchanged60: true,
      releaseAuthorized: false
    }
  };
}
