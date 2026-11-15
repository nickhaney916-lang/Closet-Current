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
   // M82: a cropped preview is NOT a second original. Verify in real
   // IndexedDB with the exact same original bytes and source SHA, but
   // a different displayed crop and garment ID. Rejected draft survives.
   const original='data:image/jpeg;base64,b3JpZ2luYWw=';
   const cropSha='a'.repeat(64);
   const cropped=id=>({...row(id),image:'data:image/jpeg;base64,Y3JvcC0'+(id==='crop-first'?'x':'y'),
    originalPhoto:{image:original,sha256:cropSha},sourceSHA256:cropSha});
   const firstCrop=cropped('crop-first'),secondCrop=cropped('crop-second');
   await put('items',firstCrop);
   await put('state',{id:'draft',batch:[secondCrop]});
   try{await save(secondCrop,[],{expectedDraftRow:secondCrop});output.croppedOriginal='unexpected success';}
   catch(e){output.croppedOriginal=e.message;}
   output.croppedDraftRetained=(await get('state','draft')).batch.some(x=>x.id===secondCrop.id);
   output.croppedSavedAbsent=!(await get('items',secondCrop.id));
   // A forged, legacy, or transformed row could retain the genuine SHA but
   // omit original bytes. Reuse of that original still fails closed.
   const shaOnly={...firstCrop,id:'sha-only-original',originalPhoto:{image:'data:image/jpeg;base64,c3RyaXBwZWQ=',sha256:cropSha}};
   await put('items',shaOnly);
   const sameSha={...secondCrop,id:'same-sha-other-bytes',originalPhoto:{image:'data:image/jpeg;base64,YW5vdGhlcg==',sha256:cropSha}};
   await put('state',{id:'draft',batch:[sameSha]});
   try{await save(sameSha,[],{expectedDraftRow:sameSha});output.hashOnly='unexpected success';}
   catch(e){output.hashOnly=e.message;}
   output.hashOnlyDraftRetained=(await get('state','draft')).batch.some(x=>x.id===sameSha.id);
   output.hashOnlySavedAbsent=!(await get('items',sameSha.id));
   // Two independent IndexedDB connections simulate separate open tabs,
   // each with a stale in-memory wardrobe snapshot and the same pending JPEG.
   // Both call the actual savePiece implementation concurrently.
   const photoRace='data:image/jpeg;base64,cmFjZQ==';
   const race=id=>({...row(id),image:photoRace,originalPhoto:{image:photoRace,sha256:'fixture-sha'}});
   const raceA=race('race-tab-a'),raceB=race('race-tab-b');
   await put('state',{id:'draft',batch:[raceA,raceB]});
   const otherOpen=indexedDB.open('closet-current-user-'+owner);
   const otherDB=await new Promise((resolve,reject)=>{otherOpen.onsuccess=()=>resolve(otherOpen.result);otherOpen.onerror=()=>reject(otherOpen.error);});
   const saveOther=new Function('db','captureOperationEpoch','queued','captureProofVerifyBeforeSave','normalizeClothing','nativeIndex07Refresh','commitOwnerCorrection10',code+';return savePiece;')(
    otherDB,1,fn=>Promise.resolve().then(fn),async()=>{},v=>v,async()=>{},async()=>{throw Error('unexpected research mode');});
   // Both closures have an independent database connection and see the same
   // initial draft. The IDB readwrite lock serializes their actual commits.
   const raceResults=await Promise.allSettled([
    save(raceA,[],{expectedDraftRow:raceA}),
    saveOther(raceB,[],{expectedDraftRow:raceB})
   ]);
   output.raceFulfilled=raceResults.filter(x=>x.status==='fulfilled').length;
   output.raceRejected=raceResults.filter(x=>x.status==='rejected').length;
   output.raceSaved=await new Promise((resolve,reject)=>{const q=db.transaction('items').objectStore('items').getAll();q.onsuccess=()=>resolve(q.result.filter(x=>x.image===photoRace).length);q.onerror=()=>reject(q.error);});
   const raceDraft=(await get('state','draft')).batch;
   output.raceRejectedDraftRetained=raceDraft.length===1&&
    raceDraft.some(x=>x.id===(raceResults[0].status==='rejected'?raceA.id:raceB.id));
   otherDB.close();
   db.close();return output;
  },implementation);
  assert.match(result.duplicate,/CLOSET_IDENTICAL_SAVED_PHOTO_REQUIRES_OWNER_REVIEW/,name);
  assert.equal(result.draftRetained,true,name+' duplicate retains draft');
  assert.equal(result.savedCount,1,name+' duplicate does not insert');
  assert.equal(result.uniqueSaved,true,name+' unique saves');
  assert.equal(result.uniqueDraftRemoved,true,name+' unique removes draft');
  assert.match(result.croppedOriginal,/CLOSET_IDENTICAL_SAVED_PHOTO_REQUIRES_OWNER_REVIEW/,name);
  assert.equal(result.croppedDraftRetained,true,name+' cropped source retains draft');
  assert.equal(result.croppedSavedAbsent,true,name+' cropped source cannot save');
  assert.match(result.hashOnly,/CLOSET_IDENTICAL_SAVED_PHOTO_REQUIRES_OWNER_REVIEW/,name);
  assert.equal(result.hashOnlyDraftRetained,true,name+' repeated source SHA retains draft');
  assert.equal(result.hashOnlySavedAbsent,true,name+' repeated source SHA cannot save');
  assert.equal(result.raceFulfilled,1,name+' one competing connection wins');
  assert.equal(result.raceRejected,1,name+' competing duplicate rejected');
  assert.equal(result.raceSaved,1,name+' exactly one racing JPEG saved');
  assert.equal(result.raceRejectedDraftRetained,true,name+' losing draft retained');
  console.log(name+' real IndexedDB transaction PASS',JSON.stringify(result));
 }finally{await browser.close();}
}

server.close();
