'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),vm=require('node:vm');
const {indexedDB}=require('fake-indexeddb');
const {randomUUID,createHash,webcrypto}=require('node:crypto');
const E=require('../public/cloud-backup-engine.js');
const source=readFileSync((process.env.CLOUD_SOURCE_ROOT||'.')+'/public/cloud-backup.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
const original=Buffer.from([255,216,255,224,0,16,82,69,83,84,79,82,69,255,217]);
const wrong=Buffer.from([255,216,255,224,0,16,82,69,83,84,79,82,70,255,217]);
const sha=createHash('sha256').update(original).digest('hex');
const dataURL='data:image/jpeg;base64,'+original.toString('base64');
const response=value=>({ok:true,status:200,json:async()=>value});
async function openDb(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,2);
  r.onupgradeneeded=()=>{r.result.createObjectStore('items',{keyPath:'id'});r.result.createObjectStore('state',{keyPath:'id'});};
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function transaction(db,fn){
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');fn(tx);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
const read=(db,store,key)=>new Promise((resolve,reject)=>{
 const r=db.transaction(store).objectStore(store)[key===undefined?'getAll':'get'](key);
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
async function fixture(config={}){
 const owner=randomUUID(),db=await openDb(owner);
 const remoteRef='closet-photo:'+owner+'/'+sha+'.jpg';
 const newItem={id:'remote-photo',ownerId:owner,category:'Tops',color:'Navy',
  image:remoteRef,sourceSHA256:sha,sourceHashVerified:true,userAdjusted:true,
  originalPhoto:{image:remoteRef,sha256:sha}};
 const remote={revision:2,document:{schemaVersion:1,items:[newItem],
  state:{'outfit-board':{id:'outfit-board',current:{slots:{top:'remote-photo'}},
   saved:[{id:'remote-look',name:'Owner cloud outfit',slots:{top:'remote-photo'}}]}}}};
 await transaction(db,tx=>{
  tx.objectStore('items').put({id:'local-photo',category:'Tops',image:dataURL,color:'Red'});
  tx.objectStore('state').put({id:'outfit-board',current:{slots:{top:'local-photo'}},
   saved:[{id:'local-look',name:'Owner original outfit',slots:{top:'local-photo'}}]});
  tx.objectStore('state').put({id:'cloud-sync',baseVersion:1,localRevision:7,dirty:false,
   baseDocument:{schemaVersion:1,items:[],state:{}}});
 });
 let correct=!!config.good,wrongDocument=!!config.wrongDocument;
 const events=new Map(),elements=new Map(),requests=[],scheduled=[];
 const elem=id=>{if(!elements.has(id))elements.set(id,{textContent:'',hidden:false,onclick:null});return elements.get(id);};
 const window={ClosetBackupEngine:E,closetAuth:{
  user:{id:owner},assertCurrent(){},getAccessToken:async()=>owner
 },addEventListener(name,fn){events.set(name,fn)}};
 const fetch=async(url)=>{
  const u=new URL(url),p=u.pathname;requests.push(p);
  if(p==='/rest/v1/closet_backups'){
   if(wrongDocument)remote.document.items[0].originalPhoto.sha256='0'.repeat(64);
   else remote.document.items[0].originalPhoto.sha256=sha;
   return response([remote]);
  }
  const pref='/storage/v1/object/closet-private/';
  if(p.startsWith(pref)){
   assert.equal(p.slice(pref.length),owner+'/'+sha+'.jpg');
   const buf=correct?original:wrong;
   return {...response({}),arrayBuffer:async()=>buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.length)};
  }
  throw Error('Unexpected cloud endpoint '+p);
 };
 const install=()=>vm.runInNewContext(source,{window,
  document:{getElementById:elem},location:{hostname:'localhost',search:''},
  navigator:{storage:{persist:async()=>true}},fetch,URL,URLSearchParams,
  crypto:webcrypto,Uint8Array,atob,btoa,AbortController,console,
  setTimeout:(fn,ms)=>{scheduled.push(ms);return scheduled.length;},
  clearTimeout:()=>{},setInterval:()=>0});
 install();
 const start=()=>window.closetCloud.start(db,{capture:fn=>fn(),canRestore:()=>true,async restored(){}});
 return {owner,window,db,remote,requests,scheduled,start,
  status:()=>elem('cloudStatus').textContent,
  marker:()=>read(db,'state','cloud-sync'),rows:()=>read(db,'items'),board:()=>read(db,'state','outfit-board'),
  manual:()=>elem('syncCloset').onclick(),
  async auto(){await events.get('online')?.();await events.get('focus')?.();window.closetCloud.changed();},
  async reload(){events.get('pagehide')?.();install();await start();},
  repair(){correct=true;wrongDocument=false;},close(){events.get('pagehide')?.();db.close();}
 };
}
test('verified PR #819 parent lacks durable integrity quarantine',()=>{
 if(baseline)assert.doesNotMatch(source,/integrityPause/);
 else{
  assert.match(source,/cloud-photo-integrity/);
  assert.match(source,/writeIntegrityPause/);
  assert.match(source,/m\.integrityPause/);
 }
});
test('wrong remote JPEG SHA never overwrites old wardrobe; restores only after owner retry',async()=>{
 if(baseline)return;
 const f=await fixture();
 try{
  await f.start();
  assert.match(f.status(),/Cloud photograph integrity check failed/);
  assert.deepEqual((await f.rows()).map(x=>x.id),['local-photo']);
  assert.equal((await f.board()).saved[0].id,'local-look');
  assert.equal((await f.marker()).baseVersion,1);
  assert.equal((await f.marker()).integrityPause,true);
  const before=f.requests.length;await f.auto();await f.reload();
  assert.equal(f.requests.length,before,'blocked reload/online/focus must not access cloud');
  assert.equal((await f.rows())[0].image,dataURL);
  f.repair();await f.manual();
  assert.equal((await f.marker()).integrityPause,false);
  assert.equal((await f.marker()).baseVersion,2);
  assert.deepEqual((await f.rows()).map(x=>x.id),['remote-photo']);
  assert.equal((await f.board()).saved[0].id,'remote-look');
  const actual=Buffer.from((await f.rows())[0].image.split(',')[1],'base64');
  assert.equal(createHash('sha256').update(actual).digest('hex'),sha);
  await f.reload();assert.equal(f.status(),'Cloud backup up to date');
 }finally{f.close();}
});
test('malformed verified source receipt blocks restore before photo download and resumes on repair',async()=>{
 if(baseline)return;
 const f=await fixture({wrongDocument:true,good:true});
 try{
  await f.start();assert.match(f.status(),/integrity check failed/);
  assert.equal(f.requests.filter(x=>x.startsWith('/storage/')).length,0);
  assert.equal((await f.marker()).integrityPause,true);
  assert.equal((await f.board()).saved[0].id,'local-look');
  f.repair();await f.manual();assert.equal((await f.marker()).baseVersion,2);
  assert.equal((await f.board()).saved[0].id,'remote-look');
 }finally{f.close();}
});
test('another owner can restore normally while original owner integrity-pause is held',async()=>{
 if(baseline)return;
 const a=await fixture(),b=await fixture({good:true});
 try{
  await a.start();assert.equal((await a.marker()).integrityPause,true);
  await b.start();assert.equal(b.status(),'Cloud backup up to date');
  assert.equal((await b.rows())[0].id,'remote-photo');
  const before=a.requests.length;await a.reload();assert.equal(a.requests.length,before);
  assert.equal((await a.marker()).integrityPause,true);
  assert.equal((await b.marker()).integrityPause,undefined);
 }finally{a.close();b.close();}
});
test('revoked owner session and switched account cannot clear persistent integrity pause',async()=>{
 if(baseline)return;
 const f=await fixture();
 try{
  await f.start();assert.equal((await f.marker()).integrityPause,true);
  const before=f.requests.length,owner=f.owner;
  f.window.closetAuth.user={id:randomUUID()};
  await f.manual();
  assert.equal((await f.marker()).integrityPause,true);
  assert.equal(f.requests.length,before);
  f.window.closetAuth.user={id:owner};
  f.window.closetAuth.assertCurrent=()=>{throw Error('session revoked')};
  await f.manual();assert.equal((await f.marker()).integrityPause,true);
  f.window.closetAuth.assertCurrent=()=>{};
  f.repair();await f.manual();assert.equal((await f.marker()).integrityPause,false);
 }finally{f.close();}
});
