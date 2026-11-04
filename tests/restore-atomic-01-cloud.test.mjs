import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,webcrypto,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import 'fake-indexeddb/auto';
import {createNativeRestore01} from '../research/restore-atomic-01/native-restore-bridge.mjs';
import cloudEngine from '../public/cloud-backup-engine.js';
const {mergeDocuments,keepBothDocuments}=cloudEngine;
if(!globalThis.crypto)globalThis.crypto=webcrypto;

const bytes=readFileSync('benchmark/fixtures/commons-0053.jpg');
const hash=createHash('sha256').update(bytes).digest('hex');
const image='data:image/jpeg;base64,'+bytes.toString('base64');
const doc=(owner)=>({schemaVersion:1,items:[{id:owner+'-dress',ownerId:owner,
 sourceSHA256:hash,originalPhoto:{image,sha256:hash},
 image,category:'Dresses',color:'Blue',corrected:true}],state:{
 'outfit-board':{id:'outfit-board',current:{name:'Original',slots:{}},
 saved:[{id:'saved',outfit3dId:'3d',ownerId:owner,
 slots:{top:owner+'-dress',layer2:'missing-jacket',layer3:'missing-coat'}}]}}});
function environment(){
 const owner=randomUUID(),auth={ready:Promise.resolve(),user:{id:owner},
  getAccessToken:async()=> 'fake-token'},authGate={hidden:true},
  shell={hidden:false},logout=new EventTarget();
 const elements={authGate,appShell:shell,logout};
 const docNode={getElementById:id=>elements[id]||null};
 const listeners=new EventTarget(),raw={access_token:'fake-token',
  refresh_token:'fake-refresh',expires_at:Math.floor(Date.now()/1000)+3600};
 const local={getItem:()=>JSON.stringify(raw)};
 const win={
  location:{search:'?nativeLossless04=research&restoreAtomic01=research'},
  document:docNode,closetAuth:auth,localStorage:local,
  confirm:()=>true,addEventListener:(...a)=>listeners.addEventListener(...a),
  removeEventListener:(...a)=>listeners.removeEventListener(...a),
  dispatchEvent:(...a)=>listeners.dispatchEvent(...a),
  CustomEvent:class extends Event{constructor(name,opts){super(name);this.detail=opts.detail;}}
 };
 const board={status:()=>({active:true,dirty:false})};
 return {win,board,auth,raw,owner,logout};
}
async function database(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,2);
  r.onupgradeneeded=()=>{r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});};
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function seed(db,owner,{dirty=false,localRevision=3,baseVersion=2}={}){
 const value=doc(owner);
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  for(const row of value.items)tx.objectStore('items').put(row);
  for(const row of Object.values(value.state))tx.objectStore('state').put(row);
  tx.objectStore('state').put({id:'cloud-sync',localRevision,baseVersion,
   baseDocument:null,dirty});
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
 return value;
}
async function withController(fn,options){
 const env=environment(),db=await database(env.owner);
 try{
  const value=await seed(db,env.owner,options);
  const ctrl=await createNativeRestore01({win:env.win,db,board:env.board});
  try{await fn({ctrl,env,db,value});}finally{ctrl.dispose();}
 }finally{db.close();indexedDB.deleteDatabase('closet-current-user-'+env.owner);}
}
test('same owner newer cloud revision requires human approval before replacement',async()=>{
 await withController(async({ctrl,env,value})=>{
  let prompts=0;env.win.confirm=()=>{prompts++;return false;};
  assert.equal(await ctrl.allowCloud({document:value,revision:4,expectedRevision:3}),false);
  assert.equal(prompts,1);
  env.win.confirm=()=>{prompts++;return true;};
  assert.equal(await ctrl.allowCloud({document:value,revision:4,expectedRevision:3}),true);
  assert.equal(prompts,2);
 });
});
test('locally newer or offline-dirty wardrobe cannot be overwritten by remote',async()=>{
 await withController(async({ctrl,value})=>{
  assert.equal(await ctrl.allowCloud({document:value,revision:4,expectedRevision:3}),false);
 },{dirty:true});
});
test('stale cloud apply lease and invalid revision do not obtain consent',async()=>{
 await withController(async({ctrl,env,value})=>{
  let prompts=0;env.win.confirm=()=>{prompts++;return true;};
  assert.equal(await ctrl.allowCloud({document:value,revision:4,expectedRevision:2}),false);
  assert.equal(await ctrl.allowCloud({document:value,revision:0,expectedRevision:3}),false);
  assert.equal(prompts,0);
 });
});
test('cloud candidate with foreign private owner is rejected, not merged',async()=>{
 await withController(async({ctrl,value})=>{
  value.items[0].ownerId=randomUUID();
  await assert.rejects(ctrl.allowCloud({document:value,revision:4,expectedRevision:3}),
   /foreign owner/);
 });
});
test('cloud candidate with tampered source bytes is rejected before permission prompt',async()=>{
 await withController(async({ctrl,value,env})=>{
  let prompts=0;env.win.confirm=()=>{prompts++;return true;};
  value.items[0].originalPhoto.sha256='0'.repeat(64);
  await assert.rejects(ctrl.allowCloud({document:value,revision:4,expectedRevision:3}));
  assert.equal(prompts,0);
 });
});
test('expired or refreshed token revokes pending restore/cloud operation',async()=>{
 await withController(async({ctrl,env,value})=>{
  env.raw.access_token='rotated-after-session-refresh';
  await assert.rejects(ctrl.allowCloud({document:value,revision:4,expectedRevision:3}),
   /session|token|revok/i);
  assert.equal(ctrl.status().active,false);
 });
});
test('logout and switch from owner A to owner B revokes owner A restore',async()=>{
 await withController(async({ctrl,env,value})=>{
  env.logout.dispatchEvent(new Event('click'));
  env.auth.user={id:randomUUID()};
  await assert.rejects(ctrl.allowCloud({document:value,revision:4,expectedRevision:3}),
   /session|owner|revok/i);
 });
});
test('independent simultaneous device changes merge without replacing either garment correction',()=>{
 const a=randomUUID(),base=doc(a),local=structuredClone(base),remote=structuredClone(base);
 local.items[0].color='Teal';remote.items[0].name='Dress corrected on second phone';
 const merged=mergeDocuments(base,local,remote);
 assert.equal(merged.items[0].color,'Teal');
 assert.equal(merged.items[0].name,'Dress corrected on second phone');
 assert.equal(merged.state['outfit-board'].saved[0].slots.layer3,'missing-coat');
});
test('two devices editing the same garment attribute fail closed with conflict',()=>{
 const a=randomUUID(),base=doc(a),local=structuredClone(base),remote=structuredClone(base);
 local.items[0].color='Cyan';remote.items[0].color='Red';
 assert.throws(()=>mergeDocuments(base,local,remote),e=>e.code==='conflict');
});
test('repeated retry of identical cloud backup does not duplicate IDs',()=>{
 const a=randomUUID(),base=doc(a),local=structuredClone(base),remote=structuredClone(base);
 local.items[0].color='Cyan';
 const result=mergeDocuments(base,local,remote);
 assert.deepEqual(mergeDocuments(base,result,result),result);
 assert.equal(new Set(result.items.map(x=>x.id)).size,result.items.length);
});
test('keep-both owner reconciliation preserves photographed missing outerwear IDs',()=>{
 const a=randomUUID(),base=doc(a),local=structuredClone(base),remote=structuredClone(base);
 local.items[0].color='Cyan';remote.items[0].color='Red';
 const result=keepBothDocuments(base,local,remote,row=>'copied-'+row.id);
 assert.equal(result.items.length,2);
 assert.equal(result.state['outfit-board'].saved[0].slots.layer3,'missing-coat');
 assert.equal(result.state['outfit-board'].saved[0].slots.layer2,'missing-jacket');
});
