import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {evaluateMission1Evidence} from '../scripts/m1-release-evidence-851.mjs';
const require=createRequire(import.meta.url);
const Device=require('../public/device-acceptance-78.js');
const moduleCode=readFileSync('public/device-acceptance-78.js','utf8');
const app=readFileSync('public/app.js','utf8');
const html=readFileSync('public/index.html','utf8');
const script=readFileSync('scripts/test-parallel78-device-browser.mjs','utf8');
const SHA='a'.repeat(64),SOURCE='b'.repeat(64);
test('P852 recorder exact parent agrees with independently verified P851, and operator must identify exact tested build',()=>{
 assert.equal(Device.SOURCE_PARENT,'9b582710e1b406e0d8ee256940627b5297646500');
 assert.match(moduleCode,/id="p78commit"/);
 assert.match(moduleCode,/if\(!COMMIT\.test\(commit\)\)/);
 assert.match(moduleCode,/create\(\{sourceCommit:commit,/);
 assert.match(script,/P78_COMMIT_REQUIRED/);
 assert.equal((html.match(/device-acceptance-78\.js/g)||[]).length,1);
});
test('P852 device app remains default off and cannot auto-recognize an emulator as a witnessed phone',()=>{
 assert.match(moduleCode,/new URLSearchParams\(root\.location\.search\)\.get\('deviceLab78'\)==='1'/);
 const s=Device.create({sourceCommit:Device.SOURCE_PARENT});
 assert.equal(Device.publicReport(s).counts.NOT_RUN,23);
 assert.equal(Device.publicReport(s).independentlyVerifiedPhysicalRuns,0);
 assert.throws(()=>Device.record(s,{caseId:'owner_review_843',status:'PASS',evidenceSha256:SHA,ownerGate:true}),/UNVERIFIED_DEVICE_EVIDENCE/);
 assert.equal(Device.releaseGate([Device.publicReport(s)]).status,'BLOCKED');
});
test('P852 even fully filled operator PASS claims remain unverified and cannot become P851 release acceptance',()=>{
 const results=[];
 for(const platform of ['ANDROID_CHROME','IPHONE_SAFARI']){
  const s=Device.create({platform,operatorDeclaredPhysical:true,sourceCommit:Device.SOURCE_PARENT});
  for(const [caseId] of Device.CASES){
   Device.record(s,{caseId,status:'PASS',evidenceSha256:SHA,originalSha256:SOURCE,sourcePreserved:true,ownerGate:true,severity:'NONE'});
  }
  const publicReport=Device.publicReport(s);
  assert.equal(publicReport.counts.PASS,23);
  assert.equal(Device.validatePublic(publicReport),true);
  assert.equal(publicReport.independentlyVerifiedPhysicalRuns,0);
  results.push(publicReport);
 }
 assert.equal(Device.releaseGate(results,{independentlyReviewedPairs:60,cloudOwnerIsolationVerified:true}).status,'BLOCKED');
 assert.equal(evaluateMission1Evidence({schema:'m1-release-evidence-851-v1',roles:{physicalDevices:results}}).status,'BLOCKED');
 assert.equal(evaluateMission1Evidence(null).shouldLiftFamilyAlphaHold,false);
});
test('P852 public reports contain no private photo hash, account IDs or exact private observations',()=>{
 const s=Device.create({platform:'ANDROID_CHROME',operatorDeclaredPhysical:true});
 Device.record(s,{caseId:'source_sha',status:'PASS',evidenceSha256:SHA,originalSha256:SOURCE,ownerGate:true,sourcePreserved:true});
 const r=Device.publicReport(s),serialized=JSON.stringify(r);
 assert.equal(r.releaseStatus,'BLOCKED');
 assert.equal(serialized.includes(SHA),false);
 assert.equal(serialized.includes(SOURCE),false);
 assert.equal(serialized.includes('ownerId'),false);
 assert.equal(serialized.includes('"originalSha256"'),false);\n assert.equal(serialized.includes('"evidenceSha256"'),false);
});
test('P852 real main P851 owner-approved edit/queue/correction constraints are unchanged',()=>{
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(app,/let saveInFlight=false;/);
 assert.match(app,/P849_CHANGED_CANDIDATE_OR_OWNER/);
 assert.match(app,/reviewQueue850\.keepForLater\(batch,window\.closetAuth\.user\)/);
 assert.match(app,/function learningScope72\(/);
 assert.doesNotMatch(moduleCode,/(?:savePiece|writeAll|indexedDB\.open|localStorage\.setItem)\s*\(/);
});
