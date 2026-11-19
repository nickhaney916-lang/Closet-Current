import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {deviceCheckReport}=require('../public/device-check-engine.js');
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {blankManifest,verifyEvidence,DEVICE_CASES,CLOUD_CASES,INTEGRATION_CASES}
 from '../research/mission3-release-evidence-gate/verify.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const cases=keys=>Object.fromEntries(keys.map(k=>[k,'PASS']));
const appSteps=['login','capture','cameraModes','recognition','adjust',
 'outfitCapture','closet','outfit','return','backup'];
const head='b'.repeat(40),release='abc123abc123',source='c'.repeat(40);
function fixture(){
 const files=new Map();
 function attach(name,obj){
  const bytes=Buffer.from(JSON.stringify(obj));
  files.set(name,bytes);return sha(bytes);
 }
 const devices=['android-chrome','ios-safari'].map((family,i)=>{
  const file=(i?'ios':'android')+'-device-check.json';
  const report={
   format:'closet-current-device-check',version:1,
   appRelease:release,platform:i?'iPhone/iPad':'Android',
   steps:cases(appSteps),
   events:[{type:'recognized_saved',durationMs:2500}]
  };
  for(const k of appSteps)report.steps[k]='pass';
  const photoReceipts=Array.from({length:15},(_,n)=>{
   const h=(i*100+n+1).toString(16).padStart(64,'0');
   return {capture:h,saved:h,restored:h};
  });
  return {
   family,execution:'physical',osVersion:i?'20.1':'17.0',
   browserVersion:i?'26.1':'141.0.10',testedAt:'2026-11-14T03:20:00Z',
   reportFile:file,reportSha256:attach(file,report),cases:cases(DEVICE_CASES),
   photoReceipts
  };
 });
 const testAccounts=['tester-1','tester-2','tester-3','tester-4'];
 const cloudReport={
  format:'closet-current-mission3-cloud-check',version:1,
  environment:'authorized-hosted',testAccounts,passedCases:[...CLOUD_CASES]
 };
 const integrationReport={
  format:'closet-current-mission3-integration',version:1,
  sourceHead:head,passedCases:[...INTEGRATION_CASES]
 };
 const manifest={
  schema:1,sourceHead:head,appAssetRelease:release,devices,
  cloud:{
   environment:'authorized-hosted',testedAt:'2026-11-14T03:20:00Z',
   testAccounts,cases:cases(CLOUD_CASES),reportFile:'hosted-cloud-check.json',
   reportSha256:attach('hosted-cloud-check.json',cloudReport)
  },
  integration:{
   sourceHead:head,mission1Head:source,mission2Head:source,mission3Head:source,
   testedAt:'2026-11-14T03:20:00Z',
   cases:cases(INTEGRATION_CASES),reportFile:'integrated-check.json',
   reportSha256:attach('integrated-check.json',integrationReport)
  },
  ownerApproval:'HOLD'
 };
 return {manifest,files};
}
const check=(f)=>verifyEvidence(f.manifest,f.files);
test('blank template is HOLD and contains no fabricated physical, hosted or integrated PASS',()=>{
 const manifest=blankManifest();
 const value=verifyEvidence(manifest,new Map());
 assert.equal(value.status,'BLOCKED');assert.equal(value.releaseAuthorized,false);
 assert.equal(value.familyAlpha,'HOLD');
 assert.equal(manifest.ownerApproval,'HOLD');
 assert.ok(Object.values(manifest.devices[0].cases).every(x=>x==='NOT_RUN'));
 assert.ok(value.issues.some(x=>x.includes('not PASS')));
});
test('fully populated synthetic test-only fixture never authorizes release',()=>{
 const f=fixture(),v=check(f);
 assert.deepEqual(v.issues,[]);
 assert.equal(v.status,'EVIDENCE_READY_FOR_INDEPENDENT_REVIEW');
 assert.equal(v.releaseAuthorized,false);
 assert.equal(v.familyAlpha,'HOLD');
});
test('CSS viewport emulation cannot stand in for actual Android hardware',()=>{
 const f=fixture();f.manifest.devices[0].execution='emulated';
 const v=check(f);
 assert.equal(v.status,'BLOCKED');assert.ok(v.issues.some(x=>x.includes('not a physical phone')));
});
test('missing iPhone evidence never silently qualifies physical two-device coverage',()=>{
 const f=fixture();f.manifest.devices=f.manifest.devices.slice(0,1);
 assert.equal(check(f).status,'BLOCKED');
});
test('same device family twice is rejected even when both report all PASS',()=>{
 const f=fixture();f.manifest.devices[1].family='android-chrome';
 const v=check(f);assert.equal(v.status,'BLOCKED');
 assert.ok(v.issues.some(x=>x.includes('duplicate')));
});
test('app release is the real asset id, independent of exact git source SHA',()=>{
 const f=fixture();assert.equal(check(f).issues.length,0);
 f.manifest.appAssetRelease=head.slice(0,12);
 const v=check(f);assert.equal(v.status,'BLOCKED');
 assert.ok(v.issues.some(x=>x.includes('app release mismatch')));
});
test('unreviewed steps and no recorded saved recognition block a claim',()=>{
 const f=fixture();f.manifest.devices[0].cases['owner-reviewed-save']='NOT_RUN';
 let v=check(f);assert.equal(v.status,'BLOCKED');
 f.manifest.devices[0].cases['owner-reviewed-save']='PASS';
 const name=f.manifest.devices[0].reportFile;
 const report=JSON.parse(f.files.get(name));report.events=[];
 const bytes=Buffer.from(JSON.stringify(report));f.files.set(name,bytes);
 f.manifest.devices[0].reportSha256=sha(bytes);
 v=check(f);assert.ok(v.issues.some(x=>x.includes('missing recorded saved-recognition')));
});
test('original JPEG change through save or restore is a hard failure',()=>{
 const f=fixture();
 f.manifest.devices[0].photoReceipts[0].restored='a'.repeat(64);
 const v=check(f);assert.equal(v.status,'BLOCKED');
 assert.ok(v.issues.some(x=>x.includes('original JPEG SHA changed')));
});
test('15 distinct real-original receipts required, duplicates and insufficient samples rejected',()=>{
 const f=fixture();f.manifest.devices[0].photoReceipts.pop();
 let v=check(f);assert.equal(v.status,'BLOCKED');
 assert.ok(v.issues.some(x=>x.includes('at least 15')));
 f.manifest.devices[0].photoReceipts.push({...f.manifest.devices[0].photoReceipts[0]});
 v=check(f);assert.ok(v.issues.some(x=>x.includes('duplicate original SHA')));
});
test('cloud self-described disposable DB cannot be misreported as hosted',()=>{
 const f=fixture();f.manifest.cloud.environment='disposable-postgres';
 assert.equal(check(f).status,'BLOCKED');
});
test('cloud owner access alone does not establish foreign owner RLS and no-merge',()=>{
 const f=fixture();f.manifest.cloud.cases['foreign-read-denied']='NOT_RUN';
 assert.equal(check(f).status,'BLOCKED');
 f.manifest.cloud.cases['foreign-read-denied']='PASS';
 f.manifest.cloud.cases['remote-conflict-no-silent-merge']='FAIL';
 assert.equal(check(f).status,'BLOCKED');
});
test('four separate pseudonymous tester slots required, no names/emails/UUIDs',()=>{
 const f=fixture();f.manifest.cloud.testAccounts=['tester-1','tester-1','tester-3','tester-4'];
 let v=check(f);assert.equal(v.status,'BLOCKED');
 assert.ok(v.issues.some(x=>x.includes('four distinct')));
 f.manifest.cloud.testAccounts=['email@example.com','tester-2','tester-3','tester-4'];
 assert.equal(check(f).status,'BLOCKED');
});
test('integration must reflect exact same source HEAD that phones tested',()=>{
 const f=fixture();f.manifest.integration.sourceHead='d'.repeat(40);
 assert.equal(check(f).status,'BLOCKED');
});
test('raw access tokens or photo paths cannot enter manually attached report',()=>{
 const f=fixture(),name=f.manifest.devices[0].reportFile;
 const report=JSON.parse(f.files.get(name));
 report.access_token='PRIVATE SECRET';
 report.events[0].image='data:image/jpeg;base64,PRIVATE';
 const bytes=Buffer.from(JSON.stringify(report));
 f.files.set(name,bytes);f.manifest.devices[0].reportSha256=sha(bytes);
 const v=check(f);
 assert.equal(v.status,'BLOCKED');
 assert.ok(v.issues.some(x=>x.includes('contains unexpected field')));
 assert.ok(v.issues.some(x=>x.includes('contains unexpected field')));
 assert.ok(!JSON.stringify(v).includes('PRIVATE SECRET'));
 assert.ok(!JSON.stringify(v).includes('data:image'));
});
test('attacker-controlled secret JSON key names are never echoed into diagnostics',()=>{
 const f=fixture();
 const name=f.manifest.devices[0].reportFile;
 const report=JSON.parse(f.files.get(name));
 report['PRIVATE_OWNER_EMAIL_AND_SECRET_TOKEN']=true;
 const bytes=Buffer.from(JSON.stringify(report));
 f.files.set(name,bytes);f.manifest.devices[0].reportSha256=sha(bytes);
 const result=check(f);
 assert.equal(result.status,'BLOCKED');
 assert.ok(result.issues.some(x=>x.includes('unexpected field')));
 assert.ok(!JSON.stringify(result).includes('PRIVATE_OWNER_EMAIL_AND_SECRET_TOKEN'));
});
test('missing or modified local report cannot pass even with manually typed PASS values',()=>{
 const f=fixture(),name=f.manifest.devices[0].reportFile;
 f.files.delete(name);
 assert.equal(check(f).status,'BLOCKED');
 const f2=fixture();f2.files.set(name,Buffer.from('{"forged":true}'));
 assert.equal(check(f2).status,'BLOCKED');
});
test('private path traversal, URLs and unexpected manifest keys fail closed',()=>{
 const f=fixture();
 f.manifest.devices[0].reportFile='../../owner-private-file.json';
 f.manifest.authorization='Bearer secrets';
 const v=check(f);assert.equal(v.status,'BLOCKED');
 assert.ok(v.issues.some(x=>x.includes('contains unexpected field')));
 assert.ok(v.issues.some(x=>x.includes('invalid safe JSON filename')));
});
test('handwritten cloud and integration passedCase receipts must cover every required case',()=>{
 const f=fixture();
 const cloudFile=f.manifest.cloud.reportFile,cloud=JSON.parse(f.files.get(cloudFile));
 cloud.passedCases.pop();
 let bytes=Buffer.from(JSON.stringify(cloud));f.files.set(cloudFile,bytes);
 f.manifest.cloud.reportSha256=sha(bytes);
 assert.ok(check(f).issues.some(x=>x.includes('cloud.report: case receipts incomplete')));
 const integratedFile=f.manifest.integration.reportFile;
 const integration=JSON.parse(f.files.get(integratedFile));integration.sourceHead='f'.repeat(40);
 bytes=Buffer.from(JSON.stringify(integration));f.files.set(integratedFile,bytes);
 f.manifest.integration.reportSha256=sha(bytes);
 assert.ok(check(f).issues.some(x=>x.includes('integration.report: mismatched source')));
});
test('owner approval field cannot be changed into an automatic release command',()=>{
 const f=fixture();f.manifest.ownerApproval='APPROVED';
 const v=check(f);assert.equal(v.status,'BLOCKED');
 assert.equal(v.releaseAuthorized,false);
});
test('CLI template is runnable from relative path with no source credentials',()=>{
 const cli=join('research','mission3-release-evidence-gate','verify.mjs');
 const x=execFileSync(process.execPath,[cli,'--template'],{encoding:'utf8'});
 const data=JSON.parse(x);
 assert.equal(data.ownerApproval,'HOLD');
 assert.equal(data.devices.length,2);
 assert.ok(!x.includes('sb_secret_'));
});
test('CLI accepts a private local folder and returns BLOCKED/exit 2 without leaking data',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'mission3-evidence-'));
 try{
  const path=join(dir,'mission3.json');
  const data=blankManifest();
  data.secret='PRIVATE-HOSTED-TOKEN';
  await writeFile(path,JSON.stringify(data));
  const cli=resolve('research','mission3-release-evidence-gate','verify.mjs');
  const out=spawnSync(process.execPath,[cli,'--verify',path],{encoding:'utf8'});
  assert.equal(out.status,2);
  assert.equal(JSON.parse(out.stdout).status,'BLOCKED');
  assert.ok(!out.stdout.includes('PRIVATE-HOSTED-TOKEN'));
  assert.equal(out.stderr,'');
 }finally{await rm(dir,{recursive:true,force:true})}
});


test('recorded hard device faults cannot be laundered by all-PASS checkboxes or a saved scan',()=>{
 const failures=['scanner_error','worker_start_failed','timeout',
  'photo_check_failed','outfit_split_failed'];
 for(const family of ['android-chrome','ios-safari']){
  for(const fault of failures){
   for(const order of ['before','after']){
    const f=fixture(),device=f.manifest.devices.find(d=>d.family===family);
    const name=device.reportFile,report=JSON.parse(f.files.get(name));
    const failed={type:fault,stage:'runtime',code:'network',durationMs:27};
    if(order==='before')report.events.unshift(failed);
    else report.events.push(failed);
    const bytes=Buffer.from(JSON.stringify(report));
    f.files.set(name,bytes);device.reportSha256=sha(bytes);
    const result=check(f);
    assert.equal(result.status,'BLOCKED',family+' '+fault+' '+order);
    assert.equal(result.releaseAuthorized,false);
    assert.equal(result.familyAlpha,'HOLD');
    assert.ok(result.issues.some(x=>x.includes('recorded device failure')),
     family+' '+fault+' '+order);
    assert.ok(!JSON.stringify(result).includes('network'));
   }
  }
 }
});

test('informational review/duplicate events do not falsely become terminal device failures',()=>{
 const f=fixture(),d=f.manifest.devices[0];
 const report=JSON.parse(f.files.get(d.reportFile));
 report.events.push(
  {type:'not_recognized',stage:'identify'},
  {type:'duplicate_review'},
  {type:'exact_duplicate_skipped'}
 );
 const bytes=Buffer.from(JSON.stringify(report));
 f.files.set(d.reportFile,bytes);d.reportSha256=sha(bytes);
 const result=check(f);
 assert.equal(result.status,'EVIDENCE_READY_FOR_INDEPENDENT_REVIEW');
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.familyAlpha,'HOLD');
});

test('a new clean owner device report can be considered for review only after logged failure is absent',()=>{
 const f=fixture(),d=f.manifest.devices[0],name=d.reportFile;
 const original=JSON.parse(f.files.get(name));
 const withFailure={...original,events:[...original.events,{type:'photo_check_failed',code:'image'}]};
 let bytes=Buffer.from(JSON.stringify(withFailure));
 f.files.set(name,bytes);d.reportSha256=sha(bytes);
 assert.equal(check(f).status,'BLOCKED');
 // Starting a *new* QA run clears the old device diagnostic history; the
 // manifest checks only the newly attached report and still never releases.
 bytes=Buffer.from(JSON.stringify(original));
 f.files.set(name,bytes);d.reportSha256=sha(bytes);
 const status=check(f);
 assert.equal(status.status,'EVIDENCE_READY_FOR_INDEPENDENT_REVIEW');
 assert.equal(status.releaseAuthorized,false);
 assert.equal(status.familyAlpha,'HOLD');
});

test('a saturated 40-event device export blocks even when every retained event is benign',()=>{
 const f=fixture(),device=f.manifest.devices[0],name=device.reportFile;
 const report=JSON.parse(f.files.get(name));
 report.events=Array.from({length:40},(_,i)=>
  i===0?{type:'recognized_saved'}:{type:'scanner_progress',percent:50});
 const bytes=Buffer.from(JSON.stringify(report));
 f.files.set(name,bytes);device.reportSha256=sha(bytes);
 const result=check(f);
 assert.equal(result.status,'BLOCKED');
 assert.ok(result.issues.some(x=>x.includes('40-event device diagnostic cap')));
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.familyAlpha,'HOLD');
});

test('actual shipped exporter can evict an earlier genuine failure; saturated preflight refuses false PASS',()=>{
 const f=fixture(),device=f.manifest.devices[1],name=device.reportFile;
 const initial=JSON.parse(f.files.get(name));
 const sourceEvents=[
  {type:'scanner_error',code:'runtime',stage:'runtime'},
  ...Array.from({length:40},(_,i)=>
   i===0?{type:'recognized_saved'}:{type:'scanner_progress',percent:50})
 ];
 const exported=deviceCheckReport(
  {steps:initial.steps,events:sourceEvents},
  release,'iPhone/iPad');
 assert.equal(exported.events.length,40);
 assert.equal(exported.events.some(e=>e.type==='scanner_error'),false,
  'Source exporter really evicted the earlier genuine failure');
 assert.equal(exported.events.some(e=>e.type==='recognized_saved'),true);
 const bytes=Buffer.from(JSON.stringify(exported));
 f.files.set(name,bytes);device.reportSha256=sha(bytes);
 const result=check(f);
 assert.equal(result.status,'BLOCKED');
 assert.ok(result.issues.some(x=>x.includes('40-event device diagnostic cap')));
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.familyAlpha,'HOLD');
});

test('below-cap original export with ordinary informational diagnostics still remains review-only',()=>{
 const f=fixture(),device=f.manifest.devices[1],name=device.reportFile;
 const original=JSON.parse(f.files.get(name));
 const source=deviceCheckReport({
  steps:original.steps,
  events:[{type:'recognized_saved'},{type:'scanner_progress',percent:50},
   {type:'duplicate_review'},{type:'not_recognized'}]
 },release,'iPhone/iPad');
 const bytes=Buffer.from(JSON.stringify(source));
 f.files.set(name,bytes);device.reportSha256=sha(bytes);
 const result=check(f);
 assert.equal(result.status,'EVIDENCE_READY_FOR_INDEPENDENT_REVIEW');
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.familyAlpha,'HOLD');
});

test('SHA-matched cloud report must not be reused with a later manifest cloud test time',()=>{
 const f=fixture();
 f.manifest.cloud.testedAt='2026-11-18T03:20:00Z';
 const result=check(f);
 assert.equal(result.status,'BLOCKED',
  'Changing only the unsigned manifest time must not reuse old cloud proof bytes');
 assert.ok(result.issues.some(x=>x.includes('cloud.report: test time mismatch')));
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.familyAlpha,'HOLD');
});

test('SHA-matched integration report must not be reused with changed integrated test time',()=>{
 const f=fixture();
 f.manifest.integration.testedAt='2026-11-18T03:20:00Z';
 const result=check(f);
 assert.equal(result.status,'BLOCKED');
 assert.ok(result.issues.some(x=>x.includes('integration.report: test time mismatch')));
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.familyAlpha,'HOLD');
});

test('old cloud evidence must not be replayed under a different source head',()=>{
 const f=fixture(),newHead='d'.repeat(40);
 f.manifest.sourceHead=newHead;
 f.manifest.integration.sourceHead=newHead;
 const name=f.manifest.integration.reportFile;
 const integrated=JSON.parse(f.files.get(name));
 integrated.sourceHead=newHead;
 const bytes=Buffer.from(JSON.stringify(integrated));
 f.files.set(name,bytes);
 f.manifest.integration.reportSha256=sha(bytes);
 // The cloud report bytes and digest are deliberately unchanged.
 const result=check(f);
 assert.equal(result.status,'BLOCKED');
 assert.ok(result.issues.some(x=>x.includes('cloud.report: different source head')));
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.familyAlpha,'HOLD');
});
