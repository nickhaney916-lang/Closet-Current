'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {randomUUID,webcrypto}=require('node:crypto');
const {indexedDB}=require('fake-indexeddb');
const E=require('../public/cloud-backup-engine.js');
const baseline=process.env.EXPECT_BASELINE==='1';
const source=fs.readFileSync((process.env.CLOUD_SOURCE_ROOT||'.')+'/public/cloud-backup.js','utf8');
const empty=()=>({schemaVersion:1,items:[],state:{}});
const largeRemote=()=>({schemaVersion:1,
 items:Array.from({length:1000},(_,i)=>({id:'cloud-piece-'+i,category:'Tops',
  color:'Blue',description:'owner-private-photo-metadata-'.repeat(36)})),state:{}});
const response=body=>({ok:true,status:200,json:async()=>body});

async function open(owner){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+owner,2);
  req.onupgradeneeded=()=>{
   req.result.createObjectStore('items',{keyPath:'id'});
   req.result.createObjectStore('state',{keyPath:'id'});
  };
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
}
async function seed(db,{baseVersion=5,dirty=false,needsRestore=false,local=[]}={}){
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  for(const item of local)tx.objectStore('items').put(item);
  tx.objectStore('state').put({id:'cloud-sync',
   baseVersion,baseDocument:empty(),localRevision:17,dirty,needsRestore});
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
}
const readItems=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('items').objectStore('items').getAll();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
const readMarker=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('state').objectStore('state').get('cloud-sync');
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});

async function fixture({baseVersion=5,dirty=false,needsRestore=false,
 local=[],cloudRevision=5,cloudDocument=largeRemote(),
 secondDocument=null,secondRevision=null,failFull=false,
 onRevision=null,holdRevision=false}={}){
 const owner=randomUUID(),db=await open(owner);
 await seed(db,{baseVersion,dirty,needsRestore,local});
 const selectors=[],requests=[],events=new Map(),elements=new Map();
 let revision=cloudRevision,doc=cloudDocument,save=null,restores=0;
 let resolveHeld;const blocked=holdRevision?new Promise(r=>resolveHeld=r):null;
 let resolveStarted;const revisionStarted=new Promise(r=>resolveStarted=r);
 const node=id=>{
  if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',onclick:null});
  return elements.get(id);
 };
 const window={ClosetBackupEngine:E,closetAuth:{
  user:{id:owner},getAccessToken:async()=> 'synthetic-only-'+owner,
  assertCurrent(){}
 },addEventListener(name,fn){events.set(name,fn)}};
 const fetch=async(url,options={})=>{
  const u=new URL(url),verb=options.method||'GET';
  requests.push({path:u.pathname,verb});
  if(u.pathname==='/rest/v1/closet_backups'){
   assert.equal(u.searchParams.get('owner_id'),'eq.'+owner);
   const select=u.searchParams.get('select');
   assert.ok(['revision','revision,document'].includes(select));
   selectors.push(select);
   if(select==='revision'){
    resolveStarted();
    if(onRevision)await onRevision();
    if(blocked)await blocked;
   }
   if(select==='revision,document'&&failFull)return response([{revision,document:null}]);
   if(!revision)return response([]);
   if(select==='revision')return response([{revision}]);
   return response([{revision:secondRevision??revision,
    document:secondDocument||doc}]);
  }
  if(u.pathname==='/rest/v1/rpc/save_closet_backup'){
   const body=JSON.parse(options.body);
   assert.equal(body.p_expected_revision,revision,
    'save must use optimistic revision in a current owner session');
   assert.ok(E.validateDocument(body.p_document));
   save=body;revision++;doc=body.p_document;
   return response(revision);
  }
  throw Error('Unexpected remote request '+u.pathname);
 };
 vm.runInNewContext(source,{window,fetch,URL,URLSearchParams,
  location:{hostname:'localhost',search:''},navigator:{storage:{persist:async()=>true}},
  document:{getElementById:node},crypto:webcrypto,
  AbortController,Uint8Array,atob,btoa,console,
  setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0});
 return {owner,db,requests,selectors,events,window,
  get saved(){return save;},
  get revision(){return revision;},
  get restores(){return restores;},
  get remoteDocument(){return doc;},
  status:()=>node('cloudStatus').textContent,
  readItems:()=>readItems(db),readMarker:()=>readMarker(db),
  start:()=>window.closetCloud.start(db,{
   capture:work=>work(),canRestore:()=>true,async restored(){restores++;}
  }),
  release:()=>resolveHeld?.(),waitForRevision:()=>revisionStarted,
  close(){resolveHeld?.();events.get('pagehide')?.();db.close();}
 };
}

test('1,000 remote garments: unchanged clean cloud checks request only a tiny revision, never a large document',async()=>{
 const f=await fixture({local:[{id:'saved-private-piece'}]});
 try{
  await f.start();await f.window.closetCloud.sync();await f.window.closetCloud.sync();
  if(baseline)assert.deepEqual(f.selectors,['revision,document','revision,document','revision,document']);
  else assert.deepEqual(f.selectors,['revision','revision','revision']);
  assert.equal(f.status(),'Cloud backup up to date');
  assert.equal((await f.readItems())[0].id,'saved-private-piece');
  assert.equal(f.saved,null);
  assert.equal(f.restores,0);
  assert.ok(JSON.stringify(largeRemote()).length>800000,'realistic large remote payload comparator');
 }finally{f.close();}
});

test('dirty local wardrobe with matching cloud revision publishes without downloading untouched 1,000-piece remote JSON',async()=>{
 const f=await fixture({dirty:true,local:[{id:'new-private-garment',category:'Tops',color:'Blue'}]});
 try{
  await f.start();
  if(baseline)assert.deepEqual(f.selectors,['revision,document']);
  else assert.deepEqual(f.selectors,['revision']);
  assert.equal(f.saved.p_expected_revision,5);
  assert.deepEqual(f.saved.p_document.items.map(x=>x.id),['new-private-garment']);
  assert.equal((await f.readMarker()).baseVersion,6);
  assert.equal((await f.readMarker()).dirty,false);
  assert.equal(f.status(),'Cloud backup up to date');
 }finally{f.close();}
});

test('newer cloud revision demands a complete owner document before atomic local restore',async()=>{
 const f=await fixture({cloudRevision:6,cloudDocument:{schemaVersion:1,
  items:[{id:'updated-cloud-garment',category:'Tops',color:'Navy'}],state:{}},
  local:[{id:'old-original-garment',category:'Tops'}]});
 try{
  await f.start();
  if(baseline)assert.deepEqual(f.selectors,['revision,document']);
  else assert.deepEqual(f.selectors,['revision','revision,document']);
  assert.deepEqual((await f.readItems()).map(x=>x.id),['updated-cloud-garment']);
  assert.equal((await f.readMarker()).baseVersion,6);
  assert.equal(f.restores,1);
  assert.equal(f.saved,null);
 }finally{f.close();}
});

test('pending merged-owner needsRestore forces full cloud fetch even when revision matches',async()=>{
 const f=await fixture({cloudRevision:5,needsRestore:true,cloudDocument:{
  schemaVersion:1,items:[{id:'pending-owner-restoration'}],state:{}}});
 try{
  await f.start();
  if(baseline)assert.deepEqual(f.selectors,['revision,document']);
  else assert.deepEqual(f.selectors,['revision','revision,document']);
  assert.deepEqual((await f.readItems()).map(x=>x.id),['pending-owner-restoration']);
  assert.equal((await f.readMarker()).needsRestore,false);
  assert.equal(f.restores,1);
 }finally{f.close();}
});

test('remote advancing between revision and document requests uses fresh coherent document revision',async()=>{
 const f=await fixture({cloudRevision:6,secondRevision:7,
  secondDocument:{schemaVersion:1,items:[{id:'newest-owner-garment'}],state:{}}});
 try{
  await f.start();
  assert.equal((await f.readMarker()).baseVersion,baseline?7:7);
  assert.deepEqual((await f.readItems()).map(x=>x.id),['newest-owner-garment']);
  if(!baseline)assert.deepEqual(f.selectors,['revision','revision,document']);
 }finally{f.close();}
});

test('dirty owner edits merge remote new pieces only after fetching full changed document',async()=>{
 const f=await fixture({dirty:true,cloudRevision:6,
  cloudDocument:{schemaVersion:1,items:[{id:'remote-parallel-piece',category:'Tops'}],state:{}},
  local:[{id:'local-parallel-piece',category:'Tops'}]});
 try{
  await f.start();
  if(baseline)assert.deepEqual(f.selectors,['revision,document']);
  else assert.deepEqual(f.selectors,['revision','revision,document']);
  assert.ok(f.saved,'the successful optimistic backup should publish the merged wardrobe');
  assert.equal(f.saved.p_expected_revision,6);
  assert.deepEqual(f.saved.p_document.items.map(x=>x.id).sort(),
   ['local-parallel-piece','remote-parallel-piece']);
  assert.equal(f.revision,7);
  assert.deepEqual((await f.readItems()).map(x=>x.id).sort(),
   ['local-parallel-piece','remote-parallel-piece']);
 }finally{f.close();}
});

test('full response older than revision head refuses stale private restore without touching local records',async()=>{
 if(baseline)return; // the verified parent has no two-step metadata fetch
 const f=await fixture({cloudRevision:6,secondRevision:4,
  secondDocument:{schemaVersion:1,items:[{id:'stale-remote-piece'}],state:{}},
  local:[{id:'retained-local-original'}]});
 try{
  await f.start();
  assert.deepEqual(f.selectors,['revision','revision,document']);
  assert.deepEqual((await f.readItems()).map(x=>x.id),['retained-local-original']);
  assert.equal((await f.readMarker()).baseVersion,5);
  assert.equal(f.saved,null);
  assert.match(f.status(),/Cloud connection unavailable/);
 }finally{f.close();}
});

test('invalid changed cloud JSON fails closed and does not mutate saved local clothing',async()=>{
 const f=await fixture({cloudRevision:6,failFull:true,
  local:[{id:'keep-original-owner-photo'}]});
 try{
  await f.start();
  assert.deepEqual((await f.readItems()).map(x=>x.id),['keep-original-owner-photo']);
  assert.equal((await f.readMarker()).baseVersion,5);
  assert.equal(f.restores,0);
  assert.equal(f.saved,null);
  // Integrated integrity quarantine intentionally improves the old generic
  // connectivity message for a malformed private full document.
  if(!baseline&&source.includes('const integrityText=')){
   assert.match(f.status(),/Cloud photograph integrity check failed/);
   assert.equal((await f.readMarker()).integrityPause,true);
  }else assert.match(f.status(),/Cloud connection unavailable/);
  if(!baseline)assert.deepEqual(f.selectors,['revision','revision,document']);
 }finally{f.close();}
});

test('owner save during revision-only request remains pending and is never silently replaced',async()=>{
 const f=await fixture({holdRevision:true,local:[{id:'preserved-first'}]});
 try{
  const inFlight=f.start();
  if(!baseline)await f.waitForRevision();
  else {await inFlight;return;} // parent always downloads full document
  await f.window.closetCloud.beforeWrite(f.db);
  f.window.closetCloud.changed();
  f.release();await inFlight;
  assert.equal(f.saved,null);
  assert.equal(f.status(),'Saved on this device · cloud backup pending');
  assert.equal((await f.readMarker()).dirty,true);
  assert.deepEqual((await f.readItems()).map(x=>x.id),['preserved-first']);
 }finally{f.close();}
});
