import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {settleGravityTarget10,GRAVITY_REST10,applyPhotographedGravityRest10}
 from '../research/shirt-flow-10/gravity-rest-equilibrium.mjs';
test('Real source cloth converges to a NONZERO resting gravity displacement and is deterministic',()=>{
 const first=settleGravityTarget10(),second=settleGravityTarget10();
 assert.deepEqual(first,second);
 assert.equal(first.nonzeroGravityEquilibrium,true);
 assert.ok(first.worldEquilibriumMeters>.0074&&first.worldEquilibriumMeters<=.00755);
 assert.ok(first.iterations>=GRAVITY_REST10.stableFrames&&first.iterations<GRAVITY_REST10.maxSteps);
 assert.equal(first.originalPhotoPreserved,true);
 assert.equal(first.releaseAuthorized,false);
 assert.notEqual(first.worldEquilibriumMeters,0,'No reverting gravity rest to original unadjusted shirt');
});
test('Reject target exceeding source-authentic garment displacement budget',()=>{
 for(const x of [0,-.1,.0001,NaN,Infinity,.011])
  assert.throws(()=>settleGravityTarget10({targetMeters:x}),/bounded nonzero target/);
});
test('No source 3D shirt, SHA provenance or 163-bone rig = no gravity rest deform',()=>{
 assert.throws(()=>applyPhotographedGravityRest10({},{}),/original genuine/);
});
test('Outfit, 163-bone source, static frozen fit and real BVH are wired, optional by default',()=>{
 const m=readFileSync('research/shirt-flow-08/pose-conditioned-sleeves.mjs','utf8');
 const controller=readFileSync('research/shirt-flow-08/outfit-controller.mjs','utf8');
 const room=readFileSync('research/shirt-flow-08/showroom.mjs','utf8');
 const view=readFileSync('research/shirt-flow-08/photo-jeans-demo.mjs','utf8');
 const source=readFileSync('research/shirt-flow-10/gravity-rest-equilibrium.mjs','utf8');
 assert.ok(m.includes('gravityRest10=false'));
 assert.ok(m.includes('applyPhotographedGravityRest10(root,shirt'));
 assert.ok(m.includes('contactFactory(root,shirt,pants)'));
 assert.ok(m.includes('shirt.stats.poseTriangleContact?.after?.count!==0'));
 assert.ok(m.includes('frozen={pose,meshes:capture()'));
 assert.ok(controller.includes('gravityRest10=false'));
 assert.ok(room.includes('gravityRest10=false'));
 assert.ok(view.includes("get('gravityRest')==='after'"));
 assert.ok(view.includes('window.ccShirtGravityRest10=fraction'));
 for(const field of ['panelPosition','panelNormal','skinIndex','skinWeight','sourceHemSwing08',
   'actualPhotographedSource3DEquilibrium:true','originalPhotoAttributesUnchanged',
   'GRAVITY_REST10.maxMeters','originalPhotoPixelsUnchanged:true'])
  assert.ok(source.includes(field),'Source image / true anatomical contract: '+field);
 assert.doesNotMatch(view,/supabase\.auth|localStorage\.setItem\(/);
});
