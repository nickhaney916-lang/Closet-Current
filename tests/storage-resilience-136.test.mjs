import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import 'fake-indexeddb/auto';

const sha=value=>createHash('sha256').update(value).digest('hex');
function open(name){return new Promise((resolve,reject)=>{
 const request=indexedDB.open(name,1);
 request.onupgradeneeded=()=>{request.result.createObjectStore('items',{keyPath:'id'});request.result.createObjectStore('state',{keyPath:'id'});};
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
});}
function done(tx){return new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('transaction aborted'));});}
function row(owner,id,source,cutout){return {id,ownerId:owner,category:'Tops',itemType:'T-shirt',color:'Blue',userAdjusted:true,
 image:'data:image/jpeg;base64,'+cutout.toString('base64'),sourceSHA256:sha(source),
 originalPhoto:{image:'data:image/jpeg;base64,'+source.toString('base64'),sha256:sha(source)},
 cutoutSHA256:sha(cutout),segmentHint:{cutoutImage:'data:image/jpeg;base64,'+cutout.toString('base64'),cutoutSHA256:sha(cutout)}};}

test('STORAGE136 keeps the original JPEG bytes and independent cutout bytes across 25/100/250/500/1000 record atomic round trips',async()=>{
 const source=Buffer.from([0xff,0xd8,0x53,0x4f,0x55,0x52,0x43,0x45,0xff,0xd9]);
 const cutout=Buffer.from([0xff,0xd8,0x43,0x55,0x54,0x4f,0x55,0x54,0xff,0xd9]);
 const owner='synthetic-owner-136';
 for(const size of [25,100,250,500,1000]){
  const db=await open('storage136-roundtrip-'+size+'-'+crypto.randomUUID());
  const values=Array.from({length:size},(_,i)=>row(owner,'g-'+i,source,cutout));
  const board={id:'outfit-board',current:{slots:{top:'g-0',bottom:'g-'+(size-1)}},saved:[{id:'look-'+size,slots:{top:'g-0'}}]};
  let tx=db.transaction(['items','state'],'readwrite');
  for(const value of values)tx.objectStore('items').add(value);
  tx.objectStore('state').put(board);await done(tx);
  tx=db.transaction(['items','state'],'readonly');
  const rows=await new Promise((resolve,reject)=>{const r=tx.objectStore('items').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  const persistedBoard=await new Promise((resolve,reject)=>{const r=tx.objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  assert.equal(rows.length,size);
  assert.equal(persistedBoard.saved[0].id,'look-'+size);
  assert.deepEqual(Buffer.from(rows[0].originalPhoto.image.split(',')[1],'base64'),source);
  assert.deepEqual(Buffer.from(rows.at(-1).segmentHint.cutoutImage.split(',')[1],'base64'),cutout);
  assert.equal(rows[0].sourceSHA256,sha(source));assert.equal(rows[0].cutoutSHA256,sha(cutout));
  db.close();
 }
});

test('STORAGE136 aborted multi-record transaction commits neither partial garments nor outfit replacement',async()=>{
 const db=await open('storage136-abort-'+crypto.randomUUID()),owner='owner-abort';
 const prior=row(owner,'existing',Buffer.from('original'),Buffer.from('cutout'));
 let tx=db.transaction(['items','state'],'readwrite');tx.objectStore('items').add(prior);
 tx.objectStore('state').put({id:'outfit-board',saved:[{id:'keep-this-look',slots:{top:'existing'}}],current:{slots:{top:'existing'}}});await done(tx);
 tx=db.transaction(['items','state'],'readwrite');tx.objectStore('items').add(row(owner,'new-a',Buffer.from('original'),Buffer.from('cutout')));
 tx.objectStore('items').add(row(owner,'existing',Buffer.from('replacement'),Buffer.from('replacement-cutout')));
 tx.objectStore('state').put({id:'outfit-board',saved:[],current:{slots:{}}});
 const aborted=done(tx);try{tx.abort();}catch{} await assert.rejects(aborted);
 const read=db.transaction(['items','state'],'readonly');
 const all=await new Promise(resolve=>{const r=read.objectStore('items').getAll();r.onsuccess=()=>resolve(r.result);});
 const board=await new Promise(resolve=>{const r=read.objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result);});
 assert.deepEqual(all.map(x=>x.id),['existing']);assert.equal(board.saved[0].id,'keep-this-look');
 assert.equal(all[0].sourceSHA256,prior.sourceSHA256);db.close();
});

test('STORAGE136 owner databases stay isolated and bounded closet rendering keeps lazy image decoding',async()=>{
 const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
 assert.match(app,/const closetPageSize136=48/);assert.match(app,/visible\.slice\(0,closetRendered136\)/);
 assert.match(app,/observeWardrobeThumbnail/);assert.doesNotMatch(app,/im\.src=item\.image/);assert.match(app,/wardrobeIndex/);
 assert.match(app,/Your existing closet and saved outfits remain in place/);
 const a=await open('closet-current-user-owner-a-136'),b=await open('closet-current-user-owner-b-136');
 let tx=a.transaction('items','readwrite');tx.objectStore('items').add(row('owner-a','private-a',Buffer.from('a'),Buffer.from('cut-a')));await done(tx);
 tx=b.transaction('items','readwrite');tx.objectStore('items').add(row('owner-b','private-b',Buffer.from('b'),Buffer.from('cut-b')));await done(tx);
 const read=(db)=>new Promise(resolve=>{const r=db.transaction('items').objectStore('items').getAll();r.onsuccess=()=>resolve(r.result);});
 assert.deepEqual((await read(a)).map(x=>x.id),['private-a']);assert.deepEqual((await read(b)).map(x=>x.id),['private-b']);a.close();b.close();
});
