import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inspectSignedOwner26 as inspect,renderSignedOwner26 as render}
 from '../scripts/audit-signed-owner-evidence-26.mjs';
const manifest=JSON.parse(readFileSync('research/signed-owner-evidence-26/manifest.json','utf8'));
const actions=['backup and outfit hidden','direct overwrite cannot target foreign row',
 'direct delete cannot target foreign row','forged owner insertion denied',
 'wrong backup revision cannot commit','foreign photo listing empty',
 'foreign photo GET','foreign photo PUT','foreign photo DELETE',
 'cannot issue a foreign signed photo URL','foreign photo upload denied'];
const copy=x=>structuredClone(x);
function fixture(){
 const w=manifest.work29;
 const metadata={
  pr:{number:581,state:'open',draft:true,merged:false,
   head:{sha:w.sha,ref:'research/signed-owner-privacy-25-work29-HOLD',
    repo:{full_name:manifest.repository}},base:{repo:{full_name:manifest.repository}}},
  run:{id:w.runId,head_sha:w.sha,
   head_repository:{full_name:manifest.repository},
   name:'SIGNED-OWNER-PRIVACY-25 disposable auth and local browser NO DEPLOY',
   status:'completed',conclusion:'success',event:'pull_request'},
  jobs:['browser','signed-http'].map(name=>({name,status:'completed',conclusion:'success'})),
  artifacts:[
   {id:w.signedArtifactId,name:w.signedArtifactName,expired:false,size_in_bytes:838},
   {id:w.browserArtifactId,name:w.browserArtifactName,expired:false,size_in_bytes:560468}],
  issue:{number:255,state:'open'}
 };
 const checks=[];
 const add=(name,status=200)=>checks.push({name,status});
 for(const owner of ['A','B']){
  for(const part of ['signup','password login','server-authenticated identity',
   'owner creates private JPEG','owner creates backup'])add(owner+' '+part);
  for(let repeat=0;repeat<2;repeat++)
   for(const part of ['owns unchanged original, outfit and backup','private JPEG hash',
    'owner can list photo'])add(owner+' '+part);
 }
 for(const [actor,victim] of [['A','B'],['B','A']])
  for(const action of actions){
   const status=/hidden|overwrite|delete cannot|wrong backup revision|listing empty/.test(action)?200:400;
   add(actor+' against '+victim+' '+action,status);
  }
 for(const owner of ['A','B'])
  for(let i=0;i<3;i++)add('Anonymous '+owner+' backup or photo denied',401);
 for(const [name,status] of [
  ['Tampered signed credential denied',401],
  ['Refresh preserves signed owner',200],
  ['Signed logout succeeds',204],
  ['Signed logout revokes refresh credential',400],
  ['Naturally expired signed credential denied',401],
  ['Refresh after access expiry retains owner',200]])add(name,status);
 assert.equal(checks.length,56);
 const signed={head:w.sha,signedLocalSupabase:true,
  distinctAuthenticatedOwners:true,checks,
  logoutAccessTokenRemainsUsable:true,
  scope:'Disposable loopback; synthetic JPEGs; no hosted access'};
 const pngs={},results=[];
 for(const engine of ['chromium','webkit'])
  for(const width of [320,390,430]){
   const filename=engine+'-'+width+'.png';
   const bytes=Buffer.alloc(10000,0x21);
   Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes,0);
   bytes.writeUInt32BE(width,16);bytes.writeUInt32BE(780,20);
   pngs[filename]=bytes;
   results.push({engine,width,filename,
    sha256:createHash('sha256').update(bytes).digest('hex'),
    realIndexedDB:true,authFixture:true,lateWriteRejected:true});
  }
 const browser={authScope:'Synthetic auth transport with real application and IndexedDB',results};
 return {metadata,signed,browser,pngs};
}
const pass=(m=manifest,f=fixture())=>inspect(m,f.metadata,f.signed,f.browser,f.pngs);
test('independent signed evidence is accepted only as disposable local research; pilot remains HOLD',()=>{
 const out=pass();
 assert.equal(out.verdict,'NARROW_DISPOSABLE_SIGNED_RESEARCH_VERIFIED');
 assert.equal(out.realSignedDisposableAccounts,2);
 assert.equal(out.signedHttpChecks,56);
 assert.equal(out.browserRuns,6);
 assert.equal(out.screenshotSha256Verified,6);
 assert.equal(out.hostedCloudSignedSecurityAccepted,false);
 assert.equal(out.realSignedBrowserToCloudAccepted,false);
 assert.equal(out.realHandsetAccepted,false);
 assert.equal(out.pilotReleaseApproved,false);
 assert.equal(out.familyAlpha,'HOLD');
});
test('real Work29 PR must retain immutable head and draft ownership',()=>{
 for(const mutation of [
  f=>f.metadata.pr.head.sha='a'.repeat(40),
  f=>f.metadata.pr.draft=false,
  f=>f.metadata.pr.merged=true,
  f=>f.metadata.pr.head.repo.full_name='malicious/closet',
  f=>f.metadata.pr.head.ref='main'
 ]){
  const f=fixture();mutation(f);
  assert.throws(()=>pass(manifest,f),/exact Work29 PR/);
 }
});
test('green GitHub Actions on wrong SHA, deployment workflow or incomplete job cannot pass',()=>{
 for(const mutation of [
  f=>f.metadata.run.head_sha='a'.repeat(40),
  f=>f.metadata.run.name='Deploy production',
  f=>f.metadata.run.conclusion='failure',
  f=>f.metadata.run.event='workflow_dispatch'
 ]){
  const f=fixture();mutation(f);
  assert.throws(()=>pass(manifest,f),/exact no-deploy/);
 }
 for(const name of ['signed-http','browser']){
  const f=fixture();f.metadata.jobs.find(x=>x.name===name).conclusion='failure';
  assert.throws(()=>pass(manifest,f),/independent/);
 }
});
test('missing signed JSON or browser artifact does not count as evidence',()=>{
 for(const mod of [
  f=>f.metadata.artifacts.pop(),
  f=>f.metadata.artifacts[0].expired=true,
  f=>f.metadata.artifacts[0].id=99,
  f=>f.metadata.artifacts[1].size_in_bytes=10
 ]){
  const f=fixture();mod(f);
  assert.throws(()=>pass(manifest,f),/artifact absent or expired/);
 }
});
test('two genuine signed distinct accounts cannot be replaced by a simulated userId',()=>{
 for(const mod of [
  f=>f.signed.signedLocalSupabase=false,
  f=>f.signed.distinctAuthenticatedOwners=false,
  f=>f.signed.head='b'.repeat(40),
  f=>f.signed.scope='Mocked SQL roles on hosted environment'
 ]){
  const f=fixture();mod(f);
  assert.throws(()=>pass(manifest,f),/genuine disposable/);
 }
});
test('every cross-owner read/write/delete/storage/signed URL attack needs a tested receipt',()=>{
 for(const action of actions){
  const f=fixture();
  f.signed.checks=f.signed.checks.filter(x=>x.name!=='A against B '+action);
  assert.throws(()=>pass(manifest,f),/56 signed HTTP checks absent|missing cross-owner/);
 }
});
test('foreign owner access returning 200 on forbidden object endpoints is a failure',()=>{
 const f=fixture();
 const bad=f.signed.checks.find(x=>x.name==='B against A foreign photo GET');
 bad.status=200;
 assert.throws(()=>pass(manifest,f),/bad forbidden status/);
});
test('owner positive access and three anonymous denial paths must be present',()=>{
 const f=fixture();
 f.signed.checks.find(x=>x.name==='B owner creates backup').status=403;
 assert.throws(()=>pass(manifest,f),/positive signed owner proof/);
 const g=fixture();g.signed.checks.find(x=>x.name==='Anonymous A backup or photo denied').status=200;
 assert.throws(()=>pass(manifest,g),/anonymous privacy not tested/);
});
test('revoked refresh token does not falsely claim immediate logout JWT revocation',()=>{
 const f=fixture();f.signed.logoutAccessTokenRemainsUsable=false;
 assert.throws(()=>pass(manifest,f),/must disclose JWT/);
 const g=fixture();g.signed.checks.find(x=>x.name==='Naturally expired signed credential denied').status=200;
 assert.throws(()=>pass(manifest,g),/expired\/tampered tokens not blocked/);
});
test('browser auth must stay labeled fixture, never signed browser-to-cloud',()=>{
 for(const mod of [
  f=>f.browser.authScope='Real hosted signed browser',
  f=>f.browser.results[0].authFixture=false,
  f=>f.browser.results[0].lateWriteRejected=false,
  f=>f.browser.results[0].realIndexedDB=false
 ]){
  const f=fixture();mod(f);assert.throws(()=>pass(manifest,f),/fixture auth|fixture|real app browser/);
 }
});
test('all six 320 390 430 Chromium/WebKit screenshot SHA proofs must be unique and authentic',()=>{
 const f=fixture();
 f.browser.results[1].width=320;
 assert.throws(()=>pass(manifest,f),/duplicate browser case|screenshot/);
 const g=fixture();g.pngs['webkit-430.png'][42]=10;
 assert.throws(()=>pass(manifest,g),/screenshot byte SHA mismatch/);
 const h=fixture();delete h.pngs['chromium-320.png'];
 assert.throws(()=>pass(manifest,h),/screenshot missing/);
});
test('screenshot dimensions need to match the claim, not just a PNG hash',()=>{
 const f=fixture(),file='chromium-320.png';
 f.pngs[file].writeUInt32BE(390,16);
 f.browser.results[0].sha256=createHash('sha256').update(f.pngs[file]).digest('hex');
 assert.throws(()=>pass(manifest,f),/screenshot missing\/blank\/wrong viewport/);
});
test('Family Alpha #255 and all nine release gates remain unavailable',()=>{
 const f=fixture();f.metadata.issue.state='closed';
 assert.throws(()=>pass(manifest,f),/hold issue changed/);
 const m=copy(manifest);m.governance.productionDeploy=true;
 assert.throws(()=>pass(m),/release guard/);
 const n=copy(manifest);n.familyAlpha.releaseRequirementsUnverified=0;
 assert.throws(()=>pass(n),/pilot guard/);
});
test('a temporary reduction in Work29 test cases cannot silently pass',()=>{
 const f=fixture();f.signed.checks.pop();
 assert.throws(()=>pass(manifest,f),/56 signed HTTP checks absent/);
 const g=fixture();g.browser.results.pop();
 assert.throws(()=>pass(manifest,g),/real app browser with fixture auth/);
});
test('report explicitly distinguishes signed local proof from hosted and physical tests',()=>{
 const out=pass(),report=render(out);
 assert.match(report,/disposable loopback/i);
 assert.match(report,/fixture-auth/i);
 assert.match(report,/NOT VERIFIED/);
 assert.match(report,/HOLD/);
 assert.match(report,/JWT/i);
 assert.doesNotMatch(report,/production.*verified/i);
});
