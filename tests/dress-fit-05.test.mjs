import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {convergeDressRest05,DRESS_FIT05,createPhotographedDressStaticFit05}
 from '../research/dress-fit-05/static-source-dress-fit.mjs';
test('Photographed dress reaches bounded reproducible nonzero gravity equilibrium',()=>{
 const a=convergeDressRest05(),b=convergeDressRest05();
 assert.deepEqual(a,b);
 assert.equal(a.isNonzeroStaticRest,true);
 assert.ok(a.restMeters>.0064&&a.restMeters<=DRESS_FIT05.maxMeters);
 assert.ok(a.steps<=DRESS_FIT05.maxSteps&&a.stableSteps>=DRESS_FIT05.stableSteps);
 assert.equal(a.releaseAuthorized,false);
});
test('Unsafe targets and fabricated dress/rig/source identities fail closed',()=>{
 for(const targetMeters of [-1,0,.001,1,NaN,Infinity])
  assert.throws(()=>convergeDressRest05({targetMeters}),/finite, bounded, nonzero/);
 assert.throws(()=>createPhotographedDressStaticFit05({},{}),/Original SHA-verified/);
});
test('Genuine skinned dress, synthetic owner, static freeze and collision audit wired opt-in',()=>{
 const fit=readFileSync('research/dress-fit-05/static-source-dress-fit.mjs','utf8');
 const ctl=readFileSync('research/fabric-sweep-04/dress-outfit-controller.mjs','utf8');
 const room=readFileSync('research/fabric-sweep-04/dress-mobile-showroom.mjs','utf8');
 const view=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8');
 const html=readFileSync('research/fabric-sweep-04/index.html','utf8');
 for(const word of ['dressRest','skinIndex','skinWeight','163',
  'sourceSHA256','row.front','protectedIds','stillGarmentAfterFit:true','physicalPhoneVerified:false'])
  assert.ok(fit.includes(word),word);
 for(const word of ['staticDressFit05=false','staticFit05.freeze()',
  'motion01.reset();','if(folds03)folds03.reset();','staticFit05?.dispose()'])
  assert.ok(ctl.includes(word),word);
 assert.ok(room.includes('freezeDressFit05=()=>'));
 assert.ok(room.includes('auditGaitDress02();'));
 assert.ok(room.includes('after.actualSkinnedDressBodyTriangleCrossings>before.actualSkinnedDressBodyTriangleCrossings'));
 assert.ok(room.includes('outfit.restoreDressFit05();'));
 assert.ok(view.includes('window.ccWardrobeDressFreeze05=()=>'));
 assert.ok(view.includes("get('dressFit')==='after'"));
 assert.ok(view.includes('current().generation!==pre.generation'));
 assert.ok(html.includes('id="dress-freeze"'));
 assert.doesNotMatch(view,/supabase\.auth|localStorage\.setItem\(/);
});
