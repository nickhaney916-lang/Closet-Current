import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {basewearUnderAnatomicalDress,shouldRevealAnatomicalDressOpenings}
 from '../research/three-d-26/basewear-openings.mjs';

const dressed=()=>({mode:'dress',dress:{
 sourceId:'commons-0053',sourceSHA256:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
 anatomicalDress:true,releaseAuthorized:false}});

test('Only the exact SHA-verified, physically sleeveless research dress can reveal neutral clay at armholes',()=>{
 assert.equal(shouldRevealAnatomicalDressOpenings(dressed()),true);
 for(const data of [
  {mode:'shirt-pants'}, {mode:'none'}, {mode:'pants'},
  {mode:'dress',dress:{...dressed().dress,anatomicalDress:undefined}},
  {mode:'dress',dress:{...dressed().dress,sourceId:'commons-0003'}},
  {mode:'dress',dress:{...dressed().dress,sourceSHA256:'invalid'}},
  {mode:'dress',dress:{...dressed().dress,releaseAuthorized:true}}
 ])assert.equal(shouldRevealAnatomicalDressOpenings(data),false);
 assert.equal(shouldRevealAnatomicalDressOpenings(dressed(),{enabled:false}),false);
});

test('Verified dress reveals body-colored upper armhole edges while preserving central chest and lower coverage',()=>{
 for(const sx of [-1,1]){
  const before=basewearUnderAnatomicalDress({x:sx*.23,y:1.52,dressActive:false});
  const after=basewearUnderAnatomicalDress({x:sx*.23,y:1.52,dressActive:true});
  assert.ok(before.coverage>.05,'Unchanged training basewear was visible');
  assert.ok(after.coverage<before.coverage*.4,'Real sleeveless dress should expose clay shoulder instead of green training top');
 }
 for(const coord of [
  {x:0,y:1.22}, {x:.1,y:1.28}, {x:.12,y:1.37},
  {x:0,y:.89}, {x:.18,y:.95}
 ]){
  const a=basewearUnderAnatomicalDress({...coord,dressActive:false});
  const b=basewearUnderAnatomicalDress({...coord,dressActive:true});
  assert.ok(a.coverage>.1);assert.ok(Math.abs(a.coverage-b.coverage)<1e-8,
   'Do not expose chest or pelvis because a dress was applied');
 }
});

test('New V-shaped skin view at center neckline is bounded to upper chest; no source pixels modified',()=>{
 const under=basewearUnderAnatomicalDress({x:0,y:1.60,dressActive:false});
 const exposed=basewearUnderAnatomicalDress({x:0,y:1.60,dressActive:true});
 assert.ok(under.coverage>.2);assert.ok(exposed.coverage<under.coverage*.15);
 assert.equal(exposed.releaseAuthorized,false);
 for(const args of [{x:NaN,y:1.5},{x:0,y:Infinity},{x:1,y:1.2,dressActive:'dress'}])
  assert.throws(()=>basewearUnderAnatomicalDress(args));
});

test('Existing source-licensed dress mesh, cloth shaders and anatomical GLB assets are unchanged',async()=>{
 const [showroom,controller,demo,body]=await Promise.all([
  readFile('research/three-d-15/showroom.mjs','utf8'),
  readFile('research/three-d-15/outfit-controller.mjs','utf8'),
  readFile('research/three-d-15/demo.mjs','utf8'),
  readFile('research/three-d-26/basewear-openings.mjs','utf8')
 ]);
 assert.match(showroom,/shader\.uniforms\.uDressOpening=dressOpeningUniform/);
 assert.match(showroom,/float openSkin=max\(shoulderExposure,neckExposure\)\*uDressOpening/);
 assert.match(showroom,/torso\*\(1\.0-openSkin\)\+shorts/);
 assert.match(showroom,/dressOpeningUniform\.value=shouldRevealAnatomicalDressOpenings\(s,\{enabled:dressBasewear\}\)\?1:0/);
 assert.match(showroom,/canvas\.dataset\.dressSkinOpenings/);
 assert.match(demo,/dressBasewear:new URLSearchParams\(location\.search\)\.get\('dressBasewear'\)!=='before'/);
 assert.match(controller,/fitAnatomicalDress/);
 assert.match(controller,/shapePhysicalDressNeckline/);
 assert.match(body,/releaseAuthorized:false/);
 for(const text of [showroom,demo,body]){
  for(const pattern of [/supabase\.co/,/indexedDB\.open/,/getUserMedia/,/openai\.com/,/sendBeacon/])
   assert.doesNotMatch(text,pattern);
 }
});
