// P93: pinned M121 shared-original / distinct owner instance v3 backup contract.
// Run ONLY in a detached M121 checkout. Public-style synthetic JPEG bytes and
// synthetic owner IDs; no hosted accounts, user originals, or product writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {exportDurableOwnerBackupM3} from '../public/native-default-verified-backup-export-m3.mjs';
import {prepareDefaultAtomicM3,commitDefaultAtomicM3}
 from '../public/native-default-atomic-import-m3.mjs';
const {indexedDB}=createRequire(import.meta.url)('fake-indexeddb');
globalThis.crypto??=webcrypto;
const exact=runInNewContext(
 readFileSync('public/taxonomy.js','utf8')+'\n'+
 readFileSync('public/outfit-board-engine.js','utf8').split('function boardGaps(')[0]+'\n'+
 readFileSync('public/trends.js','utf8').split('function validLook(value){')[1]
  .split('function storeLooks(')[0].replace(/^/,'function validLook(value){')+
 '\n({normalizeClothing,cleanOutfitBoard,validLook})',
 {categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],
  safeInspirationUrl:()=>'',structuredClone,crypto:globalThis.crypto}
);
const jpeg=bytes=>'data:image/jpeg;base64,'+Buffer.from([255,216,...bytes,255,217]).toString('base64');
const original=jpeg([70,71,72,73]);
const sourceHash=createHash('sha256').update(Buffer.from([255,216,70,71,72,73,255,217])).digest('hex');
const differentOriginal=jpeg([10,11,12,13]);
const differentHash=createHash('sha256').update(Buffer.from([255,216,10,11,12,13,255,217])).digest('hex');
async function dbFor(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,1);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function clear(owner,db){
 db?.close();
 await new Promise((resolve,reject)=>{
  const r=indexedDB.deleteDatabase('closet-current-user-'+owner);
  r.onsuccess=resolve;r.onerror=reject;
 });
}
async function writeRows(db,rows){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  for(const row of rows)tx.objectStore('items').put(row);
  tx.objectStore('state').put({id:'outfit-board',
   current:{name:'Shared photograph owner review',slots:{top:'top-one',bottom:'bottom-two'}},
   saved:[{name:'Saved two-item outfit',slots:{top:'top-one',bottom:'bottom-two'}}]});
  tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);
 });
}
async function rowsOf(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readonly');
  const items=tx.objectStore('items').getAll(),state=tx.objectStore('state').getAll();
  tx.oncomplete=()=>resolve({items:items.result,state:state.result});
  tx.onerror=tx.onabort=()=>reject(tx.error);
 });
}
function pieces(owner,sameOriginal){
 const a={id:'top-one',ownerId:owner,name:'First reviewed physical unit',
  category:'Tops',itemType:'T-shirt',color:'Blue',image:jpeg([1,2,3,4]),
  originalPhoto:{image:original,sha256:sourceHash,ownerId:owner},
  sourceSHA256:sourceHash,sourceHashVerified:true,
  sourcePieceKey:'synthetic-piece-one',
  ownerSourceReview88:{schema:'p88-owner-source-review/v1',ownerId:owner,
   itemId:'top-one',ownerReviewed:true,independentPhysicalItemVerified:false}};
 const b={id:'bottom-two',ownerId:owner,name:'Second reviewed physical unit',
  category:'Bottoms',itemType:'Jeans',color:'Navy',image:jpeg([5,6,7,8]),
  originalPhoto:{image:sameOriginal?original:differentOriginal,
   sha256:sameOriginal?sourceHash:differentHash,ownerId:owner},
  sourceSHA256:sameOriginal?sourceHash:differentHash,sourceHashVerified:true,
  sourcePieceKey:'synthetic-piece-two',
  ownerSourceReview88:{schema:'p88-owner-source-review/v1',ownerId:owner,
   itemId:'bottom-two',ownerReviewed:true,independentPhysicalItemVerified:false}};
 return [a,b];
}
async function exported(owner,db){
 return exportDurableOwnerBackupM3({ownerDB:db,ownerId:owner,
  assertLease:()=>{},assertIdle:()=>{}});
}
const args=(owner,db,data)=>({data,ownerDB:db,ownerId:owner,
 assertLease:()=>{},...exact});
test('M121 v3 denies un-restorable two-source-piece export without any private write',async()=>{
 const owner='p93-m121-shared-source-'+randomUUID();
 let db=await dbFor(owner);
 try{
  const originals=pieces(owner,true);
  await writeRows(db,originals);
  const before=await rowsOf(db);
  // A same-photo pair can be legitimate, but v3 has no signed physical
  // instance restoration contract. Do not distribute a broken backup.
  await assert.rejects(exported(owner,db),
   /M3_EXPORT_SHARED_ORIGINAL_RESTORE_UNSUPPORTED/);
  assert.deepEqual(await rowsOf(db),before,'Rejected export cannot mutate saved owner originals');
  assert.equal(before.items.length,2);
  // An untrusted imported JSON must not circumvent the exact same fence.
  const board=before.state.find(row=>row.id==='outfit-board');
  const attack={format:'closet-current',version:3,items:originals,
   looks:[],outfitBoard:{current:board.current,saved:board.saved}};
  await clear(owner,db);db=await dbFor(owner);
  const clean=await rowsOf(db);
  await assert.rejects(prepareDefaultAtomicM3(args(owner,db,attack)),
   /LEGACY_ATOMIC_DUPLICATE_ORIGINAL_REQUIRES_OWNER_REVIEW/);
  assert.deepEqual(await rowsOf(db),clean,'Native import rejection cannot partially restore one item');
 }finally{await clear(owner,db);}
});
test('M121 refuses exact cross-item preview duplicates despite separate original SHA receipts',async()=>{
 const owner='p93-m121-preview-overlap-'+randomUUID();
 const db=await dbFor(owner);
 try{
  const rows=pieces(owner,false);
  rows[0].image=jpeg([1,2,3]);
  rows[1].image=rows[0].image;
  await writeRows(db,rows);
  const before=await rowsOf(db);
  await assert.rejects(exported(owner,db),
   /M3_EXPORT_SHARED_ORIGINAL_RESTORE_UNSUPPORTED/);
  assert.deepEqual(await rowsOf(db),before,
   'A same-preview refusal must never alter owner-private records');
 }finally{await clear(owner,db);}
});
test('M121 treats alternate Base64 pad bits for identical previews as one JPEG',async()=>{
 const owner='p93-m121-preview-padding-'+randomUUID();
 const db=await dbFor(owner);
 try{
  const rows=pieces(owner,false);
  rows[0].image=jpeg([1,2,3]);
  assert.match(rows[0].image,/Q==$/);
  rows[1].image=rows[0].image.replace(/Q==$/,'R==');
  assert.notEqual(rows[0].image,rows[1].image);
  assert.deepEqual(Buffer.from(rows[0].image.split(',')[1],'base64'),
   Buffer.from(rows[1].image.split(',')[1],'base64'));
  assert.notEqual(rows[0].sourceSHA256,rows[1].sourceSHA256);
  await writeRows(db,rows);
  const before=await rowsOf(db);
  await assert.rejects(exported(owner,db),
   /M3_EXPORT_SHARED_ORIGINAL_RESTORE_UNSUPPORTED/);
  assert.deepEqual(await rowsOf(db),before,
   'Alternate pad-bit spellings cannot trick an owner-private backup');
 }finally{await clear(owner,db);}
});
test('M121 signed-owner native app warns against an un-restorable download',()=>{
 const app=readFileSync('public/app.js','utf8');
 assert.match(app,/M3_EXPORT_SHARED_ORIGINAL_RESTORE_UNSUPPORTED/);
 assert.match(app,/Backup not downloaded: two saved garments share original or display photograph content/);
 assert.match(app,/Do not delete or reset this closet/);
});
test('M121 v3 restores two independently sourced items, exact slots and original SHA',async()=>{
 const owner='p93-two-photos-'+randomUUID();
 let db=await dbFor(owner);
 try{
  await writeRows(db,pieces(owner,false));
  const receipt=await exported(owner,db);
  await clear(owner,db);db=await dbFor(owner);
  const planned=await prepareDefaultAtomicM3(args(owner,db,JSON.parse(receipt.json)));
  assert.equal(planned.incoming.length,2);
  assert.equal((await rowsOf(db)).items.length,0,'Preflight cannot silently save');
  const committed=await commitDefaultAtomicM3({ownerDB:db,ownerId:owner,
   assertLease:()=>{},prepared:planned,confirmed:true});
  assert.equal(committed.committed,true);
  const saved=await rowsOf(db);
  assert.equal(saved.items.length,2);
  assert.deepEqual(new Set(saved.items.map(x=>x.sourceSHA256)),
   new Set([sourceHash,differentHash]));
  const board=saved.state.find(x=>x.id==='outfit-board');
  assert.equal(board.current.slots.top,'top-one');
  assert.equal(board.current.slots.bottom,'bottom-two');
  assert.equal(board.saved[0].slots.bottom,'bottom-two');
  assert.equal(saved.state.find(x=>x.id==='cloud-sync')?.dirty,true);
 }finally{await clear(owner,db);}
});
