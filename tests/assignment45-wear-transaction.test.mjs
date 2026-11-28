import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {createHash} from 'node:crypto';
import {migrateOutfitOrganization} from '../public/outfit-organization.mjs';
import {exportDurableOwnerBackupM3} from '../public/native-default-verified-backup-export-m3.mjs';
import {prepareDefaultAtomicM3,commitDefaultAtomicM3} from '../public/native-default-atomic-import-m3.mjs';
import {exportOwnerWearSection,prepareOwnerWearRestore,commitOwnerWearRestore} from '../public/outfit-wear-portability-transaction.mjs';

const key='outfit-wear-history-v1',ownerId='synthetic-a45';
const event=i=>({id:'event-'+i,name:'Recorded',day:'2026-11-27',at:1795737600000-i,slots:{top:'historical-'+i}});
const row=(events,owner=ownerId)=>({id:key,owner,events});
async function profile(t,id=ownerId){
 const ownerDB=await new Promise((resolve,reject)=>{
  const req=new IDBFactory().open('closet-current-user-'+id,1);
  req.onupgradeneeded=()=>{req.result.createObjectStore('items',{keyPath:'id'});req.result.createObjectStore('state',{keyPath:'id'});};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
 t.after(()=>ownerDB.close());
 return {ownerDB,ownerId:id,assertLease(){},normalizeClothing:row=>row,validLook:()=>true,cleanOutfitBoard:row=>({name:row.name,slots:row.slots??{}})};
}
const put=(db,store,value)=>new Promise((resolve,reject)=>{
 const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value);
 tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
});
const get=(db,store,id)=>new Promise((resolve,reject)=>{
 const req=db.transaction(store).objectStore(store).get(id);
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});

test('actual v5 omits separate history; independent section restores it in a fresh same-owner database',async t=>{
 const source=await profile(t),dest=await profile(t),foreign=await profile(t,'synthetic-b45');
 const bytes=Buffer.from([255,216,7,38,19,255,217]),image='data:image/jpeg;base64,'+bytes.toString('base64');
 const sha=createHash('sha256').update(bytes).digest('hex');
 const garment={id:'shirt',ownerId,name:'Shirt',category:'Tops',itemType:'T-shirt',image,sourceSHA256:sha,originalPhoto:{image,sha256:sha}};
 const current={name:'Saved',slots:{top:'shirt'}};
 const board=migrateOutfitOrganization({id:'outfit-board',current,saved:[current]},ownerId);
 const history=row([event(0),event(1)]);
 await put(source.ownerDB,'items',garment);
 await put(source.ownerDB,'state',board);
 await put(source.ownerDB,'state',history);
 const {data}=await exportDurableOwnerBackupM3(source);
 assert.equal(data.version,5);
 const prepared=await prepareDefaultAtomicM3({...dest,data});
 await commitDefaultAtomicM3({...dest,prepared,confirmed:true});
 assert.equal(await get(dest.ownerDB,'state',key),undefined,'baseline: v5 does not transfer separate history');
 const section=await exportOwnerWearSection(source);
 await assert.rejects(prepareOwnerWearRestore({...foreign,section}),/foreign/);
 const historyPlan=await prepareOwnerWearRestore({...dest,section});
 await commitOwnerWearRestore({...dest,prepared:historyPlan,confirmed:true});
 assert.deepEqual(await get(dest.ownerDB,'state',key),history);
 assert.deepEqual((await get(dest.ownerDB,'state','outfit-board')).saved,board.saved);
 assert.deepEqual((await get(dest.ownerDB,'state','outfit-board')).organization,board.organization);
 assert.equal((await get(dest.ownerDB,'items','shirt')).originalPhoto.image,image);
 assert.equal(await get(foreign.ownerDB,'state',key),undefined);
});

test('history-only transaction refuses cancellation, conflicts, stale leases and rollback; preserves unrelated state',async t=>{
 const dest=await profile(t),db=dest.ownerDB;
 const existing=row([event(1)]),unrelated={id:'unrelated',value:'keep'};
 await put(db,'state',existing);await put(db,'state',unrelated);
 const section={version:1,owner:ownerId,events:[event(0)]};
 let prepared=await prepareOwnerWearRestore({...dest,section});
 await assert.rejects(commitOwnerWearRestore({...dest,prepared}),/confirmation/);
 await assert.rejects(commitOwnerWearRestore({...dest,prepared,confirmed:true,onStage(){throw Error('injected failure');}}),/injected/);
 assert.deepEqual(await get(db,'state',key),existing);
 const newer=row([event(1),event(2)]);
 await put(db,'state',newer);
 await assert.rejects(commitOwnerWearRestore({...dest,prepared,confirmed:true}),/changed/);
 assert.deepEqual(await get(db,'state',key),newer);
 prepared=await prepareOwnerWearRestore({...dest,section});
 let active=true;
 await assert.rejects(commitOwnerWearRestore({...dest,prepared,confirmed:true,assertLease(){if(!active)throw Error('stale owner');},onStage(){active=false;}}),/stale owner/);
 assert.deepEqual(await get(db,'state',key),newer);
 await commitOwnerWearRestore({...dest,prepared,confirmed:true});
 const expected=row([event(0),event(1),event(2)]);
 assert.deepEqual(await get(db,'state',key),expected);
 prepared=await prepareOwnerWearRestore({...dest,section});
 await commitOwnerWearRestore({...dest,prepared,confirmed:true});
 assert.deepEqual(await get(db,'state',key),expected);
 assert.deepEqual(await get(db,'state',unrelated.id),unrelated);
});
