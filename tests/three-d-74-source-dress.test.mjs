import test from 'node:test';
import assert from 'node:assert/strict';
import {dress74Fold,DRESS74_POLICY,tailorSourceDress74} from '../research/three-d-74/source-true-dress-tailoring.mjs';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';

test('geometry relief is bounded, lower-skirt only, and preserves original photographed front',()=>{
 const h=.54,t=.855;
 for(let a=-Math.PI;a<Math.PI;a+=.05)for(let y=h;y<=t;y+=.025){
  const x=dress74Fold({theta:a,sourceY:y,sourceHemY:h,transitionY:t});
  assert.ok(x.radial>=0&&x.radial<=DRESS74_POLICY.maxOutwardMeters);
  assert.ok(x.drop>=0&&x.drop<=DRESS74_POLICY.maxHemDropMeters);
  if(Math.cos(a)>=DRESS74_POLICY.frontProtectedCos)
   assert.equal(x.radial+x.drop,0,'Photographic front mapping cannot be deformed');
 }
 assert.deepEqual(dress74Fold({theta:Math.PI,sourceY:1.2,sourceHemY:h,transitionY:t}),{radial:0,drop:0});
 assert.throws(()=>dress74Fold({theta:NaN,sourceY:.6,sourceHemY:h,transitionY:t}),/Finite/);
 assert.throws(()=>dress74Fold({theta:1,sourceY:.6,sourceHemY:.58,transitionY:.62}),/Finite/);
 assert.equal(DRESS74_POLICY.releaseAuthorized,false);
});

test('generic or spoofed garment cannot acquire source-verified dress fold modifier',()=>{
 assert.throws(()=>tailorSourceDress74({mesh:{isSkinnedMesh:true},stats:{sourceId:'random'}},{}),/Only source-verified/);
 assert.throws(()=>tailorSourceDress74({mesh:{isSkinnedMesh:true},stats:{sourceId:'commons-0053',anatomicalDress:true,actualOpenArmholes:true,skirtDrapeApplied:true,releaseAuthorized:true,collisionValidated:false}},{}),/Only source-verified/);
});

for(const kind of ['female','male'])test(kind+' actual 163-joint skinned dress preserves source and rigid upper body while adding bounded lower-skirt drape',async()=>{
 const root=await person(kind);
 const c=createOutfitController(root,{dress74:true,skirtDrape:true});
 try{
  const r=c.setOutfit('dress',candidate('dress'),{reviewed:true});
  assert.equal(r.dress.sourceId,'commons-0053');
  assert.equal(r.dress.actualOpenArmholes,true);
  assert.equal(r.dress.anatomicalDress,true);
  assert.equal(r.dress.skirtDrapeApplied,true);
  assert.equal(r.dress.dress74ProvisionalDrape,true);
  assert.ok(r.dress.dress74ChangedVertices>=100);
  assert.ok(r.dress.dress74MaxMovementMeters>.002);
  assert.ok(r.dress.dress74MaxMovementMeters<=DRESS74_POLICY.maxGarmentMovementMeters);
  assert.equal(r.dress.dress74OriginalPhotoCoordinatesPreserved,true);
  assert.equal(r.dress.dress74OriginalNormalsPreserved,true);
  assert.equal(r.dress.dress74OriginalSkinWeightsPreserved,true);
  assert.equal(r.dress.dress74NeckShoulderArmholeUntouched,true);
  assert.equal(r.dress.fabricPhysicsSimulated,false);
  assert.equal(r.dress.physicalPhonesAccepted,false);
  assert.equal(r.dress.collisionValidated,false);
  assert.equal(r.dress.releaseAuthorized,false);
  c.setPose('source');c.setPose('relaxed');
  const prior=c.getState();
  assert.throws(()=>c.setOutfit('dress',candidate('dress'),{reviewed:false}),/review/i);
  assert.deepEqual(c.getState(),prior,'Bad source review cannot silently remove saved research garment');
  assert.equal(c.setOutfit('none').garmentMeshes,0);
 }finally{c.dispose();}
});

test('research opt-in OFF leaves existing photographed dress default unchanged',async()=>{
 const root=await person('female');
 const c=createOutfitController(root);
 try{
  const r=c.setOutfit('dress',candidate('dress'),{reviewed:true});
  assert.equal(r.dress.dress74ProvisionalDrape,undefined);
  assert.equal(r.dress.actualOpenArmholes,true);
  assert.equal(r.dress.releaseAuthorized,false);
 }finally{c.dispose();}
});
