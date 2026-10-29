import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {outwardDrapeAtRest,SKIRT_DRAPE} from '../research/three-d-27/skirt-drape.mjs';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
test('side/rear hem drape is bounded, smooth, nonnegative and never touches center-front source',()=>{
 const waistY=1.12,hemY=.56,position=y=>({waistY,hemY,y,centerX:0,centerZ:0});
 assert.equal(outwardDrapeAtRest({x:0,z:.4,...position(.56)}),0,
  'Photographed front V/print must remain perfectly untouched');
 assert.equal(outwardDrapeAtRest({x:.4,z:.4,...position(.56)}),0,
  'Front-quarter garment source must not be deformed');
 assert.equal(outwardDrapeAtRest({x:-.4,z:.4,...position(.56)}),0);
 assert.equal(outwardDrapeAtRest({x:.4,z:0,...position(1.2)}),0,
  'Above waist and armholes unchanged');
 assert.equal(outwardDrapeAtRest({x:0,z:-.4,...position(1.04)}),0,
  'Upper fitted bodice unaffected');
 let changed=0,max=0;
 for(let theta=-Math.PI;theta<=Math.PI;theta+=.035)for(let y=.56;y<1.12;y+=.026){
  const delta=outwardDrapeAtRest({
   x:.35*Math.sin(theta),z:.35*Math.cos(theta),...position(y)
  });
  assert.ok(Number.isFinite(delta)&&delta>=0&&delta<=SKIRT_DRAPE.maxOutwardMeters);
  if(delta>1e-4)changed++;
  max=Math.max(max,delta);
 }
 assert.ok(changed>200&&max>.007&&max<=.018);
 for(const args of [{x:NaN,y:.6,z:0,waistY,hemY},{x:0,y:.6,z:0,waistY:.6,hemY:.4}])
  assert.throws(()=>outwardDrapeAtRest(args));
});
for(const kind of ['female','male'])test(kind+' verified CC0 dress uses measured source-only 3D folds while preserving original review boundaries',async()=>{
 const rig=await person(kind),ctrl=createOutfitController(rig,{skirtDrape:true});
 try{
  const result=ctrl.setOutfit('dress',candidate('dress'),{reviewed:true});
  assert.equal(result.dress.sourceId,'commons-0053');
  assert.equal(result.dress.anatomicalDress,true);
  assert.equal(result.dress.actualOpenArmholes,true);
  assert.equal(result.dress.skirtDrapeApplied,true);
  assert.equal(result.dress.originalPhotoMappingPreserved,true);
  assert.equal(result.dress.frontCenterUnchanged,true);
  assert.equal(result.dress.shoulderAndArmholesUnchanged,true);
  assert.equal(result.dress.originalRGBUnchanged,true);
  assert.ok(result.dress.skirtDrapeMaxOutward>.005&&result.dress.skirtDrapeMaxOutward<=.01800001);
  assert.ok(result.dress.skirtDrapeChangedVertices>150);
  assert.equal(result.dress.collisionValidated,false);
  assert.equal(result.dress.releaseAuthorized,false);
  ctrl.setPose('source');ctrl.setPose('relaxed');
  const before=ctrl.getState();
  assert.throws(()=>ctrl.setOutfit('dress',candidate('dress'),{reviewed:false}),/review/i);
  assert.deepEqual(ctrl.getState(),before,'Failed source review cannot delete current dress');
  const shirt=ctrl.setOutfit('shirt-pants',candidate('shirt'),{reviewed:true});
  assert.equal(shirt.dress,null);
  assert.equal(shirt.shirt.sourceId,'commons-0003');
  const empty=ctrl.setOutfit('none');
  assert.equal(empty.garmentMeshes,0);
 }finally{ctrl.dispose();}
});
test('Rollback without V-neck or anatomical dress is exactly its original unchanged path',async()=>{
 const rig=await person('female');
 const ctrl=createOutfitController(rig,{skirtDrape:true,dressNeckline:false});
 try{
  const s=ctrl.setOutfit('dress',candidate('dress'),{reviewed:true});
  assert.equal(s.dress.skirtDrapeApplied,undefined);
  assert.equal(s.dress.anatomicalDress,undefined);
  assert.equal(s.dress.releaseAuthorized,false);
 }finally{ctrl.dispose();}
});
test('Skirt fold comparison toggles do not overwrite original shirt, photographs or older geometry stages',async()=>{
 const [control,show,demo]=await Promise.all([
  readFile('research/three-d-15/outfit-controller.mjs','utf8'),
  readFile('research/three-d-15/showroom.mjs','utf8'),
  readFile('research/three-d-15/demo.mjs','utf8')
 ]);
 assert.match(control,/if\(anatomyEnabled&&skirtDrape\)fitted=softenAnatomicalSkirt\(fitted,root\)/);
 assert.match(control,/finishAnatomicalOpenings\(fitted\)/);
 assert.match(control,/finishNecklineAndSeams\(built\.shirt,root\)/);
 assert.match(show,/necklineSeams,dressNeckline,dressAnatomy,skirtDrape/);
 assert.match(demo,/skirtDrape:new URLSearchParams\(location\.search\)/);
 for(const x of [control,show,demo,await readFile('research/three-d-27/skirt-drape.mjs','utf8')]){
  for(const prohibited of [/localStorage\.setItem/,/indexedDB\.open/,/getUserMedia/,/supabase\.co/,/api\.openai\.com/,/navigator\.sendBeacon/])
   assert.doesNotMatch(x,prohibited);
 }
});
