import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectAlphaEdges} from '../benchmark/inspect-alpha-edges.mjs';
test('counts uncertainty at the sides and bottom without changing the mask',()=>{
 const original=Uint8Array.from([
  100,0,0,100,
  0,255,255,0,
  0,0,0,180,
  255,0,0,180
 ]);
 const before=[...original];
 const result=inspectAlphaEdges(original,4,4,{sideFraction:0.25,bottomFraction:0.25});
 assert.equal(result.regions.left.uncertain,1);
 assert.equal(result.regions.right.uncertain,2);
 assert.equal(result.regions.bottom.uncertain,1);
 assert.equal(result.regions.interior.opaque,2);
 assert.equal(result.reviewOnly,true);
 assert.equal(result.shadowPixelsRemoved,0);
 assert.deepEqual([...original],before);
});
test('rejects invalid geometry and alpha values',()=>{
 assert.throws(()=>inspectAlphaEdges([0],2,2),/Invalid/);
 assert.throws(()=>inspectAlphaEdges([256],1,1),/bytes/);
});
