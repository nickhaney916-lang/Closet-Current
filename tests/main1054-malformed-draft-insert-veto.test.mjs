import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
const start=app.indexOf('function persistDraft('),end=app.indexOf('\nfunction ',start+10);
assert.ok(start>=0&&end>start,'Native persistDraft source missing');
const source=app.slice(start,end);
const cases=[
 {name:'absent draft',ok:true},
 {name:'empty draft',state:{id:'draft',batch:[]},ok:true},
 {name:'pending peer',state:{id:'draft',batch:[{id:'peer',image:'different'}]},ok:true},
 ...[null,false,0,'',{}].map(batch=>({name:'invalid batch '+JSON.stringify(batch),state:{id:'draft',batch},error:'CLOSET_CAPTURE_INVALID_PERSISTED_DRAFT'})),
 {name:'missing batch',state:{id:'draft'},error:'CLOSET_CAPTURE_INVALID_PERSISTED_DRAFT'},
 {name:'saved collision',saved:{id:'fresh'},error:'CLOSET_CAPTURE_SAVED_ID_COLLISION'},
 {name:'duplicate source',state:{id:'draft',batch:[{id:'peer',image:'fake-jpeg'}]},error:'CLOSET_CAPTURE_DUPLICATE_SOURCE_IN_OTHER_TAB'}
];
const fresh={id:'fresh',ownerId:'synthetic-owner',image:'fake-jpeg'};
const check=(c,result)=>{
 if(c.ok){
  assert.equal(result.ok,true);
  assert.deepEqual(result.after,{id:'draft',batch:[...(c.state?.batch||[]),fresh]});
 }else{
  assert.equal(result.ok,false);
  assert.equal(result.reason,c.error);
  assert.deepEqual(result.after,c.state,'Refusal must preserve the entire stored record');
 }
 assert.deepEqual(result.saved,c.saved,'Saved wardrobe is immutable');
};
async function mock(c){
 let stored=structuredClone(c.state),saved=structuredClone(c.saved);
 const auth={user:{id:'synthetic-owner'},assertCurrent(){}};
 const db={name:'closet-current-user-synthetic-owner',transaction(){
  let aborted=false,pending;
  const draft={result:structuredClone(stored)},item={result:structuredClone(saved)};
  const tx={objectStore(name){return name==='state'?{get(){return draft},put(v){pending=structuredClone(v);}}:{get(){return item;}}},abort(){aborted=true;tx.onabort?.();}};
  queueMicrotask(()=>{item.onsuccess();draft.onsuccess();if(!aborted){if(pending)stored=pending;tx.oncomplete?.();}});
  return tx;
 }};
 const fn=new Function('window','db','captureOperationEpoch','queued','normalizeClothing','message','failedDraftCaptures','structuredClone',source+'\nreturn persistDraft;')({closetAuth:auth},db,1,cb=>cb(),x=>x,()=>{},new Set(),structuredClone);
 let ok=false,reason;
 try{ok=await fn({required:true,mode:'insert',record:fresh});}catch(e){reason=e.cause?.message||e.message;}
 return {ok,reason,after:stored,saved};
}
for(const c of cases)test('source mock: '+c.name,async()=>check(c,await mock(c)));

if(process.env.NATIVE_DRAFT_BROWSER==='1'){
 const {chromium,webkit}=await import('playwright');
 for(const [name,engine] of Object.entries({chromium,webkit}))test('actual '+name+' IndexedDB malformed-draft refusal',async()=>{
  const browser=await engine.launch({headless:true});
  const page=await browser.newPage();
  await page.route('https://draft-fixture.invalid/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic draft test</title>'}));
  await page.goto('https://draft-fixture.invalid/');
  try{
   for(const c of cases){
    const result=await page.evaluate(async ({c,source,fresh})=>{
     const name='closet-current-user-synthetic-owner';
     const req=indexedDB.open(name,1);
     req.onupgradeneeded=()=>{for(const store of ['state','items'])req.result.createObjectStore(store,{keyPath:'id'});};
     const db=await new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
     const done=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(tx.error);});
     const read=(store,key)=>new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
     const setup=db.transaction(['state','items'],'readwrite'),finished=done(setup);
     setup.objectStore('state').clear();setup.objectStore('items').clear();
     if(c.state!==undefined)setup.objectStore('state').put(c.state);
     if(c.saved!==undefined)setup.objectStore('items').put(c.saved);
     await finished;
     const auth={user:{id:'synthetic-owner'},assertCurrent(){}};
     const fn=new Function('window','db','captureOperationEpoch','queued','normalizeClothing','message','failedDraftCaptures','structuredClone',source+'\nreturn persistDraft;')({closetAuth:auth},db,1,cb=>cb(),x=>x,()=>{},new Set(),structuredClone);
     let ok=false,reason;
     try{ok=await fn({required:true,mode:'insert',record:fresh});}catch(e){reason=e.cause?.message||e.message;}
     const after=await read('state','draft'),saved=await read('items','fresh');
     db.close();
     return {ok,reason,after,saved};
    },{c,source,fresh});
    check(c,result);
   }
   console.log('NATIVE_MALFORMED_DRAFT_INSERT_VETO '+name+' '+cases.length+'/'+cases.length+' PASS');
  }finally{await browser.close();}
 });
}
