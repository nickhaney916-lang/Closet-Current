// P93: actual M97 native *v3 export + import* contract under disposable source.
// Uses public licensed JPEG plus synthetic EXIF-like APP metadata and fake-IDB.
// Product code is immutable; only exact hash-pinned candidate modules are tested.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,webcrypto} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {createRequire} from 'node:module';
import {proposeP93SourceOnlyPatch,P93_PINS} from '../research/parallel93-convergence/proposed-v3-pair-adapter.mjs';
const {indexedDB}=createRequire(import.meta.url)('fake-indexeddb');
globalThis.crypto??=webcrypto;
const paths=Object.keys(P93_PINS);
const exportPath=paths.find(x=>x.includes('export'));
const importPath=paths.find(x=>x.includes('import'));
assert(exportPath&&importPath);
const originalImporter=await import('../public/native-default-atomic-import-m3.mjs');
const originalExporter=await import('../public/native-default-verified-backup-export-m3.mjs');
const exact=runInNewContext(
 readFileSync('public/taxonomy.js','utf8')+'\n'+
 readFileSync('public/outfit-board-engine.js','utf8').split('function boardGaps(')[0]+'\n'+
 readFileSync('public/trends.js','utf8').split('function validLook(value){')[1]
  .split('function storeLooks(')[0].replace(/^/,'function validLook(value){')+
 '\n({normalizeClothing,cleanOutfitBoard,validLook})',
 {categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],
  safeInspirationUrl:()=>'',structuredClone,crypto:globalThis.crypto}
);
const licensed=readFileSync('benchmark/fixtures/commons-0003.jpg');
assert.deepEqual([...licensed.subarray(0,2)],[0xff,0xd8]);
function appendMetadata(segments){
 const metadata=[];
 for(let i=0;i<segments;i++){
  const bytes=48000;
  metadata.push(Buffer.from([255,239,(bytes+2)>>8,(bytes+2)&255]),Buffer.alloc(bytes,i%203));
 }
 return Buffer.concat([licensed.subarray(0,2),...metadata,licensed.subarray(2)]);
}
const photo=appendMetadata(56);
const originalJPEG='data:image/jpeg;base64,'+photo.toString('base64');
const sha=createHash('sha256').update(photo).digest('hex');
const smallPreview='data:image/jpeg;base64,'+Buffer.from([255,216,255,217]).toString('base64');
assert(originalJPEG.length>3_000_000&&originalJPEG.length<11_200_000);
let seq=0;
function item(owner,id='owner-original'){
 return {id,ownerId:owner,name:'Owner photo',category:'Tops',
  itemType:'T-shirt',color:'Blue',colorSource:'user',
  image:smallPreview,originalPhoto:{image:originalJPEG,sha256:sha,ownerId:owner},
  sourceSHA256:sha,sourceHashVerified:true};
}
function backup(owner){
 return {format:'closet-current',version:3,items:[item(owner)],looks:[],
  outfitBoard:{current:{name:'Selected',slots:{top:'owner-original'}},
   saved:[{name:'Saved outfit',slots:{top:'owner-original'}}]}};
}
async function openOwner(owner){
 const db=await new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+owner,1);
  req.onupgradeneeded=()=>{
   req.result.createObjectStore('items',{keyPath:'id'});
   req.result.createObjectStore('state',{keyPath:'id'});
  };
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
 return {owner,db,close:()=>db.close()};
}
async function newOwner(){return openOwner('p93-roundtrip-synthetic-'+(++seq));}
async function destroy(f){
 f.close();
 await new Promise((done,reject)=>{
  const req=indexedDB.deleteDatabase('closet-current-user-'+f.owner);
  req.onsuccess=done;req.onerror=()=>reject(req.error);
 });
}
async function seed(f){
 const row=item(f.owner);
 const board=backup(f.owner).outfitBoard;
 await new Promise((resolve,reject)=>{
  const tx=f.db.transaction(['items','state'],'readwrite');
  tx.objectStore('items').put(row);
  tx.objectStore('state').put({id:'outfit-board',...board});
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
}
async function snapshot(f){
 return new Promise((resolve,reject)=>{
  const tx=f.db.transaction(['items','state'],'readonly');
  const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();
  tx.oncomplete=()=>resolve({items:a.result,state:b.result});
  tx.onerror=()=>reject(tx.error);
 });
}
const args=(f,raw,assertLease=()=>{})=>({
 data:raw,ownerDB:f.db,ownerId:f.owner,assertLease,...exact
});
async function patchedModules(){
 const dir=await mkdtemp(join(tmpdir(),'p93-v3-pair-'));
 try{
  const sourceExport=readFileSync(exportPath,'utf8');
  const sourceImport=readFileSync(importPath,'utf8');
  const candidateExport=proposeP93SourceOnlyPatch(exportPath,sourceExport);
  const candidateImport=proposeP93SourceOnlyPatch(importPath,sourceImport);
  assert.notEqual(candidateExport.proposedSource,sourceExport);
  assert.notEqual(candidateImport.proposedSource,sourceImport);
  const expFile=join(dir,'export-proposed.mjs'),impFile=join(dir,'import-proposed.mjs');
  await writeFile(expFile,candidateExport.proposedSource);
  await writeFile(impFile,candidateImport.proposedSource);
  const exp=await import(pathToFileURL(expFile).href);
  const imp=await import(pathToFileURL(impFile).href);
  return {exp,imp,dir,patches:[candidateExport,candidateImport]};
 }catch(e){await rm(dir,{recursive:true,force:true});throw e;}
}
const p=await patchedModules();
test.after(async()=>{await rm(p.dir,{recursive:true,force:true});});
test('exact M97 exporter rejects large SHA-bound preserved original without modifying private DB',async()=>{
 const f=await newOwner();try{
  await seed(f);const before=await snapshot(f);
  await assert.rejects(originalExporter.exportDurableOwnerBackupM3({
   ownerDB:f.db,ownerId:f.owner,assertLease:()=>{},assertIdle:()=>{}
  }),/M3_EXPORT_INVALID_JPEG/);
  assert.deepEqual(await snapshot(f),before);
 }finally{await destroy(f);}
});
test('exact M97 importer refuses same large original even with separate tiny preview',async()=>{
 const f=await newOwner();try{
  const before=await snapshot(f);
  await assert.rejects(originalImporter.prepareDefaultAtomicM3(
   args(f,backup(f.owner))),/LEGACY_ATOMIC_INVALID_JPEG/);
  assert.deepEqual(await snapshot(f),before);
 }finally{await destroy(f);}
});
test('disposable two-module patch exports and imports same original JPEG, owned outfit and cloud CAS losslessly',async()=>{
 const f=await newOwner();let g;
 try{
  await seed(f);
  const sourceBefore=await snapshot(f);
  const output=await p.exp.exportDurableOwnerBackupM3({
   ownerDB:f.db,ownerId:f.owner,assertLease:()=>{},assertIdle:()=>{}
  });
  assert.equal(output.data.version,3);
  assert.equal(output.data.items[0].originalPhoto.image,originalJPEG);
  assert.equal(output.data.items[0].sourceSHA256,sha);
  assert.equal(output.data.outfitBoard.current.slots.top,'owner-original');
  assert.deepEqual(await snapshot(f),sourceBefore);
  const owner=f.owner;
  await destroy(f);
  g=await openOwner(owner);
  const before=await snapshot(g);
  const plan=await p.imp.prepareDefaultAtomicM3(args(g,JSON.parse(output.json)));
  assert.deepEqual(await snapshot(g),before,'Export/import preflight must not write');
  const completed=await p.imp.commitDefaultAtomicM3({
   ownerDB:g.db,ownerId:g.owner,assertLease:()=>{},prepared:plan,confirmed:true
  });
  assert.equal(completed.committed,true);
  const after=await snapshot(g);
  assert.equal(after.items.length,1);
  assert.equal(after.items[0].originalPhoto.image,originalJPEG);
  assert.equal(after.items[0].originalPhoto.sha256,sha);
  assert.equal(after.items[0].ownerId,g.owner);
  const state=Object.fromEntries(after.state.map(x=>[x.id,x]));
  assert.equal(state['outfit-board'].current.slots.top,'owner-original');
  assert.equal(state['outfit-board'].saved[0].slots.top,'owner-original');
  assert.equal(state['cloud-sync'].dirty,true);
  assert.equal(state['cloud-sync'].localRevision,1);
 }finally{if(g)await destroy(g);else try{await destroy(f);}catch{}}
});
test('disposable import refuses two IDs for one original SHA and preserves old wardrobe',async()=>{
 const f=await newOwner();try{
  await seed(f);
  const before=await snapshot(f),bad=backup(f.owner);
  bad.items=[{...bad.items[0],id:'alias-original'}];
  await assert.rejects(p.imp.prepareDefaultAtomicM3(args(f,bad)),
   /LEGACY_ATOMIC_DUPLICATE_ORIGINAL_REQUIRES_OWNER_REVIEW/);
  assert.deepEqual(await snapshot(f),before);
 }finally{await destroy(f);}
});
test('disposable adapter refuses malformed JPEG, altered source SHA, foreign owner and 8MiB+ originals with no writes',async()=>{
 const f=await newOwner();try{
  const before=await snapshot(f);
  const corruptHash=backup(f.owner);
  corruptHash.items[0].originalPhoto.sha256='f'.repeat(64);
  await assert.rejects(p.imp.prepareDefaultAtomicM3(args(f,corruptHash)),
   /LEGACY_ATOMIC_JPEG_SHA_MISMATCH/);
  const foreign=backup(f.owner);
  foreign.items[0].originalPhoto.ownerId='different-owner';
  await assert.rejects(p.imp.prepareDefaultAtomicM3(args(f,foreign)),/FOREIGN_OWNER/);
  const malformed=backup(f.owner);
  malformed.items[0].originalPhoto.image=originalJPEG.slice(0,-8)+'!!!===';
  await assert.rejects(p.imp.prepareDefaultAtomicM3(args(f,malformed)),/INVALID_JPEG/);
  const oversize=backup(f.owner);
  oversize.items[0].originalPhoto.image='data:image/jpeg;base64,'+appendMetadata(175).toString('base64');
  assert(oversize.items[0].originalPhoto.image.length<11_200_000);
  assert(appendMetadata(175).length>8*1024*1024);
  await assert.rejects(p.imp.prepareDefaultAtomicM3(args(f,oversize)),
   /LEGACY_ATOMIC_INVALID_JPEG_BYTES/);
  assert.deepEqual(await snapshot(f),before);
 }finally{await destroy(f);}
});
test('disposable adapter cannot restore under revoked owner lease or after failed commit',async()=>{
 const f=await newOwner();try{
  const before=await snapshot(f),raw=backup(f.owner);
  let active=true;
  const assertLease=()=>{if(!active)throw Error('revoked owner session');};
  const plan=await p.imp.prepareDefaultAtomicM3(args(f,raw,assertLease));
  active=false;
  await assert.rejects(p.imp.commitDefaultAtomicM3({
   ownerDB:f.db,ownerId:f.owner,assertLease,prepared:plan,confirmed:true
  }),/revoked owner session/);
  assert.deepEqual(await snapshot(f),before);
  active=true;
  const fresh=await p.imp.prepareDefaultAtomicM3(args(f,raw,assertLease));
  await assert.rejects(p.imp.commitDefaultAtomicM3({
   ownerDB:f.db,ownerId:f.owner,assertLease,prepared:fresh,confirmed:true,
   onStage:()=>{throw Error('injected quota rollback');}
  }),/injected quota rollback/);
  assert.deepEqual(await snapshot(f),before);
 }finally{await destroy(f);}
});
