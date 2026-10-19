import test from 'node:test';
import assert from 'node:assert/strict';
import engine from '../public/device-check-engine.js';
import {comparePrivatePhonePilotReports} from '../benchmark/review-phone-pilot-reports.mjs';
const {deviceCheckSteps,deviceCheckReport}=engine;
const full=()=>Object.fromEntries(deviceCheckSteps.map(([id])=>[id,'pass']));
const report=(platform,build='abc123abc123',steps=full(),events=[])=>deviceCheckReport({
 enabled:false,steps,events},build,platform);
test('two complete sanitized reports still require independent real-device hardware review',()=>{
 const r=comparePrivatePhonePilotReports(report('Android'),report('iPhone/iPad'));
 assert.equal(r.status,'manual-human-evidence-review-required');
 assert.equal(r.android.totalChecks,17);
 assert.equal(r.android.localSelfReportedComplete,true);
 assert.equal(r.iphone.localSelfReportedComplete,true);
 assert.equal(r.bothReportsSameBuild,'abc123abc123');
 assert.equal(r.actualHardwareCameraVerified,null);
 assert.equal(r.independentPhysicalDevicesConfirmed,false);
 assert.equal(r.actualOriginalPhotoFormAccuracy,null);
 assert.equal(r.productionReleaseApproved,false);
});
test('missing checks, explicit failure and scanner error keep both devices blocked',()=>{
 const android=report('Android');
 const ios=report('iPhone/iPad','abc123abc123',{login:'pass',capture:'fail'},[
  {type:'scanner_error',stage:'weights',code:'network',durationMs:150}]);
 const x=comparePrivatePhonePilotReports(android,ios);
 assert.equal(x.status,'blocked-manual-checks-incomplete');
 assert.deepEqual(x.blockers,['ios-needs-review']);
 assert.ok(x.iphone.missing.includes('originalColor'));
 assert.deepEqual(x.iphone.needsHelp,['capture']);
 assert.equal(x.iphone.scannerErrors,1);
});
test('different app builds must not be accepted as same staging session',()=>{
 const r=comparePrivatePhonePilotReports(report('Android'),report('iPhone/iPad','bbbbbbbbbbbb'));
 assert.equal(r.status,'blocked-manual-checks-incomplete');
 assert.deepEqual(r.blockers,['different-app-builds']);
 assert.equal(r.bothReportsSameBuild,null);
 assert.equal(r.branchOrDeploymentVerified,false);
});
test('spoofed completion, forged phone data, leaked image bytes and wrong platform fail closed',()=>{
 const a=report('Android'),i=report('iPhone/iPad');
 const attacks=[
  x=>x.summary.locallyComplete=false,
  x=>x.summary.checked=1,
  x=>x.summary.missing=['capture'],
  x=>x.image='data:image/png;base64,PRIVATE',
  x=>x.events.push({type:'scanner_error',url:'https://private-photo.example',stage:'identify'}),
  x=>x.events.push({type:'test_custom',code:'user-name'}),
  x=>x.steps.privateBody='pass',
  x=>x.platform='iPhone/iPad',
  x=>x.liveCameraVerified=true,
  x=>x.summary.needsHelp=['capture'],
  x=>x.appRelease='unknown'
 ];
 for(const mutate of attacks){const tampered=structuredClone(a);mutate(tampered);
  assert.throws(()=>comparePrivatePhonePilotReports(tampered,i));
 }
});
test('device-check report itself excludes photos, email, clothing names and user IDs',()=>{
 const state={enabled:true,steps:{recognition:'pass',cameraModes:'fail',
  privateClothes:'pass'},events:[{type:'scanner_error',
   photo:'data:image/jpeg;base64,private',email:'person@example.org',
   body:'private',code:'image',durationMs:100,stage:'identify'}]};
 const r=deviceCheckReport(state,'abc123abc123','Android');
 const raw=JSON.stringify(r);
 assert.equal(r.version,2);
 assert.equal(r.summary.checked,2);
 assert.equal(r.summary.missing.length,15);
 assert.equal(r.summary.locallyComplete,false);
 for(const forbidden of ['data:image','person@example.org','privateClothes','personID','base64,private'])
  assert.ok(!raw.includes(forbidden),'private data leaked: '+forbidden);
 assert.equal(r.sendAutomatically,false);
});
