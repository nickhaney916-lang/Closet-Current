import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LICENSED_SHIRT,BODY_PREVIEW,requireAnatomicalShirtPreview,
 buildSourceUV,imageUVFromBoundingCrop} from '../research/three-d-07/rig-shirt-transfer.mjs';
function valid(){
 return {id:LICENSED_SHIRT,type:'shirt',sourceSHA256:'a'.repeat(64),
  ownerApproved:false,releaseAuthorized:false,humanVisualApproval:false,
  realFabricTexture:true,cutout:{decode:async()=>{}},
  cropRect:[.1,.2,.8,.65],baseColor:[.12,.11,.1]};
}
test('Only explicitly acknowledged original-photo Work47 shirt source may enter human rig',()=>{
 const item=valid();
 assert.throws(()=>requireAnatomicalShirtPreview(item),/source-hash-verified/);
 const good=requireAnatomicalShirtPreview(item,{acknowledged:true});
 assert.equal(good.sourceSHA256,item.sourceSHA256);
 assert.equal(good.id,LICENSED_SHIRT);
 assert.equal(good.ownerApproved,false);
 assert.equal(good.humanVisualApproval,false);
 assert.equal(good.releaseAuthorized,false);
 for(const invalid of [
  {id:'commons-0053'},{type:'dress'},{sourceSHA256:'unverified'},
  {ownerApproved:true},{releaseAuthorized:true},{humanVisualApproval:true},
  {realFabricTexture:false},{cutout:null},{cropRect:[.2,.6,.9,.9]},
  {baseColor:[200,.1,.2]}
 ]){
  assert.throws(()=>requireAnatomicalShirtPreview({...valid(),...invalid},{acknowledged:true}));
 }
});
test('Body-space front-only photo coordinates derive from existing source-alpha crop, no pixel editing',()=>{
 assert.deepEqual(buildSourceUV(0,BODY_PREVIEW.torsoBottom),[.5,0]);
 assert.deepEqual(buildSourceUV(0,BODY_PREVIEW.shoulderTop),[.5,1]);
 const u=imageUVFromBoundingCrop(0,BODY_PREVIEW.torsoBottom,[.1,.2,.8,.65]);
 assert.ok(Math.abs(u[0]-.5)<1e-8);
 assert.ok(Math.abs(u[1]-.15)<1e-8);
 const v=imageUVFromBoundingCrop(0,BODY_PREVIEW.shoulderTop,[.1,.2,.8,.65]);
 assert.ok(Math.abs(v[1]-.8)<1e-8);
 assert.throws(()=>buildSourceUV(NaN,1.2));
 assert.throws(()=>imageUVFromBoundingCrop(0,1.2,[NaN,1,0,1]));
});
test('Renderer uses *actual rigged anatomical surface* not paper doll or standalone flat avatar',async()=>{
 const src=await readFile('research/three-d-06/anatomical-showroom.mjs','utf8');
 assert.match(src,/requireAnatomicalShirtPreview/);
 assert.match(src,/new THREE\.Texture\(source\.textureImage\)/);
 assert.match(src,/tex\.colorSpace=THREE\.SRGBColorSpace/);
 assert.match(src,/uVerifiedTexture/);
 assert.match(src,/uVerifiedCrop/);
 assert.match(src,/vStudioBody\.z/);
 assert.match(src,/vStudioFacing/);
 assert.match(src,/transformedNormal/);
 assert.match(src,/new THREE\.WebGLRenderer/);
 assert.match(src,/isSkinnedMesh/);
 assert.match(src,/realGarmentGeometry:false/);
 assert.match(src,/const clearShirt=/);
 assert.match(src,/clearShirt\(\);\s*selected=obj/);
});
test('Original Work47 JPEG and PNG SHA identities stay required at the live research-preview click',async()=>{
 const [demo,loader]=await Promise.all([
  readFile('research/three-d-07/demo.mjs','utf8'),
  readFile('research/three-d-02/reviewed-texture.mjs','utf8')
 ]);
 assert.match(demo,/event\?\.isTrusted/);
 assert.match(demo,/readVerifiedAsset\('\/benchmark\/work47\/assets\/'\+LICENSED_SHIRT\+'\.jpg'/);
 assert.match(demo,/readVerifiedAsset\('\/benchmark\/work47\/assets\/'\+LICENSED_SHIRT\+'\.png'/);
 assert.match(demo,/loadLicensedCutout\(LICENSED_SHIRT/);
 assert.match(demo,/app\.applyShirt\(source,\{acknowledged:true\}\)/);
 assert.match(demo,/app\.clearShirt\(\)/);
 assert.match(loader,/adaptGarmentFor3D/);
 assert.match(loader,/cutoutSHA256/);
 assert.match(loader,/readVerifiedAsset/);
});
test('No production, auth, user image, cloud, service tokens or external runtime assets introduced',async()=>{
 const files=['research/three-d-07/rig-shirt-transfer.mjs','research/three-d-07/demo.mjs',
  'research/three-d-07/index.html','research/three-d-06/anatomical-showroom.mjs'];
 for(const f of files){
  const s=await readFile(f,'utf8');
  for(const bad of [/supabase\.co/,/localStorage/,/indexedDB/,/getUserMedia/,
   /sendBeacon/,/openai\.com/,/cdn\.jsdelivr/,/unpkg\.com/,/readyplayer\.me/])
   assert.doesNotMatch(s,bad);
 }
 const html=await readFile('research/three-d-07/index.html','utf8');
 assert.match(html,/3D-07/);assert.match(html,/not<\/strong> a separate fitted garment/);
 assert.match(html,/id="review"/);assert.match(html,/id="dress" type="button" disabled/);
 assert.doesNotMatch(html,/<script\s+src="https?:/);
});
