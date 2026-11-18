/**
 * M220: v3 saved/current outfit references may never silently include retired
 * (deleted or sourceRevoked) original-photo records in export or import.
 * Run genuine fake-indexeddb with public licensed JPEG bytes, real SHA,
 * exact taxonomy and outfit normalization. No hosted owners/model/release.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createHash,webcrypto,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {indexedDB}=require('fake-indexeddb');
globalThis.crypto??=webcrypto;
import {exportDurableOwnerBackupM3}
 from '../public/native-default-verified-backup-export-m3.mjs';
import {prepareDefaultAtomicM3}
 from '../public/native-default-atomic-import-m3.mjs';
const read=path=>readFileSync(path,'utf8');
const boardEngine=read('public/outfit-board-engine.js');
const trends=read('public/trends.js');
const exact=runInNewContext(
 read('public/taxonomy.js')+'\n'+
 boardEngine.slice(0,boardEngine.indexOf('function boardGaps('))+'\n'+
 trends.slice(trends.indexOf('function validLook(value){'),
  trends.indexOf('function storeLooks('))+
 '\n({normalizeClothing,cleanOutfitBoard,validLook})',
 {categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],
  safeInspirationUrl:()=>'',structuredClone,crypto:globalThis.crypto}
);
const raw=readFileSync('benchmark/fixtures/commons-0053.jpg');
assert(raw[0]===255&&raw[1]===216);
const jpeg='data:image/jpeg;base64,'+raw.toString('base64');
const sha=createHash('sha256').update(raw).digest('hex');
function item(owner,flag){
 return {id:'owned-top',ownerId:owner,name:'Reviewed top',
  image:jpeg,originalPhoto:{ownerId:owner,image:jpeg,sha256:sha},
  sourceSHA256:sha,sourceHashVerified:true,
  category:'Tops',itemType:'T-shirt',color:'Blue',colorSource:'user',
  ownerReviewed:true,singleGarmentVerified:true,
  ...(flag?{[flag]:true}:{})
 };
}
function outfit(which){
 const used={name:'Old saved outfit',slots:{top:'owned-top'}};
 const empty={name:'Empty new outfit',slots:{}};
 return which==='current'?{current:used,saved:[]}:
  {current:empty,saved:[used]};
}
async function database(owner){
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
async function put(db,store,value){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');
  tx.objectStore(store).put(value);
  tx.oncomplete=resolve;
  tx.onerror=tx.onabort=()=>reject(tx.error);
 });
}
async function snap(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readonly');
  const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();
  tx.oncomplete=()=>resolve({items:a.result,state:b.result});
  tx.onerror=tx.onabort=()=>reject(tx.error);
 });
}
async function fixture(flag,which,hasBoard){
 const owner='m220-'+randomUUID();
 const db=await database(owner);
 await put(db,'items',item(owner,flag));
 await put(db,'state',{id:'cloud-sync',baseVersion:3,baseDocument:null,
  localRevision:6,dirty:false});
 await put(db,'state',{id:'draft',batch:[]});
 if(hasBoard)await put(db,'state',{id:'outfit-board',...outfit(which)});
 return {owner,db,close:()=>db.close(),assertLease:()=>{}};
}
function prepare(f,which){
 return prepareDefaultAtomicM3({
  data:{format:'closet-current',version:3,items:[],looks:[],
   outfitBoard:outfit(which)},
  ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease,...exact
 });
}
test('M220 immutable original public JPEG SHA is actual photo identity',()=>{
 assert.equal(raw[0],255);assert.equal(raw[1],216);
 assert.match(sha,/^[0-9a-f]{64}$/);
 assert.ok(jpeg.startsWith('data:image/jpeg;base64,'));
});
for(const flag of ['deleted','sourceRevoked']){
 for(const where of ['current','saved']){
  test('M220 backup EXPORT must refuse '+flag+' referenced in '+where+' outfit, no snapshot mutation',async()=>{
   const f=await fixture(flag,where,true);
   try{
    const before=await snap(f.db);
    await assert.rejects(exportDurableOwnerBackupM3({
     ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease
    }),/M3_EXPORT_RETIRED_OUTFIT_SOURCE/);
    assert.deepEqual(await snap(f.db),before);
   }finally{f.close();}
  });
  test('M220 v3 IMPORT must refuse '+flag+' referenced in '+where+' outfit, no private mutation',async()=>{
   const f=await fixture(flag,where,false);
   try{
    const before=await snap(f.db);
    await assert.rejects(prepare(f,where),
     /LEGACY_ATOMIC_RETIRED_OUTFIT_SOURCE/);
    assert.deepEqual(await snap(f.db),before);
   }finally{f.close();}
  });
 }
}
for(const where of ['current','saved']){
 test('M220 independently owner-reviewed active '+where+' outfit still EXPORTS',async()=>{
  const f=await fixture(null,where,true);
  try{
   const p=await exportDurableOwnerBackupM3({
    ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease});
   assert.equal(p.counts.garments,1);
   assert.equal(p.releaseAuthorized,false);
   assert.equal(p.data.outfitBoard[where==='current'?'current':'saved']
    [where==='current'?'slots':0]?.top,
    where==='current'?'owned-top':undefined);
  }finally{f.close();}
 });
 test('M220 independently owner-reviewed active '+where+' outfit still IMPORTS',async()=>{
  const f=await fixture(null,where,false);
  try{
   const p=await prepare(f,where);
   assert.equal(p.board[where==='current'?'current':'saved']
    [where==='current'?'slots':0]?.top,
    where==='current'?'owned-top':undefined);
   assert.equal(p.releaseAuthorized,false);
  }finally{f.close();}
 });
}
test('M220 retired original without outfit reference remains exportable for historic backup',async()=>{
 const f=await fixture('sourceRevoked','saved',false);
 try{
  const p=await exportDurableOwnerBackupM3({
   ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease});
  assert.equal(p.counts.garments,1);
  assert.equal(p.data.items[0].sourceRevoked,true);
 }finally{f.close();}
});
test('M220 retired original without outfit reference remains stored but empty outfit import allowed',async()=>{
 const f=await fixture('deleted','current',false);
 try{
  const p=await prepareDefaultAtomicM3({
   data:{format:'closet-current',version:3,items:[],looks:[],
    outfitBoard:{current:{name:'No retired slot',slots:{}},saved:[]}},
   ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease,...exact
  });
  assert.deepEqual(Object.keys(p.board.current.slots),[]);
 }finally{f.close();}
});
