'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const {randomUUID,webcrypto}=require('node:crypto');
const {indexedDB}=require('fake-indexeddb');
const E=require('../public/cloud-backup-engine.js');
const baseline=process.env.EXPECT_BASELINE==='1';
const cloudSource=fs.readFileSync((process.env.CLOUD_SOURCE_ROOT||'.')+'/public/cloud-backup.js','utf8');
const empty=()=>({schemaVersion:1,items:[],state:{}});
const response=value=>({ok:true,status:200,json:async()=>value});

async function ownerDB(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,2);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function seed(db,{items=[],draft=null,dirty=false,baseVersion=4}={}){
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  items.forEach(row=>tx.objectStore('items').put(row));
  if(draft)tx.objectStore('state').put({id:'draft',batch:draft});
  tx.objectStore('state').put({id:'cloud-sync',dirty,baseVersion,
   localRevision:13,baseDocument:empty(),needsRestore:false});
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
}
const rows=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('items').objectStore('items').getAll();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
const state=(db,id)=>new Promise((resolve,reject)=>{
 const r=db.transaction('state').objectStore('state').get(id);
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});

async function fixture({ownerA=randomUUID(),ownerB=randomUUID(),
 localItems=[],localDraft=null,dirty=false,baseVersion=4,remoteRevision=4,
 remoteItems=[],remoteDraft=null}={}){
 const db=await ownerDB(ownerA);
 await seed(db,{items:localItems,draft:localDraft,dirty,baseVersion});
 let currentRevision=remoteRevision,document={schemaVersion:1,items:remoteItems,
  state:remoteDraft?{draft:{id:'draft',batch:remoteDraft}}:{}};
 let saved=null;const requests=[],events=new Map(),elements=new Map(),counters={restored:0};
 const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',onclick:null});return elements.get(id);};
 const window={ClosetBackupEngine:E,closetAuth:{user:{id:ownerA},
  assertCurrent(){},getAccessToken:async()=> 'synthetic-'+ownerA},
  addEventListener(name,fn){events.set(name,fn)}};
 const fetch=async(url,opts={})=>{
  const u=new URL(url),verb=opts.method||'GET';
  requests.push({path:u.pathname,select:u.searchParams.get('select'),verb});
  if(u.pathname==='/rest/v1/closet_backups'){
   assert.equal(u.searchParams.get('owner_id'),'eq.'+ownerA);
   return response(currentRevision?[u.searchParams.get('select')==='revision'
    ?{revision:currentRevision}:{revision:currentRevision,document}]:[]);
  }
  if(u.pathname==='/rest/v1/rpc/save_closet_backup'){
   const body=JSON.parse(opts.body);
   assert.equal(body.p_expected_revision,currentRevision);
   saved=body;currentRevision++;document=body.p_document;
   return response(currentRevision);
  }
  throw Error('Unexpected private cloud endpoint '+u.pathname);
 };
 vm.runInNewContext(cloudSource,{window,fetch,URL,URLSearchParams,
  navigator:{storage:{persist:async()=>true}},location:{hostname:'localhost',search:''},
  document:{getElementById:el},crypto:webcrypto,AbortController,Uint8Array,
  atob,btoa,console,setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0});
 return {ownerA,ownerB,db,window,requests,events,counters,
  get saved(){return saved;},get remoteRevision(){return currentRevision;},
  status:()=>el('cloudStatus').textContent,
  localRows:()=>rows(db),marker:()=>state(db,'cloud-sync'),draft:()=>state(db,'draft'),
  start:()=>window.closetCloud.start(db,{
   capture:work=>work(),canRestore:()=>true,async restored(){counters.restored++;}
  }),
  close(){events.get('pagehide')?.();db.close();}
 };
}
const row=(id,ownerId)=>({id,category:'Tops',itemType:'T-shirt',color:'Navy',
 ...(ownerId===undefined?{}:{ownerId})});
const expectBeforeAfter=(f,beforeId)=>Promise.all([
 f.localRows().then(items=>assert.deepEqual(items.map(x=>x.id),[beforeId])),
 f.marker().then(marker=>assert.equal(marker.baseVersion,4))
]);

test('foreign-owner saved piece is never published from current owner private database',async()=>{
 const f=await fixture({localItems:[row('foreign-saved-item',undefined)],dirty:true});
 try{
  const x=await state(f.db,'cloud-sync');assert.equal(x.dirty,true);
  // A cloud document with a forged owner tag could appear after local
  // contamination even when the destination owner-specific DB is correct.
  await new Promise((resolve,reject)=>{
   const tx=f.db.transaction('items','readwrite');
   tx.objectStore('items').put(row('foreign-saved-item',f.ownerB));
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });
  await f.start();
  if(baseline)assert.ok(f.saved,'verified parent published tagged foreign clothing');
  else{
   assert.equal(f.saved,null,'must reject before cloud RPC');
   assert.equal((await f.marker()).dirty,true);
   assert.match(f.status(),/backup pending/);
  }
  assert.deepEqual((await f.localRows()).map(x=>x.id),['foreign-saved-item']);
 }finally{f.close();}
});

test('foreign owner private camera draft is rejected before backup without discarding it',async()=>{
 const ownerA=randomUUID(),ownerB=randomUUID();
 const f=await fixture({ownerA,ownerB,localDraft:[row('foreign-draft',ownerB)],
  dirty:true});
 try{
  await f.start();
  if(baseline)assert.ok(f.saved,'parent copied foreign draft into owner A cloud row');
  else{
   assert.equal(f.saved,null);
   assert.equal((await f.marker()).dirty,true);
  }
  assert.equal((await f.draft()).batch[0].ownerId,ownerB,
   'failed sync cannot erase forensic draft evidence');
 }finally{f.close();}
});

test('remote document tagged for owner B never replaces owner A originals',async()=>{
 const ownerA=randomUUID(),ownerB=randomUUID(),original=row('local-original-owner-A',ownerA);
 const f=await fixture({ownerA,ownerB,remoteRevision:5,
  remoteItems:[row('foreign-cloud-piece',ownerB)],localItems:[original]});
 try{
  await f.start();
  if(baseline){
   assert.deepEqual((await f.localRows()).map(x=>x.id),['foreign-cloud-piece']);
   assert.equal((await f.marker()).baseVersion,5);
  }else{
   await expectBeforeAfter(f,original.id);
   assert.equal(f.counters.restored,0);
   assert.equal(f.saved,null);
   assert.deepEqual(f.requests.filter(x=>x.path==='/rest/v1/closet_backups').map(x=>x.select),
    ['revision','revision,document']);
   assert.match(f.status(),/Local items are kept/);
  }
 }finally{f.close();}
});

test('remote camera draft with owner B tag cannot contaminate owner A saved state',async()=>{
 const ownerA=randomUUID(),ownerB=randomUUID();
 const f=await fixture({ownerA,ownerB,remoteRevision:5,
  remoteItems:[row('new-same-owner',ownerA)],
  remoteDraft:[row('foreign-cloud-draft',ownerB)],
  localItems:[row('owner-original',ownerA)]});
 try{
  await f.start();
  if(baseline){
   assert.equal((await f.draft()).batch[0].ownerId,ownerB);
   assert.equal((await f.marker()).baseVersion,5);
  }else{
   await expectBeforeAfter(f,'owner-original');
   assert.equal(await f.draft(),undefined,'foreign draft never committed');
   assert.equal(f.saved,null);
  }
 }finally{f.close();}
});

test('parallel dirty owner A changes cannot merge with a foreign owner B remote garment',async()=>{
 const ownerA=randomUUID(),ownerB=randomUUID();
 const f=await fixture({ownerA,ownerB,dirty:true,remoteRevision:5,
  localItems:[row('valid-local-owner',ownerA)],
  remoteItems:[row('foreign-newer-remote',ownerB)]});
 try{
  await f.start();
  if(baseline){
   assert.ok(f.saved);
   assert.ok(f.saved.p_document.items.some(x=>x.ownerId===ownerB));
  }else{
   assert.equal(f.saved,null,'no upload or merge with known foreign source');
   assert.equal((await f.marker()).dirty,true);
   assert.equal((await f.localRows())[0].ownerId,ownerA);
  }
 }finally{f.close();}
});

test('properly tagged owner A backup and cloud restore remain supported',async()=>{
 const ownerA=randomUUID(),ownerB=randomUUID();
 const f=await fixture({ownerA,ownerB,localItems:[row('legitimate-A',ownerA)],dirty:true});
 try{
  await f.start();
  assert.ok(f.saved);
  assert.equal(f.saved.p_document.items[0].ownerId,ownerA);
  assert.equal((await f.marker()).dirty,false);
  assert.equal((await f.marker()).baseVersion,5);
 }finally{f.close();}
});

test('ownerless legacy rows remain compatible and are not upgraded to unverified signed receipts',async()=>{
 const f=await fixture({remoteRevision:5,
  remoteItems:[row('unattested-legacy-piece',undefined)],
  localItems:[row('local-old-piece',undefined)]});
 try{
  await f.start();
  assert.deepEqual((await f.localRows()).map(x=>x.id),['unattested-legacy-piece']);
  assert.equal((await f.localRows())[0].ownerId,undefined);
  assert.equal((await f.marker()).baseVersion,5);
  assert.equal(f.counters.restored,1);
 }finally{f.close();}
});

test('a validated current-owner camera draft is allowed in private cloud backup',async()=>{
 const ownerA=randomUUID(),ownerB=randomUUID();
 const f=await fixture({ownerA,ownerB,dirty:true,
  localDraft:[row('legitimate-A-draft',ownerA)],
  localItems:[row('legitimate-A-saved',ownerA)]});
 try{
  await f.start();
  assert.ok(f.saved);
  assert.equal(f.saved.p_document.state.draft.batch[0].ownerId,ownerA);
  assert.equal(f.saved.p_document.items[0].ownerId,ownerA);
 }finally{f.close();}
});
