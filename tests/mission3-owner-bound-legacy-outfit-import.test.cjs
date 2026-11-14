'use strict';
// Executes the exact production legacy outfit import and signed-owner lease.
// Private photos, users and IDB outcome are synthetic; no hosted operations.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('public/outfit-board.js','utf8');
function extract(start,end){
 const i=source.indexOf(start),j=source.indexOf(end,i);
 assert.ok(i>=0&&j>i,'Missing exact production helper '+start);
 return source.slice(i,j);
}
const leaseSource=extract('function beginOwnerBoardUiLease(){','function beginNativeBoardMountLease(){');
const importSource=extract('async function importBoardBackup(value){','for(const slot of outfitSlots){const option=');
const storeSource=extract('async function persistBoardState(', 'function outfitSavedItemFacts(');
function fixture({initialized=true,native=false}={}){
 const events=[],nodes={
  authGate:{hidden:true},appShell:{hidden:false}
 };
 let releaseStartup;
 const startup=new Promise(r=>releaseStartup=r);
 const auth={user:{id:'owner-a'},assertCurrent(){if(auth.revoked)throw Error('revoked');}};
 const db={name:'closet-current-user-owner-a'};
 const ctx={
  window:{closetAuth:auth},db,captureOperationEpoch:7,nativeLossless04Active:native,
  boardInitialized:initialized,outfitBoardReady:startup,
  currentBoard:{name:'OWNER-A-CURRENT',slots:{top:'OWNER-A-ITEM'}},
  savedOutfitBoards:[{name:'OWNER-A-SAVED'}],items:[],
  $(id){return nodes[id]},
  cleanOutfitBoard(input){return JSON.parse(JSON.stringify(input??{name:'',slots:{}}))},
  syncBoardInputs(){events.push('sync')},
  renderOutfitBoard(){events.push('render')},
  persistBoardState(args){
   events.push('persist');
   const captured=JSON.parse(JSON.stringify(args));
   return new Promise((resolve,reject)=>{ctx.pending={resolve,reject,args:captured}});
  }
 };
 vm.createContext(ctx);vm.runInContext(leaseSource+importSource,ctx,{timeout:1500});
 const incoming={current:{name:'PRIVATE-IMPORT-A',slots:{top:'PRIVATE-A-SHA'}},
  saved:[{name:'PRIVATE-SAVED-A',slots:{top:'PRIVATE-A-SHA'}}]};
 function start(value=incoming){ctx.input=value;return vm.runInContext('importBoardBackup(input)',ctx);}
 async function waitForPending(){
  for(let i=0;i<30&&!ctx.pending;i++)await new Promise(r=>setImmediate(r));
  assert.ok(ctx.pending,'Signed owner import must reach IDB commit boundary');
  return ctx.pending;
 }
 return {ctx,events,nodes,auth,db,incoming,start,waitForPending,
  finishStartup(){ctx.boardInitialized=true;releaseStartup();},
  switchOwner(){
   ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-b'};ctx.captureOperationEpoch++;
  },
  sameIdLogin(){
   ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-a'};ctx.captureOperationEpoch++;
  },
  rotateEpoch(){ctx.captureOperationEpoch++},
  replaceDB(){ctx.db={name:'closet-current-user-owner-a'}},
  revoke(){auth.revoked=true},
  lockGate(){nodes.authGate.hidden=false},
  hideShell(){nodes.appShell.hidden=true},
  applyNewOwner(){
   ctx.currentBoard={name:'NEW-OWNER-CURRENT',slots:{top:'NEW-OWNER-ITEM'}};
   ctx.savedOutfitBoards=[{name:'NEW-OWNER-SAVED'}];
   events.length=0;
  }
 };
}
test('legacy import valid owner waits for commit before publishing private outfit',async()=>{
 const f=fixture();const p=f.start();const pending=await f.waitForPending();
 assert.equal(f.ctx.currentBoard.name,'OWNER-A-CURRENT');
 assert.equal(f.ctx.savedOutfitBoards[0].name,'OWNER-A-SAVED');
 assert.deepEqual(f.events,['persist']);
 assert.equal(pending.args.replaceCurrent.name,'PRIVATE-IMPORT-A');
 assert.equal(pending.args.replaceSaved[0].name,'PRIVATE-SAVED-A');
 pending.resolve();await p;
 assert.equal(f.ctx.currentBoard.name,'PRIVATE-IMPORT-A');
 assert.equal(f.ctx.savedOutfitBoards[0].name,'PRIVATE-SAVED-A');
 assert.deepEqual(f.events,['persist','sync','render']);
});
test('legacy private import failure never publishes speculative source IDs or saved outfits',async()=>{
 const f=fixture();const p=f.start();const pending=await f.waitForPending();
 pending.reject(Error('Synthetic transaction denied'));
 await assert.rejects(p,/transaction denied/);
 assert.equal(f.ctx.currentBoard.name,'OWNER-A-CURRENT');
 assert.equal(f.ctx.savedOutfitBoards[0].name,'OWNER-A-SAVED');
 assert.deepEqual(f.events,['persist']);
});
test('default import refuses native research mode before touching owned storage',async()=>{
 const f=fixture({native:true});
 await assert.rejects(f.start(),/Native backup import blocked/);
 assert.deepEqual(f.events,[]);
});
test('default import refuses unsigned account before touching storage',async()=>{
 const f=fixture();f.ctx.window.closetAuth=null;
 await assert.rejects(f.start(),/Sign in again/);
 assert.deepEqual(f.events,[]);
});
test('backup import rejects invalid saved roster before transaction',async()=>{
 for(const value of [null,{}, {saved:[]}, {current:{},saved:{}},
  {current:{},saved:Array.from({length:51},()=>({name:'x'}))}]){
  const f=fixture();
  if(value?.saved?.length===0)continue; // An empty saved roster is valid.
  await assert.rejects(f.start(value),/Invalid outfit board backup/);
  assert.deepEqual(f.events,[]);
 }
});
test('valid empty saved roster remains a supported owner-private backup import',async()=>{
 const f=fixture();const p=f.start({current:{name:'Empty',slots:{}},saved:[]});
 const pending=await f.waitForPending();
 assert.deepEqual(pending.args.replaceSaved,[]);
 pending.resolve();await p;
 assert.equal(f.ctx.currentBoard.name,'Empty');
 assert.equal(f.ctx.savedOutfitBoards.length,0);
});
for(const [reason,mutate] of [
 ['account switched',f=>f.switchOwner()],
 ['same user ID new login',f=>f.sameIdLogin()],
 ['replaced owner DB handle',f=>f.replaceDB()],
 ['capture operation epoch rotated',f=>f.rotateEpoch()],
 ['revoked signed auth',f=>f.revoke()],
 ['locked gate',f=>f.lockGate()],
 ['hidden app shell',f=>f.hideShell()]
]){
 test('delayed startup import blocks previous owner on '+reason,async()=>{
  const f=fixture({initialized:false}),p=f.start();
  mutate(f);f.applyNewOwner();f.finishStartup();
  await assert.rejects(p,/Your account changed/);
  assert.equal(f.ctx.currentBoard.name,'NEW-OWNER-CURRENT');
  assert.equal(f.ctx.savedOutfitBoards[0].name,'NEW-OWNER-SAVED');
  assert.deepEqual(f.events,[]);
 });
 test('post-commit import continuation does not render previous owner on '+reason,async()=>{
  const f=fixture(),p=f.start(),pending=await f.waitForPending();
  mutate(f);f.applyNewOwner();pending.resolve();await p;
  assert.equal(f.ctx.currentBoard.name,'NEW-OWNER-CURRENT');
  assert.equal(f.ctx.savedOutfitBoards[0].name,'NEW-OWNER-SAVED');
  assert.deepEqual(f.events,[]);
 });
}
test('owner valid delayed startup import can commit and render after readiness',async()=>{
 const f=fixture({initialized:false});const p=f.start();
 f.finishStartup();
 const pending=await f.waitForPending();
 pending.resolve();await p;
 assert.equal(f.ctx.currentBoard.name,'PRIVATE-IMPORT-A');
 assert.deepEqual(f.events,['persist','sync','render']);
});
test('production persistence snapshots explicit imported current rather than global draft',()=>{
 assert.match(storeSource,/replaceCurrent=null/);
 assert.match(storeSource,/structuredClone\(replaceCurrent===null\?currentBoard:replaceCurrent\)/);
 assert.match(importSource,/await persistBoardState\(\{replaceSaved:incomingSaved,replaceCurrent:incomingCurrent\}\)/);
 assert.match(importSource,/if\(!lease\.current\(\)\)return;\s*currentBoard=incomingCurrent;/);
});
