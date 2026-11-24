import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {profileRearDepth89 as profile,buildCategorySourceVolume89 as build} from '../research/parallel89/category-source-volume89.mjs';
import {buildAutomaticSourceVolume89 as baseline} from '../research/parallel89/automatic-source-volume89.mjs';
const sha=a=>createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const reg=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
const ids=['commons-0001','commons-0003','commons-0016','commons-0023','commons-0041','commons-0053'];
function grid(w,h){
 const p=[],idx=[];
 for(let y=0;y<=h;y++)for(let x=0;x<=w;x++)p.push(x*.01,y*.01,0);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=y*(w+1)+x,b=a+1,c=a+w+1,d=c+1;idx.push(a,b,d,a,d,c)}
 return {positions:new Float32Array(p),indices:new Uint32Array(idx)};
}
test('narrow regions shallower than broad interiors; category hypotheses differ',()=>{
 const narrow=profile({category:'shirt',...grid(2,10)}),broad=profile({category:'shirt',...grid(10,10)}),jeans=profile({category:'jeans',...grid(10,10)});
 assert.ok(Math.max(...narrow.depths)<Math.max(...broad.depths));
 assert.notDeepEqual(broad.depths,jeans.depths);
 assert.ok(broad.depths.every((d,i)=>broad.hops[i]!==0||Math.abs(d-.02)<1e-7));
 assert.throws(()=>profile({category:'unknown',...grid(10,10)}));
});
test('six genuine photographs retain identical source plane and closed topology with bounded variable inferred depth',async()=>{
 let changed=0;
 for(const id of ids){
  const originalBytes=readFileSync(new URL('../benchmark/fixtures/'+id+'.jpg',import.meta.url)),before=sha(originalBytes),args={sourceId:id,originalBytes,lockedRecord:reg.find(r=>r.id===id)};
  const a=await baseline(args),r=await build(args);
  assert.equal(a.status,'PROVISIONAL_SOURCE_VOLUME_RESEARCH_ONLY');assert.equal(r.status,'CATEGORY_DEPTH_HYPOTHESIS_RESEARCH_ONLY',id+': '+r.reason);
  assert.equal(r.originalSHA256,before);assert.equal(sha(originalBytes),before);
  assert.deepEqual(r.sourcePlane,a.sourcePlane);assert.deepEqual(r.topology.indices,a.topology.indices);
  const n=r.sourcePlane.positions.length/3,t=r.topology.positions,old=a.topology.positions;
  assert.deepEqual(t.slice(0,n*3),old.slice(0,n*3));assert.equal(r.topology.positionSHA256,sha(t));
  for(let i=n;i<2*n;i++){assert.equal(t[3*i],old[3*i]);assert.equal(t[3*i+1],old[3*i+1]);assert.ok(t[3*i+2]<=-.019999&&t[3*i+2]>=-(.02+r.depthHypothesis.cap+1e-6));}
  const [min,max]=r.dimensionlessDepthRange;if(max-min>1e-6)changed++;
  assert.deepEqual(r.inferredNeutral.positions,t);assert.equal(r.inferredNeutral.uv,undefined);assert.equal(r.inferredNeutral.textureRGBA,undefined);
  assert.equal(r.consumer3DAdmitted,false);assert.equal(r.physicalDepthMeasured,false);assert.equal(r.actualDepthRecovered,false);assert.equal(r.wearableFitProved,false);assert.equal(r.familyAlpha,'HOLD');
  let volume=0;
  for(let i=0;i<r.topology.indices.length;i+=3){const [u,v,w]=r.topology.indices.subarray(i,i+3),A=t.subarray(u*3,u*3+3),B=t.subarray(v*3,v*3+3),C=t.subarray(w*3,w*3+3);volume+=(A[0]*(B[1]*C[2]-B[2]*C[1])+A[1]*(B[2]*C[0]-B[0]*C[2])+A[2]*(B[0]*C[1]-B[1]*C[0]))/6;}
  assert.ok(volume>0);
  console.log('CATEGORY_DEPTH',id,JSON.stringify({category:r.category,min,max,volume,sourceTriangles:r.topology.sourceTriangles}));
 }
 assert.ok(changed>=3,'multiple genuine source hypotheses must vary in depth');
});
test('caller category, geometry and corrupt original rejected',async()=>{
 const sourceId=ids[0],originalBytes=readFileSync(new URL('../benchmark/fixtures/'+sourceId+'.jpg',import.meta.url)),lockedRecord=reg.find(r=>r.id===sourceId),a={sourceId,originalBytes,lockedRecord};
 const corrupt=Buffer.from(originalBytes);corrupt[70]^=1;
 for(const args of [{...a,category:'jeans'},{...a,depth:1},{...a,originalBytes:corrupt}]){const r=await build(args);assert.equal(r.status,'ORIGINAL_PHOTO_2D_REQUIRED');assert.equal(r.topology,undefined);}
});
