import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {trialCategoryRigAlignment89 as trial} from '../research/parallel89/category-rig-alignment89.mjs';
import {buildCategorySourceVolume89 as source} from '../research/parallel89/category-source-volume89.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const donor=resolve(process.argv[2]??'.');
assert.notEqual(donor,resolve('.'));
const reg=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
const ids=['commons-0001','commons-0003','commons-0016','commons-0023','commons-0041','commons-0053'];
const hashes={female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'};
const rigs=Object.fromEntries(Object.keys(hashes).map(kind=>[kind,readFileSync(resolve(donor,'research/three-d-06/models',kind+'-cc0-rigged.glb'))]));
const rows=[];
for(const id of ids){
 const originalBytes=readFileSync(new URL('../benchmark/fixtures/'+id+'.jpg',import.meta.url)),before=sha(originalBytes),args={sourceId:id,originalBytes,lockedRecord:reg.find(x=>x.id===id)};
 const baseline=await source(args);assert.equal(baseline.status,'CATEGORY_DEPTH_HYPOTHESIS_RESEARCH_ONLY');
 for(const [rigKind,rigBytes] of Object.entries(rigs)){
  assert.equal(sha(rigBytes),hashes[rigKind]);
  const r=await trial({...args,rigKind,rigBytes});
  assert.equal(r.status,'LICENSED_RIG_LANDMARK_PLACEMENT_TRIAL_ONLY',id+': '+rigKind+': '+r.reason);
  assert.equal(r.rig.boneCount,163);assert.equal(r.rig.sha256,hashes[rigKind]);assert.equal(r.originalSHA256,before);
  assert.deepEqual(r.sourceVolume.sourcePlane,baseline.sourcePlane);assert.deepEqual(r.sourceVolume.topology,baseline.topology);
  assert.deepEqual(r.sourceVolume.inferredNeutral,baseline.inferredNeutral);
  const p=r.sourceVolume.sourcePlane.positions,{scale,translation,assumedRelativeHeight,assumedBottomOffset}=r.placement;
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(let i=0;i<p.length;i+=3){const x=p[i]*scale+translation[0],y=p[i+1]*scale+translation[1];minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
  assert.ok(Math.abs((minX+maxX)/2-r.rig.anchor[0])<1e-9);
  assert.ok(Math.abs(maxY-minY-r.rig.span*assumedRelativeHeight)<1e-9);
  assert.ok(Math.abs(minY-r.rig.anchor[1]-r.rig.span*assumedBottomOffset)<1e-9);
  assert.equal(r.physicalFitProved,false);assert.equal(r.skinBindingProved,false);assert.equal(r.bodyMeshContactProved,false);assert.equal(r.consumer3DAdmitted,false);
  assert.equal(r.familyAlpha,'HOLD');assert.equal(sha(rigBytes),hashes[rigKind]);assert.equal(sha(originalBytes),before);
  rows.push({id,rigKind,rigSHA:r.rig.sha256,sourceSHA:before,category:r.category,bones:r.rig.boneCount,scale,anchorName:r.placement.anchorName,sourcePlaneUnchanged:true,physicalFitProved:false});
 }
}
const sourceId=ids[0],originalBytes=readFileSync(new URL('../benchmark/fixtures/'+sourceId+'.jpg',import.meta.url)),lockedRecord=reg.find(x=>x.id===sourceId),base={sourceId,originalBytes,lockedRecord,rigKind:'female',rigBytes:rigs.female};
const bad=Buffer.from(rigs.female);bad[70]^=1;
for(const args of [{...base,rigBytes:bad},{...base,rigBytes:rigs.male},{...base,scale:1},{...base,sourceId:ids[1]}]){
 const r=await trial(args);assert.equal(r.status,'ORIGINAL_PHOTO_2D_REQUIRED');assert.equal(r.sourceVolume,undefined);assert.equal(r.consumer3DAdmitted,false);
}
assert.equal(rows.length,12);
const report={rows,realRigBytesVerified:true,restJointHierarchyOnly:true,consumer3DAdmitted:false,familyAlpha:'HOLD'};
mkdirSync('benchmark/m2-category-rig-placement-HOLD',{recursive:true});writeFileSync('benchmark/m2-category-rig-placement-HOLD/receipt.json',JSON.stringify(report,null,2));console.log('M2_CATEGORY_RIG_PLACEMENT '+JSON.stringify(report));
