import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {verifyOriginalTap798,sourceRectFromVerifiedPoints800}
 from '../public/owner-original-photo-point-798.mjs';
import {makeOwnerSeededLocalPreview802}
 from '../public/mission1-local-mask-preview-802.mjs';
import {correctOwnerLocalMask803}
 from '../public/mission1-local-mask-correction-803.mjs';
// Authentic source SHA and verified owner input on licensed public JPEG;
// the RGB array here is SYNTHETIC unit data, never human ground truth.
const jpeg=readFileSync('benchmark/fixtures/commons-0053.jpg');
const sha=createHash('sha256').update(jpeg).digest('hex');
const originalPhoto={image:'data:image/jpeg;base64,'+jpeg.toString('base64'),
 sha256:sha,width:320,height:480};
const tap=(x,y)=>verifyOriginalTap798({
 originalPhoto,sourceSHA256:sha,sourceHashVerified:true,
 ownerId:'fixture-account-A',sourceId:'fixture-source-A',
 currentOwner:()=> 'fixture-account-A',sourceStillCurrent:()=>true,
 rect:{left:0,top:0,width:320,height:480},clientX:x,clientY:y,
 imageNaturalWidth:320,imageNaturalHeight:480,cryptoProvider:webcrypto
});
async function setup(){
 const a=await tap(64,96),b=await tap(256,384),point=await tap(160,240);
 const box=sourceRectFromVerifiedPoints800(a,b);
 const width=64,height=96,pixels=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=4*(y*width+x),garment=x>=20&&x<44&&y>=24&&y<72;
  pixels[i]=garment?185:245;
  pixels[i+1]=garment?25:245;
  pixels[i+2]=garment?30:245;
  pixels[i+3]=255;
 }
 const preview=makeOwnerSeededLocalPreview802({box,point,pixels,width,height});
 return {box,point,preview};
}
test('P803 original SHA-bound owner preview manually ERASEs and ADDs local mask pixels without changing JPEG or private save',async()=>{
 const {box,point,preview}=await setup();
 const erased=correctOwnerLocalMask803({preview,box,point,x:32,y:48,mode:'erase',radius:5});
 assert.equal(erased.maskPixels<preview.maskPixels,true);
 assert.equal(erased.overlay[4*(48*64+32)+3],0);
 assert.equal(preview.overlay[4*(48*64+32)+3],112,'source preview not mutated');
 assert.equal(erased.manualEditCount,1);
 const restored=correctOwnerLocalMask803({preview:erased,box,point,x:32,y:48,mode:'add',radius:5});
 assert.equal(restored.maskPixels,preview.maskPixels);
 assert.equal(restored.overlay[4*(48*64+32)+3],112);
 assert.equal(restored.manualEditCount,2);
 assert.equal(originalPhoto.sha256,sha);
 for(const k of ['independentHumanVerified','ownerApprovedMask','autoSaveAllowed',
  'privatePersisted','externalUpload','learnedGarmentSegmentation'])assert.equal(restored[k],false,k);
 assert.equal(restored.manualPixelCorrectionApplied,true);
});
test('P803 rejects cross-owner, cross-SHA, stale point proof, owner mask approval and unauthenticated preview',async()=>{
 const {box,point,preview}=await setup();
 for(const item of [
  {box:{...box,ownerId:'other'}},
  {preview:{...preview,sourceSHA256:'f'.repeat(64)}},
  {point:{...point,sourceBytesSHA256Verified:false}},
  {preview:{...preview,ownerApprovedMask:true}},
  {preview:{...preview,externalUpload:true}},
  {preview:{...preview,autoSaveAllowed:true}}
 ])assert.throws(()=>correctOwnerLocalMask803({box,point,preview,...item,x:32,y:48,mode:'erase'}),
  /active verified original owner/);
});
test('P803 rejects outside-box painting, unsupported modes, brushes and mismatched thumbnail budget',async()=>{
 const {box,point,preview}=await setup();
 for(const props of [
  {x:2,y:2},{x:500,y:48},{x:32,y:-1},{radius:13},
  {radius:0},{mode:'approve'},{x:1.5},
  {preview:{...preview,overlay:new Uint8ClampedArray(16)}},
  {preview:{...preview,width:513}},
  {preview:{...preview,ownerBoxPixels:1}}
 ])assert.throws(()=>correctOwnerLocalMask803({preview,box,point,x:32,y:48,mode:'erase',...props}));
});
test('P803 refuses no-op edits, caps local edit count, leaves pixels outside source box untouched',async()=>{
 const {box,point,preview}=await setup();
 assert.throws(()=>correctOwnerLocalMask803({preview,box,point,x:32,y:48,mode:'add'}),
  /did not change/);
 assert.throws(()=>correctOwnerLocalMask803({
  preview:{...preview,manualEditCount:1024},box,point,x:32,y:48,mode:'erase'
 }),/limit exceeded/);
 const edited=correctOwnerLocalMask803({preview,box,point,x:13,y:21,mode:'add',radius:12});
 assert.equal(edited.overlay[4*(2*64+2)+3],0,'no painting outside source box');
 assert.equal(edited.maskPixels>preview.maskPixels,true);
});
test('P803 correction implementation never accesses storage, model runtimes or network',()=>{
 const code=readFileSync('public/mission1-local-mask-correction-803.mjs','utf8');
 for(const forbidden of ['fetch(', 'postMessage(', 'localStorage.', 'indexedDB.',
  'supabase.', 'onnxruntime', 'XMLHttpRequest', 'source.image='])
  assert.equal(code.includes(forbidden),false,forbidden);
});
