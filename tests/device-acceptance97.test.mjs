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
 d.trials[0].cases[0].status='PASS';d.trials[0].cases[0].observation='actual camera capture';
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
 assert.throws(()=>verifyLedger(d),/source SHA256/);
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
