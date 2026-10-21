import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,readdir,rm,writeFile,stat} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once as eventOnce} from 'node:events';
import {setTimeout as sleep} from 'node:timers/promises';
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

test('competing builder fails without interrupting a live builder',async()=>{
 await withTemp(async directory=>{
  const output=join(directory,'staging-dist');
  let started;const startedPromise=new Promise(resolve=>started=resolve);
  let release;const gate=new Promise(resolve=>release=resolve);
  const one=writeAtomicStagingBundle(output,async pending=>{
   await mkdir(pending,{recursive:true});
   await writeFile(join(pending,'auth.js'),'synthetic');
   started();await gate;
   await writeFile(join(pending,'verified.txt'),'complete');
  });
  try{
   await startedPromise;
   await assert.rejects(writeAtomicStagingBundle(output,async()=>{
    throw Error('Unexpected concurrent callback');
   }),/already locked/);
   assert.equal((await readdir(directory)).filter(n=>n.startsWith('staging-dist.incomplete-')).length,1);
  }finally{release();}
  await one;
  assert.equal(await readFile(join(output,'verified.txt'),'utf8'),'complete');
  assert.deepEqual(await readdir(directory),['staging-dist']);
 });
});

test('interrupted candidate rejects rebuild without removing an earlier valid artifact',async()=>{
 await withTemp(async directory=>{
  const output=join(directory,'staging-dist'),orphan=output+'.incomplete-999999-crashed';
  await mkdir(orphan);
  await writeFile(join(orphan,'unreviewed.js'),'synthetic production-looking source');
  await mkdir(output);
  await writeFile(join(output,'verified.txt'),'previous verified build');
  await assert.rejects(writeAtomicStagingBundle(output,async()=>{
   throw Error('callback must never run');
  }),/Interrupted staging candidate found/);
  assert.equal(await readFile(join(output,'verified.txt'),'utf8'),'previous verified build');
  assert.equal(await readFile(join(orphan,'unreviewed.js'),'utf8'),'synthetic production-looking source');
  assert.ok(!(await readdir(directory)).includes('staging-dist.build.lock'));
  await rm(orphan,{recursive:true,force:true});
  await writeAtomicStagingBundle(output,async pending=>{
   await mkdir(pending,{recursive:true});
   await writeFile(join(pending,'verified.txt'),'fresh safe build');
  });
  assert.equal(await readFile(join(output,'verified.txt'),'utf8'),'fresh safe build');
 });
});

test('existing build lock always prevents destructive rebuild',async()=>{
 await withTemp(async directory=>{
  const output=join(directory,'staging-dist');
  await mkdir(output);await writeFile(join(output,'keep.txt'),'safe');
  await writeFile(output+'.build.lock','unknown running builder');
  await assert.rejects(writeAtomicStagingBundle(output,async()=>{}),/already locked/);
  assert.equal(await readFile(join(output,'keep.txt'),'utf8'),'safe');
  assert.equal(await readFile(output+'.build.lock','utf8'),'unknown running builder');
 });
});

test('SIGKILL leaves locked incomplete source and refuses auto-restart',{skip:process.platform==='win32'},async()=>{
 await withTemp(async directory=>{
  const output=join(directory,'staging-dist'),marker=join(directory,'ready.marker');
  const moduleUrl=new URL('../scripts/atomic-staging-output.mjs',import.meta.url).href;
  const code=`import {writeAtomicStagingBundle} from ${JSON.stringify(moduleUrl)};
import {mkdir,writeFile} from 'node:fs/promises';
await writeAtomicStagingBundle(process.argv[1],async dir=>{
 await mkdir(dir,{recursive:true});
 await writeFile(dir+'/auth.js','fake copied input');
 await writeFile(process.argv[2],'ready');
 await new Promise(()=>setInterval(()=>{},1000));
});`;
  const child=spawn(process.execPath,['--input-type=module','-e',code,output,marker],{stdio:'ignore'});
  try{
   let ready=false;
   for(let i=0;i<200;i++){
    try{await stat(marker);ready=true;break;}catch{}
    if(child.exitCode!==null)throw Error('Child exited before candidate was made');
    await sleep(25);
   }
   assert.equal(ready,true,'Child never reached staging generation');
   const finished=eventOnce(child,'exit');
   child.kill('SIGKILL');await finished;
   const leftover=(await readdir(directory)).filter(n=>n.startsWith('staging-dist.incomplete-'));
   assert.equal(leftover.length,1);
   assert.equal(await readFile(join(directory,leftover[0],'auth.js'),'utf8'),'fake copied input');
   assert.match(await readFile(output+'.build.lock','utf8'),/staging-build-in-progress/);
   await assert.rejects(writeAtomicStagingBundle(output,async()=>{}),/already locked/);
   await assert.rejects(stat(output),{code:'ENOENT'});
  }finally{if(child.exitCode===null)child.kill('SIGKILL');}
 });
});
