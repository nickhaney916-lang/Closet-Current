import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {snapshotBrowserProcessTree} from '../research/master-consolidation-1054/browser-process-memory.mjs';

function withTree(callback){
  const root=mkdtempSync(join(tmpdir(),'cc1054-memory-'));
  const add=(pid,ppid,rss,hwm,pss)=>{
    const dir=join(root,String(pid));mkdirSync(dir);
    writeFileSync(join(dir,'status'),['Name:\ttest','PPid:\t'+ppid,'VmRSS:\t'+rss+' kB','VmHWM:\t'+hwm+' kB',''].join('\n'));
    if(pss!==null)writeFileSync(join(dir,'smaps_rollup'),'Rss: '+rss+' kB\nPss: '+pss+' kB\n');
  };
  try{callback({root,add});}finally{rmSync(root,{recursive:true,force:true});}
}

test('samples only browser root and descendants, never exports PIDs',()=>withTree(({root,add})=>{
  add(101,1,100,200,50);add(102,101,60,70,20);add(103,102,40,50,10);add(999,1,9000,9000,9000);
  const x=snapshotBrowserProcessTree(101,{procRoot:root});
  assert.equal(x.processCount,3);
  assert.equal(x.rootRSSBytes,100*1024);
  assert.equal(x.rootHWMBytes,200*1024);
  assert.equal(x.summedTreeRSSBytes,200*1024);
  assert.equal(x.proportionalTreePSSBytes,80*1024);
  assert.equal(x.pssComplete,true);
  assert.doesNotMatch(JSON.stringify(x),/"pid"|"ppid"|999/);
}));

test('missing child PSS refuses false complete proportional memory',()=>withTree(({root,add})=>{
  add(101,1,100,200,60);add(102,101,20,25,null);
  const x=snapshotBrowserProcessTree(101,{procRoot:root});
  assert.equal(x.summedTreeRSSBytes,120*1024);
  assert.equal(x.proportionalTreePSSBytes,null);
  assert.equal(x.pssComplete,false);
}));

test('missing root and invalid PID are not memory measurements',()=>withTree(({root,add})=>{
  add(102,101,20,25,10);
  for(const pid of [0,-1,NaN,Infinity,101,1.5])
    assert.equal(snapshotBrowserProcessTree(pid,{procRoot:root}),null);
}));

test('genuine runner samples the live browser PID, keeps no-release blocked rule',()=>{
  const code=readFileSync('scripts/test-main1054-real-webkit-repeat.mjs','utf8');
  assert.match(code,/snapshotBrowserProcessTree/);
  assert.match(code,/browserServer\?\.process\(\)\?\.pid/);
  assert.match(code,/setInterval\(sampleMemory/);
  assert.match(code,/maxSampledBrowserTreeRSSBytes/);
  assert.match(code,/maxSampledBrowserTreePSSBytes/);
  assert.match(code,/HARNESS_WALL_CLOCK_BUDGET/);
  assert.match(code,/acceptanceForRelease:false/);
  assert.match(code,/persistedPrivateWardrobeWrites:0/);
});
