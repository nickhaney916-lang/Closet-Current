import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync,existsSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {lockPhotoLabels,phonePhotoResult,scorePhonePhotos} from '../public/phone-photo-benchmark.mjs';
import device from '../public/device-check-engine.js';
const checks=Object.fromEntries(device.deviceCheckSteps.map(([id])=>[id,'pass']));
const fixture=()=>{
 const labels=lockPhotoLabels([{category:'Tops',type:'T-shirt',color:'Blue'}]);
 const model=phonePhotoResult('photo-001',{strong:true,choices:[
  {category:'Tops',itemType:'T-shirt'}],details:{color:'Blue'}},22);
 return scorePhonePhotos(labels,[model],{release:'a'.repeat(12),indexHash:'b'.repeat(64)});
};
test('local CLI emits a private, redacted, non-overwriting release-BLOCKED summary',()=>{
 const temp=mkdtempSync(join(tmpdir(),'closet-phone-evidence-'));
 const root='artifacts/private-phone-pilot';
 mkdirSync(root,{recursive:true});
 const outFolder=mkdtempSync(join(root,'cli-unit-'));
 try{
  const android=join(temp,'android.json'),iphone=join(temp,'iphone.json'),photo=join(temp,'model-color.json');
  const out=join(outFolder,'summary.json');
  writeFileSync(android,JSON.stringify(device.deviceCheckReport({enabled:false,steps:checks,events:[]},'a'.repeat(12),'Android')));
  writeFileSync(iphone,JSON.stringify(device.deviceCheckReport({enabled:false,steps:checks,events:[]},'a'.repeat(12),'iPhone/iPad')));
  writeFileSync(photo,JSON.stringify(fixture()));
  const args=['scripts/review-private-pilot-evidence.mjs','--android',android,
   '--iphone',iphone,'--color-reports',photo,'--out',out];
  const call=()=>spawnSync(process.execPath,args,{cwd:process.cwd(),encoding:'utf8'});
  const first=call();
  assert.equal(first.status,0,first.stderr);
  assert.equal(existsSync(out),true);
  assert.ok(!first.stdout.includes('photo-001'));
  const report=JSON.parse(readFileSync(out,'utf8'));
  assert.equal(report.status,'pilot-release-BLOCKED-evidence-review-only');
  assert.equal(report.proposedDiagnosticThresholdsMet,false);
  assert.equal(report.modelSuggestionStudy.reportSessions,1);
  assert.equal(report.productionReleaseApproved,false);
  assert.equal(statSync(out).mode&0o777,0o600);
  assert.ok(!JSON.stringify(report).includes('photo-001'));
  const second=call();
  assert.notEqual(second.status,0);
  assert.deepEqual(JSON.parse(readFileSync(out,'utf8')),report,'existing summary stays unchanged');
  args[args.length-1]=android;
  assert.notEqual(call().status,0,'cannot overwrite original input outside private artifact folder');
  writeFileSync(photo,JSON.stringify({...fixture(),image:'data:image/jpeg;base64,secret'}));
  args[args.length-1]=join(outFolder,'tampered.json');
  assert.notEqual(call().status,0);
  assert.equal(existsSync(args[args.length-1]),false);
  assert.ok(!call().stderr.includes('base64'));
 }finally{rmSync(outFolder,{recursive:true,force:true});rmSync(temp,{recursive:true,force:true});}
});
