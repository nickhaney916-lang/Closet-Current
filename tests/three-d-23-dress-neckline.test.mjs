import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {readFile} from 'node:fs/promises';
import {NECKLINE,neckDropForAngle,shapePhysicalDressNeckline}
 from '../research/three-d-23/dress-neckline.mjs';

function sampleDress(){
 const rings=9,segments=32,positions=[],rest=[],weights=[],skins=[],tris=[];
 for(let r=0;r<rings;r++)for(let j=0;j<=segments;j++){
  const a=j*Math.PI*2/segments,rx=r===rings-1?.123:r===rings-2?.28:.32;
  const y=.65+r*.125;
  positions.push(rx*Math.sin(a),y,.18*Math.cos(a));
  rest.push(rx*Math.sin(a),y,.18*Math.cos(a));
  weights.push(1,0,0,0);skins.push(0,0,0,0);
  if(r<rings-1&&j<segments){
   const n=r*(segments+1)+j,b=n+segments+1;
   tris.push(n,n+1,b,n+1,b+1,b);
  }
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 g.setAttribute('dressRest',new T.Float32BufferAttribute(rest,3));
 g.setAttribute('skinIndex',new T.Uint16BufferAttribute(skins,4));
 g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
 g.setIndex(tris);g.computeVertexNormals();
 const sk=new T.Skeleton(Array.from({length:28},()=>new T.Bone()));
 const mesh=new T.SkinnedMesh(g,new T.MeshBasicMaterial());mesh.bind(sk);
 return {mesh,stats:{sourceId:'commons-0053',ringCount:rings,
  releaseAuthorized:false,sourceSHA256:'a'.repeat(64),frontOriginalPixels:true,
  collisionValidated:false}};
}

test('physical V-center dip follows only *front* neck arc; never fabricates rear',()=>{
 assert.equal(neckDropForAngle(Math.PI),0);
 assert.ok(neckDropForAngle(Math.PI/2)<1e-12);
 assert.ok(Math.abs(neckDropForAngle(0)-.028)<1e-12);
 assert.ok(Math.abs(neckDropForAngle(2*Math.PI)-.028)<1e-12);
 assert.ok(neckDropForAngle(Math.PI/4)<.006);
 for(const x of [NaN,Infinity])assert.throws(()=>neckDropForAngle(x));
 assert.throws(()=>neckDropForAngle(0,{maxDropMeters:1}));
});

test('actual separate skinned garment has a V neckline; rear and UV, bones, index identical',()=>{
 const d=sampleDress(),m=d.mesh,g=m.geometry,stride=g.attributes.position.count/d.stats.ringCount;
 const before={positions:Array.from(g.getAttribute('position').array),
  rest:Array.from(g.getAttribute('dressRest').array),
  skin:Array.from(g.getAttribute('skinIndex').array),
  weights:Array.from(g.getAttribute('skinWeight').array),
  indices:Array.from(g.index.array),skeleton:m.skeleton,material:m.material};
 const top=(d.stats.ringCount-1)*stride,frontY=before.positions[top*3+1],
  back=top+(stride-1)/2,backY=before.positions[back*3+1],
  shoulder=top+(stride-1)/4,shoulderY=before.positions[shoulder*3+1];
 const shaped=shapePhysicalDressNeckline(d);
 assert.equal(shaped.mesh,m);
 assert.equal(shaped.stats.physicalFrontNeckline,true);
 assert.ok(shaped.stats.frontCenterNeckDrop>=.025&&shaped.stats.frontCenterNeckDrop<=.029);
 assert.equal(shaped.stats.unverifiedRearNecklineUnchanged,true);
 assert.ok(g.getAttribute('position').getY(top)<frontY-.025);
 assert.equal(g.getAttribute('position').getY(back),backY);
 assert.equal(g.getAttribute('position').getY(shoulder),shoulderY);
 assert.deepEqual(Array.from(g.getAttribute('dressRest').array),before.rest);
 assert.deepEqual(Array.from(g.getAttribute('skinIndex').array),before.skin);
 assert.deepEqual(Array.from(g.getAttribute('skinWeight').array),before.weights);
 assert.deepEqual(Array.from(g.index.array),before.indices);
 assert.equal(m.skeleton,before.skeleton);assert.equal(m.material,before.material);
 assert.equal(shaped.stats.collisionValidated,false);
 assert.equal(shaped.stats.humanVisualApproval,false);
 assert.equal(shaped.stats.releaseAuthorized,false);
 assert.equal(NECKLINE.maxAffectedRings,1);
});
test('exact before candidate stays byte-identical to original dress geometry',()=>{
 const d=sampleDress(),before=Array.from(d.mesh.geometry.attributes.position.array);
 const old=shapePhysicalDressNeckline(d,{enabled:false});
 assert.equal(old,d);assert.deepEqual(Array.from(d.mesh.geometry.attributes.position.array),before);
});
test('failed source metadata or garment anatomy aborts without modifying source',()=>{
 for(const field of [
  {releaseAuthorized:true},{sourceId:'commons-0003'},{ringCount:0}
 ]){
  const d=sampleDress(),source=Array.from(d.mesh.geometry.attributes.position.array);
  Object.assign(d.stats,field);
  assert.throws(()=>shapePhysicalDressNeckline(d));
  assert.deepEqual(Array.from(d.mesh.geometry.attributes.position.array),source);
 }
 const d=sampleDress();assert.throws(()=>shapePhysicalDressNeckline(d,{maxDropMeters:.5}));
 assert.throws(()=>shapePhysicalDressNeckline(d,{enabled:1}));
});
test('dress integration is isolated; shirt and photograph sources remain unchanged',async()=>{
 const [controller,viewer,demo,source]=await Promise.all([
 readFile('research/three-d-15/outfit-controller.mjs','utf8'),
 readFile('research/three-d-15/showroom.mjs','utf8'),
 readFile('research/three-d-15/demo.mjs','utf8'),
 readFile('research/three-d-23/dress-neckline.mjs','utf8')
 ]);
 assert.match(controller,/shapePhysicalDressNeckline\(raw,\{enabled:dressNeckline\}\)/);
 assert.match(controller,/if\(next==='dress'\)/);
 assert.match(viewer,/enableCuffBridge,naturalFit,necklineSeams,dressNeckline/);
 assert.match(controller,/finishNecklineAndSeams\(built\.shirt,root\)/);
 assert.match(demo,/necklineSeams'\)!=='before'/);
 assert.match(demo,/dressNeckline'\)!=='before'/);
 assert.match(demo,/event\.isTrusted/);
 assert.doesNotMatch(source,/localStorage|indexedDB|Supabase|fetch\(|XMLHttpRequest|openai\.com|sendBeacon/);
 assert.match(source,/originalPhotoCoordinatesUnchanged:true/);
});
