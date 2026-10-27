import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {randomUUID,createHash} from 'node:crypto';
import {abortSynchronousWriteFailure} from './family-alpha-28-storage-candidate.mjs';
const {IDBFactory,IDBObjectStore}=await import(process.env.CC28_IDB_MODULE||'fake-indexeddb');
const ref='795ad6637f8d4f782bc99751211b25e8e72a3a7d';
const source=execFileSync('git',['show',ref+':public/app.js'],{maxBuffer:10e6,encoding:'utf8'});
const patched=abortSynchronousWriteFailure(source);
const functions=['writeAll','savePiece'];
function extract(s,name){const a=s.indexOf('function '+name+'('),b=s.indexOf('\nfunction ',a+1);assert.ok(a>=0&&b>a);return s.slice(a,b);}
async function setup(s){
 const factory=new IDBFactory(),dbName='synthetic-'+randomUUID();let db=await new Promise((resolve,reject)=>{const r=factory.open(dbName,1);r.onupgradeneeded=()=>{r.result.createObjectStore('items',{keyPath:'id'});r.result.createObjectStore('state',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 const c={db,structuredClone,Error};vm.createContext(c);
 vm.runInContext('let writes=Promise.resolve();function queued(work){const result=writes.then(work);writes=result.catch(()=>{});return result;}'+functions.map(n=>extract(s,n)).join('\n'),c);
 const read=(store='items')=>new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 return {c,get db(){return db;},read,reopen:async()=>{db.close();db=await new Promise((resolve,reject)=>{const r=factory.open(dbName,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});c.db=db;}};
}
const settle=()=>new Promise(r=>setTimeout(r,10));
async function synchronousFault(s,kind){
 const h=await setup(s),originalPut=IDBObjectStore.prototype.put;
 let calls=0;IDBObjectStore.prototype.put=function(...args){if(++calls===2)throw new DOMException('synthetic injected low storage','QuotaExceededError');return originalPut.apply(this,args);};
 try{await assert.rejects(kind==='bulk'?h.c.writeAll([{id:'a',image:'original-a'},{id:'b',image:'original-b'}]):h.c.savePiece({id:'a',image:'original-a'},[]));}
 finally{IDBObjectStore.prototype.put=originalPut;}
 await settle();const count=(await h.read()).length;
 await h.c.writeAll([{id:'retry',image:'original-retry'}]);assert.ok((await h.read()).some(x=>x.id==='retry'),'queue recovers');h.db.close();return count;
}
const failures={};for(const kind of ['bulk','save']){
 failures[kind]={baselineRowsAfterRejectedWrite:await synchronousFault(source,kind),candidateRowsAfterRejectedWrite:await synchronousFault(patched,kind)};
 assert.equal(failures[kind].baselineRowsAfterRejectedWrite,1);assert.equal(failures[kind].candidateRowsAfterRejectedWrite,0);
}
// Synthetic high-volume payload, NOT JPEG decode or recognition accuracy test.
const cloneFailure={};for(const [label,s] of [['baseline',source],['candidate',patched]]){
 const h=await setup(s);await assert.rejects(h.c.writeAll([{id:'first',image:'kept'},{id:'second',nonCloneable:()=>{}}]));await settle();cloneFailure[label]=(await h.read()).length;h.db.close();
}
assert.deepEqual(cloneFailure,{baseline:1,candidate:0});
const payload='data:image/jpeg;base64,'+'A'.repeat(1024*1024);
const garments=Array.from({length:20},(_,i)=>({id:'fixture-'+i,image:payload+i,originalPhoto:{image:payload+i},category:'Tops',color:'Red',userAdjusted:true}));
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
async function measure(s){const samples=[];for(let repeat=0;repeat<3;repeat++){
 const h=await setup(s);const heapBefore=process.memoryUsage().heapUsed,t=performance.now();
 await h.c.writeAll(garments);const saved=await h.read();const ms=performance.now()-t,heapDeltaBytes=process.memoryUsage().heapUsed-heapBefore;
 assert.equal(digest(saved),digest([...garments].sort((a,b)=>a.id.localeCompare(b.id))));
 samples.push({writeRead20Ms:+ms.toFixed(2),heapDeltaBytes});
 await h.reopen();assert.equal(digest(await h.read()),digest(saved),'reopened synthetic connection retains originals');
 // Transaction abort must retain the prior committed original and correction.
 const tx=h.db.transaction('items','readwrite');tx.objectStore('items').put({...garments[0],image:'bad'});tx.abort();await settle();
 assert.equal(digest(await h.read()),digest(saved));h.db.close();
 }return samples;}
const measurements={baseline:await measure(source),candidate:await measure(patched)};
const recovery=await setup(patched);
await Promise.all(garments.map(value=>recovery.c.savePiece(value,()=>[])));
assert.equal((await recovery.read()).length,20,'rapid queued saves retain all pieces');
const beforeGuard=digest(await recovery.read());
await assert.rejects(recovery.c.savePiece({id:'foreign'},()=>[],()=>false));
assert.equal(digest(await recovery.read()),beforeGuard,'existing stillCurrent preflight preserved');
await assert.rejects(recovery.c.savePiece({id:'callback-failure'},()=>{throw Error('synthetic draft callback failure');}));
await settle();assert.equal(digest(await recovery.read()),beforeGuard,'throwing draft callback aborts earlier item put');
recovery.db.close();
// Snapshot pressure from actual algorithm: each capture persists the full batch.
const cloneStart=performance.now();let snapshotBytes=0;for(let i=1;i<=20;i++){const copy=structuredClone(garments.slice(0,i));snapshotBytes+=JSON.stringify(copy).length;}
const report={sourceRef:ref,sourceSha256:createHash('sha256').update(source).digest('hex'),runtime:process.version,platform:process.platform,method:'Node VM actual extracted writeAll/savePiece + fake-indexeddb; synthetic 1 MiB image strings; no image decoding',failures,cloneFailure,measurements,fullDraftSnapshot20:{clonePlusJSONElapsedMs:+(performance.now()-cloneStart).toFixed(2),serializedCharactersAcross20Captures:snapshotBytes},verified:['20 committed originals/metadata unchanged','same-factory connection close/reopen retains committed originals (not browser restart)', '20 rapid queued saves retained', 'existing stillCurrent guard unchanged', 'throwing draft callback aborts item write','explicit transaction abort retains prior originals','synchronous quota fault aborts candidate bulk and item+draft writes','queue accepts retry after rejected write', 'actual fake-indexeddb DataCloneError aborts entire candidate bulk write'],notTested:['physical Android/iPhone','Chromium/WebKit','real IndexedDB quota/eviction','browser restart/refresh','offline-online cloud restore','initial app loading','actual model initialization/inference','actual high-resolution image decoding','wardrobe/builder navigation','GPU or browser memory'],release:'HOLD'};
console.log(JSON.stringify(report,null,2));if(process.env.CC28_REPORT)await writeFile(process.env.CC28_REPORT,JSON.stringify(report,null,2)+'\n');
