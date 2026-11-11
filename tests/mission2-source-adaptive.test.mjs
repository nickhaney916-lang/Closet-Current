import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {fitSourceLength,planNoNewContactSourceLength,applyNoNewContactSourceLength}
 from '../research/mission2-source-length/source-length.mjs';

const SHA='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const profile={accepted:true,sourceSHA256:SHA,cutoutSHA256:'a'.repeat(64),
 inferredBack:true,releaseAuthorized:false,silhouetteAspect:.8534,
 bands:[.44,.74,.92,.89,.78,.86,.95,.67]};
function fixture(obstacleHeight=null,{torsoMode='plane'}={}){
 const root=new THREE.Group(),bones=Array.from({length:163},()=>new THREE.Bone());
 root.add(...bones);const skeleton=new THREE.Skeleton(bones);
 function skinned(g,role){
  const n=g.getAttribute('position').count,ix=new Uint16Array(n*4),w=new Float32Array(n*4);
  for(let i=0;i<n;i++)w[i*4]=1;
  g.setAttribute('skinIndex',new THREE.BufferAttribute(ix,4));
  g.setAttribute('skinWeight',new THREE.BufferAttribute(w,4));
  const m=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());m.bind(skeleton);
  if(role==='body')m.name='actual-body';
  else{m.userData.work56Garment=true;
   if(role==='torso')m.name='Work56-independent-shirt-shell';
   else m.userData.work45IndependentShoulderCap=role;}
  root.add(m);return m;
 }
 const body=new THREE.CylinderGeometry(.15,.15,1,32,20,true);body.translate(0,1.05,0);
 skinned(body,'body');
 if(obstacleHeight!==null){
  const g=new THREE.BoxGeometry(.6,.12,.35);g.translate(0,obstacleHeight,.2);
  skinned(g,'body');
 }
 const torso=torsoMode==='cylinder'
  ?new THREE.CylinderGeometry(.23,.23,.57,32,20,true)
  :new THREE.PlaneGeometry(.46,.57,20,20);
 torso.translate(0,1.365,torsoMode==='cylinder'?0:.25);
 const cap=(x)=>{const g=new THREE.CylinderGeometry(.04,.04,.2,24,6,true);g.translate(x,1.45,0);return g;};
 const meshes=[skinned(torso,'torso'),skinned(cap(-.45),'L'),skinned(cap(.45),'R')];
 for(const m of meshes)m.geometry.setAttribute('panelPosition',
  m.geometry.getAttribute('position').clone());
 const shirt={meshes,stats:{sourceSHA256:SHA,cutoutSHA256:profile.cutoutSHA256,
  ownerAlphaMaskBasedPhysicalGeometry190:true,
  ownerPhysicalBilateralReadbackVerified196:true,envelope:{center:0}}};
 const positions=meshes.map(m=>m.geometry.getAttribute('position').array.slice());
 const panels=meshes.map(m=>m.geometry.getAttribute('panelPosition').array.slice());
 const weights=meshes.map(m=>m.geometry.getAttribute('skinWeight').array.slice());
 return {root,shirt,positions,panels,weights,
  assertOriginal(){
   meshes.forEach((m,i)=>{
    assert.deepEqual(m.geometry.getAttribute('position').array,positions[i]);
    assert.deepEqual(m.geometry.getAttribute('panelPosition').array,panels[i]);
    assert.deepEqual(m.geometry.getAttribute('skinWeight').array,weights[i]);
   });
  }};
}

test('dry-run sampled extension scales are truly immutable before contact gate',()=>{
 const fx=fixture();
 for(const scale of [1,.75,.5,.25]){
  const result=fitSourceLength(fx.shirt,fx.root,profile,
   {extensionScale:scale,traceTriangleContacts:true,traceGarmentPartContacts:true,traceSelfContacts:true,previewOnly:true});
  assert.equal(result.stats.sourceLengthFit,false);
  assert.equal(result.stats.sourceLengthDryRun,true);
  assert.equal(result.stats.sourceLengthExtensionScale,scale);
  assert.equal(result.stats.sourceLengthNewTriangleContacts,0);
  assert.equal(result.stats.sourceLengthNewGarmentPartContacts,0);
  assert.equal(result.stats.sourceLengthNewIntrapanelContacts,0);
  assert.ok(result.stats.sourceLengthNewHemY<result.stats.sourceLengthOldHemY-.07);
  fx.assertOriginal();
 }
 for(const extensionScale of [0,.2,1.01,NaN])
  assert.throws(()=>fitSourceLength(fx.shirt,fx.root,profile,
   {extensionScale,previewOnly:true}),/bounded extension scale/);
 fx.assertOriginal();
});

test('adaptive 163-bone real triangles select a reduced length, then atomically commit only an accepted candidate',()=>{
 const fx=fixture(.82);
 const decision=planNoNewContactSourceLength(fx.shirt,fx.root,profile);
 assert.equal(decision.accepted,true,JSON.stringify(decision));
 assert.ok(decision.selectedScale<1,'Full extension crosses added body geometry');
 assert.ok(decision.selectedScale>=.25);
 assert.ok(decision.attempts.length>=2);
 assert.ok(decision.attempts.some(x=>x.newlyIntersecting>0||/new posed body intersection pairs/.test(x.error||'')),
  'Reproduce a full extension rejected by either the original body-pair gate or exact triangle gate');
 assert.equal(decision.attempts.at(-1).newlyIntersecting,0);
 assert.equal(decision.attempts.at(-1).newlyIntersectingGarmentParts,0);
 assert.equal(decision.attempts.at(-1).newlyIntersectingIntrapanel,0);
 assert.equal(decision.noNewContactAtOnePose,true);
 assert.equal(decision.existingIntersectionsUnresolved,true);
 fx.assertOriginal();
 const fitted=applyNoNewContactSourceLength(fx.shirt,fx.root,profile);
 assert.equal(fitted.stats.sourceLengthAdaptiveOnePoseNonregression,true);
 assert.equal(fitted.stats.sourceLengthTriangleContactStrictlyAccepted,true);
 assert.equal(fitted.stats.sourceLengthGarmentPartContactStrictlyAccepted,true);
 assert.equal(fitted.stats.sourceLengthAdaptiveGarmentPartNonregression,true);
 assert.equal(fitted.stats.sourceLengthNewGarmentPartContacts,0);
 assert.equal(fitted.stats.sourceLengthIntrapanelStrictlyAccepted,true);
 assert.equal(fitted.stats.sourceLengthNewIntrapanelContacts,0);
 assert.equal(fitted.stats.sourceLengthAdaptiveIntrapanelNonregression,true);
 assert.equal(fitted.stats.sourceLengthSelfLayerCollisionCertified,false);
 assert.equal(fitted.stats.sourceLengthNewTriangleContacts,0);
 assert.equal(fitted.stats.sourceLengthExtensionScale,decision.selectedScale);
 assert.equal(fitted.stats.sourceLengthCollisionCertified,false);
 assert.equal(fitted.stats.releaseAuthorized,false);
 assert.notDeepEqual(fx.shirt.meshes[0].geometry.getAttribute('position').array,fx.positions[0]);
 fx.shirt.meshes.forEach((m,i)=>{
  assert.deepEqual(m.geometry.getAttribute('panelPosition').array,fx.panels[i]);
  assert.deepEqual(m.geometry.getAttribute('skinWeight').array,fx.weights[i]);
 });
});

test('no acceptable extension fails closed before ANY user-photo mesh or panel mutation',()=>{
 const fx=fixture(.98);
 const decision=planNoNewContactSourceLength(fx.shirt,fx.root,profile);
 assert.equal(decision.accepted,false,JSON.stringify(decision));
 assert.equal(decision.originalPhotographOnly,true);
 assert.equal(decision.selectedScale,null);
 assert.equal(decision.attempts.length,4);
 assert.ok(decision.attempts.every(x=>x.accepted===false));
 fx.assertOriginal();
 assert.throws(()=>applyNoNewContactSourceLength(fx.shirt,fx.root,profile),
  /new-body-triangle-contacts: original-photo\/2D fallback required/);
 fx.assertOriginal();
});


test('unsewn synthetic cylinder folds into new intrapanel contacts and cannot be promoted as safe 3D',()=>{
 const fx=fixture(null,{torsoMode:'cylinder'});
 const decision=planNoNewContactSourceLength(fx.shirt,fx.root,profile);
 assert.equal(decision.accepted,false);
 assert.equal(decision.originalPhotographOnly,true);
 assert.ok(decision.attempts.some(a=>Number.isInteger(a.newlyIntersectingIntrapanel)&&a.newlyIntersectingIntrapanel>0));
 fx.assertOriginal();
 assert.throws(()=>applyNoNewContactSourceLength(fx.shirt,fx.root,profile),/original-photo\/2D fallback required/);
 fx.assertOriginal();
});
