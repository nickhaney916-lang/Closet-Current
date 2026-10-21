import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,writeFile,readFile,rm,lstat,stat,symlink} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import device from '../public/device-check-engine.js';
import saved from '../public/saved-closet-audit-engine.js';
import {lockPhotoLabels,phonePhotoResult,scorePhonePhotos,photoTypes} from '../public/phone-photo-benchmark.mjs';
const release='abc123abc123';
const checks=Object.fromEntries(device.deviceCheckSteps.map(([id])=>[id,'pass']));
const typeLabel={category:'Tops',type:'T-shirt',color:'Blue'};
const makeSaved=platform=>saved.makeReport([{
 id:'item-001',source:'camera',expected:typeLabel,proposed:typeLabel,
 disposition:'saved-auto',saved:typeLabel,quality:'clear',backup:'restored'
}],release,platform);
const makeModel=()=>{
 const labels=lockPhotoLabels([{category:'Tops',type:photoTypes('Tops')[0],color:'Blue'}]);
 return scorePhonePhotos(labels,[phonePhotoResult('photo-001',{
  strong:true,choices:[{category:'Tops',itemType:labels[0].expectedType}],
  details:{color:'Blue'}},17)],{release,indexHash:'b'.repeat(64)});
};
async function fixtures(){
 const input=await mkdtemp(join(tmpdir(),'cc-pilot-cohort-'));
 const paths=['android.json','iphone.json','model.json','saved-android.json','saved-iphone.json']
  .map(x=>join(input,x));
 const payload=[
  device.deviceCheckReport({steps:checks},release,'Android'),
  device.deviceCheckReport({steps:checks},release,'iPhone/iPad'),
  makeModel(),makeSaved('Android'),makeSaved('iPhone/iPad')
 ];
 for(let k=0;k<paths.length;k++)await writeFile(paths[k],JSON.stringify(payload[k]));
 const output=resolve('artifacts/private-phone-pilot/cohort-'+randomBytes(8).toString('hex')+'.json');
 const run=(args=[])=>spawnSync(process.execPath,[
  'scripts/review-private-pilot-cohort.mjs',
  '--android',paths[0],'--iphone',paths[1],
  '--model-reports',paths[2],
  '--saved-reports',paths[3],paths[4],
  '--out',output,...args
 ],{cwd:process.cwd(),encoding:'utf8',timeout:12000});
 return {input,paths,payload,output,run};
}
test('local CLI writes only redacted aggregate, never overwrites inputs or existing report',async()=>{
 await mkdir('artifacts/private-phone-pilot',{recursive:true});
 const f=await fixtures();
 try{
  const original=await Promise.all(f.paths.map(x=>readFile(x,'utf8')));
  const first=f.run();assert.equal(first.status,0,first.stderr);
  const report=JSON.parse(await readFile(f.output,'utf8'));
  assert.equal(report.appRelease,release);
  assert.equal(report.productionReleaseApproved,false);
  assert.equal(report.originalPhotosLinkedAcrossReportFamilies,false);
  assert.equal(report.verifiedProductionSavedClosetAccuracy,null);
  const raw=JSON.stringify(report);
  for(const s of ['item-001','photo-001','SECRET','fileName','imageData','accountId'])
   assert.equal(raw.includes(s),false,'private row detail leaked: '+s);
  if(process.platform!=='win32')assert.equal((await stat(f.output)).mode&0o777,0o600);
  assert.notEqual(f.run().status,0,'Must reject overwrite');
  assert.deepEqual(await Promise.all(f.paths.map(x=>readFile(x,'utf8'))),original);
 }finally{await rm(f.input,{recursive:true,force:true});await rm(f.output,{force:true});}
});
test('tampered inputs and an output symlink fail without writing outside the private root',async()=>{
 await mkdir('artifacts/private-phone-pilot',{recursive:true});
 const f=await fixtures();
 try{
  const bad={...f.payload[2],photo:'PRIVATE_SECRET'};
  await writeFile(f.paths[2],JSON.stringify(bad));
  assert.notEqual(f.run().status,0);
  await assert.rejects(()=>lstat(f.output));
  await writeFile(f.paths[2],JSON.stringify(f.payload[2]));
  const outside=join(f.input,'untouched.json');await writeFile(outside,'leave-untouched');
  await symlink(outside,f.output);
  assert.notEqual(f.run().status,0);
  assert.equal(await readFile(outside,'utf8'),'leave-untouched');
 }finally{await rm(f.input,{recursive:true,force:true});await rm(f.output,{force:true});}
});
