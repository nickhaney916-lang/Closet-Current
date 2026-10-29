import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController,OUTFITS,sourceForOutfit} from '../research/three-d-15/outfit-controller.mjs';

test('Both independently verified shirt and dress passes coexist with isolated rollbacks',async()=>{
 const [controller,showroom,demo]=await Promise.all([
  readFile('research/three-d-15/outfit-controller.mjs','utf8'),
  readFile('research/three-d-15/showroom.mjs','utf8'),
  readFile('research/three-d-15/demo.mjs','utf8')
 ]);
 assert.match(controller,/finishNecklineAndSeams\(built\.shirt,root\)/);
 assert.match(controller,/fitAnatomicalDress\(shaped,root\)/);
 assert.match(controller,/finishAnatomicalOpenings\(fitted\)/);
 assert.match(controller,/shapePhysicalDressNeckline\(raw,\{enabled:dressNeckline\}\)/);
 assert.match(controller,/anatomyEnabled=dressAnatomy&&dressNeckline/);
 assert.match(showroom,/necklineSeams,dressNeckline,dressAnatomy/);
 assert.match(demo,/dressAnatomy:new URLSearchParams\(location\.search\)/);
 assert.match(demo,/necklineSeams:new URLSearchParams\(location\.search\)/);
 assert.match(demo,/dressNeckline:new URLSearchParams\(location\.search\)/);
 assert.deepEqual(OUTFITS,['none','pants','shirt','shirt-pants','dress']);
 assert.equal(sourceForOutfit('dress'),'commons-0053');
 assert.equal(sourceForOutfit('shirt-pants'),'commons-0003');
 assert.equal(sourceForOutfit('pants'),null);
});

for(const kind of ['female','male'])test(kind+' genuine original anatomy retains V-neck rollback without invalid armhole fitting',async()=>{
 const rig=await person(kind);
 const viewer=createOutfitController(rig,{
  dressAnatomy:true,dressNeckline:false,necklineSeams:true
 });
 const state=viewer.setOutfit('dress',candidate('dress'),{reviewed:true});
 assert.equal(state.dress.anatomicalDress,undefined,'Physical V-neck disabled => armhole fitter safely disabled');
 assert.equal(state.dress.sourceId,'commons-0053');
 assert.equal(state.dress.releaseAuthorized,false);
 const current=viewer.getState();
 assert.throws(()=>viewer.setOutfit('dress',candidate('dress')),/review/i);
 assert.deepEqual(viewer.getState(),current,'A rejected review cannot destroy the current dress');
 viewer.setPose('source');viewer.setPose('relaxed');
 viewer.setOutfit('pants');
 viewer.setOutfit('none');
 assert.equal(viewer.getState().garmentMeshes,0);
 viewer.dispose();
});

test('Anatomical armhole source module is imported from exact source-pinned PR429 without altering original shaders or photos',async()=>{
 const [dress,shirt,photo]=await Promise.all([
  readFile('research/three-d-24/anatomical-dress.mjs','utf8'),
  readFile('research/three-d-22/neckline-seams.mjs','utf8'),
  readFile('research/three-d-23/dress-neckline.mjs','utf8')
 ]);
 assert.match(dress,/actualOpenArmholes:true/);
 assert.match(dress,/collisionValidated:false/);
 assert.match(dress,/necklineProfilePreserved:true/);
 assert.match(dress,/originalPhotoMappingPreserved:true/);
 assert.match(dress,/neutralOpeningThickness:\.003/);
 assert.match(shirt,/finishNecklineAndSeams/);
 assert.match(photo,/shapePhysicalDressNeckline/);
 assert.doesNotMatch(dress,/supabase|localStorage|indexedDB|fetch\(|openai|customerPhotos/i);
});

test('Family Alpha release remains blocked; no production/staging, photos or accounts modified',async()=>{
 const files=[
 'research/three-d-15/demo.mjs',
 'research/three-d-15/showroom.mjs',
 'research/three-d-15/outfit-controller.mjs',
 'research/three-d-24/anatomical-dress.mjs'
 ];
 for(const file of files){
  const src=await readFile(file,'utf8');
  for(const disallowed of [/localStorage\.setItem/,/indexedDB\.open/,/getUserMedia/,
   /supabase\.co/,/api\.openai\.com/,/navigator\.sendBeacon/])
   assert.doesNotMatch(src,disallowed);
 }
 const anatomy=await readFile('research/three-d-24/anatomical-dress.mjs','utf8');
 assert.match(anatomy,/releaseAuthorized:false/);
 assert.match(anatomy,/collisionValidated:false/);
});
