'use strict';
// Exact production handlers; synthetic auth, private JPEG strings and backup URLs.
// No real photos, hosted accounts, network, file download, or deployment.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),vm=require('node:vm');
const app=readFileSync('public/app.js','utf8');
const board=readFileSync('public/outfit-board.js','utf8');
function extract(source,a,b){
 const i=source.indexOf(a),j=source.indexOf(b,i);
 assert.ok(i>=0&&j>i,'Missing exact production boundary '+a);
 return source.slice(i,j);
}
const appLease=extract(app,'function ownerWardrobeMutationLease(){','function writeAll(');
const exportHandler=extract(app,"$('export').onclick=async()=>{","$('import').onchange=async e=>");
const boardLease=extract(board,'function beginOwnerBoardUiLease(){','function beginNativeBoardMountLease(){');
const boardExport=extract(board,'function boardBackup(){','function boardHasUnsavedDraft(){');
function fixture({native=false,restore=false,ready=false,bridgeReady=false}={}){
 const downloads=[],created=[],messages=[],nodes={},events=[];
 let startReady,startBridge;
 const outfitBoardReady=ready?Promise.resolve():new Promise(r=>startReady=r);
 const backupReady=bridgeReady?Promise.resolve():new Promise(r=>startBridge=r);
 const auth={user:{id:'owner-a'},assertCurrent(){if(auth.revoked)throw Error('revoked')}};
 const items=[{id:'private-a',image:'data:image/jpeg;base64,/9j/AA==',name:'OWNER-A-PRIVATE'}];
 const saved=[{name:'OWNER-A-SAVED',slots:{top:'private-a'}}];
 const bridge={async exportJSON(){events.push('bridge-read');await backupReady;
  return {data:{format:'closet-current-owner-backup',version:4,items,marker:'PRIVATE-A-V4'}}}};
 const ctx={
  window:{closetAuth:auth,restoreAtomic01Bridge:bridge},
  db:{name:'closet-current-user-owner-a'},captureOperationEpoch:3,
  nativeLossless04Active:native,nativeLossless04:{status(){return {active:true}},
   readOnlySnapshot(){return {current:{name:'NATIVE-A'},saved}}},
  currentBoard:{name:'OWNER-A-CURRENT',slots:{top:'private-a'}},savedOutfitBoards:saved,
  items,inspirationLooks:[],outfitBoardReady,
  location:{search:restore?'?restoreAtomic01=research':''},
  Blob,structuredClone,URLSearchParams,
  URL:class{
   constructor(path){this.searchParams=new URLSearchParams(String(path).split('?')[1]||'')}
   static createObjectURL(blob){created.push(blob);return 'blob:private-test-'+created.length}
   static revokeObjectURL(){events.push('revoke')}
  },
  setTimeout(fn){events.push('revoke-scheduled');return 5},
  document:{body:{append(){events.push('append')}}},
  node(tag){assert.equal(tag,'a');return {href:'',download:'',
   click(){downloads.push({name:this.download,blob:created.at(-1)})},
   remove(){events.push('remove')}}
  },
  $:id=>(nodes[id]??=id==='authGate'?{hidden:true}:id==='appShell'?{hidden:false}:{}),
  message(text){messages.push(text)}
 };
 vm.createContext(ctx);
 // Isolate only the ESM loader; execute the actual durable helper separately in
 // mission3-default-verified-backup-export tests against real fake-IDB stores.
 const handler=exportHandler.replace("import('./native-default-verified-backup-export-m3.mjs')",'durableModule');
 ctx.writes=Promise.resolve();
 Object.assign(ctx,{busy:false,saving:false,captureProofTaking:false,cameraOpening:false,
  photoImportActive:false,videoImportActive:false,automaticRunning:false,
  automaticQueue:[],localPending:new Set(),failedDraftCaptures:new Set(),batch:[],stream:null});
 ctx.document.querySelector=()=>null;
 ctx.durableModule={async exportDurableOwnerBackupM3({assertLease,assertIdle}){
  assertLease();assertIdle();
  if(!ctx.items.length)throw Error('Save a closet piece before exporting.');
  return {json:JSON.stringify({format:'closet-current',version:3,items:ctx.items,
   outfitBoard:ctx.boardBackup()})};
 }};
 vm.runInContext(appLease+boardLease+boardExport+handler,ctx,{timeout:1200});
 return {ctx,downloads,created,messages,events,auth,bridge,
  releaseReady(){startReady?.()},
  releaseBridge(){startBridge?.()},
  click(){return ctx.$('export').onclick()},
  async exportedJSON(){assert.equal(downloads.length,1);return JSON.parse(await downloads[0].blob.text())},
  swap(){ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-b'};ctx.captureOperationEpoch++;},
  relogin(){ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-a'};ctx.captureOperationEpoch++;},
  changeDB(){ctx.db={name:'closet-current-user-owner-a'}},
  rotate(){ctx.captureOperationEpoch++},
  revoke(){auth.revoked=true},
  lock(){ctx.$('authGate').hidden=false},
  hideShell(){ctx.$('appShell').hidden=true},
  changeBridge(){ctx.window.restoreAtomic01Bridge={exportJSON:bridge.exportJSON}},
  newOwner(){ctx.items=[{id:'private-b',name:'OWNER-B',image:'data:image/jpeg;base64,/9j/BB=='}];
   ctx.currentBoard={name:'OWNER-B-DRAFT',slots:{}};ctx.savedOutfitBoards=[{name:'B-SAVED'}];messages.length=0;}
 };
}
async function ticks(){await new Promise(r=>setImmediate(r));}
test('valid legacy backup is owner-scoped and contains preserved owner JPEG',async()=>{
 const f=fixture({ready:true});await f.click();
 const result=await f.exportedJSON();
 assert.equal(result.version,3);
 assert.equal(result.items[0].id,'private-a');
 assert.equal(result.outfitBoard.current.name,'OWNER-A-CURRENT');
 assert.equal(result.outfitBoard.saved[0].name,'OWNER-A-SAVED');
 assert.equal(f.downloads[0].name,'closet-current-backup.json');
 assert.match(f.messages.at(-1),/downloaded from verified private storage/);
});
test('valid v4 lossless research backup is owner-scoped and stays separate',async()=>{
 const f=fixture({ready:true,restore:true,bridgeReady:true});await f.click();
 const data=await f.exportedJSON();
 assert.equal(data.marker,'PRIVATE-A-V4');
 assert.equal(f.downloads[0].name,'closet-current-owner-backup-v4.json');
});
const cases=[
 ['account switch',f=>f.swap()],
 ['same owner ID new auth',f=>f.relogin()],
 ['private DB replacement',f=>f.changeDB()],
 ['capture epoch change',f=>f.rotate()],
 ['revoked login',f=>f.revoke()],
 ['visible auth gate',f=>f.lock()],
 ['hidden private app',f=>f.hideShell()]
];
for(const [why,mutate] of cases){
 test('legacy export cannot download old owner after pending startup: '+why,async()=>{
  const f=fixture();const pending=f.click();mutate(f);f.newOwner();f.releaseReady();await pending;
  assert.equal(f.downloads.length,0);assert.deepEqual(f.messages,[]);
 });
 test('v4 async private backup cannot download old owner after '+why,async()=>{
  const f=fixture({ready:true,restore:true});const pending=f.click();await ticks();
  assert.ok(f.events.includes('bridge-read'));mutate(f);f.newOwner();f.releaseBridge();await pending;
  assert.equal(f.downloads.length,0);assert.deepEqual(f.messages,[]);
 });
}
test('v4 old bridge replacement rejects the stale returned private backup',async()=>{
 const f=fixture({ready:true,restore:true});const pending=f.click();await ticks();
 f.changeBridge();f.releaseBridge();await pending;
 assert.equal(f.downloads.length,0);
 assert.match(f.messages.at(-1),/failed/);
});
test('guest cannot export legacy private JSON even with cached clothing array',async()=>{
 const f=fixture({ready:true});f.ctx.window.closetAuth=null;await f.click();
 assert.equal(f.downloads.length,0);assert.deepEqual(f.messages,[]);
});
test('signed out boardBackup refuses to expose default private outfit in memory',()=>{
 const f=fixture({ready:true});f.ctx.window.closetAuth=null;
 assert.throws(()=>f.ctx.boardBackup(),/verified owner session/);
});
test('same-ID new login cannot directly export former owner native snapshot',()=>{
 const f=fixture({ready:true,native:true});f.relogin();f.lock();
 assert.throws(()=>f.ctx.boardBackup(),/verified owner session/);
});
test('native owner-signed legacy boardBackup uses the live source controller only',()=>{
 const f=fixture({ready:true,native:true});
 assert.equal(f.ctx.boardBackup().current.name,'NATIVE-A');
});
test('default boardBackup refuses when private app shell is hidden',()=>{
 const f=fixture({ready:true});f.hideShell();
 assert.throws(()=>f.ctx.boardBackup(),/verified owner session/);
});
test('native backup snapshot requiring async same-owner approval remains guarded after await',async()=>{
 const f=fixture({ready:true,restore:true});const pending=f.click();await ticks();
 f.relogin();f.newOwner();f.releaseBridge();await pending;
 assert.equal(f.downloads.length,0);
});
test('the old export click creates no files when no signed-in garment exists',async()=>{
 const f=fixture({ready:true});f.ctx.items=[];await f.click();
 assert.equal(f.downloads.length,0);
 assert.match(f.messages.at(-1),/Save a closet piece/);
});
test('exact app source pins private owner both before and after awaits and before click',()=>{
 assert.match(exportHandler,/exportLease=ownerWardrobeMutationLease\(\)/);
 assert.match(exportHandler,/if\(typeof outfitBoardReady!=='undefined'\)await outfitBoardReady;\s*assertExport\(\)/);
 assert.match(exportHandler,/const \{data\}=await bridge\.exportJSON\(\);\s*assertExport\(\)/);
 assert.match(exportHandler,/try\{assertExport\(\);a\.click\(\);\}/);
 assert.match(boardExport,/const lease=beginOwnerBoardUiLease\(\)/);
});
