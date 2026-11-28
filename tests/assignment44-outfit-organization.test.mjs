import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {indexedDB} from 'fake-indexeddb';
import {migrateOutfitOrganization,validateOutfitOrganization} from '../public/outfit-organization.mjs';
import {prepareDefaultAtomicM3,commitDefaultAtomicM3} from '../public/native-default-atomic-import-m3.mjs';
import {exportDurableOwnerBackupM3} from '../public/native-default-verified-backup-export-m3.mjs';

const legacy={name:'Twin',slots:{top:'shirt'},savedAt:'2026-11-27T00:00:00Z'};
const cleanOutfitBoard=row=>({name:row.name,slots:row.slots??{}});
const authenticate=async(ownerId=randomUUID())=>{
 const ownerDB=await new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+ownerId,1);
  req.onupgradeneeded=()=>{
   req.result.createObjectStore('items',{keyPath:'id'});
   req.result.createObjectStore('state',{keyPath:'id'});
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
 return {ownerDB,ownerId,assertLease(){},normalizeClothing:row=>row,validLook:()=>true,cleanOutfitBoard};
};
const put=(db,store,value)=>new Promise((resolve,reject)=>{
 const tx=db.transaction(store,'readwrite');
 tx.objectStore(store).put(value);
 tx.oncomplete=resolve;
 tx.onabort=()=>reject(tx.error);
});
const get=(db,store,id)=>new Promise((resolve,reject)=>{
 const req=db.transaction(store).objectStore(store).get(id);
 req.onsuccess=()=>resolve(req.result);
 req.onerror=()=>reject(req.error);
});
const bytes=Buffer.from([255,216,7,38,19,255,217]);
const image='data:image/jpeg;base64,'+bytes.toString('base64');
const sha=createHash('sha256').update(bytes).digest('hex');

test('migration preserves every legacy row and is idempotent at all supported roster sizes',()=>{
 for(const size of [0,1,10,25,50]){
  const legacyBoard={id:'outfit-board',current:legacy,saved:Array.from({length:size},()=>({...legacy}))};
  const migration=migrateOutfitOrganization(legacyBoard,'owner');
  assert.equal(new Set(migration.saved.map(row=>row.savedOutfitId)).size,size);
  assert.deepEqual(migration.saved.map(({savedOutfitId,savedOutfitOwnerId,...row})=>row),legacyBoard.saved);
  assert.equal(migrateOutfitOrganization(migration,'owner'),migration);
  assert.equal(migration.current,legacy);
 }
});

test('local v5 restore preserves identities, owner references, metadata and original bytes through transaction abort and retry',async t=>{
 const owner=await authenticate(),foreign=await authenticate(),db=owner.ownerDB;
 t.after(()=>{db.close();foreign.ownerDB.close();});
 const board=migrateOutfitOrganization({id:'outfit-board',current:legacy,saved:[legacy,legacy]},owner.ownerId);
 const [a,b]=board.saved;
 board.organization={...board.organization,favoriteOutfitIds:[b.savedOutfitId],
  favoriteGarmentIds:['shirt'],collections:[{id:randomUUID(),name:'Travel',garmentIds:['shirt'],outfitIds:[a.savedOutfitId]}]};
 const garment={id:'shirt',ownerId:owner.ownerId,name:'Blue shirt',category:'Tops',itemType:'T-shirt',
  image,sourceSHA256:sha,originalPhoto:{image,sha256:sha}};
 await put(db,'items',garment);
 await put(db,'state',board);
 const {data}=await exportDurableOwnerBackupM3(owner);
 assert.equal(data.version,5);
 assert.deepEqual(data.outfitBoard.organization,board.organization);
 assert.equal(data.items[0].originalPhoto.image,image);
 await assert.rejects(prepareDefaultAtomicM3({...foreign,data}),/FOREIGN_OWNER/);
 await assert.rejects(prepareDefaultAtomicM3({...owner,data:{...data,version:99}}),/INVALID_BACKUP/);
 await assert.rejects(prepareDefaultAtomicM3({...owner,data:{...data,version:3}}),/Unsupported/);
 const invalid=structuredClone(data);
 invalid.outfitBoard.organization.favoriteOutfitIds=[randomUUID()];
 await assert.rejects(prepareDefaultAtomicM3({...owner,data:invalid}),/Invalid saved outfit/);
 assert.throws(()=>validateOutfitOrganization(board,new Set(),owner.ownerId),/Invalid saved outfit/);
 const remaining={...board,saved:[a],organization:{...board.organization,favoriteOutfitIds:[]}};
 await put(db,'state',remaining);
 const prepared=await prepareDefaultAtomicM3({...owner,data});
 await assert.rejects(commitDefaultAtomicM3({...owner,prepared}),/CONFIRMATION/);
 await assert.rejects(commitDefaultAtomicM3({...owner,prepared,confirmed:true,onStage(){throw Error('simulated write failure');}}),/simulated/);
 assert.deepEqual(await get(db,'state','outfit-board'),remaining);
 await commitDefaultAtomicM3({...owner,prepared,confirmed:true});
 assert.deepEqual((await get(db,'state','outfit-board')).saved,board.saved);
 assert.deepEqual((await get(db,'state','outfit-board')).organization,board.organization);
 assert.equal((await get(db,'items','shirt')).originalPhoto.image,image);
 assert.equal(await get(foreign.ownerDB,'state','outfit-board'),undefined);
});
