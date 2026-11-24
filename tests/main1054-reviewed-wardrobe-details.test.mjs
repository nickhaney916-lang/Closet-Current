import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {indexedDB} from 'fake-indexeddb';
import vm from 'node:vm';
import {buildOwnerWardrobeIndex,queryOwnerWardrobeIndex} from '../public/native-owner-wardrobe-index-167.mjs';
import {commitHumanReviewedPhoto119} from '../public/native-reviewed-private-save-167.mjs';
const details={sleeveLength:'Long sleeve',pattern:'Solid',fit:'Regular',seasons:['Winter'],brand:'Example',size:'M',material:'Cotton',occasion:'Casual',notes:'Owner note'};
const bytes=Buffer.from([255,216,255,217]),sha=createHash('sha256').update(bytes).digest('hex'),image='data:image/jpeg;base64,'+bytes.toString('base64');
let seq=0;
async function setup({pending=true}={}){
 const ownerId='synthetic-'+(++seq);
 const db=await new Promise((yes,no)=>{const r=indexedDB.open('closet-current-user-'+ownerId,1);r.onupgradeneeded=()=>{r.result.createObjectStore('items',{keyPath:'id'});r.result.createObjectStore('state',{keyPath:'id'});};r.onsuccess=()=>yes(r.result);r.onerror=()=>no(r.error);});
 const record={id:'one',ownerId,sourceSHA256:sha,sourceHashVerified:true,originalPhoto:{image,sha256:sha},image,category:'Uncategorized',itemType:'Unknown',seasons:[],...(pending?{localChoices:[{itemType:'T-shirt'}]}:{}),requiresOwnershipConfirmation:pending};
 await new Promise((yes,no)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put({id:'draft',batch:[record]});tx.oncomplete=yes;tx.onabort=no;});
 const review={confirmed:true,recordId:record.id,originalSHA256:sha,category:'Tops',itemType:'T-shirt',color:'Blue',name:'Owner shirt',singleGarmentConfirmed:true,wardrobeDetails:structuredClone(details)};
 const read=async()=>new Promise((yes,no)=>{const tx=db.transaction(['items','state'],'readonly');let items,draft;tx.objectStore('items').getAll().onsuccess=e=>items=e.target.result;tx.objectStore('state').get('draft').onsuccess=e=>draft=e.target.result;tx.oncomplete=()=>yes({items,draft});tx.onabort=no;});
 const save=()=>commitHumanReviewedPhoto119({db,ownerId,currentOwner:()=>ownerId,record,review,cryptoProvider:webcrypto});
 return {db,record,review,read,save};
}
test('reviewed metadata survives original-photo atomic save',async()=>{
 // The parent already admits this non-pending draft; the RED must be lost metadata.
 const f=await setup({pending:false});try{
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
 const f=await setup({pending:false});try{delete f.review.wardrobeDetails;assert.equal((await f.save()).saved,true);const {items,draft}=await f.read();assert.deepEqual(items[0].seasons,[]);assert.equal(items[0].image,image);assert.equal(draft.batch.length,0);}finally{f.db.close();}
});
test('editor submits bounded optional fields with the owner review',()=>{
 const source=readFileSync('public/app.js','utf8');const pos=source.indexOf('const review={\n    confirmed:true,recordId:item.id,originalSHA256:item.sourceSHA256,');assert.ok(pos>=0);const review=source.slice(pos,source.indexOf('   };',pos));assert.match(review,/wardrobeDetails:\{/);for(const key of Object.keys(details))assert.match(review,new RegExp(key+':'));assert.doesNotMatch(review.slice(review.indexOf('wardrobeDetails:'),review.indexOf('}}:{}')),/ownerId:|image:|sourceSHA256:/);
});

test('legacy unconfirmed draft stays blocked with its original intact',async()=>{
 const f=await setup();try{
 delete f.review.wardrobeDetails;await assert.rejects(f.save(),/reviewed source, owner or draft commit rejected/);
 const {items,draft}=await f.read();assert.equal(items.length,0);assert.deepEqual(draft.batch,[f.record]);
 }finally{f.db.close();}
});
test('explicit review admits pending garment and its durable details drive owned search and seasonal styling',async()=>{
 const f=await setup();try{
 assert.equal((await f.save()).saved,true);const {items,draft}=await f.read(),saved=items[0];
 assert.equal(draft.batch.length,0);assert.equal(saved.requiresOwnershipConfirmation,false);
 assert.equal(saved.localChoices,undefined);assert.deepEqual(saved.originalPhoto,f.record.originalPhoto);
 const index=buildOwnerWardrobeIndex(saved.ownerId,items);
 assert.equal(index.summary.ready,1);
 for(const filters of [{season:'Winter',sleeveLength:'Long sleeve'},{search:'example cotton'},{category:'Tops',itemType:'T-shirt',color:'blue'}]){
  assert.deepEqual(queryOwnerWardrobeIndex(index,saved.ownerId,filters).ids,[saved.id]);
 }
 assert.equal(queryOwnerWardrobeIndex(index,saved.ownerId,{season:'Summer'}).total,0);
 assert.equal(queryOwnerWardrobeIndex(index,saved.ownerId,{sleeveLength:'Short sleeve'}).total,0);
 assert.throws(()=>queryOwnerWardrobeIndex(index,'another-owner',{search:'example'}),/owner-mismatch/);
 const context=vm.createContext({URL,Date,structuredClone,encodeURIComponent});
 for(const file of ['taxonomy.js','outfit-matcher.js','trend-library.js','outfit-board-engine.js','closet-stylist-engine.js'])
  vm.runInContext(readFileSync('public/'+file,'utf8'),context,{filename:file});
 // The shirt is the actual committed row; companions are synthetic metadata,
 // not independently photographed or saved garments.
 const rows=[saved,{id:'pants',category:'Bottoms',itemType:'Jeans',color:'Black',seasons:['All seasons']},{id:'shoe',category:'Shoes',itemType:'Sneakers',color:'White',seasons:['All seasons']}];
 const winter=context.styleOwnedCollection(rows,{request:'Casual',audience:'All',season:'Winter'});
 const summer=context.styleOwnedCollection(rows,{request:'Casual',audience:'All',season:'Summer'});
 assert.ok(winter.some(look=>look.board.slots.top===saved.id&&look.missing.length===0));
 assert.ok(summer.length>0);assert.ok(summer.every(look=>!Object.values(look.board.slots).includes(saved.id)));
 assert.ok([...winter,...summer].every(look=>Object.values(look.board.slots).every(id=>rows.some(row=>row.id===id))));
 }finally{f.db.close();}
});
