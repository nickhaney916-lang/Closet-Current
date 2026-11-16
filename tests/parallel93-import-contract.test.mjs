// P93 exact-source M4 vs M3 research import contract: legal public fixture
// plus synthetic JPEG APP metadata. No private photos, owner accounts or writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
import {createHash,webcrypto} from 'node:crypto';
import {prepareDefaultAtomicM3} from '../public/native-default-atomic-import-m3.mjs';
const {indexedDB}=createRequire(import.meta.url)('fake-indexeddb');
globalThis.crypto??=webcrypto;
const M3='4d9a28bba60c7f17f934848fc36d4bd478ffea55';
const source=readFileSync('benchmark/fixtures/commons-0003.jpg');
assert(source[0]===255&&source[1]===216&&source.at(-2)===255&&source.at(-1)===217,
 'Checked-in original must be JPEG');
function largeJPEG(){
 const parts=[];
 // APP15 metadata segments after SOI: the image still contains its intact
 // full original JPEG stream; no source pixels, rows or model outputs change.
 // Additional metadata simulates a large camera-original backup.
 for(let i=0;i<56;i++){
  const bytes=48000;const header=Buffer.from([255,239,(bytes+2)>>8,(bytes+2)&255]);
  parts.push(header,Buffer.alloc(bytes,i&255));
 }
 return Buffer.concat([source.subarray(0,2),...parts,source.subarray(2)]);
}
const original=largeJPEG();
const original64='data:image/jpeg;base64,'+original.toString('base64');
const sourceSHA256=createHash('sha256').update(original).digest('hex');
const preview='data:image/jpeg;base64,'+Buffer.from([255,216,255,217]).toString('base64');
assert(original64.length>3_000_000&&original64.length<11_200_000);
const exact=runInNewContext(
 readFileSync('public/taxonomy.js','utf8')+'\n'+
 readFileSync('public/outfit-board-engine.js','utf8').split('function boardGaps(')[0]+'\n'+
 readFileSync('public/trends.js','utf8').split('function validLook(value){')[1]
  .split('function storeLooks(')[0].replace(/^/,'function validLook(value){')+
 '\n({normalizeClothing,cleanOutfitBoard,validLook})',
 {categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],
  safeInspirationUrl:()=>'',structuredClone,crypto:globalThis.crypto}
);
let seq=0;
async function fixture(){
 const owner='parallel93-synthetic-'+(++seq);
 const db=await new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+owner,1);
  req.onupgradeneeded=()=>{
   req.result.createObjectStore('items',{keyPath:'id'});
   req.result.createObjectStore('state',{keyPath:'id'});
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
 return {owner,db,close:()=>db.close()};
}
function input(owner){
 return {format:'closet-current',version:3,items:[{
  id:'source-1',ownerId:owner,category:'Tops',itemType:'T-shirt',
  color:'Blue',colorSource:'user',image:preview,
  originalPhoto:{image:original64,sha256:sourceSHA256,ownerId:owner},
  sourceSHA256,sourceHashVerified:true
 }]};
}
function args(f,raw){return {data:raw,ownerDB:f.db,ownerId:f.owner,
 assertLease:()=>{},...exact};}
async function snapshot(f){
 return new Promise((resolve,reject)=>{
  const tx=f.db.transaction(['items','state'],'readonly');
  const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();
  tx.oncomplete=()=>resolve({items:a.result,state:b.result});
  tx.onerror=()=>reject(tx.error);
 });
}
let donorModule;
async function donor(){
 if(donorModule)return donorModule;
 const tmp=await mkdtemp(join(tmpdir(),'p93-import-donor-'));
 const path=join(tmp,'legacy-atomic-merge.mjs');
 const git=spawnSync('git',['show',M3+':research/mission3-legacy-atomic-import/legacy-atomic-merge.mjs'],{encoding:'utf8',maxBuffer:5e6});
 try{
  assert.equal(git.status,0,'Pinned M3 donor is available from full git checkout');
  await writeFile(path,git.stdout);
  const m=await import(pathToFileURL(path).href);
  donorModule=m;return m;
 }finally{await rm(tmp,{recursive:true,force:true});}
}
test('M4 native importer rejects a valid-provenance camera original over 3 MB encoded, WITHOUT a write',async()=>{
 const f=await fixture();
 try{
  const before=await snapshot(f);
  await assert.rejects(prepareDefaultAtomicM3(args(f,input(f.owner))),
   /LEGACY_ATOMIC_INVALID_JPEG/);
  assert.deepEqual(await snapshot(f),before);
 }finally{f.close();}
});
test('M3 exact donor preflight accepts that same large-source v3 original, preserving SHA and board item ID',async()=>{
 const f=await fixture();
 try{
  const m=await donor(),before=await snapshot(f);
  assert.equal(typeof m.prepareLegacyAtomicM3,'function');
  const prepared=await m.prepareLegacyAtomicM3(args(f,input(f.owner)));
  assert.equal(prepared.incoming.length,1);
  assert.equal(prepared.incoming[0].id,'source-1');
  assert.equal(prepared.incoming[0].sourceSHA256,sourceSHA256);
  assert.deepEqual(await snapshot(f),before,'Preflight alone may not write');
 }finally{f.close();}
});
test('M3 donor still denies the changed original checksum and foreign-owner claim, no write',async()=>{
 const f=await fixture();
 try{
  const m=await donor(),before=await snapshot(f);
  let bad=input(f.owner);
  bad.items[0].originalPhoto.sha256='a'.repeat(64);
  await assert.rejects(m.prepareLegacyAtomicM3(args(f,bad)),
   /JPEG_SHA_MISMATCH|ORIGINAL_RECEIPT_CONFLICT/);
  bad=input(f.owner);bad.items[0].originalPhoto.ownerId='another-owner';
  await assert.rejects(m.prepareLegacyAtomicM3(args(f,bad)),/FOREIGN_OWNER/);
  assert.deepEqual(await snapshot(f),before);
 }finally{f.close();}
});
test('real currentBoard.slots use canonical saved IDs, never invented {items:[]} experimental schema',()=>{
 const one={id:'source-1',category:'Tops',itemType:'T-shirt',color:'Blue'};
 const pants={id:'source-2',category:'Bottoms',itemType:'Jeans',color:'Navy'};
 const board=exact.cleanOutfitBoard({slots:{top:'source-1',bottom:'source-2'}},[one,pants]);
 assert.equal(board.slots.top,'source-1');
 assert.equal(board.slots.bottom,'source-2');
 const dress={id:'dress-1',category:'Dresses',itemType:'Dress',color:'Red'};
 const clean=exact.cleanOutfitBoard({slots:{top:'dress-1',bottom:'source-2'}},
  [dress,pants]);
 assert.equal(clean.slots.top,'dress-1');
 assert.equal(clean.slots.bottom,undefined);
 assert.equal(clean.items,undefined);
});
