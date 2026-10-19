import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,existsSync,statSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import engine from '../public/device-check-engine.js';
const {deviceCheckReport,deviceCheckSteps}=engine;
const checks=()=>Object.fromEntries(deviceCheckSteps.map(([id])=>[id,'pass']));
function run({tamper=null,iosBuild='abc123abc123'}={}){
 const folder=mkdtempSync(join(tmpdir(),'closet-private-phone-'));
 try{
  const android=deviceCheckReport({enabled:false,steps:checks(),events:[]},'abc123abc123','Android');
  const iphone=deviceCheckReport({enabled:false,steps:checks(),events:[]},iosBuild,'iPhone/iPad');
  tamper?.(android,iphone);
  const a=join(folder,'android.json'),i=join(folder,'iphone.json'),out=join(folder,'summary.json');
  writeFileSync(a,JSON.stringify(android));writeFileSync(i,JSON.stringify(iphone));
  const result=spawnSync(process.execPath,['scripts/compare-private-phone-pilot-reports.mjs',a,i,out],
   {cwd:process.cwd(),encoding:'utf8'});
  return {exit:result.status,stdout:result.stdout,stderr:result.stderr,
   fileCreated:existsSync(out),report:existsSync(out)?JSON.parse(readFileSync(out,'utf8')):null};
 }finally{rmSync(folder,{recursive:true,force:true});}
}
test('local CLI retains only derived 17-step status and never certifies physical phones',()=>{
 const r=run();
 assert.equal(r.exit,0,r.stderr);
 assert.equal(r.fileCreated,true);
 assert.equal(r.report.status,'manual-human-evidence-review-required');
 assert.equal(r.report.bothReportsSameBuild,'abc123abc123');
 assert.equal(r.report.independentPhysicalDevicesConfirmed,false);
 assert.equal(r.report.productionReleaseApproved,false);
 assert.equal(r.report.android.checksCompleted,17);
 assert.match(r.stdout,/PRIVATE_TWO_PHONE_PILOT_REVIEW/);
});
test('mismatched builds remain blocked even when all manual buttons are clicked',()=>{
 const r=run({iosBuild:'bbbbbbbbbbbb'});
 assert.equal(r.exit,0);
 assert.equal(r.report.status,'blocked-manual-checks-incomplete');
 assert.deepEqual(r.report.blockers,['different-app-builds']);
});
test('full reports with unsolicited account or clothing private text are never written to output',()=>{
 const r=run({tamper:(android)=>{android.accountEmail='private@example.test';}});
 assert.notEqual(r.exit,0);
 assert.equal(r.fileCreated,false);
 assert.ok(!r.stdout.includes('private@example.test'));
 assert.ok(!r.stderr.includes('private@example.test'));
});

test('never overwrite original Android or iPhone evidence or existing private summaries',()=>{
 const folder=mkdtempSync(join(tmpdir(),'closet-private-no-clobber-'));
 try{
  const a=join(folder,'android.json'),i=join(folder,'iphone.json'),out=join(folder,'summary.json');
  const android=JSON.stringify(deviceCheckReport({enabled:false,steps:checks(),events:[]},'abc123abc123','Android'));
  const iphone=JSON.stringify(deviceCheckReport({enabled:false,steps:checks(),events:[]},'abc123abc123','iPhone/iPad'));
  writeFileSync(a,android);writeFileSync(i,iphone);
  const execute=destination=>spawnSync(process.execPath,
   ['scripts/compare-private-phone-pilot-reports.mjs',a,i,destination],
   {cwd:process.cwd(),encoding:'utf8'});
  for(const target of [a,i]){
   const r=execute(target);
   assert.notEqual(r.status,0,'must not replace raw tester evidence');
   assert.match(r.stderr,/output already exists or cannot be created/);
  }
  assert.equal(readFileSync(a,'utf8'),android);
  assert.equal(readFileSync(i,'utf8'),iphone);
  writeFileSync(out,'existing independent summary');
  assert.notEqual(execute(out).status,0);
  assert.equal(readFileSync(out,'utf8'),'existing independent summary');
  const link=join(folder,'summary-link.json');
  symlinkSync(a,link);
  assert.notEqual(execute(link).status,0,'symlink must not overwrite a raw export');
  assert.equal(readFileSync(a,'utf8'),android);
  assert.equal(readFileSync(i,'utf8'),iphone);
 }finally{rmSync(folder,{recursive:true,force:true});}
});
test('new local derived summary is a private file rather than world-readable output',()=>{
 const folder=mkdtempSync(join(tmpdir(),'closet-private-mode-'));
 try{
  const a=join(folder,'android.json'),i=join(folder,'iphone.json'),out=join(folder,'summary.json');
  writeFileSync(a,JSON.stringify(deviceCheckReport({enabled:false,steps:checks(),events:[]},'abc123abc123','Android')));
  writeFileSync(i,JSON.stringify(deviceCheckReport({enabled:false,steps:checks(),events:[]},'abc123abc123','iPhone/iPad')));
  const result=spawnSync(process.execPath,['scripts/compare-private-phone-pilot-reports.mjs',a,i,out],
   {cwd:process.cwd(),encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.equal(JSON.parse(readFileSync(out,'utf8')).productionReleaseApproved,false);
  if(process.platform!=='win32')
   assert.equal(statSync(out).mode & 0o077,0,'group and other must have no summary access');
 }finally{rmSync(folder,{recursive:true,force:true});}
});
