import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {indexedDB} from 'fake-indexeddb';
import {commitHumanReviewedPhoto119} from '../public/native-reviewed-private-save-167.mjs';
const details={sleeveLength:'Long sleeve',pattern:'Solid',fit:'Regular',seasons:['Winter'],brand:'Example',size:'M',material:'Cotton',occasion:'Casual',notes:'Owner note'};
const bytes=Buffer.from([255,216,255,217]),sha=createHash('sha256').update(bytes).digest('hex'),image='data:image/jpeg;base64,'+bytes.toString('base64');
let seq=0;
async function setup(){
 const ownerId='synthetic-'+(++seq);
 const db=await new Promise((yes,no)=>{const r=indexedDB.open('closet-current-user-'+ownerId,1);r.onupgradeneeded=()=>{r.result.createObjectStore('items',{keyPath:'id'});r.result.createObjectStore('state',{keyPath:'id'});};r.onsuccess=()=>yes(r.result);r.onerror=()=>no(r.error);});
 const record={id:'one',ownerId,sourceSHA256:sha,sourceHashVerified:true,originalPhoto:{image,sha256:sha},image,category:'Uncategorized',itemType:'Unknown',seasons:[],localChoices:[{itemType:'T-shirt'}],requiresOwnershipConfirmation:true};
 await new Promise((yes,no)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put({id:'draft',batch:[record]});tx.oncomplete=yes;tx.onabort=no;});
 const review={confirmed:true,recordId:record.id,originalSHA256:sha,category:'Tops',itemType:'T-shirt',color:'Blue',name:'Owner shirt',singleGarmentConfirmed:true,wardrobeDetails:structuredClone(details)};
 const read=async()=>new Promise((yes,no)=>{const tx=db.transaction(['items','state'],'readonly');let items,draft;tx.objectStore('items').getAll().onsuccess=e=>items=e.target.result;tx.objectStore('state').get('draft').onsuccess=e=>draft=e.target.result;tx.oncomplete=()=>yes({items,draft});tx.onabort=no;});
 const save=()=>commitHumanReviewedPhoto119({db,ownerId,currentOwner:()=>ownerId,record,review,cryptoProvider:webcrypto});
 return {db,record,review,read,save};
}
test('reviewed metadata survives original-photo atomic save',async()=>{
 const f=await setup();try{
 const result=await f.save();assert.equal(result.saved,true);
 const {items,draft}=await f.read();assert.equal(items.length,1);assert.equal(draft.batch.length,0);
 const saved=items[0];for(const [key,value] of Object.entries(details))assert.deepEqual(saved[key],value,key);
 assert.deepEqual(saved.originalPhoto,f.record.originalPhoto);assert.equal(saved.image,image);assert.equal(saved.sourceSHA256,sha);assert.equal(saved.ownerId,f.record.ownerId);assert.equal(saved.color,'Blue');assert.equal(saved.localChoices,undefined);assert.equal(saved.requiresOwnershipConfirmation,false);
 }finally{f.db.close();}
});
for(const [name,mutate] of [
 ['foreign owner',d=>d.ownerId='other'],['source bytes',d=>d.image='other'],['bad enum',d=>d.pattern='bad'],['invalid season',d=>d.seasons=['Rainy']],['duplicate seasons',d=>d.seasons=['Winter','Winter']],['mixed all seasons',d=>d.seasons=['All seasons','Winter']],['long notes',d=>d.notes='x'.repeat(501)],['missing size',d=>delete d.size],['nonstring',d=>d.brand=17]
])test('invalid metadata refuses entire save: '+name,async()=>{
 const f=await setup();try{mutate(f.review.wardrobeDetails);const result=await f.save();assert.equal(result.saved,false);const {items,draft}=await f.read();assert.equal(items.length,0);assert.deepEqual(draft.batch,[f.record]);}finally{f.db.close();}
});
test('legacy callers retain original source and metadata',async()=>{
 const f=await setup();try{delete f.review.wardrobeDetails;assert.equal((await f.save()).saved,true);const {items,draft}=await f.read();assert.deepEqual(items[0].seasons,[]);assert.equal(items[0].image,image);assert.equal(draft.batch.length,0);}finally{f.db.close();}
});
test('editor submits bounded optional fields with the owner review',()=>{
 const source=readFileSync('public/app.js','utf8');const pos=source.indexOf('const review={\n    confirmed:true,recordId:item.id,originalSHA256:item.sourceSHA256,');assert.ok(pos>=0);const review=source.slice(pos,source.indexOf('   };',pos));assert.match(review,/wardrobeDetails:\{/);for(const key of Object.keys(details))assert.match(review,new RegExp(key+':'));assert.doesNotMatch(review.slice(review.indexOf('wardrobeDetails:'),review.indexOf('}}:{}')),/ownerId:|image:|sourceSHA256:/);
});
