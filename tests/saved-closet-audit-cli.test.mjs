import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,writeFile,readFile,stat,lstat,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import engine from '../public/saved-closet-audit-engine.js';
const release='abc123abc123';
const a={category:'Tops',type:'T-shirt',color:'Blue'},b={category:'Shoes',type:'Shoes',color:'White'};
const make=(category,platform)=>engine.makeReport([{
 id:'item-001',source:'camera',expected:category,proposed:category,
 disposition:'saved-auto',saved:category,quality:'clear',backup:'restored'
}],release,platform);
const run=(files,out)=>spawnSync(process.execPath,['scripts/review-private-saved-closet.mjs',
 '--reports',...files,'--out',out],{cwd:process.cwd(),encoding:'utf8',timeout:10000});
test('private saved-closet auditor makes only redacted reports; never overwrites or shares inputs',async()=>{
 await mkdir('artifacts/private-phone-pilot',{recursive:true});
 const testRoot=await mkdtemp(resolve('artifacts/private-phone-pilot/test-saved-'));
 const inputs=await mkdtemp(join(tmpdir(),'closet-audit-input-'));
 try{
  const android=join(inputs,'android.json'),ios=join(inputs,'ios.json'),dest=join(testRoot,'result.json');
  const aa=JSON.stringify(make(a,'Android')),bb=JSON.stringify(make(b,'iPhone/iPad'));
  await writeFile(android,aa);await writeFile(ios,bb);
  const result=run([android,ios],dest);
  assert.equal(result.status,0,result.stderr);
  const output=JSON.parse(await readFile(dest,'utf8'));
  assert.equal(output.productionReleaseApproved,false);
  assert.equal(output.productionSavedClosetAccuracy,null);
  assert.equal(output.attemptsWithSavedClosetRecord,2);
  assert.equal(output.rawPhotosOrAccountIdsRead,false);
  assert.ok(!JSON.stringify(output).includes('item-001'));
  if(process.platform!=='win32')assert.equal((await stat(dest)).mode&0o777,0o600);
  const again=run([android,ios],dest);assert.notEqual(again.status,0);
  assert.deepEqual(await readFile(android,'utf8'),aa);
  assert.deepEqual(await readFile(ios,'utf8'),bb);
  assert.equal(JSON.parse(await readFile(dest,'utf8')).productionReleaseApproved,false);
 }finally{await rm(testRoot,{recursive:true,force:true});await rm(inputs,{recursive:true,force:true});}
});
test('tampered private photos, forged approval and linked report output fail without writing files',async()=>{
 await mkdir('artifacts/private-phone-pilot',{recursive:true});
 const testRoot=await mkdtemp(resolve('artifacts/private-phone-pilot/test-saved-'));
 const inputs=await mkdtemp(join(tmpdir(),'closet-audit-input-'));
 try{
  const android=join(inputs,'android.json'),ios=join(inputs,'ios.json'),dest=join(testRoot,'output.json');
  const modified=make(a,'Android');modified.rows[0].photo='data:image/jpeg;base64,SECRET';
  await writeFile(android,JSON.stringify(modified));await writeFile(ios,JSON.stringify(make(b,'iPhone/iPad')));
  assert.notEqual(run([android,ios],dest).status,0);
  await assert.rejects(()=>lstat(dest));
  await writeFile(android,JSON.stringify(make(a,'Android')));
  const outside=join(inputs,'outside.json');await writeFile(outside,'keep');
  await symlink(outside,dest);
  assert.notEqual(run([android,ios],dest).status,0);
  assert.equal(await readFile(outside,'utf8'),'keep');
 }finally{await rm(testRoot,{recursive:true,force:true});await rm(inputs,{recursive:true,force:true});}
});
