import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,readdir,rm,writeFile,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {writeAtomicStagingBundle} from '../scripts/atomic-staging-output.mjs';

async function withTemp(fn){
 const directory=await mkdtemp(join(tmpdir(),'closet-atomic-staging-'));
 try{await fn(directory);}finally{await rm(directory,{recursive:true,force:true});}
}
async function assertNoStagingRemnants(directory){
 const contents=await readdir(directory);
 assert.ok(!contents.some(name=>name==='staging-dist'||name.startsWith('staging-dist.incomplete-')),JSON.stringify(contents));
}

test('publishes staging-dist only after every generated file succeeds',async()=>{
 await withTemp(async directory=>{
  const output=join(directory,'staging-dist');
  const result=await writeAtomicStagingBundle(output,async pending=>{
   await mkdir(pending,{recursive:true});
   await writeFile(join(pending,'auth.js'),"const URL='https://separate-staging.supabase.co';\n");
   await writeFile(join(pending,'staging-preflight.json'),'{"releasePromotion":"BLOCKED"}\n');
   await assert.rejects(stat(output),{code:'ENOENT'});
   return 'complete';
  });
  assert.equal(result,'complete');
  assert.match(await readFile(join(output,'auth.js'),'utf8'),/separate-staging/);
  assert.equal((await readdir(directory)).length,1);
 });
});

test('failure after source copy cannot leave a partially configured deployable folder',async()=>{
 await withTemp(async directory=>{
  const output=join(directory,'staging-dist');
  await assert.rejects(writeAtomicStagingBundle(output,async pending=>{
   await mkdir(pending,{recursive:true});
   await writeFile(join(pending,'auth.js'),"const URL='https://LIVE-PRODUCTION.example';\n");
   throw Error('Staging Auth rewrite refused changed source layout');
  }),/Staging Auth rewrite refused/);
  await assertNoStagingRemnants(directory);
 });
});

test('failed rebuild removes both stale previous output and incomplete candidate',async()=>{
 await withTemp(async directory=>{
  const output=join(directory,'staging-dist');
  await mkdir(output);
  await writeFile(join(output,'old.txt'),'outdated');
  await assert.rejects(writeAtomicStagingBundle(output,async pending=>{
   await mkdir(pending,{recursive:true});
   await writeFile(join(pending,'new.txt'),'unverified');
   throw Error('synthetic failure');
  }),/synthetic failure/);
  await assertNoStagingRemnants(directory);
 });
});

test('generator failure before copying source leaves nothing deployable',async()=>{
 await withTemp(async directory=>{
  const output=join(directory,'staging-dist');
  await assert.rejects(writeAtomicStagingBundle(output,async()=>{throw Error('build failed');}),/build failed/);
  await assertNoStagingRemnants(directory);
 });
});

test('invalid invocation cannot delete existing output',async()=>{
 await withTemp(async directory=>{
  const output=join(directory,'staging-dist');
  await mkdir(output);
  await writeFile(join(output,'keep.txt'),'original');
  await assert.rejects(writeAtomicStagingBundle(output,null),{name:'TypeError'});
  assert.equal(await readFile(join(output,'keep.txt'),'utf8'),'original');
 });
});
