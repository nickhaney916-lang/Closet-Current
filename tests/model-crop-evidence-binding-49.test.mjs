import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import {indexedDB} from 'fake-indexeddb';
import sharp from 'sharp';
import {bindInputs49,assetTag49} from '../research/multi-garment-capture-01/recognition-review-42.mjs';
import {
 atomicSaveGarments24,verifiedModelPieces49,verifiedRecord24
} from '../research/multi-garment-capture-01/atomic-group.mjs';
if(!globalThis.crypto?.subtle)globalThis.crypto=webcrypto;

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const url=bytes=>'data:image/jpeg;base64,'+bytes.toString('base64');
const photo=async()=>{
 const bytes=await readFile('benchmark/fixtures/commons-0003.jpg');
 const digest=sha(bytes);
 const entry=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'))
  .find(row=>row.id==='commons-0003');
 assert.equal(digest,entry.sha256,'true original JPEG must remain source-locked');
 const metadata=await sharp(bytes).metadata();
 const original=url(bytes);
 const cropA=await sharp(bytes).extract({
  left:Math.floor(metadata.width*.05),top:Math.floor(metadata.height*.05),
  width:Math.floor(metadata.width*.8),height:Math.floor(metadata.height*.8)
 }).jpeg({quality:91}).toBuffer();
 const cropB=await sharp(bytes).extract({
  left:Math.floor(metadata.width*.09),top:Math.floor(metadata.height*.09),
  width:Math.floor(metadata.width*.78),height:Math.floor(metadata.height*.78)
 }).jpeg({quality:91}).toBuffer();
 assert.notEqual(sha(cropA),sha(cropB));
 return {proof:{
  image:original,sourceSHA256:digest,sourceHashVerified:true,
  originalPhoto:{image:original,sha256:digest,width:metadata.width,height:metadata.height,origin:'licensed-SHA-locked-original'}
 },cropA:url(cropA),cropB:url(cropB),cropASHA256:sha(cropA),cropBSHA256:sha(cropB)};
};
const proposal=(binding)=>({
 source:'local-fashionclip',category:'Tops',itemType:null,color:'Gray',
 status:'category-only',colorSource:'recognition',
 originalContext:{category:'Tops',itemType:'T-shirt',color:'Gray'},
 subtypeReview47:{candidate:'Sweatshirt',alternative:'T-shirt',needsConfirmation:true,
  reason:'independently-observed-high-confidence-confusion'},
 ...(binding?{inputBinding49:binding}:{})
});
const piece=(image,binding,opts={})=>({
 id:'crop49',instanceKey:'seg-10-10-80-80-1',
 image,cropBounds:{x:.05,y:.05,width:.8,height:.8},
 category:'Tops',itemType:'T-shirt',color:'Black',
 cropReviewed:true,confirmed:true,recognitionSuggestion42:proposal(binding),
 ...opts
});
const dbOpen=owner=>new Promise((resolve,reject)=>{
 const req=indexedDB.open('closet-current-user-'+owner,1);
 req.onupgradeneeded=()=>req.result.createObjectStore('items',{keyPath:'id'});
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});
const rows=db=>new Promise((resolve,reject)=>{
 const req=db.transaction('items').objectStore('items').getAll();
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});

test('INPUT49 real CC-licensed source crop WebCrypto SHA matches Node hash of actual JPEG bytes',async()=>{
 const {proof,cropA,cropASHA256}=await photo();
 const b=await bindInputs49({sourceSHA256:proof.sourceSHA256,cropImage:cropA,
  requestedAssetVersion:'fashionclip-build_2026.11'});
 assert.deepEqual(b,{
  sourceSHA256:proof.sourceSHA256,cropSHA256:cropASHA256,
  requestedAssetTag:'fashionclip-build_2026.11',hashAlgorithm:'SHA-256'
 });
 assert.equal(Object.isFrozen(b),true);
 assert.equal(assetTag49('../../evil-script'),'unversioned');
 assert.equal(assetTag49(''), 'unversioned');
 assert.equal(assetTag49('v2.4-beta'),'v2.4-beta');
});

test('INPUT49 invalid source identity or invalid crop JPEG refuses model proposal binding',async()=>{
 const {proof,cropA}=await photo();
 await assert.rejects(bindInputs49({sourceSHA256:'bad',cropImage:cropA}),/invalid source/);
 await assert.rejects(bindInputs49({sourceSHA256:proof.sourceSHA256,cropImage:'data:image/jpeg;base64,/9j/2Q=='}),/JPEG/);
});

test('INPUT49 changing only the crop JPEG bytes under the SAME detected instanceKey drops old AI while retaining true human type/color',async()=>{
 const {proof,cropA,cropB}=await photo();
 const receipt=await bindInputs49({sourceSHA256:proof.sourceSHA256,cropImage:cropA,requestedAssetVersion:'rev49'});
 const stale=piece(cropB,receipt);
 const fresh=await verifiedModelPieces49([stale],proof);
 assert.equal(fresh[0].instanceKey,stale.instanceKey,'detected piece key must remain same to expose genuine weakness');
 assert.equal(fresh[0].recognitionSuggestion42,undefined,'stale AI evidence must be removed');
 const row=verifiedRecord24({proof,ownerId:'owner49',piece:fresh[0]});
 assert.equal(row.itemType,'T-shirt');assert.equal(row.category,'Tops');assert.equal(row.color,'Black');
 assert.equal(row.recognitionSuggestion42,undefined);
 assert.equal(row.image,cropB);
 assert.equal(row.originalPhoto.image,proof.image);
});

test('INPUT49 mismatched original SHA/invalid asset tag/forged input hashes are all omitted, while human truth survives',async()=>{
 const {proof,cropA}=await photo();
 const actual=await bindInputs49({sourceSHA256:proof.sourceSHA256,cropImage:cropA,requestedAssetVersion:'newtag'});
 for(const injected of [
  {...actual,sourceSHA256:'f'.repeat(64)},
  {...actual,cropSHA256:'0'.repeat(64)},
  {...actual,requestedAssetTag:'script/../'},
  {...actual,hashAlgorithm:'MD5'},
  {...actual,sourceSHA256:null}
 ]){
  const checked=await verifiedModelPieces49([piece(cropA,injected)],proof);
  assert.equal(checked[0].recognitionSuggestion42,undefined);
  const record=verifiedRecord24({proof,ownerId:'owner49',piece:checked[0]});
  assert.equal(record.recognitionSuggestion42,undefined);
  assert.equal(record.itemType,'T-shirt');
 }
});

test('INPUT49 current matching crop holds sanitized bounded model provenance but never saves untrusted extra payload',async()=>{
 const {proof,cropA,cropASHA256}=await photo();
 const binding=await bindInputs49({sourceSHA256:proof.sourceSHA256,cropImage:cropA,requestedAssetVersion:'v49'});
 const untrusted=piece(cropA,binding);
 untrusted.recognitionSuggestion42.inputBinding49={
  ...binding,secretModelPayload:'DO-NOT-PERSIST',privatePhoto:'hidden'
 };
 const reviewed=(await verifiedModelPieces49([untrusted],proof))[0];
 const record=verifiedRecord24({proof,ownerId:'owner49',piece:reviewed});
 assert.deepEqual(record.recognitionSuggestion42.inputBinding49,{
  sourceSHA256:proof.sourceSHA256,cropSHA256:cropASHA256,
  requestedAssetTag:'v49',hashAlgorithm:'SHA-256'
 });
 assert.equal(record.recognitionSuggestion42.itemType,null);
 assert.equal(record.itemType,'T-shirt');assert.equal(record.color,'Black');
 assert.equal(JSON.stringify(record).includes('DO-NOT-PERSIST'),false);
 assert.equal(JSON.stringify(record).includes('hidden'),false);
});

test('INPUT49 real owner-specific IndexedDB saves original and user truth, with independently checked crop/input provenance',async()=>{
 const {proof,cropA,cropASHA256}=await photo(),owner='input49-owner';
 const receipt=await bindInputs49({sourceSHA256:proof.sourceSHA256,cropImage:cropA,requestedAssetVersion:'v49'});
 const db=await dbOpen(owner);
 try {
  await atomicSaveGarments24({db,proof,ownerId:owner,currentOwner:()=>owner,
   pieces:[piece(cropA,receipt)]});
  const saved=await rows(db);
  assert.equal(saved.length,1);
  assert.equal(saved[0].ownerId,owner);
  assert.equal(saved[0].sourceSHA256,proof.sourceSHA256);
  assert.equal(saved[0].originalPhoto.image,proof.image);
  assert.equal(saved[0].recognitionSuggestion42.inputBinding49.cropSHA256,cropASHA256);
  assert.equal(saved[0].color,'Black');assert.equal(saved[0].colorSource,'user');
  await assert.rejects(atomicSaveGarments24({db,proof,ownerId:owner,currentOwner:()=>owner,
   pieces:[piece(cropA,receipt,{id:'duplicate-id'})]}),/duplicate/i);
  assert.deepEqual(await rows(db),saved);
 } finally {db.close();}
});

test('INPUT49 async save captures an immutable snapshot before SHA checks, even if user mutates its crop/type/color after invocation',async()=>{
 const {proof,cropA,cropB,cropASHA256}=await photo(),owner='input49-snapshot';
 const receipt=await bindInputs49({sourceSHA256:proof.sourceSHA256,cropImage:cropA,requestedAssetVersion:'v49'});
 const db=await dbOpen(owner),selected=piece(cropA,receipt);
 try {
  const pending=atomicSaveGarments24({db,proof,ownerId:owner,currentOwner:()=>owner,pieces:[selected]});
  selected.image=cropB;selected.itemType='Sweatshirt';selected.color='Red';
  selected.recognitionSuggestion42.inputBinding49.cropSHA256='0'.repeat(64);
  const output=await pending;
  assert.equal(output.length,1);
  assert.equal(output[0].image,cropA);
  assert.equal(output[0].itemType,'T-shirt');
  assert.equal(output[0].color,'Black');
  assert.equal(output[0].recognitionSuggestion42.inputBinding49.cropSHA256,cropASHA256);
  assert.deepEqual(await rows(db),output);
 } finally {db.close();}
});

test('INPUT49 old unbound research suggestions remain explicitly unbound, never magically claim new crop hash accuracy',async()=>{
 const {proof,cropA}=await photo();
 const old=piece(cropA,null);
 const checked=await verifiedModelPieces49([old],proof);
 assert.equal(checked[0].recognitionSuggestion42?.inputBinding49,undefined);
 const stored=verifiedRecord24({proof,ownerId:'owner49',piece:checked[0]});
 assert.equal(stored.recognitionSuggestion42?.inputBinding49,undefined);
 assert.equal(stored.itemType,'T-shirt');
});
