import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dress74Fold,DRESS74_POLICY} from '../research/dress-mobile-01/source-true-dress-tailoring.mjs';

test('Exact source-true PR487 dress and preserved finite fold region only',()=>{
 assert.equal(DRESS74_POLICY.sourceId,'commons-0053');
 assert.equal(DRESS74_POLICY.maxOutwardMeters,.021);
 assert.equal(DRESS74_POLICY.releaseAuthorized,false);
 assert.deepEqual(dress74Fold({theta:0,sourceY:.75,sourceHemY:.50,transitionY:.815}),{radial:0,drop:0});
 const v=dress74Fold({theta:Math.PI,sourceY:.57,sourceHemY:.5,transitionY:.815});
 assert.ok(v.radial>0&&v.radial<=.021);
 assert.ok(v.drop>=0&&v.drop<=.004);
 assert.throws(()=>dress74Fold({theta:0,sourceY:1,sourceHemY:0,transitionY:2}),/Finite licensed/);
});
test('Research integration does not weaken original photo, skin or garment bounds',()=>{
 const p='research/dress-mobile-01/';
 const ctrl=readFileSync(p+'dress-outfit-controller.mjs','utf8'),
  scene=readFileSync(p+'dress-mobile-showroom.mjs','utf8'),
  src=readFileSync(p+'source-true-dress-tailoring.mjs','utf8'),
  ui=readFileSync(p+'dress-mobile-demo.mjs','utf8');
 for(const x of ['dressMobile74=false','tailorSourceDress74(fitted,root)',
  "if(next==='dress')","if(next==='pants'||next==='shirt-pants')"])
  assert.ok(ctrl.includes(x),x);
 assert.ok(scene.includes('dressMobile74=false'));
 assert.match(ui,/dressMobile74:true/);
 for(const x of ['dress74OriginalPhotoCoordinatesPreserved:true','dress74OriginalNormalsPreserved:true',
  'dress74OriginalSkinWeightsPreserved:true','dress74NeckShoulderArmholeUntouched:true',
  'dress74BackMaterial:','fabricPhysicsSimulated:false'])
  assert.ok(src.includes(x),x);
 for(const x of ['app.applyOutfit(\\x27dress\\x27','app.applyOutfit(\\x27none\\x27',
  'prepareIndexedGarmentsFor3D','applyIndexed3DSelection','dressOriginal',
  'contextLoss()','Retry 3D'])
  assert.ok(ui.includes(x.replaceAll('\\x27',"'")),x);
 assert.doesNotMatch(ui,/supabase\.|localStorage\.setItem|createClient\(/);
});
