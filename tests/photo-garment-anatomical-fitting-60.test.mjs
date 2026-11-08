import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attachPhotographedFitReceipt60,
  inspectPhotographedFit60
} from '../research/photo-garment-anatomical-fitting-60/fit-contract.mjs';

const sourceSHA256 = 'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';

function attribute(rows, itemSize) {
  return {
    count: rows.length / itemSize,
    itemSize,
    getComponent(vertex, component) { return rows[vertex * itemSize + component]; }
  };
}

function fixture({ source = sourceSHA256, boneCount = 163, weight = 1, owner = false } = {}) {
  const bones = Array.from({ length: boneCount }, (_, index) => ({ name: `bone-${index}` }));
  const skeleton = { bones };
  const geometry = {
    index: { count: 3 },
    getAttribute(name) {
      if (name === 'position') return attribute([0, 1, 0, .1, 1, 0, 0, 1.1, 0], 3);
      if (name === 'skinIndex') return attribute([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 4);
      if (name === 'skinWeight') return attribute([weight, 0, 0, 0, weight, 0, 0, 0, weight, 0, 0, 0], 4);
      return null;
    }
  };
  const material = { onBeforeCompile() {} };
  const mesh = { isSkinnedMesh: true, geometry, skeleton, material };
  const bodyRoot = { traverse(callback) { callback({ isSkinnedMesh: true, skeleton }); } };
  const garment = {
    meshes: [mesh],
    stats: {
      sourceId: 'commons-0003', sourceSHA256: source, photoApplied: true,
      ownerApproved: owner, humanVisualApproval: false, releaseAuthorized: false
    }
  };
  return { garment, bodyRoot, geometry, material, mesh };
}

test('P60 admits only source-identified, photo-projected skinned mesh bound to the loaded 163-bone body', () => {
  const { garment, bodyRoot } = fixture();
  const result = inspectPhotographedFit60(garment, bodyRoot);
  assert.equal(result.accepted, true);
  assert.equal(result.mode, 'source-photo-on-anatomical-skinned-mesh');
  assert.equal(result.sourceId, 'commons-0003');
  assert.equal(result.vertices, 3);
  assert.equal(result.triangles, 1);
  assert.equal(result.maxSkinWeightSumError, 0);
  assert.equal(result.rearPhotoProvenance, 'INFERRED_UNVERIFIED_NEUTRAL');
  assert.equal(result.releaseAuthorized, false);
});

test('P60 routes unknown user photos to the verified original-photo 2D fallback', () => {
  const { garment, bodyRoot } = fixture({ source: 'a'.repeat(64) });
  const result = inspectPhotographedFit60(garment, bodyRoot);
  assert.equal(result.accepted, false);
  assert.equal(result.mode, 'verified-original-photo-2d-fallback');
  assert.equal(result.reason, 'source-photo-is-not-an-admitted-public-fixture');
});

test('P60 rejects geometry bound to a different or incomplete body skeleton', () => {
  const { garment, bodyRoot } = fixture({ boneCount: 162 });
  const result = inspectPhotographedFit60(garment, bodyRoot);
  assert.equal(result.accepted, false);
  assert.equal(result.reason, 'garment-is-not-bound-to-the-loaded-163-bone-body');
});

test('P60 rejects malformed bone weights and source-review promotion', () => {
  const malformedWeights = fixture({ weight: .9 });
  assert.equal(inspectPhotographedFit60(malformedWeights.garment, malformedWeights.bodyRoot).reason,
    'garment-bone-weights-are-not-normalized');
  const promoted = fixture({ owner: true });
  assert.equal(inspectPhotographedFit60(promoted.garment, promoted.bodyRoot).reason,
    'source-review-or-release-state-is-not-research-only');
});

test('P60 receipt adds evidence only and keeps source geometry and photo material references intact', () => {
  const { garment, bodyRoot, geometry, material, mesh } = fixture();
  const receipt = attachPhotographedFitReceipt60(garment, bodyRoot);
  assert.equal(receipt.meshes[0].geometry, geometry);
  assert.equal(receipt.meshes[0].material, material);
  assert.equal(receipt.meshes[0], mesh);
  assert.equal(receipt.stats.photoAnatomicalFit60, true);
  assert.equal(receipt.stats.photoAnatomicalFitGeometryUnchanged60, true);
  assert.equal(receipt.stats.photoAnatomicalFitReceipt60.accepted, true);
  assert.equal(receipt.stats.releaseAuthorized, false);
});
