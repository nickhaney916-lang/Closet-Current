import test,{after as afterTests} from 'node:test';
import assert from 'node:assert/strict';import * as T from 'three';
import {mkdir,writeFile} from 'node:fs/promises';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact,posedGeometry} from '../research/three-d-42/posed-contact.mjs';
import {shapePosedSleeveEase} from '../research/three-d-56/pose-conditioned-sleeves.mjs';
import {crossings,denim} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
const records=[];afterTests(async()=>{await mkdir('benchmark/three-d-56',{recursive:true});await writeFile('benchmark/three-d-56/collision-seam-audit.json',JSON.stringify({records,continuousMotionCertified:false,signedContainmentCertified:false,humanApproved:false,releaseAuthorized:false},null,2));});
const collect=r=>{const out={body:[],shirt:[],pants:[]};r.updateMatrixWorld(true);r.traverse(m=>{if(m.isSkinnedMesh)out[m.userData.work56Garment?(m.userData.work60Pants?'pants':'shirt'):'body'].push(m);});return out;};
const point=(m,i,posed=false)=>{const q=new T.Vector3().fromBufferAttribute(m.geometry.attributes.position,i);if(posed){m.skeleton.update();m.applyBoneTransform(i,q);}return q.applyMatrix4(m.matrixWorld);};
const key=q=>q.toArray().map(x=>x.toFixed(5)).join(':');
const snapshot=ms=>ms.map(m=>({name:m.name,index:m.geometry.index?.array.slice()||null,attrs:Object.fromEntries(Object.entries(m.geometry.attributes).map(([n,a])=>[n,a.array.slice()]))}));
function seams(ms,cuffs=false){const shells=new Map(),out=[];for(const [j,m] of ms.entries())if(m.name==='Work56-independent-shirt-shell')for(const i of new Set(m.geometry.index.array)){const k=key(point(m,i));if(!shells.has(k))shells.set(k,[]);shells.get(k).push([j,i]);}for(const [j,m] of ms.entries())if(cuffs?/inner-cuff/.test(m.name):m.userData.work45IndependentShoulderCap)for(const i of new Set(m.geometry.index?m.geometry.index.array:Array.from({length:m.geometry.attributes.position.count},(_,i)=>i)))for(const [s,si] of shells.get(key(point(m,i)))||[])out.push({cap:j,ci:i,shell:s,si,side:cuffs?(point(m,i).x>0?'L':'R'):m.userData.work45IndependentShoulderCap});return out;}
for(const kind of ['female','male'])for(const src of [A,B])test('3D56 real posed sleeve drape '+kind+'/'+src.id,async()=>{
 const br=await person(kind),ar=await person(kind),common={poseContactFactory:createPoseContact,jeansPanelFall:true,independentGarments:true,tailoredShoulderSleeves:true,independentShoulderCaps:true,realisticShoulderContour:true,upperArmFabricVolume:true,sourceNeutralCollarRoll:true,rearShirtFabricRelief:true,naturalShoulderSleeveTransition:true,sourceMeasuredSleeveHang:true};
 const baseline=createOutfitController(br,common),after=createOutfitController(ar,{...common,poseConditionedSleeveDrape:true});
 try{
  baseline.setPose('source');after.setPose('source');const opt={reviewed:true,pantsCandidate:denim(src),pantsReviewed:true};baseline.setOutfit('shirt-pants',candidate('shirt'),opt);after.setOutfit('shirt-pants',candidate('shirt'),opt);
  const b=collect(br),a=collect(ar),bs=snapshot(b.shirt),as=snapshot(a.shirt);
  assert.deepEqual(snapshot(a.body),snapshot(b.body),'Original anatomical geometry/attributes unchanged');assert.deepEqual(snapshot(a.pants),snapshot(b.pants),'Both real licensed jeans unchanged');
  for(let j=0;j<bs.length;j++){assert.equal(bs[j].name,as[j].name);assert.deepEqual(bs[j].index,as[j].index);for(const [n,values] of Object.entries(bs[j].attrs))if(n!=='position'&&n!=='normal')assert.deepEqual(as[j].attrs[n],values,'Original source/UV/skin '+n);}
  const witnesses=seams(b.shirt),counts={L:0,R:0};for(const w of witnesses)counts[w.side]++;assert.ok(counts.L>=3&&counts.R>=3);
  const cuffs=seams(b.shirt,true),cuffCounts={L:0,R:0};for(const w of cuffs)cuffCounts[w.side]++;assert.ok(cuffCounts.L>=3&&cuffCounts.R>=3,'Real bilateral indexed cuff/shell witnesses required');
  const seen=new Map(),responses=[];
  for(const pose of ['source','blend-25','blend-50','blend-75','relaxed','blend-50','source']){
   const s=after.setPose(pose),ease=s.shirt.poseConditionedSleeveDrape;assert.equal(ease.pose,pose);assert.equal(ease.sourceRebuilt,true);assert.ok(ease.maximum>.002&&ease.maximum<=.01501);assert.equal(s.shirt.poseTriangleContact.after.count,0);
   for(const side of ['L','R'])assert.ok(ease.sides[side].elbow>=8&&ease.sides[side].forearm>=8);
   let maximumGap=0;for(const w of witnesses){const gap=point(a.shirt[w.cap],w.ci,true).distanceTo(point(a.shirt[w.shell],w.si,true));assert.ok(Number.isFinite(gap)&&gap<=5e-5,'Real posed bilateral seam '+JSON.stringify({pose,...w,gap}));maximumGap=Math.max(maximumGap,gap);const normal=(m,i)=>new T.Vector3().fromBufferAttribute(m.geometry.attributes.normal,i).applyMatrix3(new T.Matrix3().getNormalMatrix(m.matrixWorld)).normalize();assert.ok(normal(a.shirt[w.cap],w.ci).distanceTo(normal(a.shirt[w.shell],w.si))<1e-4,'Cap/sleeve seam shading must match after every pose solve');}
   let maximumCuffGap=0;for(const w of cuffs){const gap=point(a.shirt[w.cap],w.ci,true).distanceTo(point(a.shirt[w.shell],w.si,true));assert.ok(Number.isFinite(gap)&&gap<=5e-5,'Actual posed wrist cuff seam '+JSON.stringify({pose,...w,gap}));maximumCuffGap=Math.max(maximumCuffGap,gap);}
   const positions=a.shirt.map(m=>m.geometry.attributes.position.array.slice());if(seen.has(pose))assert.deepEqual(positions,seen.get(pose),'Return pose cannot accumulate drape or drift');else seen.set(pose,positions);
   const g=Object.fromEntries(Object.entries(a).map(([k,ms])=>[k,posedGeometry(ms).g]));try{const shirtBody=crossings(g.shirt,g.body),pantsBody=crossings(g.pants,g.body),shirtJeans=crossings(g.shirt,g.pants);for(const result of [shirtBody,pantsBody,shirtJeans])assert.equal(result.crossingTrianglePairs,0,'Actual posed cloth crossing '+kind+'/'+src.id+'/'+pose);records.push({kind,source:src.id,pose,maximumGap,maximumCuffGap,seamWitnesses:counts,cuffWitnesses:cuffCounts,shirtBody,pantsBody,shirtJeans,ease});}finally{Object.values(g).forEach(x=>x.dispose());}
   responses.push(ease.axes.L.horizontal);
  }
  assert.ok(Math.max(...responses)-Math.min(...responses)>.01,'Fold response must follow real changing arm orientation');
  // Same-rig operator isolation: inspect actual world displacement, including
  // protected center photograph, cap and cuff arrays, independent of solver.
  const before=snapshot(b.shirt),world=b.shirt.map(m=>Array.from({length:m.geometry.attributes.position.count},(_,i)=>point(m,i,true)));
  shapePosedSleeveEase(br,{meshes:b.shirt,stats:baseline.getState().shirt});let moved=0,max=0;
  for(const [j,m] of b.shirt.entries())for(let i=0;i<m.geometry.attributes.position.count;i++){
   const distance=world[j][i].distanceTo(point(m,i,true));assert.ok(Number.isFinite(distance)&&distance<=.01502);max=Math.max(max,distance);if(distance>.0001)moved++;
   const originalRest=new T.Vector3(...before[j].attrs.position.slice(i*3,i*3+3)).applyMatrix4(m.matrixWorld);
   if(Math.abs(originalRest.x)<.31||m.name!=='Work56-independent-shirt-shell')assert.ok(distance<1e-6,'Photo center, independent shoulder caps, collar and cuff components pinned');
  }
  const isolated=snapshot(b.shirt);for(let j=0;j<before.length;j++)for(const [n,values] of Object.entries(before[j].attrs))if(n!=='position'&&n!=='normal')assert.deepEqual(isolated[j].attrs[n],values);
  assert.ok(moved>=50&&max>.002);console.log('THREE_D56_TRUE_POSED_CLOTH',JSON.stringify({kind,source:src.id,moved,max,counts,poseRecords:7,axesRange:Math.max(...responses)-Math.min(...responses)}));
 }finally{baseline.dispose();after.dispose();}
});
