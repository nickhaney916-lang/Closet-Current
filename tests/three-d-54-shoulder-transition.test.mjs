/** Independent original-rig/source integrity, indexed sewn seams in EVERY
 * sampled pose, and actual BVH garment/body + garment/garment checks. */
import test,{after as afterTests} from 'node:test';
import {mkdir,writeFile} from 'node:fs/promises';
import {roundShoulderSleeveTransition} from '../research/three-d-54/shoulder-sleeve-transition.mjs';import assert from 'node:assert/strict';import * as T from 'three';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact,posedGeometry} from '../research/three-d-42/posed-contact.mjs';
import {crossings,denim} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
const audit=[];afterTests(async()=>{await mkdir('benchmark/three-d-54',{recursive:true});await writeFile('benchmark/three-d-54/collision-seam-audit.json',JSON.stringify({records:audit,continuousMotionCertified:false,signedContainmentCertified:false,humanApproved:false,releaseAuthorized:false},null,2));});
const point=(m,i,posed=false)=>{const q=new T.Vector3().fromBufferAttribute(m.geometry.attributes.position,i);if(posed){m.skeleton.update();m.applyBoneTransform(i,q);}return q.applyMatrix4(m.matrixWorld);};
const key=q=>q.toArray().map(v=>v.toFixed(5)).join(':');
const meshes=r=>{const out={body:[],shirt:[],pants:[]};r.updateMatrixWorld(true);r.traverse(m=>{if(m.isSkinnedMesh)out[m.userData.work56Garment?(m.userData.work60Pants?'pants':'shirt'):'body'].push(m);});return out;};
function witnesses(list){const shells=new Map(),out=[];for(const [id,m] of list.entries())if(m.name==='Work56-independent-shirt-shell')for(const i of new Set(m.geometry.index.array)){const k=key(point(m,i));if(!shells.has(k))shells.set(k,[]);shells.get(k).push({id,i});}for(const [id,m] of list.entries())if(m.userData.work45IndependentShoulderCap)for(const i of new Set(m.geometry.index.array))for(const s of shells.get(key(point(m,i)))||[])out.push({cap:id,ci:i,shell:s.id,si:s.i,side:m.userData.work45IndependentShoulderCap});return out;}
const snapshot=list=>list.map(m=>({name:m.name,index:m.geometry.index?.array.slice()||null,attributes:Object.fromEntries(Object.entries(m.geometry.attributes).map(([k,a])=>[k,a.array.slice()]))}));
for(const kind of ['female','male'])for(const src of [A,B])test('3D54 original photo shoulder transition '+kind+'/'+src.id,async()=>{
 const br=await person(kind),ar=await person(kind);const common={poseContactFactory:createPoseContact,jeansPanelFall:true,independentGarments:true,tailoredShoulderSleeves:true,independentShoulderCaps:true,realisticShoulderContour:true,upperArmFabricVolume:true,sourceNeutralCollarRoll:true,rearShirtFabricRelief:true};
 const baseline=createOutfitController(br,common),after=createOutfitController(ar,{...common,shoulderSleeveTransition:true});
 try{
  baseline.setPose('source');after.setPose('source');const options={reviewed:true,pantsCandidate:denim(src),pantsReviewed:true};baseline.setOutfit('shirt-pants',candidate('shirt'),options);const state=after.setOutfit('shirt-pants',candidate('shirt'),options);
  assert.equal(state.shirt.roundedShoulderSleeveTransition,true);assert.ok(state.shirt.shoulder54MaxMove>.002&&state.shirt.shoulder54MaxMove<=.02801);assert.equal(state.pants.sourceSHA256,src.originalSHA256);
  const b=meshes(br),a=meshes(ar),snap=snapshot(b.shirt),actual=snapshot(a.shirt);assert.equal(a.shirt.length,b.shirt.length);
  assert.deepEqual(snapshot(a.body),snapshot(b.body),'Original anatomy must remain exactly unchanged');assert.deepEqual(snapshot(a.pants),snapshot(b.pants),'Independent original denim must remain exactly unchanged');
  let moved=0;for(let j=0;j<snap.length;j++){assert.equal(snap[j].name,actual[j].name);assert.deepEqual(snap[j].index,actual[j].index);for(const [name,values] of Object.entries(snap[j].attributes))if(name!=='position'&&name!=='normal')assert.deepEqual(actual[j].attributes[name],values,'Original source/UV/rig attribute '+name);for(let i=0;i<a.shirt[j].geometry.attributes.position.count;i++)if(point(a.shirt[j],i).distanceTo(point(b.shirt[j],i))>1e-5)moved++;}assert.ok(moved>=50,'Substantive actual rendered geometry must change');
  const sewn=witnesses(b.shirt),counts={L:0,R:0};for(const w of sewn)counts[w.side]++;assert.ok(counts.L>=3&&counts.R>=3,'Independent rendered cross-mesh seam witnesses required on BOTH sleeves');
  const records=[];for(const pose of ['source','blend-25','blend-50','blend-75','relaxed','blend-50','source']){
   const s=after.setPose(pose);assert.equal(s.shirt.poseTriangleContact.after.count,0);let maximumGap=0;
   for(const w of sewn){const gap=point(a.shirt[w.cap],w.ci,true).distanceTo(point(a.shirt[w.shell],w.si,true));assert.ok(Number.isFinite(gap)&&gap<=5e-5,'Actual posed L/R sewn seam separated '+JSON.stringify({pose,...w,gap}));maximumGap=Math.max(maximumGap,gap);
    const normal=(m,i)=>new T.Vector3().fromBufferAttribute(m.geometry.attributes.normal,i).applyMatrix3(new T.Matrix3().getNormalMatrix(m.matrixWorld)).normalize();
    assert.ok(normal(a.shirt[w.cap],w.ci).distanceTo(normal(a.shirt[w.shell],w.si))<1e-4,'Actual shared cap/shell shading must be continuous on '+w.side+'/'+pose);}
   const gg=Object.fromEntries(Object.entries(a).map(([k,m])=>[k,posedGeometry(m).g]));try{const shirtBody=crossings(gg.shirt,gg.body),pantsBody=crossings(gg.pants,gg.body),shirtJeans=crossings(gg.shirt,gg.pants);for(const result of [shirtBody,pantsBody,shirtJeans])assert.equal(result.crossingTrianglePairs,0,'True posed garment triangle crossing '+kind+'/'+src.id+'/'+pose);records.push({pose,shirtBody,pantsBody,shirtJeans,maximumGap});}finally{Object.values(gg).forEach(g=>g.dispose());}
  }
  // Isolate the construction on the SAME original fitted rig: no independently
  // different contact correction may mask an out-of-domain or oversized edit.
  const isolatedBefore=snapshot(b.shirt),worldBefore=b.shirt.map(m=>Array.from({length:m.geometry.attributes.position.count},(_,i)=>point(m,i)));
  roundShoulderSleeveTransition({meshes:b.shirt,stats:baseline.getState().shirt},br);
  let isolatedMoved=0,isolatedMax=0;
  for(const [j,m] of b.shirt.entries())for(let i=0;i<m.geometry.attributes.position.count;i++){
   const distance=worldBefore[j][i].distanceTo(point(m,i));assert.ok(Number.isFinite(distance)&&distance<=.02802,'Actual isolated garment displacement must be finite and <=28mm');
   isolatedMax=Math.max(isolatedMax,distance);if(distance>1e-6)isolatedMoved++;
   if(Math.abs(worldBefore[j][i].x)<=.145||m.name==='Work59-source-neutral-collar-band')assert.ok(distance<1e-6,'Original central photo and neckline must remain anchored');
  }
  const isolatedAfter=snapshot(b.shirt);for(let j=0;j<isolatedBefore.length;j++)for(const [name,values] of Object.entries(isolatedBefore[j].attributes))if(name!=='position'&&name!=='normal')assert.deepEqual(isolatedAfter[j].attributes[name],values,'Isolated original source/UV/weights '+name);
  assert.ok(isolatedMoved>=50&&isolatedMax>=.002);
  audit.push(...records.map(r=>({kind,source:src.id,...r,seamWitnesses:counts})));
  console.log('THREE_D54_REAL_SOURCE_AUDIT',JSON.stringify({kind,source:src.id,moved,seams:counts,sampledPoses:records.length,isolatedMoved,isolatedMax,continuousMotionCertified:false,humanApproved:false}));
 }finally{baseline.dispose();after.dispose();}
});
