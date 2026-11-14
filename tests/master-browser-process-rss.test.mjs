import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sampleBrowserProcessRss} from '../research/master-consolidation-1054/browser-process-rss.mjs';
async function fixture(fn){
 const root=await mkdtemp(join(tmpdir(),'cc-rss-'));
 try{
  const add=async(pid,ppid,rss)=>{
   await mkdir(join(root,String(pid)));
   await writeFile(join(root,String(pid),'status'),['Name:\tbrowser','PPid:\t'+ppid,'VmRSS:\t'+rss+' kB',''].join('\n'));
  };
  return await fn({root,add});
 }finally{await rm(root,{recursive:true,force:true});}
}
test('only browser root and descendants count, not unrelated processes',async()=>{
 await fixture(async({root,add})=>{
  await add(100,1,1024);await add(101,100,512);await add(102,101,256);
  await add(103,77,8192);await add(77,1,4096);await add(104,100,128);
  const r=await sampleBrowserProcessRss(100,{procRoot:root});
  assert.deepEqual([r.rootRssBytes,r.treeRssBytes,r.processCount],[1024*1024,1920*1024,4]);
  assert.match(r.metric,/non-unique/);
 });
});
test('missing root means unmeasured, never fabricated zero',async()=>{
 await fixture(async({root,add})=>{await add(2,1,100);assert.equal(await sampleBrowserProcessRss(99,{procRoot:root}),null);});
});
test('missing proc is unmeasured without crashing inference',async()=>{
 assert.equal(await sampleBrowserProcessRss(123,{procRoot:'/unavailable-cc-proc-root'}),null);
 assert.equal(await sampleBrowserProcessRss(0),null);
});
test('malformed or disappearing descendants do not fabricate memory',async()=>{
 await fixture(async({root,add})=>{
  await add(100,1,1000);await mkdir(join(root,'200'));
  await writeFile(join(root,'200','status'),'PPid:\t100\nVmRSS:\tnot-a-number kB\n');
  const r=await sampleBrowserProcessRss(100,{procRoot:root});
  assert.equal(r.processCount,1);assert.equal(r.treeRssBytes,1024000);
 });
});
