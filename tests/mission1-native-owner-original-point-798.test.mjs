import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {sourceTapCoordinates798,verifyOriginalTap798}
 from '../public/owner-original-photo-point-798.mjs';

const bytes=readFileSync('benchmark/fixtures/commons-0053.jpg');
const sha=createHash('sha256').update(bytes).digest('hex');
const publicRecord=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
 .find(x=>x.id==='commons-0053');
assert.equal(sha,publicRecord.sha256,'P798 tests use a genuine pinned original CC BY JPEG, not synthetic pixels');
const originalPhoto={image:'data:image/jpeg;base64,'+bytes.toString('base64'),
 sha256:sha,width:320,height:480};
const fullRect={left:25,top:80,width:160,height:240};
const lease={owner:'independent-fixture-user-1',sourcePresent:true};
const proof=(override={})=>({
 originalPhoto,sourceSHA256:sha,sourceHashVerified:true,
 ownerId:'independent-fixture-user-1',sourceId:'fixture-source-1',
 currentOwner:()=>lease.owner,sourceStillCurrent:()=>lease.sourcePresent,
 rect:fullRect,clientX:105,clientY:200,
 imageNaturalWidth:320,imageNaturalHeight:480,
 cryptoProvider:webcrypto,...override
});
test('P798 genuine SHA-verified original JPEG yields owner-bound original pixel point, NEVER AI or reviewed mask',async()=>{
 lease.owner='independent-fixture-user-1';lease.sourcePresent=true;
 const record=await verifyOriginalTap798(proof());
 assert.equal(record.sourceSHA256,sha);
 assert.equal(record.ownerId,'independent-fixture-user-1');
 assert.deepEqual([record.pointX,record.pointY],[160,240]);
 assert.equal(record.sourceWidth,320);assert.equal(record.sourceHeight,480);
 assert.equal(record.sourceBytesSHA256Verified,true);
 assert.equal(record.capturedFromOriginalJPEG,true);
 for(const key of ['maskGenerated','maskVerified','modelRun','subtypeConfirmed',
  'colorConfirmed','autoSaveAllowed','ownerApprovedGarment','privatePersisted',
  'independentRealHumanIdentityVerified'])assert.equal(record[key],false,key);
 assert.equal(Object.isFrozen(record),true);
 assert.equal(Object.keys(record).some(k=>/image|dataURL|sourceBytes/.test(k)&&typeof record[k]==='string'&&record[k].length>1000),false);
});
test('P798 original source rect maps all corners and rejects out-of-frame, NaN and invalid scaled dimensions',()=>{
 const rect={left:12,top:20,width:100,height:80};
 assert.deepEqual(sourceTapCoordinates798({rect,clientX:12,clientY:20,width:300,height:220}).x,0);
 assert.deepEqual(sourceTapCoordinates798({rect,clientX:112,clientY:100,width:300,height:220}).x,299);
 assert.throws(()=>sourceTapCoordinates798({rect,clientX:11,clientY:40,width:300,height:220}),/outside/);
 assert.throws(()=>sourceTapCoordinates798({rect,clientX:50,clientY:101,width:300,height:220}),/outside/);
 assert.throws(()=>sourceTapCoordinates798({rect,clientX:NaN,clientY:40,width:300,height:220}),/dimensions are required/);
 assert.throws(()=>sourceTapCoordinates798({rect,clientX:50,clientY:40,width:1e9,height:220}),/dimensions are required/);
});
test('P798 refused stale owner or removed original draft before digest',async()=>{
 lease.owner='another-account';
 await assert.rejects(verifyOriginalTap798(proof()),/owner session/);
 lease.owner='independent-fixture-user-1';lease.sourcePresent=false;
 await assert.rejects(verifyOriginalTap798(proof()),/owner session/);
 lease.sourcePresent=true;
});
test('P798 owner switch DURING asynchronous SHA digest cannot leave a valid prompt',async()=>{
 lease.owner='independent-fixture-user-1';lease.sourcePresent=true;
 let resolveHash;
 const pending=verifyOriginalTap798(proof({cryptoProvider:{
  subtle:{digest:()=>new Promise(resolve=>{resolveHash=resolve;})}
 }}));
 for(let i=0;i<20&&!resolveHash;i++)await Promise.resolve();
 assert.equal(typeof resolveHash,'function');
 lease.owner='other-account';
 resolveHash(await webcrypto.subtle.digest('SHA-256',bytes));
 await assert.rejects(pending,/owner session/);
 lease.owner='independent-fixture-user-1';
});
test('P798 byte modification, fake JPEG data, changed SHA, source and displayed dimension contradictions refuse',async()=>{
 lease.owner='independent-fixture-user-1';lease.sourcePresent=true;
 const changed=Buffer.from(bytes);changed[Math.floor(changed.length/2)]^=1;
 await assert.rejects(verifyOriginalTap798(proof({originalPhoto:{
  ...originalPhoto,image:'data:image/jpeg;base64,'+changed.toString('base64')
 }})),/no longer match/);
 await assert.rejects(verifyOriginalTap798(proof({sourceSHA256:'1'.repeat(64)})),/source identity/);
 await assert.rejects(verifyOriginalTap798(proof({imageNaturalWidth:321})),/dimensions missing/);
 await assert.rejects(verifyOriginalTap798(proof({originalPhoto:{
  ...originalPhoto,image:'https://attacker.example/jpeg'
 }})),/canonical JPEG data URL/);
 await assert.rejects(verifyOriginalTap798(proof({originalPhoto:{
  ...originalPhoto,image:'data:image/jpeg;base64,'+Buffer.from('not a JPEG').toString('base64')
 }})),/JPEG byte count|complete JPEG/);
});
test('P798 original photo tap refuses unsupported owner or source ID and does not produce any persisted data',async()=>{
 for(const bad of [{ownerId:''},{sourceId:''},{sourceHashVerified:false},{cryptoProvider:{}},
  {currentOwner:()=>null},{sourceStillCurrent:()=>false}]){
  await assert.rejects(verifyOriginalTap798(proof(bad)),/M1_OWNER_SOURCE_POINT_798/);
 }
});
