import test from 'node:test';
import assert from 'node:assert/strict';
import {person} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {hangNeutralSeatToThighFabric71} from '../research/three-d-71/seat-thigh-fabric-fall.mjs';
test('3D71 explicit opt-in only; requires previous verified neutral anatomical cloth',()=>{
 assert.equal(hangNeutralSeatToThighFabric71(null,null,{enabled:false}),null);
 assert.throws(()=>hangNeutralSeatToThighFabric71({},null),/3D70 neutral/);
 assert.throws(()=>createOutfitController({},{premiumSeatThigh71:true,premiumNeutralSilhouette70:false}),/3D71 requires measured/);
});
for(const kind of ['female','male'])test('3D71 real 163-bone '+kind+' source-measured seat thigh independent neutral cloth',async()=>{
 const root=await person(kind);
 const controller=createOutfitController(root,{premiumNeutralSilhouette70:true,premiumSeatThigh71:true});
 try{
  const s=controller.setOutfit('pants');
  assert.equal(s.mode,'pants');
  assert.equal(s.pants.originalNeutralSeatThighFall71,true);
  assert.equal(s.pants.naturalNeutralSilhouette70,true);
  assert.equal(s.pants.photoApplied,false);
  assert.equal(s.pants.sourceSHA256,null);
  assert.equal(s.pants.seatThighReal3DCloth,true);
  assert.equal(s.pants.seatThighOriginalRestAndSkinUnchanged,true);
  assert.equal(s.pants.seatThighOriginalAnatomyUntouched,true);
  assert.equal(s.pants.seatThighPhotoDenimUnchanged,true);
  assert.equal(s.pants.seatThighNoManufacturedReversePhoto,true);
  assert.ok(s.pants.seatThighMovedVertices>=100);
  assert.ok(s.pants.seatThighUpperVertices>=60);
  assert.ok(s.pants.seatThighLowerVertices>=20);
  assert.ok(s.pants.seatThighMaxMovement>=.002);
  assert.ok(s.pants.seatThighMaxMovement<=.032001);
  assert.equal(s.pants.verifiedHumanPhotorealism,false);
  assert.equal(s.pants.actualPhoneAcceptance,false);
  assert.equal(s.pants.sweptContactCertified,false);
  assert.equal(s.releaseAuthorized,false);
  for(const pose of ['source','relaxed']){
   assert.equal(controller.setPose(pose).pants.originalNeutralSeatThighFall71,true);
  }
  console.log('THREE_D71_REAL_MEASURED_SEAT_THIGH',JSON.stringify({
   kind,changed:s.pants.seatThighMovedVertices,upper:s.pants.seatThighUpperVertices,
   lower:s.pants.seatThighLowerVertices,maxMove:s.pants.seatThighMaxMovement,
   bodyGuarded:s.pants.seatThighBodyGuarded,
   profiles:s.pants.sourceMeasuredSeatThighProfiles,
   released:false,phone:false,humanApproved:false
  }));
  controller.setOutfit('none');
 }finally{controller.dispose();}
});
test('3D71 off remains the independently green 3D70 unchanged',async()=>{
 const root=await person('female');
 const controller=createOutfitController(root,{premiumNeutralSilhouette70:true});
 try{
  const s=controller.setOutfit('pants');
  assert.equal(s.pants.naturalNeutralSilhouette70,true);
  assert.equal(s.pants.originalNeutralSeatThighFall71,undefined);
  assert.equal(s.releaseAuthorized,false);
 }finally{controller.dispose();}
});
