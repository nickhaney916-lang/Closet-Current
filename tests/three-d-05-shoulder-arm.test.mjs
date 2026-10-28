import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildSweptSleeve,sleeveCenterline} from '../research/three-d-05/swept-sleeve.mjs';
import {buildAvatarScene} from '../research/three-d-01/geometry.mjs';
const garment=scene=>scene.parts.find(p=>p.name==='shirt torso');
test('actual sloping arm cross-sections replace horizontally stacked cylinders',()=>{
 for(const body of ['adult','youth'])for(const side of [-1,1]){
  const scale=body==='adult'?1:.91;
  const g=buildSweptSleeve({side,shoulderScale:scale});
  assert.equal(g.surface,'swept-circumferential-mesh-not-horizontal-cylinders');
  assert.equal(g.material.photographed,false);
  assert.equal(g.releaseAuthorized,false);
  assert.ok(g.indices.length>500);
  assert.equal(g.vertices.length%9,0);
  assert.ok([...g.vertices].every(Number.isFinite));
  assert.ok([...g.indices].every(i=>i<g.vertices.length/9));
  const first=Array.from({length:33},(_,i)=>g.vertices[i*9+1]);
  assert.ok(Math.max(...first)-Math.min(...first)>.005,'Ring must be tilted across sleeve, not a horizontal disc');
  const centers=g.crossSectionCenters;
  assert.ok(centers.length>=6);
  assert.ok(centers.every(p=>p.ringNormal[1]>.70),'Sleeve rings must face along the tilted arm axis');
  assert.ok(centers.some(p=>Math.abs(p.ringNormal[0])>.10),'At least one tilted ring is required');
  assert.ok(centers.every(p=>p.rx>=.105*scale),'Swept sleeve must encompass generic arm circumference');
  assert.ok(centers[0].rx<centers.at(-1).rx,'Wrist should be narrower than shoulder');
  assert.ok(centers[0].y<=1.25&&centers.at(-1).y>=2.15);
 }
});
test('shoulder attachment overlaps body torso without detached tube mouth',()=>{
 for(const body of ['adult','youth']){
  const model=buildAvatarScene({type:'shirt',body,sleeveLength:'long'});
  const shell=garment(model);
  assert.ok(shell,'Missing center chest');
  const radius=body==='adult'?.307:.307*.91;
  for(const side of [-1,1]){
   const sleeve=model.parts.find(p=>p.name==='shirt sleeve '+side);
   const shoulder=sleeve.crossSectionCenters.at(-1);
   const x=Math.abs(shoulder.x);
   assert.ok(x-shoulder.rx<radius-.05,'Shoulder and torso need finite material overlap');
   assert.ok(x+shoulder.rx>radius,'Sleeve must extend outside shoulder');
   assert.ok(Math.abs(shoulder.y-2.19)<.06,'Shoulder seam should follow torso slope');
  }
  assert.equal(model.parts.filter(p=>p.surface?.startsWith('swept-')).length,2);
  assert.equal(model.parts.filter(p=>p.name.startsWith('body hand ')).length,2);
 }
});
test('long sleeves reach cuffs and expose distinct neutral hands only after sleeve',()=>{
 const model=buildAvatarScene({type:'shirt',sleeveLength:'long'});
 const sleeves=model.parts.filter(p=>p.name.startsWith('shirt sleeve '));
 const hands=model.parts.filter(p=>p.name.startsWith('body hand '));
 assert.equal(sleeves.length,2);assert.equal(hands.length,2);
 for(const sleeve of sleeves){
  assert.ok(sleeve.bounds.minY<1.25&&sleeve.bounds.maxY>2.15);
  assert.deepEqual(sleeve.photoRegion,[0,0,1,1]);
  assert.ok(hands.some(h=>h.material.photographed===false));
 }
 assert.equal(model.parts.filter(p=>p.material.photographed).length,1,'Source photo stays on chest only');
});
test('short sleeve remains explicit while youth and adult use appropriately scaled templates',()=>{
 const adult=buildAvatarScene({type:'shirt',body:'adult',sleeveLength:'short'});
 const youth=buildAvatarScene({type:'shirt',body:'youth',sleeveLength:'long'});
 assert.ok(adult.parts.filter(p=>p.name.startsWith('shirt sleeve ')).every(p=>p.bounds.minY>1.75));
 assert.ok(youth.parts.filter(p=>p.name.startsWith('shirt sleeve ')).every(p=>p.crossSectionCenters.at(-1).x<=.33));
 assert.equal(adult.humanVisualApproval,false);
 assert.equal(youth.releaseAuthorized,false);
 for(const args of [{side:0},{length:'guessed'},{shoulderScale:0},{shoulderScale:2},{segments:6},{color:[255,0,0]}])
  assert.throws(()=>buildSweptSleeve(args));
 assert.throws(()=>buildAvatarScene({type:'shirt',sleeveLength:'unsure'}));
});
test('source photograph logo projection has fixed body width instead of shrinking across collar rings',()=>{
 const m=garment(buildAvatarScene({type:'shirt',sleeveLength:'long'}));
 const rings=new Map();
 for(let i=0;i<m.vertices.length;i+=9){
  const y=m.vertices[i+1].toFixed(3);
  if(!rings.has(y))rings.set(y,[]);
  rings.get(y).push(m.vertices[i+6]);
 }
 const widest=[...rings.values()].find(a=>Math.max(...a)-Math.min(...a)>.85);
 const collar=[...rings.entries()].find(([y])=>Number(y)>2.275);
 assert.ok(widest,'Need broad enough torso/front source region');
 assert.ok(collar&&Math.max(...collar[1])-Math.min(...collar[1])<.40,
  'Collar should not re-stretch full chest print over narrow neckline');
 assert.ok(Math.max(...m.vertices)<5);
});
test('3D05 browser exposure is source-independent; existing trust, provenance and privacy remain',async()=>{
 const [s,g,d]=await Promise.all([
  readFile('research/three-d-05/swept-sleeve.mjs','utf8'),
  readFile('research/three-d-01/geometry.mjs','utf8'),
  readFile('research/three-d-02/demo.mjs','utf8')
 ]);
 assert.match(g,/buildSweptSleeve/);
 assert.match(d,/dataset\.sweptSleeves/);
 assert.match(d,/dataset\.mannequinHands/);
 assert.match(d,/event\.isTrusted/);
 for(const x of [s,g,d]){
  for(const re of [/localStorage/,/indexedDB/,/sendBeacon/,/supabase\.co/,/openai\.com/,/getUserMedia/,/jsdelivr/,/unpkg\.com/])
   assert.doesNotMatch(x,re);
 }
});
