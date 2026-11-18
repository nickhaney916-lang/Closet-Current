/**
 * Synthetic-only contact receipt tests. Does not run actual licensed 3D
 * garments, does not certify continuous-motion cloth clearance or mobile UX.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotOriginalSkirtBvhContact89 as snapshot} from
  '../research/parallel89/source-contact-snapshot89.mjs';

const sourceProof = {
  trueOriginalSkirtTriangleIndexStable: true,
  trueOriginalBodyTriangleIndexStable: true,
  originalFaceSourceResolution: 'BVH_INDIRECT_RESOLVED_ORIGINAL_TRIANGLE_INDICES'
};
const contact = (pairs, depth = .001) => ({
  count: pairs.size, pairs, maxDepth: depth, ...sourceProof
});

test('reused mutable triangle Set does not rewrite an earlier pose receipt', () => {
  const recycled = new Set(['0|45','1|58']);
  const original = contact(recycled);
  const before = snapshot(original);
  recycled.delete('0|45');
  recycled.add('2|72');
  original.count = 2;
  original.maxDepth = .09;
  const after = snapshot(original);
  assert.deepEqual([...before.pairs],['0|45','1|58']);
  assert.deepEqual([...after.pairs],['1|58','2|72']);
  assert.equal(before.count,2);
  assert.equal(before.maxDepth,.001);
  assert.equal(after.maxDepth,.09);
  assert.equal([...after.pairs].filter(key=>!before.pairs.has(key)).length,1);
});

test('reused response object with a new Set cannot rewrite earlier evidence', () => {
  const raw = contact(new Set(['0|45']));
  const before = snapshot(raw);
  raw.pairs = new Set(['5|108']);
  raw.count = 1;
  const after = snapshot(raw);
  assert.deepEqual([...before.pairs],['0|45']);
  assert.deepEqual([...after.pairs],['5|108']);
});

test('fail closed on misleading counts, unverified face IDs or bad plane depth', () => {
  assert.equal(snapshot({...contact(new Set(['0|45'])),count:2}),null);
  assert.equal(snapshot({...contact(new Set(['0|45'])),maxDepth:NaN}),null);
  assert.equal(snapshot({...contact(new Set(['0|45'])),maxDepth:-1}),null);
  assert.equal(snapshot({...contact(new Set(['0|45'])),trueOriginalBodyTriangleIndexStable:false}),null);
  assert.equal(snapshot(contact(new Set(['00|45']))),null);
  assert.equal(snapshot(contact(new Set([1]))),null);
  assert.equal(snapshot(contact(new Set(['0|45.1']))),null);
});

test('empty authentic contact is preserved without inferring a 3D fit pass', () => {
  const sample=snapshot(contact(new Set(),0));
  assert.equal(sample.count,0);
  assert.equal(sample.pairs.size,0);
  assert.equal(Object.isFrozen(sample),true);
  assert.equal('consumer3DAdmitted' in sample,false);
});

test('rejects out-of-range original skirt and body face IDs across every pose', () => {
  const bounds={bodyFaceCount:1100};
  assert.equal(snapshot(contact(new Set(['575|1099'])),bounds).count,1);
  assert.equal(snapshot(contact(new Set(['576|45'])),bounds),null);
  assert.equal(snapshot(contact(new Set(['0|1100'])),bounds),null);
  assert.equal(snapshot(contact(new Set(['0|9007199254740993'])),bounds),null);
  assert.equal(snapshot(contact(new Set(['0|45'])),{bodyFaceCount:999}),null);
  assert.equal(snapshot(contact(new Set(['0|45'])),{bodyFaceCount:NaN}),null);
});
