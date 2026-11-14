'use strict';
// Execute the actual production import handler and owner lease against disposable
// signed-owner, DOM and backup-controller doubles. No private data or network.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('public/app.js','utf8');
function extract(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a);
 assert.ok(a>=0&&b>a,'missing actual app source boundary '+start);
 return source.slice(a,b);
}
const lease=extract('function ownerWardrobeMutationLease(){','function writeAll(');
const handler=extract("$('import').onchange=async e=>{","window.addEventListener('beforeunload',e=>{if(batch.length");
function fixture(){
 const events=[],nodes={
  import:{value:''},
  authGate:{hidden:true},
  appShell:{hidden:false}
 };
 const auth={user:{id:'owner-a'},assertCurrent(){if(auth.revoked)throw Error('revoked')}};
 const db={name:'closet-current-user-owner-a'};
 const ctx={
  window:{closetAuth:auth,restoreAtomic01Bridge:null},db,captureOperationEpoch:7,
  location:{search:'?restoreAtomic01=research&nativeLossless04=research'},
  URLSearchParams,
  $(id){return nodes[id]},
  message(value){events.push('message:'+value)},
  confirm(){events.push('confirm');return true}
 };
 vm.createContext(ctx);
 vm.runInContext(lease+handler,ctx,{timeout:3000});
 const counts={invoked:0,committed:0};
 const approval={incoming:{itemCount:1,savedCount:1},existing:2,savedExisting:1};
 const bridge={async importBackup(_data,{confirm}){
  counts.invoked++;events.push('bridge-invoked');
  const ok=confirm(approval);
  if(ok)counts.committed++;
  return {cancelled:!ok};
 }};
 ctx.window.restoreAtomic01Bridge=bridge;
 const payload=JSON.stringify({format:'closet-current-owner-backup',version:4,items:[]});
 const file={size:payload.length,text:async()=>payload};
 return {
  ctx,nodes,events,counts,bridge,file,
  run(selected=file){
   return ctx.$('import').onchange({target:{files:[selected],value:'selected'}});
  },
  changeOwner(){ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};ctx.db={name:'closet-current-user-owner-b'}},
  relogin(){ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}}},
  replaceBridge(){ctx.window.restoreAtomic01Bridge={importBackup(){throw Error('unrelated controller')}}}
 };
}
function pendingFile(f){
 let release;
 const file={size:100,text:()=>new Promise(resolve=>{release=()=>resolve(JSON.stringify({format:'closet-current-owner-backup',version:4,items:[]}))})};
 return {file,release:()=>release()};
}
async function turn(){await new Promise(resolve=>setImmediate(resolve))}
test('verified signed original session can import via the existing v4 bridge',async()=>{
 const f=fixture();
 await f.run();
 assert.equal(f.counts.invoked,1);
 assert.equal(f.counts.committed,1);
 assert.deepEqual(f.events.slice(-2),['confirm','message:All clothing photos, category corrections and outfits restored together.']);
});
test('auth gate relocked while file read pending prevents private confirmation/write',async()=>{
 const f=fixture(),p=pendingFile(f),running=f.run(p.file);
 await turn();f.nodes.authGate.hidden=false;p.release();await running;
 assert.equal(f.counts.invoked,0);
 assert.deepEqual(f.events,[]);
});
test('private app hidden during file read prevents private confirmation/write',async()=>{
 const f=fixture(),p=pendingFile(f),running=f.run(p.file);
 await turn();f.nodes.appShell.hidden=true;p.release();await running;
 assert.equal(f.counts.invoked,0);
 assert.deepEqual(f.events,[]);
});
test('same owner ID re-login during pending file read has no import side effect',async()=>{
 const f=fixture(),p=pendingFile(f),running=f.run(p.file);
 await turn();f.relogin();p.release();await running;
 assert.equal(f.counts.invoked,0);
 assert.deepEqual(f.events,[]);
});
test('bridge replacement inside approval denies old controller before commit',async()=>{
 const f=fixture();
 f.ctx.confirm=()=>{f.events.push('confirm');f.replaceBridge();return true};
 await f.run();
 assert.equal(f.counts.invoked,1);
 assert.equal(f.counts.committed,0);
 assert.ok(f.events.some(x=>x.includes('recovery controls changed')));
 assert.ok(!f.events.some(x=>x.includes('restored together')));
});
test('old controller finishing after replacement must not publish restore success',async()=>{
 const f=fixture();let release;
 f.bridge.importBackup=async()=>{
  f.counts.invoked++;
  await new Promise(resolve=>{release=resolve});
  return {cancelled:false};
 };
 const running=f.run();await turn();
 assert.equal(f.counts.invoked,1);
 f.replaceBridge();release();await running;
 assert.ok(!f.events.some(x=>x.includes('restored together')));
});
test('locked UI during v4 async restore cannot publish former owner status',async()=>{
 const f=fixture();let release;
 f.bridge.importBackup=async()=>{
  f.counts.invoked++;
  await new Promise(resolve=>{release=resolve});
  return {cancelled:false};
 };
 const running=f.run();await turn();
 assert.equal(f.counts.invoked,1);
 f.nodes.authGate.hidden=false;release();await running;
 assert.deepEqual(f.events,[]);
});
test('bridge replacement before async approval callback prevents old confirmation',async()=>{
 const f=fixture();let release;
 f.bridge.importBackup=async(_data,{confirm})=>{
  f.counts.invoked++;
  await new Promise(resolve=>{release=resolve});
  return {cancelled:!confirm({incoming:{itemCount:1,savedCount:1},existing:1,savedExisting:1})};
 };
 const running=f.run();await turn();f.replaceBridge();release();await running;
 assert.equal(f.counts.invoked,1);
 assert.ok(!f.events.includes('confirm'));
 assert.ok(!f.events.some(x=>x.includes('restored together')));
});
