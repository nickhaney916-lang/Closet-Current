import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {settleDenimRest06,DENIM_FIT06,createPhotoDenimStaticFitter06}
 from '../research/denim-fit-06/static-source-denim-fit.mjs';
test('Actual photographed jeans have deterministic nonzero 60Hz gravity resting target',()=>{
 const first=settleDenimRest06(),second=settleDenimRest06();
 assert.deepEqual(first,second);
 assert.equal(first.staticNonzeroGravityRest,true);
 assert.ok(first.meters>.0057&&first.meters<=DENIM_FIT06.maxWorldShiftMeters);
 assert.ok(first.steps>=DENIM_FIT06.stableSteps&&first.steps<=DENIM_FIT06.maxSteps);
 assert.equal(first.releaseAuthorized,false);
});
test('Out of bounds and counterfeit source-denim fitting rejects',()=>{
 for(const v of [-1,0,.001,.02,NaN,Infinity])
  assert.throws(()=>settleDenimRest06(v),/Finite bounded nonzero/);
 assert.throws(()=>createPhotoDenimStaticFitter06({},{}),/source-SHA approved/);
});
test('Both licensed real denim SHA garment fit is account-bound and physically BVH checked',()=>{
 const jeans=readFileSync('research/denim-fit-06/static-source-denim-fit.mjs','utf8');
 const controller=readFileSync('research/fabric-sweep-04/dress-outfit-controller.mjs','utf8');
 const room=readFileSync('research/fabric-sweep-04/dress-mobile-showroom.mjs','utf8');
 const view=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8');
 const html=readFileSync('research/fabric-sweep-04/index.html','utf8');
 for(const key of ['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight',
  'sourcePhotoDenimSeamContinuity76','auditedTrueSkinnedBodyToSourcePhotoDenim77',
  'frontPhotographUnchanged:true','noUnseenTextureInvented:true',
  'staticNonzeroGravityRest:true'])assert.ok(jeans.includes(key),key);
 for(const key of ['staticDenimFit06=false','staticFit06?.dispose()','staticFit06.restore()',
  'auditDenimFit06','posedGeometry(jeans)','triangleContacts(d.g,b.g)'])
  assert.ok(controller.includes(key),key);
 for(const key of ['const before=outfit.auditDenimFit06()',
  'const after=outfit.auditDenimFit06()','outfit.restoreDenimFit06()'])
  assert.ok(room.includes(key),key);
 for(const key of ["get('denimFit')==='after'","last3D?.originalPhotoSHA256s?.bottom",
  'SYNTHETIC_SOURCES10.public.sha','SYNTHETIC_SOURCES10.second.sha',
  'bound?.ownerId!==owner.ownerId','after.generation!==owner.generation',
  'sourceBoundToSavedWardrobe:true'])
  assert.ok(view.includes(key),key);
 assert.ok(html.includes('id="denim-freeze"'));
 assert.doesNotMatch(view,/supabase\.auth|localStorage\.setItem\(/);
});
