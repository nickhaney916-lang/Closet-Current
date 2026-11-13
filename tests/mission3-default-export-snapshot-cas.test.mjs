// Real production exporter and native fake IndexedDB owner stores.
// Synthetic JPEGs and signed IDs only. No network or hosted accounts.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomUUID,createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {exportDurableOwnerBackupM3} from '../public/native-default-verified-backup-export-m3.mjs';
const require=createRequire(import.meta.url);
const {indexedDB}=require('fake-indexeddb');
globalThis.crypto??=webcrypto;
const bytes=Buffer.from([255,216,25,35,55,66,255,217]);
const bytes2=Buffer.from([255,216,11,12,13,14,255,217]);
const image='data:image/jpeg;base64,'+bytes.toString('base64');
const otherImage='data:image/jpeg;base64,'+bytes2.toString('base64');
const sha=createHash('sha256').update(bytes).digest('hex');
const sha2=createHash('sha256').update(bytes2).digest('hex');
const cloth=(owner,id='shirt',photo=image,hash=sha)=>({
 id,ownerId:owner,name:'Blue shirt',image:photo,
 originalPhoto:{image:photo,sha256:hash},sourceSHA256:hash,
 sourceHashVerified:true,color:'Blue',category:'Tops',itemType:'T-shirt',
 userAdjusted:true
});
async function open(owner){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+owner,1);
  req.onupgradeneeded=()=>{
   req.result.createObjectStore('items',{keyPath:'id'});
   req.result.createObjectStore('state',{keyPath:'id'});
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
}
async function put(db,changes=[]){
 return new Promise((ok,fail)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  for(const [store,value] of changes)tx.objectStore(store).put(value);
  tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
 });
}
async function get(db,store,id){
 return new Promise((ok,fail)=>{
  const r=db.transaction(store).objectStore(store).get(id);
  r.onsuccess=()=>ok(r.result);
  r.onerror=()=>fail(r.error);
 });
}
async function fixture(){
 const owner=randomUUID(),db=await open(owner);
 return {owner,db,close(){db.close()},assertLease:()=>{},
  export(opts={}){return exportDurableOwnerBackupM3({
   ownerDB:db,ownerId:owner,assertLease:this.assertLease,
   ...opts
  });}};
}
test('default exporter reads one exact committed owner-private clothes/looks/outfit snapshot',async()=>{
 const f=await fixture();
 try{
  const garment=cloth(f.owner,'shirt'),extra=cloth(f.owner,'shoes',otherImage,sha2);
  await put(f.db,[['items',garment],['items',extra],
   ['state',{id:'draft',batch:[]}],
   ['state',{id:'looks',looks:[{id:'look',title:'Owner confirmed',pieces:[]}]}],
   ['state',{id:'outfit-board',current:{name:'Tomorrow',slots:{top:'shirt'}},
    saved:[{name:'Office',slots:{top:'shirt',shoes:'shoes'}}]}]]);
  const receipt=await f.export();
  const data=JSON.parse(receipt.json);
  assert.deepEqual(data,receipt.data);
  assert.equal(data.format,'closet-current');
  assert.equal(data.version,3);
  assert.equal(receipt.pendingDraftsOmitted,0);
  assert.equal(receipt.durableSnapshot,true);
  assert.equal(data.items.length,2);
  assert.deepEqual(data.items.map(x=>x.originalPhoto.image),[image,otherImage]);
  assert.deepEqual(data.items.map(x=>x.sourceSHA256),[sha,sha2]);
  assert.equal(data.items[0].userAdjusted,true);
  assert.equal(data.looks[0].title,'Owner confirmed');
  assert.equal(data.outfitBoard.saved[0].slots.shoes,'shoes');
  assert.equal((await get(f.db,'items','shirt')).originalPhoto.image,image);
 }finally{f.close();}
});
test('pending unsaved original in durable Photo results blocks ALL v3 backup creation',async()=>{
 const f=await fixture();
 try{
  await put(f.db,[['items',cloth(f.owner)],
   ['state',{id:'draft',batch:[cloth(f.owner,'awaiting-confirmation')]}]]);
  await assert.rejects(f.export(),/UNFINISHED_PHOTOS_NOT_IN_V3/);
  assert.equal((await get(f.db,'state','draft')).batch.length,1);
 }finally{f.close();}
});
test('a draft row with malformed batch fails closed; not silently treated as empty',async()=>{
 const f=await fixture();
 try{
  await put(f.db,[['items',cloth(f.owner)],['state',{id:'draft',batch:null}]]);
  await assert.rejects(f.export(),/UNFINISHED_PHOTOS_NOT_IN_V3/);
 }finally{f.close();}
});
test('a second same-owner tab saved a draft: stale exporter still sees it and aborts',async()=>{
 const f=await fixture(),tabB=await open(f.owner);
 try{
  await put(f.db,[['items',cloth(f.owner)]]);
  await put(tabB,[['state',{id:'draft',batch:[cloth(f.owner,'from-B')]}]]);
  await assert.rejects(f.export(),/UNFINISHED_PHOTOS_NOT_IN_V3/);
 }finally{f.close();tabB.close();}
});
test('a simultaneous second owner cannot appear in the private export',async()=>{
 const f=await fixture(),other=randomUUID(),foreign=await open(other);
 try{
  await put(f.db,[['items',cloth(f.owner)]]);
  await put(foreign,[['items',cloth(other,'foreign-jacket',otherImage,sha2)]]);
  const snap=await f.export();
  assert.deepEqual(snap.data.items.map(x=>x.id),['shirt']);
  assert.equal(snap.json.includes('foreign-jacket'),false);
 }finally{f.close();foreign.close();}
});
test('legacy saved rows without ownerId are stamped only in exported copy',async()=>{
 const f=await fixture();
 try{
  const row=cloth(f.owner);delete row.ownerId;
  await put(f.db,[['items',row]]);
  const output=await f.export();
  assert.equal(output.data.items[0].ownerId,f.owner);
  assert.equal((await get(f.db,'items','shirt')).ownerId,undefined);
 }finally{f.close();}
});
test('foreign owner nested source or outer owner row blocks export before any file',async()=>{
 const f=await fixture();
 try{
  await put(f.db,[['items',cloth(f.owner)],['state',{
   id:'looks',looks:[{id:'abc',ownerId:'another-owner',pieces:[]}]
  }]]);
  await assert.rejects(f.export(),/FOREIGN_OWNER/);
  await put(f.db,[['state',{id:'looks',looks:[]}],
   ['items',{...cloth(f.owner),originalPhoto:{
    image,sha256:sha,ownerId:'other-account'
   }}]]);
  await assert.rejects(f.export(),/FOREIGN_OWNER/);
 }finally{f.close();}
});
test('corrupted source SHA or changed original JPEG blocks a misleading backup',async()=>{
 const f=await fixture();
 try{
  await put(f.db,[['items',{...cloth(f.owner),sourceSHA256:'a'.repeat(64)}]]);
  await assert.rejects(f.export(),/PHOTO_SHA_MISMATCH/);
  await put(f.db,[['items',{...cloth(f.owner),originalPhoto:{
   image:otherImage,sha256:sha
  }}]]);
  await assert.rejects(f.export(),/PHOTO_SHA_MISMATCH/);
 }finally{f.close();}
});
test('malformed or missing image bytes fail closed before export',async()=>{
 const f=await fixture();
 try{
  await put(f.db,[['items',{...cloth(f.owner),image:'data:image/jpeg;base64,YWJjZA==',
   sourceSHA256:null,originalPhoto:null,sourceHashVerified:false}]]);
  await assert.rejects(f.export(),/INVALID_JPEG_BYTES/);
 }finally{f.close();}
});
test('v3 backup cannot include an outfit referencing a garment not in the snapshot',async()=>{
 const f=await fixture();
 try{
  await put(f.db,[['items',cloth(f.owner)],['state',{
   id:'outfit-board',current:{slots:{top:'lost-garment'}},saved:[]
  }]]);
  await assert.rejects(f.export(),/MISSING_OUTFIT_PIECE/);
 }finally{f.close();}
});
test('owner-canceled lease during readonly commit or async source digest aborts export',async()=>{
 const f=await fixture();
 try{
  await put(f.db,[['items',cloth(f.owner)]]);
  let calls=0;
  await assert.rejects(f.export({
   assertLease:()=>{if(++calls>=3)throw Error('Owner session revoked');}
  }),/Owner session revoked/);
 }finally{f.close();}
});
test('pending outfit edit blocks at preflight and after a durable read, no export generated',async()=>{
 const f=await fixture();
 try{
  await put(f.db,[['items',cloth(f.owner)]]);
  let passes=0;
  await assert.rejects(f.export({
   assertIdle:()=>{if(++passes>=3)throw Error('Uncommitted outfit edit');}
  }),/Uncommitted outfit edit/);
 }finally{f.close();}
});
test('empty wardrobe cannot be represented as a successful saved-clothing backup',async()=>{
 const f=await fixture();
 try{await assert.rejects(f.export(),/EMPTY_CLOSET/);}finally{f.close();}
});
test('app default export uses durable module, explicit privacy lease and pending photo protection',()=>{
 const source=readFileSync('public/app.js','utf8');
 const a=source.indexOf("$('export').onclick=async()=>");
 const b=source.indexOf("$('import').onchange=async",a);
 assert.ok(a>=0&&b>a);
 const region=source.slice(a,b);
 assert.match(region,/ownerWardrobeMutationLease\(\)/);
 assert.match(region,/await pendingWrites/);
 assert.match(region,/!batch\.length/);
 assert.match(region,/failedDraftCaptures\.size/);
 assert.match(region,/boardHasUnsavedDraft/);
 assert.match(region,/exportDurableOwnerBackupM3/);
 assert.doesNotMatch(region,/JSON\.stringify\(\{format:'closet-current',version:3,items,/);
 assert.match(region,/restoreAtomic01.*research/);
});
