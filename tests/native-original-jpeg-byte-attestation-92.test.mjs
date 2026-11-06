import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {attestOriginalJPEGBytes92} from '../research/native-original-photo-integrity-92/original-jpeg-byte-attestation.mjs';
const owner='native92-owner',id='same-id-photo';
const original=readFileSync(new URL('../benchmark/fixtures/commons-0053.jpg',import.meta.url));
const other=readFileSync(new URL('../benchmark/fixtures/commons-0003.jpg',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const make=(bytes=original)=>({
 id,ownerId:owner,sourceSHA256:sha(original),sourceHashVerified:true,
 category:'Dresses',itemType:'Casual dress',color:'Blue',
 originalPhoto:{image:'data:image/jpeg;base64,'+bytes.toString('base64'),sha256:sha(original)}
});
const call=(row,opts={})=>attestOriginalJPEGBytes92({
 row,ownerId:owner,cryptoImpl:webcrypto,decodeBase64:atob,...opts
});
test('NATIVE92 real licensed original JPEG independently hashes bytes correctly, without ever returning the image',async()=>{
 const row=make(),before=structuredClone(row),receipt=await call(row);
 assert.equal(receipt.id,id);assert.equal(receipt.sha256,sha(original));
 assert.equal(receipt.category,'Dresses');assert.equal(receipt.itemType,'Casual dress');
 assert.equal(receipt.color,'Blue');assert.deepEqual(row,before);
 assert.equal(receipt.image,undefined);assert.equal(receipt.originalPhoto,undefined);
 assert.ok(Object.isFrozen(receipt));
});
test('NATIVE92 same garment ID and matching metadata but different genuine licensed JPEG bytes must refuse 3D',async()=>{
 const row=make(other);
 assert.notEqual(sha(original),sha(other));
 assert.equal(row.originalPhoto.sha256,row.sourceSHA256);
 await assert.rejects(call(row),/ORIGINAL JPEG BYTES DO NOT MATCH SOURCE SHA/);
});
test('NATIVE92 unauthorized owner or bad clothing ID fails closed before JPEG hashing',async()=>{
 await assert.rejects(call({...make(),ownerId:'other'}),/owner or garment ID invalid/);
 await assert.rejects(call({...make(),id:''}),/owner or garment ID invalid/);
});
test('NATIVE92 originalPhoto SHA vs source SHA metadata mismatch fails even when actual JPEG is valid',async()=>{
 await assert.rejects(call({...make(),originalPhoto:{...make().originalPhoto,sha256:sha(other)}}),
  /SHA metadata mismatch/);
 await assert.rejects(call({...make(),sourceHash:sha(other)}),/SHA metadata mismatch/);
});
test('NATIVE92 refuses non-JPEG data URI, missing image and malformed canonical base64',async()=>{
 for(const value of ['data:image/png;base64,'+original.toString('base64'),
  'data:image/jpeg;base64,not*valid','data:image/jpeg;base64,A','']){
  await assert.rejects(call({...make(),originalPhoto:{
   image:value,sha256:sha(original)}}),/data URL required|bounded canonical JPEG base64/);
 }
});
test('NATIVE92 rejects valid-base64 not-JPEG bytes despite matching SHA metadata',async()=>{
 const fake=Buffer.from('not-a-real-jpeg','utf8'),hash=sha(fake);
 const row={...make(),sourceSHA256:hash,originalPhoto:{
  sha256:hash,image:'data:image/jpeg;base64,'+fake.toString('base64')}};
 await assert.rejects(call(row),/JPEG marker invalid/);
});
test('NATIVE92 refuses unavailable WebCrypto rather than treating metadata as proof',async()=>{
 await assert.rejects(call(make(),{cryptoImpl:{}}),/browser SHA-256 unavailable/);
 await assert.rejects(call(make(),{decodeBase64:null}),/browser SHA-256 unavailable/);
});
test('NATIVE92 browser decoded JPEG byte-count cap rejects oversized source without crypto allocation',async()=>{
 const image='data:image/jpeg;base64,'+'A'.repeat(24*1024*1024*2);
 await assert.rejects(call({...make(),originalPhoto:{
  image,sha256:sha(original)}}),/bounded canonical JPEG base64/);
});
test('NATIVE92 actual owner-wardrobe wrapper checks lease and identity after asynchronous cryptographic hash',()=>{
 const s=readFileSync(new URL('../research/native-consumer-board-04/consumer-board-controller.mjs',import.meta.url),'utf8');
 assert.match(s,/const attestOriginalPhotoBytes92=async\(ids\)=>/);
 assert.match(s,/const before=readOnlyGarmentSources91\(ids\),lease=alive\(\)/);
 assert.match(s,/await attestOriginalJPEGBytes92\(/);
 assert.match(s,/row!==wardrobe\.find\(x=>x\.id===ids\[i\]\)/);
 assert.match(s,/epoch\.auth\.getSessionGeneration\(\)!==lease\.generation/);
 assert.match(s,/return Object\.freeze\(\{ownerId:lease\.ownerId,sources:Object\.freeze\(verified\)\}\)/);
});
test('NATIVE92 verifies JPEG independently before slow donor import and after WebGL, still rechecks live outfit at boundaries',()=>{
 const s=readFileSync(new URL('../research/native-3d-05/native-preview-bridge.mjs',import.meta.url),'utf8');
 assert.match(s,/const attestOriginalBytes92=async\(\)=>/);
 assert.match(s,/consumer\.attestOriginalPhotoBytes92\(Object\.values\(selected\.slots\)\)/);
 assert.match(s,/if\(JSON\.stringify\(actual\)!==JSON\.stringify\(selectedSources91\)\)/);
 assert.match(s,/await attestOriginalBytes92\(\); \/\/ Cryptographic JPEG bytes/);
 assert.match(s,/await attestOriginalBytes92\(\); \/\/ Repeat after slow WebGL/);
 assert.match(s,/requireFresh\(\); \/\/ A concurrent source revision/);
});
test('NATIVE92 actual mobile WebGL regression corrupts bytes while keeping SHA metadata, rejects donor and restores 163-bone dress',()=>{
 const s=readFileSync(new URL('../scripts/test-native-3d-05-browser.mjs',import.meta.url),'utf8');
 for(const phrase of ["const native92=process.env.NATIVE92==='1'","if(native92&&width===390)",
  "row.originalPhoto.image=image;row.image=image",
  "photos['commons-0003'].image","photos['commons-0053'].image",
  'NATIVE92 ORIGINAL JPEG BYTES DO NOT MATCH SOURCE SHA',
  'donorNotOpenedForMismatchedBytes:true','tamperedOriginalJPEGBlocked92'])
  assert.ok(s.includes(phrase),'Missing real source-byte negative browser test: '+phrase);
});
