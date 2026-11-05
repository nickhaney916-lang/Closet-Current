import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import PhotoColor from '../public/photo-color.js';
import {indexedDB} from 'fake-indexeddb';
import {boundedCropColor46} from '../research/multi-garment-capture-01/recognition-review-42.mjs';
import {verifiedRecord24,atomicSaveGarments24} from '../research/multi-garment-capture-01/atomic-group.mjs';
if(!globalThis.crypto?.subtle)globalThis.crypto=webcrypto;
const palette=['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange','Multicolor'];
const sample=(top,bottom)=>{
 const px=new Uint8ClampedArray(48*48*4);
 for(let y=0;y<48;y++)for(let x=0;x<48;x++){
  const [r,g,b]=y<30?top:bottom,i=(y*48+x)*4;
  px.set([r,g,b,255],i);
 }
 return PhotoColor.maskedPalette(px,48,48);
};
function piece(suggestion){
 return {id:'original-color46',instanceKey:'manual-100-100-500-500',
  image:'data:image/jpeg;base64,/9j/2Q==',
  cropBounds:{x:.1,y:.1,width:.5,height:.5},cropReviewed:true,confirmed:true,manual:true,
  category:'Tops',itemType:'T-shirt',color:'Navy',recognitionSuggestion42:suggestion};
}
async function source(){
 const filename='benchmark/fixtures/commons-0003.jpg';
 const imageBytes=await readFile(filename);
 const sha=createHash('sha256').update(imageBytes).digest('hex');
 const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8')).find(x=>x.id==='commons-0003');
 assert.equal(sha,locked.sha256);
 const image='data:image/jpeg;base64,'+imageBytes.toString('base64');
 return {image,sourceSHA256:sha,sourceHashVerified:true,
  originalPhoto:{image,sha256:sha,width:800,height:900,origin:'licensed-sha-verified'}};
}
test('COLOR46 actual 48x48 color-family pixels produce primary and secondary UNVERIFIED review, not a human label',()=>{
 const pixels=sample([222,26,30],[24,51,212]);
 assert.equal(pixels.primary,'Red');
 assert.equal(pixels.secondary,'Blue');
 const result=boundedCropColor46(pixels,palette);
 assert.deepEqual(result,{source:'reviewed-crop-pixels',primary:'Red',secondary:'Blue',needsConfirmation:true});
 assert.deepEqual(palette.includes(result.primary),true);
});
test('COLOR46 strict palette, secondary != primary, and unknown/worker-injected labels never count as valid color review',()=>{
 assert.equal(boundedCropColor46({primary:'Chartreuse',secondary:'Green'},palette),null);
 assert.equal(boundedCropColor46({primary:'Unknown'},palette),null);
 assert.equal(boundedCropColor46(null,palette),null);
 assert.deepEqual(boundedCropColor46({primary:'Blue',secondary:'Blue',needsConfirmation:false,metadata:{face:'private'}},palette),
  {source:'reviewed-crop-pixels',primary:'Blue',secondary:null,needsConfirmation:true});
 assert.deepEqual(boundedCropColor46({primary:'Green',secondary:'Navy'},palette),
  {source:'reviewed-crop-pixels',primary:'Green',secondary:null,needsConfirmation:true});
});
test('COLOR46 misleading pixel Red/Blue does not change manually confirmed Navy, or the original JPEG and source identity',async()=>{
 const proof=await source(),record=verifiedRecord24({proof,ownerId:'owner46',piece:piece({
  source:'local-fashionclip',category:'Tops',itemType:'Sweatshirt',
  color:'Red',colorSource:'reviewed-crop-pixel-estimate',
  colorReview46:{source:'reviewed-crop-pixels',primary:'Red',secondary:'Blue',
   needsConfirmation:true,metadata:{untrustedImage:'secret'}},
  originalContext:{category:'Tops',itemType:'T-shirt',color:'Black'}
 })});
 assert.equal(record.category,'Tops');assert.equal(record.itemType,'T-shirt');
 assert.equal(record.color,'Navy');assert.equal(record.colorSource,'user');
 assert.equal(record.recognitionSuggestion42.color,'Red');
 assert.equal(record.recognitionSuggestion42.colorSource,'reviewed-crop-pixel-estimate');
 assert.deepEqual(record.recognitionSuggestion42.colorReview46,{
  source:'reviewed-crop-pixels',primary:'Red',secondary:'Blue',needsConfirmation:true
 });
 assert.equal(JSON.stringify(record).includes('secret'),false);
 assert.equal(record.originalPhoto.image,proof.image);
 assert.equal(record.sourceSHA256,proof.sourceSHA256);
 assert.equal(record.threeDReady,false);
});
test('COLOR46 invalid candidate source, forged confirmation, and arbitrary payload are omitted at final private commit',async()=>{
 const proof=await source();
 for(const raw of [
  {source:'arbitrary-hosted-model',color:'Red',colorReview46:{source:'reviewed-crop-pixels',primary:'Red',needsConfirmation:true}},
  {source:'local-fashionclip',colorReview46:{source:'not-real',primary:'Red',needsConfirmation:true}},
  {source:'local-fashionclip',colorReview46:{source:'reviewed-crop-pixels',primary:'Purple',needsConfirmation:false}},
  {source:'local-fashionclip',colorReview46:{source:'reviewed-crop-pixels',primary:'Chartreuse',needsConfirmation:true}}
 ]){
  const record=verifiedRecord24({proof,ownerId:'owner46',piece:piece(raw)});
  assert.equal(record.recognitionSuggestion42?.colorReview46,undefined);
 }
});
test('COLOR46 atomic one-account actual indexedDB saves safe model evidence and refuses duplicate source-region without changing user color',async()=>{
 const proof=await source(),owner='color46-owner';
 const db=await new Promise((resolve,reject)=>{
  const request=indexedDB.open('closet-current-user-'+owner,1);
  request.onupgradeneeded=()=>request.result.createObjectStore('items',{keyPath:'id'});
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });
 const selected=piece({source:'local-fashionclip',colorSource:'reviewed-crop-pixel-estimate',
  color:'Red',colorReview46:{source:'reviewed-crop-pixels',primary:'Red',secondary:'Blue',needsConfirmation:true}});
 try{
  await atomicSaveGarments24({db,proof,pieces:[selected],ownerId:owner,currentOwner:()=>owner});
  const read=()=>new Promise((resolve,reject)=>{
   const request=db.transaction('items').objectStore('items').getAll();
   request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
  const saved=await read();
  assert.equal(saved.length,1);assert.equal(saved[0].color,'Navy');assert.equal(saved[0].colorSource,'user');
  assert.equal(saved[0].recognitionSuggestion42.colorReview46.primary,'Red');
  assert.equal(saved[0].ownerId,owner);assert.equal(saved[0].originalPhoto.image,proof.image);
  await assert.rejects(atomicSaveGarments24({db,proof,ownerId:owner,currentOwner:()=>owner,
   pieces:[{...selected,id:'copy-another-id'}]}),/duplicate/i);
  assert.deepEqual(await read(),saved);
 }finally{db.close();}
});
