import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createDisposableUpperTorsoWorldTrial60,
 UPPER_TORSO_TRIAL_OUTWARD60} from
 '../research/mission2-source-length/upper-torso-clearance-trial60.mjs';

test('C60: actual original source WORLD buffer is unchanged and moved only within torso height with <=6mm displacement',()=>{
 const p=new Float32Array([
  .30,.5,0, -.3,.5,0, 0,.5,.3,
  .25,-.3,0,0,-.3,.25,-.25,-.3,0,
  0,1.4,.3,.3,1.4,0,-.3,1.4,0
 ]);
 const original=p.slice(),trial=createDisposableUpperTorsoWorldTrial60(p,{
  neck:[0,1.1,0],spine:[0,0,0]
 });
 assert.equal(UPPER_TORSO_TRIAL_OUTWARD60,.006);
 assert.ok(trial.movedVertices>=3);
 assert.ok(trial.maxAppliedMeters>0&&trial.maxAppliedMeters<=.006002);
 assert.deepEqual(p,original);
 assert.notStrictEqual(trial.world,p);
 assert.ok(trial.world[0]>p[0]);
 assert.ok(trial.world[3]<p[3]);
 assert.deepEqual(Array.from(trial.world.slice(9)),Array.from(original.slice(9)),
  'lower skirt and above-neck unused photograph remain byte-for-byte unchanged');
 assert.equal(trial.originalPhotoOrShaderTextureChanged,false);
 assert.equal(trial.originalPhotographedSourceMeshChanged,false);
 assert.equal(trial.sourceClothFitCertified,false);
 assert.equal(trial.releaseAuthorized,false);
 assert.equal(trial.familyAlpha,'HOLD');
});
test('C60: zero radial axis or below skirt produces no invented displacement',()=>{
 const p=new Float32Array([0,.5,0,0,-.9,0,0,1.9,0]);
 const v=createDisposableUpperTorsoWorldTrial60(p,{
  neck:[0,1.1,0],spine:[0,0,0]});
 assert.equal(v.movedVertices,0);
 assert.equal(v.maxAppliedMeters,0);
 assert.deepEqual(v.world,p);
 assert.notStrictEqual(v.world,p);
});
test('C60: genuine narrow neck-to-spine anatomical height still permits smooth source dry-run without fabric edits',()=>{
 const source=new Float32Array([
  .15,.04,0,.17,.05,.03,.13,.08,-.01,
  -.15,.04,0,-.17,.05,.03,-.13,.08,-.01
 ]);
 const snapshot=source.slice(),trial=createDisposableUpperTorsoWorldTrial60(source,{
  neck:[0,.13,0],spine:[0,0,0]
 });
 assert.ok(trial.movedVertices>=3);
 assert.ok(trial.maxAppliedMeters>.0001&&trial.maxAppliedMeters<=.006002);
 assert.deepEqual(source,snapshot);
 assert.equal(trial.originalPhotographedSourceMeshChanged,false);
 assert.equal(trial.releaseAuthorized,false);
});
test('C60: invalid original photo source, 163-bone anatomical reference and forged excessive move rejected',()=>{
 const normal=new Float32Array([.2,.2,0,.3,.3,0,.4,.4,0]);
 for(const run of [
  ()=>createDisposableUpperTorsoWorldTrial60([],{neck:[0,1,0],spine:[0,0,0]}),
  ()=>createDisposableUpperTorsoWorldTrial60(new Float32Array(7),{neck:[0,1,0],spine:[0,0,0]}),
  ()=>createDisposableUpperTorsoWorldTrial60(normal,{neck:[0,0,0],spine:[0,0,0]}),
  ()=>createDisposableUpperTorsoWorldTrial60(normal,{neck:[0,NaN,0],spine:[0,0,0]}),
  ()=>createDisposableUpperTorsoWorldTrial60(normal,{neck:[0,.0005,0],spine:[0,0,0]}),
  ()=>createDisposableUpperTorsoWorldTrial60(normal,{neck:[0,1,0],spine:[0,0,0],outwardMeters:.02}),
  ()=>createDisposableUpperTorsoWorldTrial60(normal,{neck:[0,1,0],spine:[0,0,0],outwardMeters:-.001}),
  ()=>createDisposableUpperTorsoWorldTrial60(normal,{neck:[0,1,0],spine:[0,0,0],outwardMeters:'6mm'}),
  ()=>createDisposableUpperTorsoWorldTrial60(
   new Float32Array([NaN,.3,0,.1,.5,0,.2,.7,0]),
   {neck:[0,1.1,0],spine:[0,0,0]})
 ])assert.throws(run);
});

test('C60: native browser-imported original photographed source fit helper has no Node-only imports',async()=>{
 const helper=await readFile('research/mission2-source-length/upper-torso-clearance-trial60.mjs','utf8');
 assert.doesNotMatch(helper,/from\\s*['\\"]node:|import\\s*['\\"]node:|require\\s*\\(/);
 assert.doesNotMatch(helper,/\\bprocess\\.|\\bBuffer\\./);
 const installer=await readFile('scripts/install-mission2-actual-photo-contact52.mjs','utf8');
 assert.match(installer,/upper-torso-clearance-trial60\\.mjs/);
});
