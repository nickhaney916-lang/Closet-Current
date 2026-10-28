import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {TYPES,SLOTS,buildAvatarScene,validateReviewedTexture}
 from '../research/three-d-01/geometry.mjs';
import {adaptGarmentFor3D} from '../research/three-d-01/garment-adapter.mjs';
const sha='a'.repeat(64);
const sample=(size=64,opaque=false)=>{
 const rgba=new Uint8ClampedArray(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const at=(y*size+x)*4;
  rgba[at]=120;rgba[at+1]=55;rgba[at+2]=77;
  rgba[at+3]=opaque||x>4&&x<size-5&&y>3&&y<size-4?255:0;
 }
 return rgba;
};
test('three true 3D templates include full-circumference garment surfaces plus body, never 2D billboards',()=>{
 assert.deepEqual(TYPES,['shirt','pants','dress']);
 assert.deepEqual(SLOTS,{shirt:'top',pants:'bottom',dress:'dress'});
 for(const type of TYPES)for(const body of ['adult','youth']){
  const scene=buildAvatarScene({type,body});
  assert.ok(scene.triangles>300);
  assert.ok(scene.parts.length>=9);
  assert.ok(scene.parts.some(p=>p.part==='garment'));
  assert.ok(scene.parts.some(p=>p.part==='body'));
  assert.equal(scene.releaseAuthorized,false);
  assert.equal(scene.humanVisualApproval,false);
  assert.equal(scene.rearMaterial,'inferred-neutral-color');
  for(const mesh of scene.parts){
   assert.equal(mesh.stride,9);
   assert.equal(mesh.indices.length%3,0);
   assert.equal(mesh.vertices.length%mesh.stride,0);
   assert.ok(mesh.vertices.length/9>15);
   assert.ok(mesh.indices.length>100);
   assert.ok([...mesh.vertices].every(Number.isFinite));
   assert.ok([...mesh.indices].every(i=>i<mesh.vertices.length/9));
   const depth=new Set();const sides=new Set();
   for(let i=0;i<mesh.vertices.length;i+=9){depth.add(mesh.vertices[i+2].toFixed(2));sides.add(mesh.vertices[i].toFixed(2));}
   assert.ok(depth.size>3&&sides.size>3,'Must be curved spatial mesh, not flat photo plane');
  }
 }
});
test('invalid geometry, unknown source slot, unsupported figure and unsafe types rejected',()=>{
 for(const arg of [{type:'shoes'},{type:'shirt',body:'unsafe'},{type:'dress',photoEnabled:'true'}])
  assert.throws(()=>buildAvatarScene(arg));
});
test('exact original 2D cutout integrity gate is reused for 3D and never certifies photos',()=>{
 for(const [type,slot] of [['Tops','top'],['Bottoms','bottom'],['Dresses','dress']]){
  const allowed=adaptGarmentFor3D({
   category:type,slot,sourceSHA256:sha,reviewConfirmed:true,
   sampleRGBA:sample(),sampleWidth:64,sampleHeight:64
  });
  assert.equal(allowed.status,'preview');
  assert.equal(allowed.sourceSHA256,sha);
  assert.equal(allowed.alphaStatus,'REVIEW_HARD_BINARY_EDGE');
  assert.equal(allowed.humanVisualApproval,false);
  assert.equal(allowed.releaseAuthorized,false);
  assert.equal(allowed.backFabric,'unverified-plain-material');
  assert.ok(!Object.hasOwn(allowed,'rgba')&&!Object.hasOwn(allowed,'originalJPEG'));
  const opaque=adaptGarmentFor3D({category:type,slot,sourceSHA256:sha,reviewConfirmed:true,
   sampleRGBA:sample(64,true),sampleWidth:64,sampleHeight:64});
  assert.equal(opaque.status,'fallback');
  assert.equal(opaque.reason,'opaque-or-unsafe-cutout');
 }
});
test('unreviewed sources, wrong slot, fake source binding and shoes cannot be promoted into 3D fit',()=>{
 for(const overrides of [
  {reviewConfirmed:false},{slot:'shoes'},{sourceSHA256:'xx'},{category:'Shoes'},
  {sampleRGBA:sample(64,true)}
 ]){
  const params={category:'Tops',slot:'top',sourceSHA256:sha,reviewConfirmed:true,
   sampleRGBA:sample(),sampleWidth:64,sampleHeight:64,...overrides};
  const result=adaptGarmentFor3D(params);
  assert.equal(result.status,'fallback');
  assert.equal(result.releaseAuthorized,false);
 }
});
test('bounded pixel transparency checker rejects opaque photo and never auto-approves',()=>{
 for(const p of [
  {rgba:sample(),width:64,height:64,slot:'top',reviewConfirmed:true},
  {rgba:sample(64,true),width:64,height:64,slot:'top',reviewConfirmed:true},
  {rgba:sample(),width:64,height:64,slot:'shoes',reviewConfirmed:true},
  {rgba:sample(),width:64,height:64,slot:'top',reviewConfirmed:false}
 ]){
  const a=validateReviewedTexture(p);
  assert.equal(a.releaseAuthorized,false);
  assert.equal(a.allowed,p.reviewConfirmed===true&&p.slot==='top'&&p.rgba[3]!==255);
 }
});
test('no new cloud/photo writes, external asset delivery, personal avatar capture, or AI token use',async()=>{
 const paths=['geometry.mjs','garment-adapter.mjs','webgl-renderer.mjs','prototype.mjs'];
 for(const path of paths){
  const s=await readFile('research/three-d-01/'+path,'utf8');
  assert.doesNotMatch(s,/localStorage|indexedDB|sendBeacon|XMLHttpRequest|supabase\.co|camera\.getUserMedia|openai\.com|threejs\.org\/build|jsdelivr|unpkg/);
 }
 const demo=await readFile('research/three-d-01/prototype.mjs','utf8');
 assert.match(demo,/locked-photo-sources\.json/);
 assert.match(demo,/require|license|attribution/);
});
test('licensed actual benchmark filenames and image hashes remain source-pinned',async()=>{
 const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 for(const id of ['commons-0002','commons-0021','commons-0049']){
  const row=locked.find(x=>x.id===id);
  assert.ok(row?.verified&&row?.attribution?.license);
  assert.equal(row.image,id+'.jpg');
  assert.match(row.sha256,/^[0-9a-f]{64}$/);
 }
});
