import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {trialCategoryRigAlignment89 as trial} from '../research/parallel89/category-rig-alignment89.mjs';
import {auditCategoryStaticContact89 as audit,realTriangleContactControl89 as control} from '../research/parallel89/category-static-body-contact89.mjs';
import {approachCategoryBody89 as approach} from '../research/parallel89/category-near-body-placement89.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const donor=resolve(process.argv[2]??'.'),here=resolve('.');
assert.notEqual(donor,here);
const engine=process.env.P89_BROWSER;assert.ok(['chromium','webkit'].includes(engine));
const hashes={female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'};
const rigs=Object.fromEntries(Object.keys(hashes).map(kind=>[kind,readFileSync(resolve(donor,'research/three-d-06/models',kind+'-cc0-rigged.glb'))]));
for(const [k,b] of Object.entries(rigs))assert.equal(sha(b),hashes[k]);
const server=createServer((req,res)=>{
 try{
  const p=new URL(req.url,'http://127.0.0.1').pathname;
  res.setHeader('Cache-Control','no-store');
  if(p==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>');return}
  const k=/^\/rig\/(female|male)$/.exec(p);
  if(k){res.setHeader('Content-Type','model/gltf-binary');res.end(rigs[k[1]]);return}
  if(p.startsWith('/node_modules/three/')&&!p.includes('..')&&p.endsWith('.js')){res.setHeader('Content-Type','text/javascript');res.end(readFileSync(resolve(here,p.slice(1))));return}
  throw Error('not allowed');
 }catch{res.writeHead(404);res.end('not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
let browser;const rows=[],external=[],errors=[];
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true});
 const page=await browser.newPage();
 page.on('request',r=>{if(/^https?:/i.test(r.url())&&!r.url().startsWith(origin+'/'))external.push(r.url())});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin);
 const registry=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
 for(const [kind,rigBytes] of Object.entries(rigs)){
  const b=await page.evaluate(async ({kind,expected})=>{
   const THREE=await import('three'),{GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
   const bytes=await (await fetch('/rig/'+kind)).arrayBuffer();
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
   if(digest!==expected)throw Error('actual rig byte hash mismatch');
   const {scene}=await new GLTFLoader().parseAsync(bytes,'/rig/');
   scene.updateMatrixWorld(true);
   const positions=[],indices=[];let parts=0;
   scene.traverse(m=>{
    if(!m.isSkinnedMesh)return;
    if(m.skeleton.bones.length!==163)throw Error('original rig bone count invalid');
    m.skeleton.update();m.updateWorldMatrix(true,false);
    const p=m.geometry.getAttribute('position'),idx=m.geometry.getIndex(),offset=positions.length/3;
    if(!p||p.count<3)throw Error('original rig position absent');
    for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);m.applyBoneTransform(i,v);v.applyMatrix4(m.matrixWorld);positions.push(v.x,v.y,v.z)}
    for(let i=0;i<(idx?.count??p.count);i++)indices.push(offset+(idx?idx.getX(i):i));
    parts++;
   });
   if(!parts||indices.length%3||!positions.every(Number.isFinite))throw Error('incomplete real body');
   return {positions,indices,parts,digest};
  },{kind,expected:hashes[kind]});
  assert.equal(b.digest,hashes[kind]);assert.ok(b.indices.length/3>50000);
  const bodyPositions=new Float64Array(b.positions),bodyIndices=new Uint32Array(b.indices);
  const maxZ=bodyPositions.reduce((m,v,i)=>i%3===2?Math.max(m,v):m,-Infinity);
  for(const id of ['commons-0001','commons-0003','commons-0016','commons-0023','commons-0041','commons-0053']){
   const originalBytes=readFileSync(new URL('../benchmark/fixtures/'+id+'.jpg',import.meta.url)),originalSHA=sha(originalBytes);
   const r=await trial({sourceId:id,originalBytes,lockedRecord:registry.find(x=>x.id===id),rigKind:kind,rigBytes});
   assert.equal(r.status,'LICENSED_RIG_LANDMARK_PLACEMENT_TRIAL_ONLY');
   const t=r.sourceVolume.topology,sourcePositions=t.positions,sourceIndices=t.indices;
   const input={bodyPositions,bodyIndices,sourcePositions,sourceIndices,scale:r.placement.scale,translation:r.placement.translation,sourcePlaneIndexCount:r.sourceVolume.sourcePlane.indices.length};
   const originalPositions=sourcePositions.slice(),originalIndices=sourceIndices.slice();
   const moved=approach(input);
   assert.equal(moved.consumer3DAdmitted,false);assert.equal(moved.physicalFitProved,false);
   if(moved.status==='CONSERVATIVE_CAMERA_AXIS_APPROACH_RESEARCH_ONLY'){
    assert.ok(moved.shift>0);assert.ok(moved.finalConservativeGap>0&&moved.finalConservativeGap<moved.initialConservativeGap);
    assert.equal(moved.translation[0],input.translation[0]);assert.equal(moved.translation[1],input.translation[1]);assert.equal(moved.scale,input.scale);
    assert.equal(audit({...input,translation:moved.translation}).status,'NO_DISCRETE_SURFACE_CONTACT_DETECTED');
   }else assert.equal(moved.status,'NEAR_BODY_APPROACH_BLOCKED');
   assert.deepEqual(sourcePositions,originalPositions);assert.deepEqual(sourceIndices,originalIndices);
   const baseline=audit(input);assert.equal(baseline.bodyFacesSubmitted,bodyIndices.length/3);assert.equal(baseline.garmentFacesSubmitted,sourceIndices.length/3);
   const c=control(input);assert.ok(c,'positive actual triangle contact control unavailable');
   const positive=audit({...input,translation:c.translation});assert.equal(positive.status,'STATIC_CONTACT_VETO');
   assert.equal(approach({...input,translation:c.translation}).status,'NEAR_BODY_APPROACH_BLOCKED');
   let minZ=Infinity;for(let i=2;i<sourcePositions.length;i+=3)minZ=Math.min(minZ,sourcePositions[i]*input.scale);
   const separated=audit({...input,translation:[input.translation[0],input.translation[1],maxZ-minZ+1]});
   assert.equal(separated.status,'NO_DISCRETE_SURFACE_CONTACT_DETECTED');
   for(const a of [baseline,positive,separated]){assert.equal(a.consumer3DAdmitted,false);assert.equal(a.physicalFitProved,false);assert.equal(a.signedOutsideBodyProved,false)}
   assert.equal(sha(originalBytes),originalSHA);assert.equal(sha(rigBytes),hashes[kind]);
   rows.push({approach:moved,id,kind,originalSHA,rigSHA:hashes[kind],bodyFaces:baseline.bodyFacesSubmitted,garmentFaces:baseline.garmentFacesSubmitted,baseline:baseline.status,baselineRegion:baseline.firstObservedCandidateRegion,baselineDecision:baseline.contact.contactDecision,positive:positive.status,positiveControlClass:c.classification,separated:separated.status,consumer3DAdmitted:false});
   console.log('NEAR_BODY_ROW '+JSON.stringify(rows.at(-1)));
  }
 }
 assert.equal(rows.length,12);assert.ok(rows.some(r=>r.approach.status==='CONSERVATIVE_CAMERA_AXIS_APPROACH_RESEARCH_ONLY'),'no real near-body improvement');assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 const report={engine,rows,actualRigBytesVerified:true,originalPhoto2DFallbackRequired:true,physicalFitProved:false,consumer3DAdmitted:false,familyAlpha:'HOLD'};
 mkdirSync('benchmark/m2-category-near-body-HOLD',{recursive:true});writeFileSync('benchmark/m2-category-near-body-HOLD/'+engine+'.json',JSON.stringify(report,null,2));
}finally{await browser?.close();await new Promise(ok=>server.close(ok))}
