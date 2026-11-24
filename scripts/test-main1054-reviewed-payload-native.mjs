import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';
const source=readFileSync(process.env.REVIEW_APP_SOURCE||'public/app.js','utf8');
const start=source.indexOf('function savePiece('),end=source.indexOf('\nfunction node(',start);
assert.ok(start>=0&&end>start);
const implementation=source.slice(start,end),red=process.env.REVIEW_EXPECT_RED==='1';
const server=createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html'});r.end('<!doctype html><title>Disposable native IDB test</title>')});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
try{
 for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await launcher.launch({headless:true});
  try{
   const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
   const rows=await page.evaluate(async ({implementation})=>{
    const request=r=>new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
    const done=tx=>new Promise((ok,no)=>{tx.oncomplete=ok;tx.onerror=tx.onabort=()=>no(tx.error)});
    const open=indexedDB.open('closet-current-user-A',1);
    open.onupgradeneeded=()=>{open.result.createObjectStore('items',{keyPath:'id'});open.result.createObjectStore('state',{keyPath:'id'});};
    const db=await request(open),results=[];
    window.closetAuth={user:{id:'A'},assertCurrent(){}};
    const original={id:'g',ownerId:'A',image:'data:image/jpeg;base64,/9j/',originalPhoto:{image:'data:image/jpeg;base64,/9j/',sha256:'a'.repeat(64)},sourceSHA256:'a'.repeat(64),color:'Blue',itemType:'T-shirt',category:'Tops'};
    for(const kind of ['queued','hash','item-read','draft-read','duplicate-read','nested-receipt','valid']){
     const init=db.transaction(['items','state'],'readwrite'),initDone=done(init);init.objectStore('items').clear();init.objectStore('state').clear();init.objectStore('state').put({id:'draft',batch:[structuredClone(original)]});await initDone;
     const value={...structuredClone(original),color:'Purple',reviewReceipt:{category:'Tops',approved:true}};
     const mutate=()=>{if(kind==='nested-receipt')value.reviewReceipt.approved=false;else value.color='Red';};
     const get=IDBObjectStore.prototype.get,getAll=IDBObjectStore.prototype.getAll;
     IDBObjectStore.prototype.get=function(...args){const r=get.apply(this,args);if((kind==='item-read'&&this.name==='items')||(kind==='draft-read'&&this.name==='state'))r.addEventListener('success',mutate,{once:true});return r;};
     IDBObjectStore.prototype.getAll=function(...args){const r=getAll.apply(this,args);if(kind==='duplicate-read'||kind==='nested-receipt')r.addEventListener('success',mutate,{once:true});return r;};
     const build=new Function('db','queued','captureProofVerifyBeforeSave','normalizeClothing','nativeIndex07Refresh','captureOperationEpoch',implementation+';return savePiece;');
     const save=build(db,async fn=>{if(kind==='queued')mutate();return fn()},async()=>{if(kind==='hash')mutate()},x=>x,async()=>{},0);
     let error=null;try{await save(value,[],{expectedDraftRow:structuredClone(original)})}catch(e){error=String(e.message||e)}finally{IDBObjectStore.prototype.get=get;IDBObjectStore.prototype.getAll=getAll;}
     const tx=db.transaction(['items','state'],'readonly'),a=tx.objectStore('items').getAll(),b=tx.objectStore('state').get('draft');
     const [saved,draft]=await Promise.all([request(a),request(b)]);
     results.push({kind,error,saved:saved.length,color:saved[0]?.color??null,approved:saved[0]?.reviewReceipt?.approved??null,draft:draft.batch.length,originalPreserved:(saved[0]??draft.batch[0])?.originalPhoto?.image===original.originalPhoto.image});
    }
    db.close();return results;
   },{implementation});
   for(const row of rows){assert.equal(row.originalPreserved,true);if(row.kind==='valid'){assert.equal(row.error,null);assert.equal(row.saved,1);assert.equal(row.color,'Purple');assert.equal(row.draft,0);}else if(red){assert.equal(row.error,null);assert.equal(row.saved,1);assert.equal(row.draft,0);}else{assert.match(row.error,/CLOSET_REVIEWED_PAYLOAD_CHANGED/);assert.equal(row.saved,0);assert.equal(row.draft,1);}}
   console.log('REVIEW_PAYLOAD_NATIVE '+JSON.stringify({engine,red,rows}));
  }finally{await browser.close()}
 }
}finally{await new Promise(ok=>server.close(ok))}
