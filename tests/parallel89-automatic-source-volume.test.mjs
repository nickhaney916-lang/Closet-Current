import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildAutomaticSourceVolume89 as build} from '../research/parallel89/automatic-source-volume89.mjs';
import {buildPhotoDerivedResearchMesh89 as plane} from '../research/parallel89/source-photo-to-mesh89.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const registry=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
const ids=['commons-0001','commons-0003','commons-0016','commons-0023','commons-0041','commons-0053'];
const input=id=>({sourceId:id,originalBytes:readFileSync(new URL('../benchmark/fixtures/'+id+'.jpg',import.meta.url)),lockedRecord:registry.find(r=>r.id===id)});
test('six original source photographs: closed indexed volume with unchanged source plane and separate neutral surfaces',async()=>{
 let count=0;
 for(const id of ids){
  const a=input(id),before=sha(a.originalBytes),p=await plane(a),r=await build(a);
  assert.equal(r.originalSHA256,before);assert.equal(sha(a.originalBytes),before);
  assert.equal(r.consumer3DAdmitted,false);assert.equal(r.physicalDepthMeasured,false);assert.equal(r.familyAlpha,'HOLD');
  if(p.status==='ORIGINAL_PHOTO_2D_REQUIRED'){assert.equal(r.status,p.status);assert.equal(r.topology,undefined);continue}
  assert.equal(r.status,'PROVISIONAL_SOURCE_VOLUME_RESEARCH_ONLY',id+': '+r.reason);count++;
  const f=r.sourcePlane,t=r.topology,m=p.mesh,n=f.positions.length/3,depth=r.dimensionlessTrialDepth;
  assert.deepEqual(f.positions,m.positions);assert.deepEqual(f.uv,m.uv);assert.deepEqual(f.indices,m.indices);
  assert.deepEqual(f.textureRGBA,m.textureRGBA);assert.equal(f.textureSHA256,m.textureSHA256);assert.equal(r.sourceMaskSHA256,p.maskSHA256);
  assert.equal(r.inferredNeutral.uv,undefined);assert.equal(r.inferredNeutral.textureRGBA,undefined);assert.equal(r.inferredNeutral.photoTextureAllowed,false);
  assert.equal(r.sourceViewIndependentlyVerified,false);assert.equal(r.wearableFitProved,false);assert.equal(r.bodyCollisionProved,false);
  assert.equal(t.positions.length,6*n);assert.deepEqual(t.positions.slice(0,3*n),f.positions);assert.deepEqual(t.indices.slice(0,f.indices.length),f.indices);
  assert.deepEqual(r.inferredNeutral.indices,t.indices.slice(f.indices.length));assert.deepEqual(r.inferredNeutral.positions,t.positions);
  const edges=new Map();
  let signedVolume=0,area=0;
  for(let i=0;i<t.indices.length;i+=3){
   const [u,v,w]=t.indices.subarray(i,i+3);assert.ok(u<2*n&&v<2*n&&w<2*n);
   for(const [a,b] of [[u,v],[v,w],[w,u]]){
    const k=a<b?a+':'+b:b+':'+a,entry=edges.get(k)||[0,0];entry[0]++;entry[1]+=a<b?1:-1;edges.set(k,entry);
   }
   const A=t.positions.subarray(3*u,3*u+3),B=t.positions.subarray(3*v,3*v+3),C=t.positions.subarray(3*w,3*w+3);
   signedVolume+=(A[0]*(B[1]*C[2]-B[2]*C[1])+A[1]*(B[2]*C[0]-B[0]*C[2])+A[2]*(B[0]*C[1]-B[1]*C[0]))/6;
   if(i<f.indices.length)area+=((B[0]-A[0])*(C[1]-A[1])-(B[1]-A[1])*(C[0]-A[0]))/2;
  }
  for(const [number,orientation] of edges.values()){assert.equal(number,2);assert.equal(orientation,0)}
  assert.ok(area>0&&signedVolume>0);assert.ok(Math.abs(signedVolume-area*depth)<1e-6);
  assert.equal(t.indices.length/3,t.sourceTriangles+t.inferredRearTriangles+t.inferredSideTriangles);
  console.log('SOURCE_VOLUME',id,JSON.stringify({sourceTriangles:t.sourceTriangles,rearTriangles:t.inferredRearTriangles,sideTriangles:t.inferredSideTriangles,dimensionlessVolume:signedVolume}));
 }
 assert.equal(count,6,'all six prior original source planes must produce a provisional closed indexed volume');
});
test('altered original and caller geometry or depth cannot be admitted',async()=>{
 const a=input(ids[0]),bytes=Buffer.from(a.originalBytes);bytes[70]^=1;
 for(const args of [{...a,originalBytes:bytes},{...a,depth:10},{...a,positions:new Float32Array(9)},{...a,sourceId:ids[1]}]){
  const r=await build(args);assert.equal(r.status,'ORIGINAL_PHOTO_2D_REQUIRED');assert.equal(r.topology,undefined);assert.equal(r.consumer3DAdmitted,false);assert.equal(r.familyAlpha,'HOLD');
 }
});
