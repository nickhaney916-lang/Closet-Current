import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {fitSourceLength,planNoNewContactSourceLength,applyNoNewContactSourceLength,classifySourceLengthContactAttempt,classifySourceLengthCandidateException,safeAdaptiveBodyContactDiagnostic}
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
  assert.equal(result.stats.sourceLengthNewBodyContactRegions.newContactCount,0);
  assert.equal(result.stats.sourceLengthNewBodyContactRegions.byHeightQuartile.reduce((a,n)=>a+n,0),0);
  assert.equal(result.stats.sourceLengthNewGarmentPartContacts,0);
  assert.equal(result.stats.sourceLengthNewIntrapanelContacts,0);
  assert.equal(result.stats.sourceLengthIntrapanelAffectedPairOnly,true);
  assert.equal(result.stats.sourceLengthIntrapanelFullBaselineEnumerated,false);
  assert.ok(result.stats.sourceLengthIntrapanelChangedFaces>0);
  assert.ok(result.stats.sourceLengthIntrapanelCandidateTests>=0);
  assert.equal(result.stats.sourceLengthBodyContactDistribution.total,result.stats.sourceLengthTriangleContactBefore);
  assert.equal(result.stats.sourceLengthBodyContactDistribution.byGarmentMesh.reduce((a,n)=>a+n,0),result.stats.sourceLengthTriangleContactBefore);
  assert.equal(result.stats.sourceLengthBodyContactDistribution.releaseAuthorized,false);
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
 assert.ok(decision.attempts.some(x=>x.newlyIntersecting>0||x.reason==='coarse-body-pair-regression'),
  'Reproduce a full extension rejected by either the original body-pair gate or exact triangle gate');
 assert.equal(decision.attempts.at(-1).newlyIntersecting,0);
 assert.equal(decision.attempts.at(-1).newlyIntersectingGarmentParts,0);
 assert.equal(decision.attempts.at(-1).newlyIntersectingIntrapanel,0);
 assert.equal(decision.noNewContactAtOnePose,true);
 const safe=safeAdaptiveBodyContactDiagnostic(decision);
 assert.equal(safe.accepted,true);
 assert.equal(safe.noPhotoOrOwnerFields,true);
 assert.equal(safe.attempts.at(-1).bodyRegions.newContactCount,0);
 assert.equal(JSON.stringify(safe).includes(profile.sourceSHA256),false);
 assert.equal(decision.refusalReason,null);
 assert.equal(decision.attempts.at(-1).reason,'eligible');
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
 assert.equal(fitted.stats.sourceLengthIntrapanelAffectedPairOnly,true);
 assert.equal(fitted.stats.sourceLengthIntrapanelFullBaselineEnumerated,false);
 assert.ok(fitted.stats.sourceLengthIntrapanelChangedFaces>0);
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
 const safe=safeAdaptiveBodyContactDiagnostic(decision);
 assert.equal(safe.accepted,false);
 assert.equal(safe.attempts.length,4);
 assert.equal(safe.noPhotoOrOwnerFields,true);
 assert.equal(JSON.stringify(safe).includes(profile.sourceSHA256),false);
 assert.equal(JSON.stringify(safe).includes('ownerId'),false);
 assert.equal(decision.selectedScale,null);
 assert.equal(decision.attempts.length,4);
 assert.ok(decision.attempts.every(x=>x.accepted===false&&typeof x.reason==='string'));
 assert.equal(typeof decision.refusalReason,'string');
 assert.match(decision.refusalReason,/^[a-z-]+$/);
 assert.equal(JSON.stringify(decision).includes('native05-A'),false);
 fx.assertOriginal();
 assert.throws(()=>applyNoNewContactSourceLength(fx.shirt,fx.root,profile),
  /adaptive-geometry-refused\[[a-z-]+\]: original-photo\/2D fallback required/);
 fx.assertOriginal();
});


test('BVH source-ID remapping prevents thousands of false new self-contacts in cylindrical skinned source',()=>{
 const fx=fixture(null,{torsoMode:'cylinder'});
 const decision=planNoNewContactSourceLength(fx.shirt,fx.root,profile);
 assert.equal(decision.accepted,true,JSON.stringify(decision));
 assert.equal(decision.noNewContactAtOnePose,true);
 assert.ok(decision.attempts.some(a=>a.accepted&&a.newlyIntersectingIntrapanel===0));
 fx.assertOriginal();
 const accepted=applyNoNewContactSourceLength(fx.shirt,fx.root,profile);
 assert.equal(accepted.stats.sourceLengthIntrapanelStrictlyAccepted,true);
 assert.equal(accepted.stats.sourceLengthNewIntrapanelContacts,0);
 assert.equal(accepted.stats.sourceLengthCollisionCertified,false);
 assert.equal(accepted.stats.sourceLengthSelfLayerCollisionCertified,false);
 assert.equal(accepted.stats.releaseAuthorized,false);
});


test('adaptive refusal taxonomy rejects fake/missing contacts and separates body, panel and self causes',()=>{
 const fx=fixture();
 const stats=fitSourceLength(fx.shirt,fx.root,profile,{traceTriangleContacts:true,
  traceGarmentPartContacts:true,traceSelfContacts:true,previewOnly:true}).stats;
 const classify=changes=>classifySourceLengthContactAttempt({...stats,...changes});
 assert.deepEqual(classify({}).reasons,[]);
 assert.equal(classify({}).reason,'eligible');
 assert.equal(classify({sourceLengthNewTriangleContacts:1}).reason,'new-body-contacts');
 assert.equal(classify({sourceLengthTriangleContactAfter:stats.sourceLengthTriangleContactBefore+1}).reason,
  'body-contact-count-regression');
 assert.equal(classify({sourceLengthNewGarmentPartContacts:1}).reason,'new-panel-contacts');
 assert.equal(classify({sourceLengthGarmentPartContactsAfter:stats.sourceLengthGarmentPartContactsBefore+1}).reason,
  'panel-contact-count-regression');
 assert.equal(classify({sourceLengthNewIntrapanelContacts:1}).reason,'new-intrapanel-contacts');
 assert.equal(classify({sourceLengthIntrapanelContactsAfter:stats.sourceLengthIntrapanelContactsBefore+1}).reason,
  'intrapanel-count-regression');
 assert.equal(classify({sourceLengthNewHemY:stats.sourceLengthOldHemY}).reason,
  'hem-extension-under-minimum');
 for(const invalid of [null,-1,NaN,Infinity,'0']){
  assert.equal(classify({sourceLengthNewTriangleContacts:invalid}).reason,'missing-contact-evidence');
 }
 assert.deepEqual(classify({sourceLengthNewTriangleContacts:3,sourceLengthNewIntrapanelContacts:2}).reasons,
  ['new-body-contacts','new-intrapanel-contacts']);
 fx.assertOriginal();
});


test('fail-closed enum diagnoses exact resource budget without fabricating cloth collision',()=>{
 for(const [message,tag] of [
  ['M2 triangle audit exceeds bounded contact budget; cannot certify','body-contact-budget'],
  ['M2 garment part audit exceeds bounded contact budget; cannot certify','panel-contact-budget'],
  ['M2 self-contact exceeds bounded triangle comparison budget; cannot certify','self-comparison-budget'],
  ['M2 self-contact exceeds bounded contact budget; cannot certify','self-contact-budget'],
  ['M2 changed-face exceeds bounded comparison budget; cannot certify','changed-self-comparison-budget'],
  ['M2 changed-face exceeds bounded new-contact budget; cannot certify','changed-self-contact-budget'],
  ['M2 changed-face exceeds bounded moved-face budget; cannot certify','changed-face-count-budget'],
  ['M2 source length new posed body intersection pairs 2 -> 3','coarse-body-pair-regression'],
  ['M2 source length new posed garment part triangle contacts 4','new-panel-contacts'],
  ['M2 source length new posed intrapanel self-intersections 2','new-intrapanel-contacts']
 ]){
  assert.equal(classifySourceLengthCandidateException(new Error(message)),tag);
 }
 assert.equal(classifySourceLengthCandidateException(new Error('private source had unknown error')),
  'candidate-preflight-unavailable');
 const fx=fixture(null,{torsoMode:'cylinder'});
 const decision=planNoNewContactSourceLength(fx.shirt,fx.root,profile);
 assert.equal(decision.accepted,true);
 assert.equal(decision.refusalReason,null);
 fx.assertOriginal();
});


test('research-only diagnostic callback runs once before 3D refusal without mutating original garment',()=>{
 const fx=fixture(.98);
 const events=[];
 assert.throws(()=>applyNoNewContactSourceLength(fx.shirt,fx.root,profile,
  {onResearchDiagnostic:d=>events.push(d)}),/original-photo\/2D fallback required/);
 assert.equal(events.length,1);
 assert.equal(events[0].accepted,false);
 assert.equal(events[0].attempts.length,4);
 assert.equal(events[0].refusalReason,events[0].attempts.at(-1).reason);
 assert.equal(events[0].noPhotoOrOwnerFields,true);
 assert.ok(events[0].attempts.some(a=>a.bodyRegions?.newContactCount>0||a.reason==='coarse-body-pair-regression'));
 fx.assertOriginal();
 assert.throws(()=>applyNoNewContactSourceLength(fx.shirt,fx.root,profile,
  {onResearchDiagnostic:'malformed'}),/bounded research diagnostic callback/);
 fx.assertOriginal();
});


test('inferred 8–24mm depth-only trial preserves photographic projected silhouette and private original UV/skin',()=>{
 const noDepth=fixture(),withDepth=fixture();
 const scale=.5;
 const no=fitSourceLength(noDepth.shirt,noDepth.root,profile,{extensionScale:scale});
 const yes=fitSourceLength(withDepth.shirt,withDepth.root,profile,{extensionScale:scale,depthClearance:.016});
 assert.equal(no.stats.sourceLengthDepthClearance,0);
 assert.equal(yes.stats.sourceLengthDepthClearance,.016);
 assert.equal(yes.stats.sourceLengthDepthFromPhotographVerified,false);
 assert.equal(yes.stats.sourceLengthDepthCorrectionDoesNotChangeProjectedXY,true);
 assert.equal(yes.stats.releaseAuthorized,false);
 assert.equal(noDepth.shirt.meshes.length,withDepth.shirt.meshes.length);
 let zShift=0,xyChanged=0;
 for(let i=0;i<noDepth.shirt.meshes.length;i++){
  const a=noDepth.shirt.meshes[i].geometry.getAttribute('position').array;
  const c=withDepth.shirt.meshes[i].geometry.getAttribute('position').array;
  for(let j=0;j<a.length;j++){
   if(j%3===2)zShift=Math.max(zShift,Math.abs(c[j]-a[j]));
   else xyChanged=Math.max(xyChanged,Math.abs(c[j]-a[j]));
  }
  assert.deepEqual(withDepth.shirt.meshes[i].geometry.getAttribute('panelPosition').array,
   withDepth.panels[i],'Original owner source panel evidence must not be rewritten');
  assert.deepEqual(withDepth.shirt.meshes[i].geometry.getAttribute('skinWeight').array,
   withDepth.weights[i],'163-bone original skin weights must stay unchanged');
 }
 assert.ok(zShift>.001,'Depth-only research stage must actually move front/rear geometry');
 assert.ok(xyChanged<1e-6,'Depth-only clearance must preserve all front-projected X/Y coordinates exactly');
 for(const invalid of [-.01,.025,Infinity,NaN,'0.01'])
  assert.throws(()=>fitSourceLength(withDepth.shirt,withDepth.root,profile,
   {extensionScale:.5,depthClearance:invalid,previewOnly:true}),/bounded inferred outward garment depth clearance/);
});

test('opt-in bounded depth and hem-taper search never bypasses body/panel/self contact veto or rewrites source',()=>{
 const f=fixture(.98);
 const standard=planNoNewContactSourceLength(f.shirt,f.root,profile);
 assert.equal(standard.accepted,false,'Established four-stage search remains unmodified');
 assert.equal(standard.attempts.length,4);
 assert.equal(standard.experimentalDepthTrial,false);
 const trial=planNoNewContactSourceLength(f.shirt,f.root,profile,{experimentalDepthTrial:true});
 assert.equal(trial.experimentalDepthTrial,true);
 assert.ok(trial.attempts.length>=5&&trial.attempts.length<=16);
 assert.ok(trial.attempts.slice(4).every(a=>a.depthClearance>0&&a.depthClearance<=.024));
 assert.ok(trial.attempts.every(a=>[1,.75,.5,.25].includes(a.scale)));
 assert.ok(trial.attempts.every(a=>[0,.008,.016,.024].includes(a.depthClearance)));
 assert.ok(trial.attempts.every(a=>[1,2,3,4].includes(a.depthEasingExponent)));
 assert.ok(trial.attempts.slice(0,10).every(a=>a.depthEasingExponent===1));
 assert.ok(trial.attempts.slice(10).every(a=>a.depthEasingExponent>=2&&a.depthEasingExponent<=4));
 const safe=safeAdaptiveBodyContactDiagnostic(trial);
 assert.equal(safe.experimentalDepthTrial,true);
 assert.equal(safe.accepted,trial.accepted);
 assert.equal(safe.noPhotoOrOwnerFields,true);
 assert.equal(JSON.stringify(safe).includes(profile.sourceSHA256),false);
 assert.equal(JSON.stringify(safe).includes('ownerId'),false);
 f.assertOriginal();
 if(trial.accepted){
  assert.ok(trial.selectedDepthClearance>0);
  const result=applyNoNewContactSourceLength(f.shirt,f.root,profile,{experimentalDepthTrial:true});
  assert.equal(result.stats.sourceLengthDepthClearance,trial.selectedDepthClearance);
  assert.equal(result.stats.sourceLengthDepthEasingExponent,trial.selectedDepthEasingExponent);
  assert.equal(result.stats.sourceLengthNewTriangleContacts,0);
  assert.equal(result.stats.sourceLengthNewGarmentPartContacts,0);
  assert.equal(result.stats.sourceLengthNewIntrapanelContacts,0);
  assert.equal(result.stats.sourceLengthCollisionCertified,false);
  assert.equal(result.stats.releaseAuthorized,false);
 }else{
  assert.equal(trial.selectedScale,null);
  assert.equal(trial.selectedDepthClearance,null);
  assert.throws(()=>applyNoNewContactSourceLength(f.shirt,f.root,profile,
   {experimentalDepthTrial:true}),/original-photo\/2D fallback required/);
  f.assertOriginal();
 }
 assert.throws(()=>planNoNewContactSourceLength(f.shirt,f.root,profile,
  {experimentalDepthTrial:'research'}),/bounded depth experiment opt-in/);
});


test('all adaptive self-fold locality receipts are exact integer counts with no owner/source geometry',()=>{
 const f=fixture(null,{torsoMode:'cylinder'});
 const before=f.shirt.meshes.map(m=>m.geometry.getAttribute('position').array.slice());
 const decision=planNoNewContactSourceLength(f.shirt,f.root,profile,{experimentalDepthTrial:true});
 const publicDiag=safeAdaptiveBodyContactDiagnostic(decision);
 assert.equal(publicDiag.experimentalDepthTrial,true);
 assert.equal(publicDiag.noPhotoOrOwnerFields,true);
 assert.equal(publicDiag.releaseAuthorized,false);
 assert.ok(publicDiag.attempts.length>=1&&publicDiag.attempts.length<=16);
 for(const a of publicDiag.attempts){
  if(!a.selfRegions)continue;
  assert.equal(a.selfRegions.newSelfContactCount,a.newSelfContacts);
  assert.equal(a.selfRegions.byGarmentMesh.reduce((t,n)=>t+n,0),a.newSelfContacts);
  assert.equal(a.selfRegions.byHeightBandPair.length,10);
  assert.equal(a.selfRegions.byHeightBandPair.reduce((t,n)=>t+n,0),a.newSelfContacts);
  assert.equal(a.selfRegions.byHeightSeparation.length,4);
  assert.equal(a.selfRegions.byHeightSeparation.reduce((t,n)=>t+n,0),a.newSelfContacts);
  assert.equal(a.selfRegions.originalSourceFaceIdentity,true);
  assert.equal(a.selfRegions.noPhotoOrOwnerFields,true);
  assert.equal(a.selfRegions.releaseAuthorized,false);
 }
 const text=JSON.stringify(publicDiag);
 assert.equal(text.includes(profile.sourceSHA256),false);
 assert.equal(text.includes('ownerId'),false);
 assert.equal(text.includes('newlyIntersectingSourceKeys'),false);
 for(let i=0;i<f.shirt.meshes.length;i++)
  assert.deepEqual(f.shirt.meshes[i].geometry.getAttribute('position').array,before[i]);
 f.assertOriginal();
});


test('hem-weighted 8mm Z taper preserves original projected photographed XY, skin weights and owner mask',()=>{
 const normal=fixture(),eased=fixture();
 const a=fitSourceLength(normal.shirt,normal.root,profile,{extensionScale:.5,depthClearance:.008});
 const c=fitSourceLength(eased.shirt,eased.root,profile,{extensionScale:.5,depthClearance:.008,depthEasingExponent:3});
 assert.equal(a.stats.sourceLengthDepthEasingExponent,1);
 assert.equal(c.stats.sourceLengthDepthEasingExponent,3);
 assert.equal(c.stats.sourceLengthHemWeightedDepthTaper,true);
 assert.equal(c.stats.sourceLengthDepthFromPhotographVerified,false);
 assert.equal(c.stats.sourceLengthDepthCorrectionDoesNotChangeProjectedXY,true);
 assert.equal(c.stats.releaseAuthorized,false);
 let xyDifference=0,zDifference=0;
 for(let i=0;i<normal.shirt.meshes.length;i++){
  const ap=normal.shirt.meshes[i].geometry.getAttribute('position').array;
  const cp=eased.shirt.meshes[i].geometry.getAttribute('position').array;
  assert.equal(ap.length,cp.length);
  for(let j=0;j<ap.length;j++){
   const diff=Math.abs(ap[j]-cp[j]);
   if(j%3===2)zDifference=Math.max(zDifference,diff);
   else xyDifference=Math.max(xyDifference,diff);
  }
  assert.deepEqual(eased.shirt.meshes[i].geometry.getAttribute('panelPosition').array,eased.panels[i]);
  assert.deepEqual(eased.shirt.meshes[i].geometry.getAttribute('skinWeight').array,eased.weights[i]);
 }
 assert.ok(zDifference>.00001,'Taper must actually vary Z for intermediate fabric vertices');
 assert.ok(xyDifference<1e-6,'Photographed projected XY outline must remain identical');
 for(const bad of [0,-1,.5,4.1,Infinity,NaN,'2'])
  assert.throws(()=>fitSourceLength(eased.shirt,eased.root,profile,{
   extensionScale:.5,depthClearance:.008,depthEasingExponent:bad,previewOnly:true
  }),/bounded photographic hem depth taper exponent/);
});
