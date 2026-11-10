import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto,createHash} from 'node:crypto';
import {verifyOriginalTap798,sourceRectFromVerifiedPoints800}
 from '../public/owner-original-photo-point-798.mjs';
import {makeOwnerSeededLocalPreview802}
 from '../public/mission1-local-mask-preview-802.mjs';

// Authentic SHA-pinned public JPEG for owner box/point receipt tests;
// COLOR PIXELS below are deliberately synthetic unit data, NOT an independent
// real-photograph segmentation-quality benchmark or human reviewer.
const jpeg=readFileSync('benchmark/fixtures/commons-0053.jpg');
const hash=createHash('sha256').update(jpeg).digest('hex');
const photo={image:'data:image/jpeg;base64,'+jpeg.toString('base64'),sha256:hash,width:320,height:480};
const live={owner:'fixture-owner-A',valid:true};
const tap=(x,y,change={})=>verifyOriginalTap798({
 originalPhoto:photo,sourceSHA256:hash,sourceHashVerified:true,
 ownerId:'fixture-owner-A',sourceId:'fixture-photo-1',
 currentOwner:()=>live.owner,sourceStillCurrent:()=>live.valid,
 rect:{left:0,top:0,width:320,height:480},
 clientX:x,clientY:y,imageNaturalWidth:320,imageNaturalHeight:480,
 cryptoProvider:webcrypto,...change
});
const fixturePixels=()=>{
 const w=64,h=96,p=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=4*(y*w+x),dress=x>=20&&x<44&&y>=24&&y<72;
  p[i]=dress?185:245;p[i+1]=dress?25:245;p[i+2]=dress?30:245;p[i+3]=255;
 }
 return p;
};
async function controls(){
 live.owner='fixture-owner-A';live.valid=true;
 const a=await tap(64,96),b=await tap(256,384),seed=await tap(160,240);
 return {box:sourceRectFromVerifiedPoints800(a,b),point:seed};
}
test('P802 genuine JPEG SHA/source/owner prompt -> bounded synthetic COLOR-connected preview, no approval, upload or persistence',async()=>{
 const pair=await controls(),pixels=fixturePixels();
 const result=makeOwnerSeededLocalPreview802({...pair,pixels,width:64,height:96});
 assert.equal(result.sourceSHA256,hash);
 assert.equal(result.ownerId,'fixture-owner-A');
 assert.equal(result.maskPixels,24*48);
 assert.ok(result.fractionOfBox>0&&result.fractionOfBox<1);
 assert.equal(result.overlay[4*(48*64+32)+3],112);
 assert.equal(result.overlay[4*(12*64+12)+3],0);
 for(const key of ['sam2ModelRun','learnedGarmentSegmentation','independentHumanVerified',
  'ownerApprovedMask','categoryConfirmed','subtypeConfirmed','colorConfirmed',
  'autoSaveAllowed','privatePersisted','externalUpload'])assert.equal(result[key],false,key);
 assert.equal(result.actualPixelRegionGenerated,true);
 assert.equal(result.originalJPEGUnchanged,true);
 assert.equal(result.overlay.length,64*96*4);
});
test('P802 denies wrong owner, different source SHA, tampered point source proof and forged box approval',async()=>{
 const {box,point}=await controls(),pixels=fixturePixels();
 for(const [label,changed] of [
  ['owner',{point:{...point,ownerId:'another-owner'}}],
  ['source',{box:{...box,sourceSHA256:'0'.repeat(64)}}],
  ['point-unverified',{point:{...point,sourceBytesSHA256Verified:false}}],
  ['rectangle-unverified',{box:{...box,twoVerifiedOriginalJPEGCornerTaps:false}}]
 ]){
  assert.throws(()=>makeOwnerSeededLocalPreview802({box,point,...changed,pixels,width:64,height:96}),
   /matching SHA-verified original owner box/,label);
 }
});
test('P802 blocks seed outside verified box, invalid image buffers, >512 dimensions and extra tolerance',async()=>{
 const {box,point}=await controls(),pixels=fixturePixels();
 const outside=await tap(4,4);
 assert.throws(()=>makeOwnerSeededLocalPreview802({box,point:outside,pixels,width:64,height:96}),/seed required/);
 for(const changes of [
  {pixels:new Uint8ClampedArray(6)},
  {pixels:Uint8Array.from(pixels)},
  {width:513,height:96},
  {colorTolerance:800},
  {width:512,height:512}
 ])assert.throws(()=>makeOwnerSeededLocalPreview802({box,point,pixels,width:64,height:96,...changes}));
});
test('P802 fails closed on inconclusive isolated seed and wrong original point dimensions',async()=>{
 const {box,point}=await controls(),pixels=fixturePixels();
 const x=32,y=48,seed=4*(y*64+x);
 pixels[seed]=1;pixels[seed+1]=2;pixels[seed+2]=3;
 assert.throws(()=>makeOwnerSeededLocalPreview802({box,point,pixels,width:64,height:96}),
  /no meaningful local connected-color region/);
 assert.throws(()=>makeOwnerSeededLocalPreview802({box,point:{...point,sourceHeight:11},
  pixels:fixturePixels(),width:64,height:96}),/matching SHA-verified/);
});
test('P802 local algorithm includes no networking, storage, model execution or owner source mutation code',()=>{
 const src=readFileSync('public/mission1-local-mask-preview-802.mjs','utf8');
 for(const risk of ['fetch(', 'postMessage(', 'localStorage.', 'indexedDB.', 'XMLHttpRequest',
  'supabase.', 'onnxruntime','from_pretrained(', 'source.image='])
  assert.equal(src.includes(risk),false,risk);
});
