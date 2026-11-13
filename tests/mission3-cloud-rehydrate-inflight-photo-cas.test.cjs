'use strict';
// Execute the exact cloud UI rehydration function from the real bridge. All
// photos and owners are synthetic; never connect to hosted Supabase.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {readFileSync}=require('node:fs');
const code=readFileSync('public/cloud-backup-bridge.js','utf8');
const start=code.indexOf('async function mission3ReloadOwnerCloudView(');
const end=code.indexOf('// Never replace private wardrobe',start);
assert.ok(start>=0&&end>start,'Source function not found');
const actual=code.slice(start,end);
const predStart=code.indexOf('function mission3CloudRestoreReviewIdle(){',end);
const predEnd=code.indexOf('function nativeLossless04RestoreSafe(){',predStart);
assert.ok(predStart>0&&predEnd>predStart);
const actualPredicate=code.slice(predStart,predEnd);
const jpg='data:image/jpeg;base64,/9j/AA==',jpg2='data:image/jpeg;base64,/9j/BB==';
const row=(id,extra={})=>({id,ownerId:'owner-a',image:jpg,
 originalPhoto:{image:jpg,sha256:'a'.repeat(64)},
 sourceSHA256:'a'.repeat(64),color:'Blue',category:'Tops',localAnalyzed:true,...extra});
const defer=()=>{let resolve;const promise=new Promise(ok=>resolve=ok);return {promise,resolve};};
function fixture({stage='',fresh=[row('remote-saved')],pending=[row('remote-review')],queue=false}={}){
 const ownerDB={name:'closet-current-user-owner-a'};
 let leaseEpoch=4,auth={user:{id:'owner-a'},assertCurrent(){}},rendered=0,queued=0,
  looks=0,board=0,index=0;
 const gate=defer(),entered=defer(),originalItems=[row('visible-saved')],
  originalBatch=[row('visible-review')];
 const c={
  db:ownerDB,items:originalItems,batch:originalBatch,writes:Promise.resolve(),
  busy:false,automaticRunning:false,memoryReviewRunning:false,
  failedDraftCaptures:new Set(),localPending:new Set(),automaticQueue:[],
  captureProofTaking:false,photoImportActive:false,videoImportActive:false,
  cameraOpening:false,stream:null,saving:false,
  window:{closetAuth:auth,closetIndex02:{refresh:()=>{index++;return Promise.resolve();}}},
  document:{querySelector:()=>null},
  location:{search:''},URLSearchParams,
  normalizeClothing:v=>({...v,originalPhoto:v.originalPhoto&&{...v.originalPhoto}}),
  nativeLossless04RestoreSafe:()=>true,
  readAllFrom:async()=>{if(stage==='readAll'){entered.resolve();await gate.promise;}
   return structuredClone(fresh);},
  readDraftFrom:async()=>{if(stage==='readDraft'){entered.resolve();await gate.promise;}
   return structuredClone(pending);},
  reloadCloudLooks:async()=>{looks++;if(stage==='looks'){entered.resolve();await gate.promise;}},
  reloadCloudBoard:async()=>{board++;if(stage==='board'){entered.resolve();await gate.promise;}},
  render:()=>{rendered++;},
  queueAutomatic:()=>{queued++;c.automaticRunning=true;},
 };
 vm.createContext(c);vm.runInContext(actual+'\n'+actualPredicate,c);
 const lease={ownerDB,assertLease(){
  if(leaseEpoch!==4||c.db!==ownerDB||c.window.closetAuth!==auth)
   throw Error('Private wardrobe changed accounts');
 }};
 return {c,gate,entered,lease,originalItems,originalBatch,
  run:()=>c.mission3ReloadOwnerCloudView(lease,{queueUnreviewed:queue}),
  get rendered(){return rendered},get queued(){return queued},
  get looks(){return looks},get board(){return board},
  get index(){return index},
  revoke:()=>{leaseEpoch++},
 };
}
test('normal signed-owner cloud rehydrate publishes saved and pending after reads',async()=>{
 const f=fixture();
 await f.run();
 assert.deepEqual(f.c.items.map(x=>x.id),['remote-saved']);
 assert.deepEqual(f.c.batch.map(x=>x.id),['remote-review']);
 assert.equal(f.rendered,1);assert.equal(f.looks,1);assert.equal(f.board,1);
});
test('two pending reviews can start automatic recognition without self-aborting',async()=>{
 const f=fixture({queue:true,pending:[row('r1',{localAnalyzed:false}),
  row('r2',{localAnalyzed:false})]});
 await f.run();
 assert.equal(f.queued,2);assert.equal(f.rendered,1);
});
test('new JPEG captured after saved read begins cannot disappear on remote rehydrate',async()=>{
 const f=fixture({stage:'readAll'}),p=f.run();
 await f.entered.promise;
 const newSource=row('just-captured',{image:jpg2,
  originalPhoto:{image:jpg2,sha256:'b'.repeat(64)},sourceSHA256:'b'.repeat(64)});
 f.c.batch.push(newSource);f.c.failedDraftCaptures.add(newSource.id);
 f.gate.resolve();
 await assert.rejects(p,/CLOSET_CLOUD_RELOAD_LOCAL_PHOTO_CHANGED/);
 assert.deepEqual(f.c.batch.map(x=>x.id),['visible-review','just-captured']);
 assert.equal(f.c.batch[1].originalPhoto.image,jpg2);
 assert.equal(f.c.items,f.originalItems);
 assert.equal(f.rendered,0);assert.equal(f.looks,0);
});
test('in-place owner correction during pending draft read is never clobbered',async()=>{
 const f=fixture({stage:'readDraft'}),p=f.run();
 await f.entered.promise;
 f.c.batch[0].color='Owner-confirmed Green';
 f.gate.resolve();
 await assert.rejects(p,/CLOSET_CLOUD_RELOAD_LOCAL_PHOTO_CHANGED/);
 assert.equal(f.c.batch[0].color,'Owner-confirmed Green');
 assert.equal(f.rendered,0);assert.equal(f.board,0);
});
test('new same-tab queued write after read starts invalidates stale screen commit',async()=>{
 const f=fixture({stage:'readDraft'}),p=f.run();
 await f.entered.promise;
 f.c.writes=Promise.resolve();
 f.gate.resolve();
 await assert.rejects(p,/CLOSET_CLOUD_RELOAD_LOCAL_PHOTO_CHANGED/);
 assert.equal(f.c.batch[0].id,'visible-review');assert.equal(f.rendered,0);
});
test('replaced original JPEG during in-flight read blocks stale published view',async()=>{
 const f=fixture({stage:'readDraft'}),p=f.run();
 await f.entered.promise;
 f.c.batch[0].originalPhoto.image=jpg2;
 f.gate.resolve();
 await assert.rejects(p,/CLOSET_CLOUD_RELOAD_LOCAL_PHOTO_CHANGED/);
 assert.equal(f.c.batch[0].originalPhoto.image,jpg2);assert.equal(f.rendered,0);
});
test('local captured photo after provisional rehydrate during looks refresh survives',async()=>{
 const f=fixture({stage:'looks'}),p=f.run();
 await f.entered.promise;
 f.c.batch.push(row('new-capture',{image:jpg2,
  originalPhoto:{image:jpg2,sha256:'b'.repeat(64)}}));
 f.c.localPending.add('new-capture');
 f.gate.resolve();
 await assert.rejects(p,/CLOSET_CLOUD_RELOAD_LOCAL_PHOTO_CHANGED/);
 assert.deepEqual(f.c.batch.map(x=>x.id),['remote-review','new-capture']);
 assert.equal(f.rendered,0);assert.equal(f.board,0);
});
test('new local camera or import session blocks rehydration without data mutation',async()=>{
 for(const edit of [c=>{c.cameraOpening=true},c=>{c.videoImportActive=true},
  c=>{c.captureProofTaking=true},c=>{c.saving=true}]){
  const f=fixture();
  edit(f.c);
  await assert.rejects(f.run(),/CLOSET_CLOUD_RELOAD_LOCAL_PHOTO_CHANGED/);
  assert.deepEqual(f.c.batch.map(x=>x.id),['visible-review']);
  assert.equal(f.rendered,0);
 }
});
test('revoked owner lease suppresses late previous-owner cloud view',async()=>{
 const f=fixture({stage:'readAll'}),p=f.run();
 await f.entered.promise;f.revoke();f.gate.resolve();
 await assert.rejects(p,/Private wardrobe changed accounts/);
 assert.equal(f.rendered,0);
});
test('rehydration uses small photo signatures instead of cloning original JPEGs',()=>{
 assert.match(actual,/typeof value==='string'&&value\.startsWith\('data:image\/'\)/);
 assert.match(actual,/value\.slice\(-12\)/);
 assert.doesNotMatch(actual,/structuredClone\(items\)|structuredClone\(batch\)/);
 assert.ok(actual.indexOf('beforePublish();\n // No asynchronous operation')<
  actual.indexOf('items=nextItems;batch=nextBatch'));
});
