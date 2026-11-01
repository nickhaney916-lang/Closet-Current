'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {randomUUID,webcrypto,createHash}=require('node:crypto');

const importSource=fs.readFileSync('public/photo-import.js','utf8');
const appSource=fs.readFileSync('public/app.js','utf8');
function makeContext(cryptoImpl={randomUUID,subtle:webcrypto.subtle}){
 const events=[],elements=new Map(),el=id=>{
  if(!elements.has(id))elements.set(id,{});
  return elements.get(id);
 };
 const context={crypto:cryptoImpl,items:[],batch:[],session:0,sessionCapturedIds:new Set(),
  $:el,persistDraft(){},queueAutomatic(){},message(t){events.push(t);},
  eventLog:events,structuredClone,console};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync('public/taxonomy.js','utf8'),context);
 vm.runInContext(importSource.slice(importSource.indexOf('async function sourcePhotoSha256('),importSource.indexOf('async function readPhotoBatch(')),context);
 vm.runInContext(appSource.slice(appSource.indexOf('function candidate('),appSource.indexOf('function queueAutomatic(')),context);
 return context;
}
function fakeFile(bytes){return {arrayBuffer:async()=>Uint8Array.from(Buffer.from(bytes)).buffer.slice(0,bytes.length)};}
// Make the exact byte array (not the transcoded display JPEG) available to WebCrypto.
function original(bytes){return {arrayBuffer:async()=>{const data=new TextEncoder().encode(bytes);return data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);}};}

test('SHA-256 identifies the exact original file bytes and changes with source changes',async()=>{
 const ctx=makeContext();
 const expected=createHash('sha256').update('source-photo-original').digest('hex');
 const digest=await ctx.sourcePhotoSha256(original('source-photo-original'));
 assert.equal(digest,expected);
 assert.match(digest,/^[a-f0-9]{64}$/);
 assert.notEqual(await ctx.sourcePhotoSha256(original('source-photo-changed')),digest);
});

test('same original file re-encoded to another JPEG is blocked as an exact import duplicate',async()=>{
 const c=makeContext(),sha=await c.sourcePhotoSha256(original('same raw JPEG'));
 assert.equal(c.candidate('display-JPEG-A',{sourceSha256:sha}),true);
 assert.equal(c.candidate('display-JPEG-B',{sourceSha256:sha}),false);
 assert.equal(c.batch.length,1);
 assert.equal(c.batch[0].sourceSha256,sha);
 assert.match(c.eventLog.at(-1),/Exact duplicate/);
 // The same fingerprint must still prevent re-import after the first save.
 c.items.push(c.batch.shift());
 assert.equal(c.candidate('display-JPEG-C',{sourceSha256:sha}),false);
});

test('different source bytes preserve separately reviewed garments',async()=>{
 const c=makeContext(),a=await c.sourcePhotoSha256(original('shirt')),b=await c.sourcePhotoSha256(original('pants'));
 assert.equal(c.candidate('JPEG-shirt',{sourceSha256:a}),true);
 assert.equal(c.candidate('JPEG-pants',{sourceSha256:b}),true);
 assert.equal(c.batch.length,2);
 assert.notEqual(c.batch[0].sourceSha256,c.batch[1].sourceSha256);
});

test('one outfit source can yield separate shirt and pants records',async()=>{
 const c=makeContext(),sha=await c.sourcePhotoSha256(original('one whole outfit'));
 assert.equal(c.candidate('crop-shirt',{outfitSourceId:'outfit-1',sourceSha256:sha}),true);
 assert.equal(c.candidate('crop-pants',{outfitSourceId:'outfit-1',sourceSha256:sha}),true);
 assert.equal(c.batch.length,2);
 // Never equate the same original outfit SHA with identical garment pieces.
 assert.equal(c.batch[0].outfitSourceId,c.batch[1].outfitSourceId);
});

test('source hash comparisons are scoped to the active account closet',async()=>{
 const sha=await makeContext().sourcePhotoSha256(original('photo'));
 const alice=makeContext(),bob=makeContext();
 assert.equal(alice.candidate('one',{sourceSha256:sha}),true);
 assert.equal(bob.candidate('two',{sourceSha256:sha}),true);
 assert.equal(alice.batch.length,1);
 assert.equal(bob.batch.length,1);
 assert.notEqual(alice.batch[0].id,bob.batch[0].id);
});

test('unavailable hashing does not destroy a valid new import',async()=>{
 const c=makeContext({randomUUID});
 assert.equal(await c.sourcePhotoSha256(original('source')),null);
 assert.equal(c.candidate('valid-JPEG'),true);
 assert.equal(c.batch[0].sourceSha256,undefined);
 assert.equal(c.batch.length,1);
});

test('malformed source hashes are not trusted as provenance',()=>{
 const c=makeContext();
 assert.equal(c.candidate('A',{sourceSha256:'abc'}),true);
 assert.equal(c.candidate('B',{sourceSha256:'abc'}),true);
 assert.equal(c.batch.every(x=>x.sourceSha256===undefined),true);
});

test('normalization preserves a recognized item source hash during save or reload',async()=>{
 const c=makeContext(),hash=await c.sourcePhotoSha256(original('shirt'));
 c.candidate('display',{sourceSha256:hash});
 c.batch[0].category='Tops';c.batch[0].itemType='T-shirt';
 const item=vm.runInContext('normalizeClothing(batch[0])',c);
 assert.equal(item.sourceSha256,hash);
 assert.equal(item.itemType,'T-shirt');
});
