/** Real Chromium/WebKit IndexedDB transaction acceptance for MAIN1054.
 * Synthetic owner/photo only. Executes the actual extracted savePiece source,
 * not a reimplementation of its IndexedDB write path.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end('<!doctype html><title>MAIN1054 IndexedDB fixture</title>');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/';
const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const start=source.indexOf('function savePiece('),end=source.indexOf('\nfunction node(',start);
assert.ok(start>=0&&end>start);
const implementation=source.slice(start,end);
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage();
  await page.goto(url);
  const result=await page.evaluate(async code=>{
   const owner='main1054-fixture',photo='data:image/jpeg;base64,ZmFrZQ==';
   const open=indexedDB.open('closet-current-user-'+owner,1);
   open.onupgradeneeded=()=>{open.result.createObjectStore('items',{keyPath:'id'});open.result.createObjectStore('state',{keyPath:'id'});};
   const db=await new Promise((resolve,reject)=>{open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error);});
   const row=id=>({id,image:photo,sourceSHA256:'fixture-sha',originalPhoto:{image:photo,sha256:'fixture-sha'}});
   const txDone=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(tx.error||Error('aborted'));});
   const put=async(store,item)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(item);await txDone(tx);};
   const get=async(store,id)=>new Promise((resolve,reject)=>{const req=db.transaction(store).objectStore(store).get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
   await put('items',row('already-saved'));
   await put('state',{id:'draft',batch:[row('second-photo')]});
   const auth={user:{id:owner},assertCurrent(){}};
   window.closetAuth=auth;
   const save=new Function('db','captureOperationEpoch','queued','captureProofVerifyBeforeSave','normalizeClothing','nativeIndex07Refresh','commitOwnerCorrection10',code+';return savePiece;')(
    db,1,fn=>Promise.resolve().then(fn),async()=>{},v=>v,async()=>{},async()=>{throw Error('unexpected research mode');});
   const output={};
   try{await save(row('second-photo'),[],{expectedDraftRow:row('second-photo')});output.duplicate='unexpected success';}
   catch(e){output.duplicate=e.message;}
   output.draftRetained=(await get('state','draft')).batch.some(x=>x.id==='second-photo');
   output.savedCount=await new Promise((resolve,reject)=>{const q=db.transaction('items').objectStore('items').count();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
   await put('state',{id:'draft',batch:[{...row('different-photo'),image:'data:image/jpeg;base64,b3RoZXI=',originalPhoto:{image:'data:image/jpeg;base64,b3RoZXI=',sha256:'fixture-sha'}}]});
   const unique={...row('different-photo'),image:'data:image/jpeg;base64,b3RoZXI=',originalPhoto:{image:'data:image/jpeg;base64,b3RoZXI=',sha256:'fixture-sha'}};
   await save(unique,[],{expectedDraftRow:unique});
   output.uniqueSaved=!!(await get('items','different-photo'));
   output.uniqueDraftRemoved=(await get('state','draft')).batch.length===0;
   db.close();return output;
  },implementation);
  assert.match(result.duplicate,/CLOSET_IDENTICAL_SAVED_PHOTO_REQUIRES_OWNER_REVIEW/,name);
  assert.equal(result.draftRetained,true,name+' duplicate retains draft');
  assert.equal(result.savedCount,1,name+' duplicate does not insert');
  assert.equal(result.uniqueSaved,true,name+' unique saves');
  assert.equal(result.uniqueDraftRemoved,true,name+' unique removes draft');
  console.log(name+' real IndexedDB transaction PASS',JSON.stringify(result));
 }finally{await browser.close();}
}

server.close();
