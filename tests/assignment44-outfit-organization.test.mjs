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

for(const [garmentCount,outfitCount] of [[25,1],[100,10],[250,25],[500,50]]){
 test(`v5 organization round-trip: ${garmentCount} garments / ${outfitCount} outfits, history and rollback`,async t=>{
  const owner=await authenticate(),db=owner.ownerDB;
  t.after(()=>db.close());
  // Tiny synthetic distinct byte streams exercise the importer's byte/SHA
  // contract, not image decoding or recognition accuracy.
  const garments=Array.from({length:garmentCount},(_,i)=>{
   const source=Buffer.from([255,216,i>>8,i&255,17,255,217]);
   const picture='data:image/jpeg;base64,'+source.toString('base64');
   const hash=createHash('sha256').update(source).digest('hex');
   return {id:'garment-'+i,ownerId:owner.ownerId,name:'Piece '+i,
    category:'Tops',itemType:'T-shirt',image:picture,sourceSHA256:hash,
    originalPhoto:{image:picture,sha256:hash}};
  });
  const current={name:'Draft',slots:{top:garments[0].id}};
  const board=migrateOutfitOrganization({id:'outfit-board',current,
   saved:Array.from({length:outfitCount},(_,i)=>({name:'Twin',slots:{top:garments[i].id},savedAt:legacy.savedAt}))},owner.ownerId);
  board.organization={...board.organization,
   favoriteGarmentIds:garments.map(row=>row.id),favoriteOutfitIds:board.saved.map(row=>row.savedOutfitId),
   collections:[{id:randomUUID(),name:'All',garmentIds:garments.map(row=>row.id),outfitIds:board.saved.map(row=>row.savedOutfitId)}]};
  const history={id:'outfit-wear-history-v1',owner:owner.ownerId,events:[
   {id:'wear-1',name:'Earlier outfit',slots:{top:'historically-removed'},day:'2026-11-26',at:Date.parse('2026-11-26T12:00:00Z')}]};
  const unrelated={id:'assignment44-unrelated',value:'keep'};
  await new Promise((resolve,reject)=>{
   const tx=db.transaction(['items','state'],'readwrite');
   for(const row of garments)tx.objectStore('items').put(row);
   for(const row of [board,history,unrelated])tx.objectStore('state').put(row);
   tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
  });
  const {data}=await exportDurableOwnerBackupM3(owner);
  assert.equal(data.version,5);
  assert.equal(data.items.length,garmentCount);
  assert.deepEqual(data.outfitBoard.saved,board.saved);
  assert.deepEqual(data.outfitBoard.organization,board.organization);
  const reduced={...board,saved:[],organization:{...board.organization,
   favoriteOutfitIds:[],collections:[]}};
  await put(db,'state',reduced);
  const prepared=await prepareDefaultAtomicM3({...owner,data});
  await assert.rejects(commitDefaultAtomicM3({...owner,prepared,confirmed:true,onStage(){throw Error('capacity rollback');}}),/capacity rollback/);
  assert.deepEqual(await get(db,'state','outfit-board'),reduced);
  assert.deepEqual(await get(db,'state',history.id),history);
  assert.deepEqual(await get(db,'state',unrelated.id),unrelated);
  await commitDefaultAtomicM3({...owner,prepared,confirmed:true});
  assert.deepEqual(await get(db,'state','outfit-board'),board);
  assert.deepEqual(await get(db,'state',history.id),history);
  assert.deepEqual(await get(db,'state',unrelated.id),unrelated);
  const after=await exportDurableOwnerBackupM3(owner);
  assert.deepEqual(after.data.items.map(row=>[row.id,row.originalPhoto.image,row.sourceSHA256]),
   data.items.map(row=>[row.id,row.originalPhoto.image,row.sourceSHA256]));
  assert.deepEqual(after.data.outfitBoard,data.outfitBoard);
  // Downgrade with an ordinary legacy backup is explicitly refused.
  const legacyData={format:'closet-current',version:3,items:[],outfitBoard:{current,saved:[]}};
  await assert.rejects(prepareDefaultAtomicM3({...owner,data:legacyData}),/version 5/);
  assert.deepEqual(await get(db,'state','outfit-board'),board);
 });
}
