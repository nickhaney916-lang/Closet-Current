import test from 'node:test';
import assert from 'node:assert/strict';
import {assertPlan,blankWorksheet,assessWorksheet,printPlan,readPlan} from '../scripts/family-alpha-70-mobile-qa.mjs';
import {makeStageReadOnlyClient,runStageTwoOwnerReadOnly,safeSummary,STAGE_REF,PRODUCTION_REF} from '../scripts/family-alpha-48-real-jwt-readonly-preflight.mjs';
const plan=await readPlan();
const tokenA='A'.repeat(70),tokenB='B'.repeat(70),key='sb_publishable_'+'p'.repeat(24);
const ua='11111111-1111-4111-8111-111111111111';
const ub='22222222-2222-4222-8222-222222222222';
const clone=x=>structuredClone(x);
const fake=(mode='normal')=>async(url,options)=>{
 const u=new URL(url),t=options.headers.Authorization.slice(7),user=t===tokenA?ua:t===tokenB?ub:'invalid';
 const other=user===ua?ub:ua;
 let body;
 if(u.pathname==='/auth/v1/user')body={id:user};
 else if(u.pathname==='/rest/v1/closet_backups'){
  const id=u.searchParams.get('owner_id')?.slice(3);
  body=(id===user || (id===other&&mode==='backup-leak'))?[{owner_id:id}]:[];
  if(mode==='missing-own'&&id===user)body=[];
 }else if(u.pathname.endsWith('/object/list/closet-private')){
  const prefix=JSON.parse(options.body).prefix;
  body=(prefix===user+'/' || (prefix===other+'/'&&mode==='photo-leak'))?[{name:prefix+'synthetic-source-only.jpg'}]:[];
  if(mode==='missing-own'&&prefix===user+'/')body=[];
 }else throw Error('Mock permitted an unexpected path');
 return {ok:true,status:200,json:async()=>body};
};
test('40+ four-account physical phone cases and two-owner A/B negative controls are complete',()=>{
 assert.equal(assertPlan(plan),plan);
 assert.equal(plan.cases.length,47);
 assert.equal(plan.cases.filter(x=>x.expected==='DENY').length>=8,true);
 assert.match(printPlan(plan),/guardian supervised/);
 assert.match(printPlan(plan),/Two-owner verification/);
 assert.equal(printPlan(plan).includes(tokenA),false);
});
test('local-only template cannot silently mark or release tests',()=>{
 const empty=blankWorksheet(plan),report=assessWorksheet(plan,empty);
 assert.equal(report.decision,'HOLD');
 assert.equal(report.releaseAuthorized,false);
 assert.equal(report.counts.NOT_RUN,47);
 assert.equal(report.physicalDeviceEvidenceAcceptedByRepository,false);
 const full=clone(empty);for(const x of full.results)x.status='PASS';
 const claim=assessWorksheet(plan,full);
 assert.equal(claim.allLocallyMarkedPass,true);
 assert.equal(claim.decision,'HOLD');
 assert.equal(claim.releaseAuthorized,false);
 assert.equal(claim.independentVisualApproval,false);
});
test('reject extra sensitive/private worksheet fields, status forgery and missing A/B cases',()=>{
 const base=blankWorksheet(plan);
 const edits=[
  x=>x.jwt=tokenA,
  x=>x.email='a@example.com',
  x=>x.familyPhoto='data:image/jpeg;base64,AAA',
  x=>x.deviceId='device-123',
  x=>x.results[0].accountId=ua,
  x=>x.results[0].notes='private-name',
  x=>x.results[0].status='VERIFIED_LIVE',
  x=>x.results[0].status=true,
  x=>x.results[0].id='two-owner/X01',
  x=>x.results.pop(),
  x=>x.results.push({id:'extra',status:'PASS'}),
  x=>x.scope='PUBLIC_GITHUB',
  x=>x.results='all pass'
 ];
 for(const [i,edit] of edits.entries()){
  const next=clone(base);edit(next);
  assert.throws(()=>assessWorksheet(plan,next),undefined,'private/forged case '+i);
 }
});
test('reject plan changes that weaken negative tests, omit devices or introduce real accounts',()=>{
 const edits=[
  x=>x.productionAccess=true,
  x=>x.deployAuthorized=true,
  x=>x.subjects.push('new-child'),
  x=>x.physicalCoverage.android='desktop-emulation',
  x=>x.cases[0].expected='OK',
  x=>x.cases[0].actors=['adult-a','adult-b'],
  x=>x.cases[0].email='example@example.com',
  x=>x.cases.pop(),
  x=>x.cases.push(clone(x.cases[0]))
 ];
 for(const [i,edit] of edits.entries()){
  const x=clone(plan);edit(x);
  assert.throws(()=>assertPlan(x),undefined,'altered plan '+i);
 }
});
test('reuses existing stage JWT readonly verifier: successful local fake is NOT release evidence',async()=>{
 assert.notEqual(STAGE_REF,PRODUCTION_REF);
 const report=await runStageTwoOwnerReadOnly({key,tokenA,tokenB,fetchImpl:fake()});
 assert.equal(report.status,'PASS_LIVE_READONLY_TWO_OWNER_ACCESS');
 assert.equal(report.crossOwnerBackupReadsDenied,true);
 assert.equal(report.crossOwnerPhotoListDenied,true);
 assert.equal(report.twoOwnerBackupPositiveControls,true);
 assert.equal(report.twoOwnerPhotoPositiveControls,true);
 assert.equal(report.decision,'HOLD');
 assert.equal(report.deploymentAuthorized,false);
 assert.equal(report.stagingModified,false);
 assert.equal(report.physicalDevicesTested,false);
});
test('two-owner mock detects cross-owner backup row exposure and object listing exposure',async()=>{
 const backup=await runStageTwoOwnerReadOnly({key,tokenA,tokenB,fetchImpl:fake('backup-leak')});
 const photo=await runStageTwoOwnerReadOnly({key,tokenA,tokenB,fetchImpl:fake('photo-leak')});
 assert.equal(backup.status,'FAIL_CROSS_OWNER_VISIBILITY');
 assert.equal(photo.status,'FAIL_CROSS_OWNER_VISIBILITY');
 assert.equal(backup.decision,'HOLD');assert.equal(photo.decision,'HOLD');
});
test('missing positive owner backups and photos cannot qualify as verified access',async()=>{
 const report=await runStageTwoOwnerReadOnly({key,tokenA,tokenB,fetchImpl:fake('missing-own')});
 assert.equal(report.status,'INCOMPLETE_POSITIVE_CONTROLS');
 assert.equal(report.decision,'HOLD');
});
test('readonly transport refuses cross-origin/production, photo download, writers and unbounded queries',async()=>{
 const client=makeStageReadOnlyClient({key,fetchImpl:fake()});
 const denied=[
  {path:'https://'+PRODUCTION_REF+'.supabase.co/auth/v1/user',token:tokenA},
  {path:'/storage/v1/object/closet-private/'+ua+'/source.jpg',token:tokenA},
  {path:'/rest/v1/closet_backups?select=document',token:tokenA},
  {path:'/rest/v1/closet_backups?select=owner_id&limit=100',token:tokenA},
  {path:'/rest/v1/closet_backups?select=owner_id&limit=2',token:tokenA,method:'POST'},
  {path:'/auth/v1/signup',token:tokenA,method:'POST'},
  {path:'/storage/v1/object/list/closet-private',token:tokenA,method:'POST',body:{prefix:ub+'/',limit:500,offset:0}}
 ];
 for(const request of denied)await assert.rejects(client(request));
 assert.deepEqual(safeSummary(null,'NOT_RUN').decision,'HOLD');
});
