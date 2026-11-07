import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import 'fake-indexeddb/auto';
import '../public/wardrobe-index.js';
const sha=value=>createHash('sha256').update(value).digest('hex');
const jpeg=Buffer.from([0xff,0xd8,1,2,3,0xff,0xd9]);
function garment(id='g-1') {const image='data:image/jpeg;base64,'+jpeg.toString('base64'),originalSHA=sha(jpeg),cutout=Buffer.from([0xff,0xd8,4,5,6,0xff,0xd9]);return {id,ownerId:'synthetic-owner',image,sourceSHA256:originalSHA,originalPhoto:{image,sha256:originalSHA},recognitionPhoto:{image,sha256:originalSHA},segmentHint:{cutoutImage:'data:image/jpeg;base64,'+cutout.toString('base64'),originalSHA256:originalSHA,cutoutSHA256:sha(cutout)},cutoutSHA256:sha(cutout),category:'Tops',itemType:'T-shirt',color:'Blue',userAdjusted:true,ownerReviewed:true};}
function open(name,version=1){return new Promise((resolve,reject)=>{const r=indexedDB.open(name,version);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('items'))db.createObjectStore('items',{keyPath:'id'});if(!db.objectStoreNames.contains('state'))db.createObjectStore('state',{keyPath:'id'});if(version>=3){if(!db.objectStoreNames.contains('wardrobeIndex')){const i=db.createObjectStore('wardrobeIndex',{keyPath:'id'});i.createIndex('category','category');i.createIndex('itemType','itemType');i.createIndex('savedAt','savedAt');}if(!db.objectStoreNames.contains('wardrobeThumbs'))db.createObjectStore('wardrobeThumbs',{keyPath:'key'});}};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
const done=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('transaction aborted'));});
const read=(db,store,key)=>new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});

test('metadata index strips every photo payload while preserving review and source identity',()=>{
 const original=garment(),row=globalThis.ClosetWardrobeIndex.metadata(original);
 assert.equal(row.image,undefined);assert.equal(row.originalPhoto.image,undefined);assert.equal(row.recognitionPhoto.image,undefined);assert.equal(row.segmentHint.cutoutImage,undefined);
 assert.equal(row.sourceSHA256,original.sourceSHA256);assert.equal(row.cutoutSHA256,original.cutoutSHA256);assert.equal(row.segmentHint.cutoutSHA256,original.cutoutSHA256);assert.equal(row.ownerReviewed,true);assert.equal(row.color,'Blue');
 assert.ok(JSON.stringify(row).length<JSON.stringify(original).length);assert.doesNotMatch(JSON.stringify(row),/data:image\/jpeg;base64/);
});

test('metadata-only boot reads small indexed rows; originals and cutouts stay byte-identical',async()=>{
 const db=await open('lazy-hydration-'+crypto.randomUUID(),3),original=garment();let tx=db.transaction(['items','wardrobeIndex'],'readwrite');tx.objectStore('items').put(original);tx.objectStore('wardrobeIndex').put(globalThis.ClosetWardrobeIndex.metadata(original));await done(tx);
 const metadata=await new Promise((resolve,reject)=>{const r=db.transaction('wardrobeIndex').objectStore('wardrobeIndex').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 assert.equal(metadata.length,1);assert.equal(metadata[0].image,undefined);
 const stored=await read(db,'items','g-1');assert.deepEqual(Buffer.from(stored.originalPhoto.image.split(',')[1],'base64'),jpeg);assert.deepEqual(Buffer.from(stored.segmentHint.cutoutImage.split(',')[1],'base64'),Buffer.from(original.segmentHint.cutoutImage.split(',')[1],'base64'));
 assert.equal(stored.sourceSHA256,sha(Buffer.from(stored.originalPhoto.image.split(',')[1],'base64')));db.close();
});

test('item, metadata, thumbnail and outfit writes abort together',async()=>{
 const db=await open('lazy-abort-'+crypto.randomUUID(),3),kept=garment('kept');let tx=db.transaction(['items','wardrobeIndex','state'],'readwrite');tx.objectStore('items').put(kept);tx.objectStore('wardrobeIndex').put(globalThis.ClosetWardrobeIndex.metadata(kept));tx.objectStore('state').put({id:'outfit-board',saved:[{id:'look-1',slots:{top:'kept'}}]});await done(tx);
 tx=db.transaction(['items','wardrobeIndex','wardrobeThumbs','state'],'readwrite');tx.objectStore('items').put(garment('new-partial'));tx.objectStore('wardrobeIndex').put(globalThis.ClosetWardrobeIndex.metadata(garment('new-partial')));tx.objectStore('state').put({id:'outfit-board',saved:[]});const rejected=done(tx);tx.abort();await assert.rejects(rejected);
 assert.equal(await read(db,'items','new-partial'),undefined);assert.equal((await read(db,'state','outfit-board')).saved[0].id,'look-1');db.close();
});

test('normal wardrobe and cloud snapshot paths never hydrate all photo-bearing item rows',async()=>{
 const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8'),cloud=await readFile(new URL('../public/cloud-backup.js',import.meta.url),'utf8');
 assert.match(app,/function readAll\(\).*wardrobeIndex/s);assert.match(app,/function readFullItem\(id,database=db\)/);assert.match(app,/IntersectionObserver/);assert.match(app,/thumbnailActive<2/);assert.match(app,/generation!==photoOwnerGeneration/);
 assert.equal((app.match(/\.objectStore\('items'\)\.getAll\(/g)||[]).length,0,'app cannot hydrate the complete photo-bearing wardrobe');
 assert.match(cloud,/objectStore\('wardrobeIndex'\)\.getAll\(\)/);assert.match(cloud,/async function encodeSnapshot/);assert.match(cloud,/async function uploadSources/);
 assert.doesNotMatch(cloud,/objectStore\('items'\)\.getAll\(\)/);
});


test('two synthetic owner databases keep photo and saved-outfit records isolated',async()=>{
 const owners=['synthetic-p144-owner-a','synthetic-p144-owner-b'],databases=[];
 try{for(const owner of owners){const db=await open('closet-current-user-'+owner,3);databases.push(db);const id='same-garment-id',value=garment(id);value.ownerId=owner;value.image='data:image/jpeg;base64,'+Buffer.from([0xff,0xd8,owner.endsWith('a')?31:62,0xff,0xd9]).toString('base64');value.originalPhoto.image=value.image;value.originalPhoto.sha256=sha(Buffer.from(value.image.split(',')[1],'base64'));value.sourceSHA256=value.originalPhoto.sha256;const tx=db.transaction(['items','wardrobeIndex','wardrobeThumbs','state'],'readwrite');tx.objectStore('items').put(value);tx.objectStore('wardrobeIndex').put(globalThis.ClosetWardrobeIndex.metadata(value));tx.objectStore('wardrobeThumbs').put({key:id,owner,sourceSHA256:value.sourceSHA256,blob:new Blob([owner])});tx.objectStore('state').put({id:'outfit-board',saved:[{id:'look-'+owner,slots:{top:id}}]});await done(tx);}
  const a=await read(databases[0],'items','same-garment-id'),b=await read(databases[1],'items','same-garment-id');assert.notEqual(a.sourceSHA256,b.sourceSHA256);assert.notEqual(a.originalPhoto.image,b.originalPhoto.image);assert.equal((await read(databases[0],'wardrobeThumbs','same-garment-id')).owner,owners[0]);assert.equal((await read(databases[1],'wardrobeThumbs','same-garment-id')).owner,owners[1]);assert.equal((await read(databases[0],'state','outfit-board')).saved[0].id,'look-'+owners[0]);assert.equal((await read(databases[1],'state','outfit-board')).saved[0].id,'look-'+owners[1]);
 }finally{for(const db of databases)db.close();}
});
