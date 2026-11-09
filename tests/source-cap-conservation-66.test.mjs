import test from 'node:test';
import assert from 'node:assert/strict';
import {partitionSourceCapFaces66} from '../research/real-garment-acceptance-66/cap-partition.mjs';
const faces=(n,start=0)=>Array.from({length:n},(_,i)=>({at:(start+i)*3}));
test('P66 preserves sparse source shoulder panels rather than creating holes',()=>{
 const r=partitionSourceCapFaces66(new Map([['L',faces(19)],['R',faces(20,19)]]));
 assert.equal(r.originalFacesRetained,19);assert.equal(r.rebuiltFaces,20);
 assert.equal(r.sourceSelectedFaces,39);
 assert.deepEqual([...r.retained],faces(19).map(f=>f.at));
 assert.equal([...r.excluded].some(at=>r.retained.has(at)),false);
});
test('P66 conserves every original selected triangle across multiple sparse and full shell panels',()=>{
 let selected=0,retained=0,rebuilt=0;
 for(const counts of [[3,7],[20,40],[1,30],[0,0],[19,19]]){
  const r=partitionSourceCapFaces66(new Map([['L',faces(counts[0])],['R',faces(counts[1],counts[0])]]));
  assert.equal(r.originalFacesRetained+r.rebuiltFaces,counts[0]+counts[1]);
  selected+=r.sourceSelectedFaces;retained+=r.originalFacesRetained;rebuilt+=r.rebuiltFaces;
 }
 assert.equal(selected,retained+rebuilt);assert.ok(retained>0&&rebuilt>0);
});
test('P66 rejects duplicated source triangles and malformed partitions',()=>{
 for(const chosen of [null,new Map([['L',faces(2)],['R',faces(2)]]),new Map([['X',faces(2)]]),new Map([['L',[{at:1}]]])])
  assert.throws(()=>partitionSourceCapFaces66(chosen),/P66/);
});
