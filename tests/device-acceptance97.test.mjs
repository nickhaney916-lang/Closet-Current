import test from 'node:test';
import assert from 'node:assert/strict';
import {blankLedger,verifyLedger,CASES} from '../scripts/device-acceptance97.mjs';
const SHA='a'.repeat(40),hash='b'.repeat(64);
test('fresh ledger BLOCKED, no fake physical wins',()=>{
 const s=verifyLedger(blankLedger(SHA));assert.equal(s.physicalAcceptance,'BLOCKED');
 assert.equal(s.notTested,CASES.length*2);assert.equal(s.pass,0);assert.equal(s.hostedRls,'NOT_VERIFIED');
});
test('simulated browser cannot masquerade as physical PASS',()=>{
 const d=blankLedger(SHA);d.trials[0].deviceKind='EMULATOR';d.trials[0].cases[0].status='PASS';
 d.trials[0].cases[0].observation='synthetic click';
 assert.throws(()=>verifyLedger(d),/browser simulation cannot PASS/);
});
test('manual witness requires physical metadata and explicit opt-in',()=>{
 const d=blankLedger(SHA);d.trials[0].deviceKind='PHYSICAL';
 assert.throws(()=>verifyLedger(d),/unobserved phone/);
 assert.throws(()=>verifyLedger(d,{allowPhysical:true}),/model required/);
 Object.assign(d.trials[0],{model:'Pixel test',osVersion:'17',browserVersion:'Chrome example',witness:'reviewer initials'});
 Object.assign(d.trials[0].cases[0],{status:'PASS',observation:'actual camera capture',sourceSha256:hash,originalByteCount:12345,decodedWidth:400,decodedHeight:300});
 const s=verifyLedger(d,{allowPhysical:true});assert.equal(s.pass,1);assert.equal(s.physicalAcceptance,'BLOCKED');
});
test('reject identity, original bytes, unknown keys, filenames',()=>{
 for(const observation of ['data:image/jpeg;base64,ABC','tester@example.com']){
 const d=blankLedger(SHA);d.trials[0].cases[0].observation=observation;
 assert.throws(()=>verifyLedger(d),/prohibited/);
 }
 const d=blankLedger(SHA);d.trials[0].cases[0].originalImage='sensitive';
 assert.throws(()=>verifyLedger(d),/unrecognized field/);
});
test('source hashes and dimensions well formed',()=>{
 const d=blankLedger(SHA);d.trials[0].cases[0].sourceSha256='not-a-hash';
 assert.throws(()=>verifyLedger(d),/sourceSha256/);
 d.trials[0].cases[0].sourceSha256=hash;d.trials[0].cases[0].decodedWidth=-1;
 assert.throws(()=>verifyLedger(d),/decodedWidth/);
});
test('measured p50/p95 and unmeasured stay absent',()=>{
 const d=blankLedger(SHA);d.trials[1].timingsMs={decode:[20,10,50,30,40]};
 const s=verifyLedger(d);assert.deepEqual(s.metrics['iphone-safari.decode'],
 {n:5,p50Ms:30,p95Ms:50,provenance:'nonphysical'});
 assert.equal(s.metrics['android-chrome.decode'],undefined);
});
test('FAIL cannot be blank; HOLD cannot change',()=>{
 const d=blankLedger(SHA);d.trials[0].cases[1].status='FAIL';
 assert.throws(()=>verifyLedger(d),/FAIL needs observation/);
 d.trials[0].cases[1].observation='permission refused';d.release='RELEASE';
 assert.throws(()=>verifyLedger(d),/HOLD/);
});
test('reject wrong platforms and missing negative gates',()=>{
 const d=blankLedger(SHA);d.trials[1].platform='desktop-webkit';
 assert.throws(()=>verifyLedger(d),/platform order/);
 const e=blankLedger(SHA);e.trials[0].cases.pop();
 assert.throws(()=>verifyLedger(e),/all scenario rows/);
});

test('prose-only PHYSICAL checklist cannot certify original-photo integrity',()=>{
 const d=blankLedger(SHA);
 for(const p of d.trials){
  Object.assign(p,{deviceKind:'PHYSICAL',model:'test phone',osVersion:'OS test',browserVersion:'test browser',witness:'tester initials'});
  for(const c of p.cases){c.status='PASS';c.observation='looks good';}
 }
 assert.throws(()=>verifyLedger(d,{allowPhysical:true}),/sourceSha256 receipt required before PASS/);
});
const physical=()=>{
 const d=blankLedger(SHA);Object.assign(d.trials[0],
  {deviceKind:'PHYSICAL',model:'test phone',osVersion:'OS 17',browserVersion:'Chrome test',witness:'tester initials'});
 return d;
};
const mark=(d,id,proof)=>{
 const c=d.trials[0].cases.find(x=>x.id===id);Object.assign(c,{status:'PASS',observation:'on-device direct receipt checked',...proof});return c;
};
const source={sourceSha256:hash,originalByteCount:12345,decodedWidth:400,decodedHeight:300};
test('source-only 2D refuses thumbnail digest, byte-count and dimension mismatches',()=>{
 const d=physical(),c=mark(d,'source-original-2d',
  {...source,savedSha256:hash,displayedSha256:'c'.repeat(64),savedByteCount:12345,displayedByteCount:12345,displayedWidth:400,displayedHeight:300});
 assert.throws(()=>verifyLedger(d,{allowPhysical:true}),/displayed original SHA mismatch/);
 c.displayedSha256=hash;c.displayedByteCount=12344;
 assert.throws(()=>verifyLedger(d,{allowPhysical:true}),/displayed original byte count mismatch/);
 c.displayedByteCount=12345;c.displayedWidth=399;
 assert.throws(()=>verifyLedger(d,{allowPhysical:true}),/width mismatch/);
 c.displayedWidth=400;assert.equal(verifyLedger(d,{allowPhysical:true}).pass,1);
});
test('v3/v4 restore requires unchanged source, exported, restored hash bytes and dimensions',()=>{
 for(const id of ['v3-atomic-restore','v4-lossless-restore']){
  const d=physical(),c=mark(d,id,{...source,savedSha256:hash,restoredSha256:hash,
   savedByteCount:12345,restoredByteCount:12345,restoredWidth:400,restoredHeight:300});
  assert.equal(verifyLedger(d,{allowPhysical:true}).pass,1);
  c.restoredSha256='c'.repeat(64);
  assert.throws(()=>verifyLedger(d,{allowPhysical:true}),/restored original SHA mismatch/);
  c.restoredSha256=hash;c.restoredByteCount=12344;
  assert.throws(()=>verifyLedger(d,{allowPhysical:true}),/restored byte count mismatch/);
  c.restoredByteCount=12345;c.restoredHeight=301;
  assert.throws(()=>verifyLedger(d,{allowPhysical:true}),/restored height mismatch/);
 }
});
test('tamper and wrong-thumbnail negative cases require distinct source digests',()=>{
 for(const [id,field] of [['tampered-original-rejected','tamperedSha256'],
  ['thumbnail-source-mismatch-rejected','thumbnailSha256']]){
  const d=physical(),c=mark(d,id,{sourceSha256:hash,[field]:hash});
  assert.throws(()=>verifyLedger(d,{allowPhysical:true}),/must differ|did not change bytes/);
  c[field]='c'.repeat(64);assert.equal(verifyLedger(d,{allowPhysical:true}).pass,1);
 }
});
test('gallery PASS requires measured original hash, bytes and decoded dimensions',()=>{
 const d=physical(),c=mark(d,'gallery-jpeg',{sourceSha256:hash});
 assert.throws(()=>verifyLedger(d,{allowPhysical:true}),/originalByteCount receipt required/);
 Object.assign(c,{originalByteCount:12345,decodedWidth:400,decodedHeight:300});
 assert.equal(verifyLedger(d,{allowPhysical:true}).pass,1);
});
