import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildAvatarScene} from '../research/three-d-01/geometry.mjs';
function part(scene,substr){const p=scene.parts.filter(x=>x.name.includes(substr));assert.ok(p.length>0,'missing '+substr);return p;}
test('real licensed long sleeve garment has source-color sleeves down to wrists, not copy-pasted logo',()=>{
 for(const body of ['adult','youth']){
  const scene=buildAvatarScene({type:'shirt',body,sleeveLength:'long'});
  const torso=part(scene,'shirt torso')[0],sleeves=part(scene,'shirt sleeve');
  assert.equal(torso.material.photographed,true,'real image retained only on torso');
  assert.equal(sleeves.length,2);
  assert.ok(sleeves.every(x=>x.material.photographed===false),'No repeat logos on sleeves');
  assert.ok(sleeves.every(x=>x.bounds.minY<=1.25),'Real shirt sleeve reaches wrist-height');
  assert.ok(sleeves.every(x=>x.bounds.maxY>=2.1));
  assert.equal(scene.parts.filter(x=>x.material.photographed).length,1);
  const top=torso.vertices,ys=Array.from({length:top.length/9},(_,i)=>top[i*9+1]);
  assert.ok(Math.max(...ys)>2.25);
  const topRadius=Array.from({length:top.length/9},(_,i)=>[top[i*9+1],Math.abs(top[i*9])])
   .filter(x=>x[0]>2.25).map(x=>x[1]);
  assert.ok(Math.max(...topRadius)<.15,'Collar must narrow around neck, not remain a broad flat cylinder');
  assert.equal(scene.releaseAuthorized,false);
 }
});
test('generic short sleeve template remains available and does not pretend all garments are long sleeved',()=>{
 const scene=buildAvatarScene({type:'shirt',sleeveLength:'short'});
 assert.ok(part(scene,'shirt sleeve').every(x=>x.bounds.minY>=1.8));
 assert.ok(part(scene,'shirt sleeve').every(x=>!x.material.photographed));
 assert.throws(()=>buildAvatarScene({type:'shirt',sleeveLength:'guess'}));
});
test('dress separately maps bodice and skirt to nonidentical image regions; sleeves not print repeated',()=>{
 const scene=buildAvatarScene({type:'dress'});
 const bodice=part(scene,'dress bodice')[0],skirt=part(scene,'dress skirt')[0];
 assert.deepEqual(bodice.photoRegion,[0,0,1,.49]);
 assert.deepEqual(skirt.photoRegion,[0,.39,1,.61]);
 assert.ok(bodice.material.photographed&&skirt.material.photographed);
 assert.deepEqual(part(scene,'dress sleeve').map(p=>p.material.photographed),[false,false]);
});
test('source median colors cover non-photo sleeves and photo print only on verified torso',async()=>{
 const renderer=await readFile('research/three-d-01/webgl-renderer.mjs','utf8');
 assert.match(renderer,/m\.part==='garment'&&matchedColor/);
 assert.match(renderer,/photoMeshes:meshes\.filter/);
 assert.match(renderer,/m\.material\.photographed&&projection/);
 assert.match(renderer,/smoothstep\(\.30,\.75,vFront\)/);
 assert.match(renderer,/baseBottom=1-crop\[1\]-crop\[3\]/);
 assert.match(renderer,/baseBottom\+\(1-region\[1\]-region\[3\]\)\*crop\[3\]/);
});
test('no new source file or photo processing, owner tracking, account storage or paid AI',async()=>{
 const files=['research/three-d-01/geometry.mjs','research/three-d-01/webgl-renderer.mjs',
 'research/three-d-02/demo.mjs'];
 for(const file of files){
  const src=await readFile(file,'utf8');
  for(const bad of [/localStorage/,/indexedDB/,/sendBeacon/,/supabase\.co/,/getUserMedia/,/openai\.com/,/unpkg\.com/])
   assert.doesNotMatch(src,bad);
 }
 const demo=await readFile('research/three-d-02/demo.mjs','utf8');
 assert.match(demo,/choice\.type==='shirt'\?'long':'short'/);
 assert.match(demo,/r\.sleeveLength/);
 assert.match(demo,/event\.isTrusted/);
});
