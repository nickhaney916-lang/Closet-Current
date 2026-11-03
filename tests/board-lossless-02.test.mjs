import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
import 'fake-indexeddb/auto';
import {createRequire} from 'node:module';
import {BOARD02,createLosslessBoard02,inspectOutfit02,verifyPhoto02,validateBoard02,boardFingerprint02} from '../research/board-lossless-02/lossless-board.mjs';
import {createExistingBoard02IO} from '../research/board-lossless-02/existing-idb-cas.mjs';
globalThis.crypto ||= webcrypto;
globalThis.atob ||= s=>Buffer.from(s,'base64').toString('binary');
const require=createRequire(import.meta.url);
const original=await readFile('benchmark/fixtures/commons-0003.jpg');
const originalSHA=createHash('sha256').update(original).digest('hex');
assert.equal(originalSHA,'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64');
const jpeg='data:image/jpeg;base64,'+original.toString('base64');
const native=await readFile('public/outfit-board-engine.js','utf8');
const nativeClean=vm.runInNewContext(native+'; cleanOutfitBoard;');
const cleanInput=()=>({
 id:'outfit-board',current:{name:'Native untouched work in progress',slots:{},futureCurrent:{keep:'source'}},
 saved:[
  {id:'outfit-legacy-1',outfit3dId:'outfit3d-dress-1',ownerId:'A',name:'Black dress plus jacket, coat and shoes',
   slots:{top:'dress',layer2:'jacket',layer3:'coat',shoes:'shoes'},
   layerCount:3,occasion:'Dinner',season:'Fall',ideas:{finish:{type:'Scarf',color:'tan'}},
   slotSources:{top:{sha256:originalSHA,categoryAtSave:'Dresses'},
    layer2:{categoryAtSave:'Outerwear'},layer3:{categoryAtSave:'Outerwear'}},
   correctionHistory:[{itemId:'dress',before:'Tops',after:'Dresses'}],
   future:{unknownFeature:{array:[{hello:'keep'}]}}},
  {id:'outfit-missing-2',outfit3dId:'outfit3d-missing-2',ownerId:'A',name:'Missing jeans recovery',
   slots:{top:'shirt',bottom:'deleted-jeans',shoes:'shoes'},
   slotSources:{bottom:{sha256:originalSHA,categoryAtSave:'Bottoms'}},
   metadata:'keep this source ID'},
  {name:'Old native without outfit ID',slots:{top:'shirt',bottom:'jeans',shoes:'shoes'},extra:'legacy survives'}
 ],futureStateMetadata:{doNotStrip:true}});
const goodItems=()=>[
 {id:'dress',ownerId:'A',category:'Dresses',itemType:'Casual dress',name:'Dress',image:jpeg,originalPhoto:{image:jpeg,sha256:originalSHA}},
 {id:'shirt',ownerId:'A',category:'Tops',itemType:'T-shirt',name:'Shirt',image:jpeg,originalPhoto:{image:jpeg,sha256:originalSHA}},
 {id:'jeans',ownerId:'A',category:'Bottoms',itemType:'Jeans',name:'Jeans',image:jpeg,originalPhoto:{image:jpeg,sha256:originalSHA}},
 {id:'jacket',ownerId:'A',category:'Outerwear',itemType:'Jacket',name:'Jacket',image:jpeg},
 {id:'coat',ownerId:'A',category:'Outerwear',itemType:'Coat',name:'Coat',image:jpeg},
 {id:'shoes',ownerId:'A',category:'Shoes',itemType:'Sneakers',name:'Shoes',image:jpeg},
 {id:'newshoes',ownerId:'A',category:'Shoes',itemType:'Sneakers',name:'Second pair',image:jpeg}
];
const clone=x=>structuredClone(x);
const makeAuth=()=>({ready:Promise.resolve(),user:{id:'A'},gen:1,getSessionGeneration(){return this.gen;}});
async function openDB(owner){
 return new Promise((resolve,reject)=>{const req=indexedDB.open('closet-current-user-'+owner,2);
 req.onupgradeneeded=()=>{req.result.createObjectStore('items',{keyPath:'id'});req.result.createObjectStore('state',{keyPath:'id'});};
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
}
async function putRows(db,items=goodItems(),state=cleanInput(),marker=null){
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  for(const item of items)tx.objectStore('items').put(item);
  tx.objectStore('state').put(state);
  if(marker)tx.objectStore('state').put(marker);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
async function patch(db,store,key,row){
 await new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');
 tx.objectStore(store).put({...row,id:key});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
}
let serial=0;
async function fixture({state=cleanInput(),items=goodItems(),marker=null}={}){
 const id='test-board02-'+(++serial),auth=makeAuth();auth.user.id=id;
 // Existing records represent the real owner, not a foreign user.
 state=clone(state);for(const x of state.saved)x.ownerId=id;
 items=items.map(x=>({...x,ownerId:id}));
 const db=await openDB(id);await putRows(db,items,state,marker);
 const io=createExistingBoard02IO(auth);
 const editor=createLosslessBoard02({auth,io,makeId:()=>String(serial)+'-new'});
 const read=async()=>io.read({authenticated:true,ownerId:id,generation:auth.gen});
 return {id,auth,db,io,editor,read,originalState:clone(state),items};
}
test('native original loss proven on actual public cleaner, untouched input retained',()=>{
 const state=cleanInput(),wardrobe=goodItems(),snapshot=JSON.stringify(state);
 const actual=nativeClean(state.saved[0],wardrobe);
 assert.equal(actual.slots.layer2,undefined);
 assert.equal(actual.slots.layer3,undefined);
 assert.equal(actual.outfit3dId,undefined);
 assert.deepEqual(Object.keys(actual.slots).sort(),['shoes','top']);
 const missing=nativeClean(state.saved[1],wardrobe);
 assert.equal(missing.slots.bottom,undefined);
 assert.equal(JSON.stringify(state),snapshot,'Reproducing defect cannot itself modify source');
});
test('lossless existing-board read and open do not write, or strip metadata and dress coat',async()=>{
 const f=await fixture();const before=(await f.read()).board;
 const result=await f.editor.refresh();assert.equal(result.savedCount,3);
 assert.equal(f.editor.list().length,3);
 const view=f.editor.open('outfit-legacy-1');
 assert.equal(view.dress,true);assert.equal(view.outerwear.length,2);
 assert.equal(view.missing.length,0);assert.equal(view.review.length,0);
 assert.equal(view.slots.layer2,'jacket');assert.equal(view.slots.layer3,'coat');
 assert.equal(JSON.stringify((await f.read()).board),JSON.stringify(before));
 assert.deepEqual(f.editor.originalSnapshot(),before);
 f.db.close();
});
test('missing garment retains original ID and exact slot; backup reconnects only that ID',async()=>{
 const f=await fixture();await f.editor.refresh();
 let v=f.editor.open('outfit-missing-2');
 assert.equal(v.missing[0].itemId,'deleted-jeans');assert.equal(v.missing[0].slot,'bottom');
 assert.equal(v.slots.top,'shirt');assert.equal(v.slots.shoes,'shoes');
 assert.equal((await f.read()).board.saved[1].slots.bottom,'deleted-jeans');
 await patch(f.db,'items','deleted-jeans',{ownerId:f.id,category:'Bottoms',itemType:'Jeans',name:'Restored backed-up jeans',image:jpeg,originalPhoto:{image:jpeg,sha256:originalSHA}});
 await f.editor.refresh();v=f.editor.open('outfit-missing-2');
 assert.equal(v.missing.length,0);assert.equal(v.review.length,0);
 assert.equal(v.slots.bottom,'deleted-jeans','Same restored ID reconnects, never substitute');
 assert.equal((await verifyPhoto02((await f.read()).items.find(x=>x.id==='deleted-jeans'))).verified,true);
 f.db.close();
});
test('restored same ID but changed original JPEG SHA remains REVIEW, never auto-reconnected as valid',async()=>{
 const f=await fixture();await f.editor.refresh();f.editor.open('outfit-missing-2');
 await patch(f.db,'items','deleted-jeans',{ownerId:f.id,category:'Bottoms',itemType:'Jeans',
  name:'Different-photo restored ID',image:jpeg,originalPhoto:{image:jpeg,sha256:'0'.repeat(64)}});
 await f.editor.refresh();const v=f.editor.open('outfit-missing-2');
 assert.equal(v.slots.bottom,'deleted-jeans');
 assert.ok(v.review.some(x=>x.itemId==='deleted-jeans'&&/SHA/.test(x.reason)));
 assert.equal((await f.read()).board.saved[1].slots.bottom,'deleted-jeans');
 f.db.close();
});
test('recategorizing preserved jacket or shoes triggers REVIEW without rewriting stored refs',async()=>{
 const f=await fixture();const altered=f.items.map(x=>x.id==='jacket'?{...x,category:'Shoes'}:x);
 await putRows(f.db,altered,f.originalState);
 await f.editor.refresh();const v=f.editor.open('outfit-legacy-1');
 assert.equal(v.review[0].itemId,'jacket');assert.equal(v.slots.layer2,'jacket');
 assert.equal((await f.read()).board.saved[0].slots.layer2,'jacket');
 f.db.close();
});
test('slot replacement picker lists only compatible, unselected owned garments',async()=>{
 const f=await fixture();await f.editor.refresh();f.editor.open('outfit-legacy-1');
 const available=f.editor.compatibleChoices('shoes');
 assert.deepEqual(available.map(x=>x.id).sort(),['newshoes','shoes']);
 assert.ok(available.every(x=>x.category==='Shoes'&&x.ownerId===f.id));
 assert.ok(!available.some(x=>x.id==='jacket'||x.id==='dress'));
 assert.deepEqual(f.editor.compatibleChoices('layer3').map(x=>x.id),['coat']);
 assert.throws(()=>f.editor.compatibleChoices('unknown-slot'),/unsupported/);
 assert.equal((await f.read()).board.saved[0].slots.layer3,'coat');
 f.db.close();
});
test('pin, swap shoes, name edit and save-existing are atomic and preserve all unaffected references',async()=>{
 const f=await fixture(),pre=await f.read();await f.editor.refresh();f.editor.open('outfit-legacy-1');
 f.editor.pin('shoes');assert.throws(()=>f.editor.swapShoes('newshoes'),/pinned/);
 f.editor.pin('shoes',false);f.editor.swapShoes('newshoes');f.editor.editName('Fall dinner updated');
 const out=await f.editor.save();assert.equal(out.id,'outfit-legacy-1');
 const after=await f.read();assert.equal(after.board.saved[0].slots.shoes,'newshoes');
 assert.equal(after.board.saved[0].slots.top,'dress');assert.equal(after.board.saved[0].slots.layer2,'jacket');
 assert.equal(after.board.saved[0].slots.layer3,'coat');
 assert.equal(after.board.saved[0].outfit3dId,'outfit3d-dress-1');
 assert.deepEqual(after.board.saved[0].future,pre.board.saved[0].future);
 assert.deepEqual(after.board.saved[1],pre.board.saved[1]);
 assert.deepEqual(after.board.current,pre.board.current);
 assert.equal(after.cloud.dirty,true);assert.equal(after.cloud.localRevision,1);
 await f.editor.refresh();assert.equal(f.editor.open('outfit-legacy-1').slots.shoes,'newshoes');
 f.db.close();
});
test('save-as-new preserves original saved and current, makes durable cloud-mergeable ID',async()=>{
 const f=await fixture();await f.editor.refresh();f.editor.open('outfit-legacy-1');
 f.editor.editName('New name');const result=await f.editor.save({asNew:true});
 const b=(await f.read()).board;assert.equal(b.saved.length,4);
 assert.equal(b.saved[0].name,'Black dress plus jacket, coat and shoes');
 assert.equal(b.saved[3].name,'New name');
 assert.equal(b.saved[3].id,result.id);assert.equal(b.saved[3].outfit3dId,result.id);
 assert.equal(b.saved[3].ownerId,f.id);assert.equal(b.saved[3].slots.layer3,'coat');
 f.db.close();
});
test('cancel edits and opening saved never persist; all unknown legacy metadata intact',async()=>{
 const f=await fixture();await f.editor.refresh();const before=JSON.stringify((await f.read()).board);
 f.editor.open('legacy-index:2');f.editor.editName('Cancelled rename');f.editor.swapShoes('newshoes');
 assert.equal(f.editor.cancel().storedUnchanged,true);
 assert.equal(JSON.stringify((await f.read()).board),before);
 f.editor.open('legacy-index:2');f.editor.editName('Deliberate legacy edit');
 const out=await f.editor.save();assert.ok(out.id.startsWith('outfit3d-'));
 const b=(await f.read()).board;
 assert.equal(b.saved[2].extra,'legacy survives');assert.equal(b.saved[2].id,b.saved[2].outfit3dId);
 assert.equal(b.saved[0].future.unknownFeature.array[0].hello,'keep');
 f.db.close();
});
test('two tabs cannot overwrite each other, retry requires explicit refresh',async()=>{
 const f=await fixture();const second=createLosslessBoard02({auth:f.auth,io:f.io,makeId:()=>String(serial)+'-competing'});
 await Promise.all([f.editor.refresh(),second.refresh()]);
 f.editor.open('outfit-legacy-1');second.open('outfit-legacy-1');
 f.editor.editName('Tab one');second.editName('Tab two');
 await f.editor.save();await assert.rejects(second.save(),/CONFLICT/);
 assert.equal((await f.read()).board.saved[0].name,'Tab one');
 await second.refresh();second.open('outfit-legacy-1');assert.equal(second.inspect().name,'Tab one');
 f.db.close();
});
test('concurrent cloud or backup revision never overwritten; failed storage preserves prior valid board',async()=>{
 const marker={id:'cloud-sync',baseVersion:7,localRevision:3,dirty:false};
 const f=await fixture({marker});await f.editor.refresh();f.editor.open('outfit-legacy-1');
 f.editor.editName('Attempted after remote restoration');
 await patch(f.db,'state','cloud-sync',{baseVersion:8,localRevision:4,dirty:false});
 await assert.rejects(f.editor.save(),/CONFLICT/);
 const after=await f.read();assert.equal(after.board.saved[0].name,'Black dress plus jacket, coat and shoes');
 assert.equal(after.cloud.baseVersion,8);assert.equal(after.cloud.localRevision,4);
 f.db.close();
});
test('explicit delete requires confirmation; removes only selected outfit',async()=>{
 const f=await fixture();await f.editor.refresh();f.editor.open('outfit-legacy-1');
 await assert.rejects(f.editor.remove({confirmedId:'wrong'}),/confirmation/);
 assert.equal((await f.read()).board.saved.length,3);
 const d=await f.editor.remove({confirmedId:'outfit-legacy-1'});
 assert.equal(d.deleted,true);assert.equal((await f.read()).board.saved.length,2);
 assert.equal((await f.read()).board.saved[0].slots.bottom,'deleted-jeans');
 f.db.close();
});
test('logout, owner B, generation renewal and late read reject private owner A without leakage',async()=>{
 const f=await fixture();await f.editor.refresh();f.editor.open('outfit-legacy-1');
 f.auth.gen++;assert.throws(()=>f.editor.inspect(),/owner\/session/);
 await assert.rejects(f.editor.save(),/owner\/session|open original/);
 f.auth.user.id='owner-B';assert.throws(()=>f.editor.list(),/owner\/session|authenticated/);
 await assert.rejects(f.io.read({authenticated:true,ownerId:f.id,generation:1}),/revoked/);
 assert.equal(f.editor.lastSave instanceof Function,true); // no token or bytes printed
 f.db.close();
});
test('original full JPEG bytes and SHA survive all board writes; invalid photo SHA stays fallback',async()=>{
 const f=await fixture();await f.editor.refresh();f.editor.open('outfit-legacy-1');
 const verified=await verifyPhoto02(f.items[0]);assert.equal(verified.verified,true);assert.equal(verified.sourceSHA256,originalSHA);
 await f.editor.swapShoes('newshoes');await f.editor.save();
 const item=(await f.read()).items.find(x=>x.id==='dress');
 assert.equal(item.originalPhoto.image,jpeg);
 assert.equal(createHash('sha256').update(await readFile('benchmark/fixtures/commons-0003.jpg')).digest('hex'),originalSHA);
 assert.equal((await verifyPhoto02({...item,originalPhoto:{...item.originalPhoto,sha256:'0'.repeat(64)}})).verified,false);
 f.db.close();
});
test('native cloud backup engine accepts lossless snapshot, retains IDs on nonconflicting restore',async()=>{
 const f=await fixture();await f.editor.refresh();f.editor.open('outfit-legacy-1');
 f.editor.editName('Backup-safe name');await f.editor.save();
 const source=await f.read();
 const Engine=require('../public/cloud-backup-engine.js');
 const local={schemaVersion:1,items:source.items,state:{'outfit-board':source.board}};
 assert.equal(Engine.validateDocument(local),local);
 const cloneDoc=structuredClone(local);
 assert.deepEqual(Engine.mergeDocuments(cloneDoc,local,cloneDoc).state['outfit-board'],source.board);
 // Cloud-backup loader may still normalize on native reload: this is research
 // storage compatibility, NOT deployed full cloud-RLS or UI acceptance.
 f.db.close();
});
test('cross-namespace durable ID collisions across native and 3D aliases fail closed',()=>{
 const sample=cleanInput();sample.saved[1].outfit3dId=sample.saved[0].id;
 assert.throws(()=>validateBoard02(sample),/duplicate persistent/);
 sample.saved[1].outfit3dId=sample.saved[0].outfit3dId;
 assert.throws(()=>validateBoard02(sample),/duplicate persistent/);
});
test('50-outfit limit and malformed unsafe future fields fail closed',async()=>{
 const source=cleanInput();source.saved=Array.from({length:50},(_,i)=>({id:'saved-'+i,name:'Look '+i,slots:{top:'shirt'},ownerId:'A'}));
 const f=await fixture({state:source});await f.editor.refresh();f.editor.open('saved-0');f.editor.editName('Another');
 await assert.rejects(f.editor.save({asNew:true}),/maximum 50/);
 assert.equal((await f.read()).board.saved.length,50);
 assert.throws(()=>validateBoard02({current:{slots:{}},saved:[{slots:{},constructor:{test:1}}]}),/unsafe/);
 f.db.close();
});
test('source verification and 3D preview are fail-closed for unverified shoes and missing original piece',async()=>{
 const f=await fixture();await f.editor.refresh();const v=f.editor.open('outfit-missing-2');
 const p=f.editor.toPreview();assert.equal(p.missing[0].itemId,'deleted-jeans');
 assert.equal(p.selected.some(x=>x.slot==='shoes'),true);
 assert.equal(p.selected.some(x=>x.slot==='bottom'),false);
 assert.ok(p.selected.every(x=>x.originalSHA256===null),'No unverified SHA is eligible for donor-3D');
 const attested=await f.editor.toVerified3DPlan();
 // Shoes in this legacy fixture have an image but no pinned original SHA:
 // never invent a verified 3D source just to turn an assertion green.
 assert.equal(attested.unverifiedCount,1);
 assert.equal(attested.originalJPEGsByteVerified,false);
 assert.equal(attested.selected.find(x=>x.slot==='shoes').originalSHA256,null);
 assert.equal(attested.selected.find(x=>x.slot==='shoes').sourceVerified,false);
 assert.equal(attested.selected.find(x=>x.slot==='top').originalSHA256,originalSHA);
 assert.equal(attested.selected.find(x=>x.slot==='top').sourceVerified,true);
 assert.equal(p.releaseAuthorized,false);
 f.db.close();
});


test('storage interruption before commit cannot remove the previously valid saved outfit or cloud marker',async()=>{
 const f=await fixture();const before=await f.read();
 const interrupted=createLosslessBoard02({
  auth:f.auth,makeId:()=>String(serial)+'-fail',
  io:{read:f.io.read,compareAndWrite:async()=>{throw Error('Simulated storage quota/transaction interruption');}}
 });
 await interrupted.refresh();interrupted.open('outfit-legacy-1');
 interrupted.editName('Uncommitted outfit must stay out of storage');
 await assert.rejects(interrupted.save(),/Simulated storage quota\/transaction interruption/);
 const after=await f.read();
 assert.deepEqual(after.board,before.board);
 assert.deepEqual(after.cloud,before.cloud);
 assert.equal(interrupted.inspect().dirty,true,'Failed write stays an editable draft');
 f.db.close();
});
test('token/session epoch rotation immediately before compare-and-write blocks stale owner update',async()=>{
 const f=await fixture(),before=await f.read();
 const io={read:f.io.read,compareAndWrite:async args=>{
  // Represents a native token refresh rotating the attested generation while
  // an asynchronous save request is pending, before any IDB write.
  f.auth.gen++;
  return f.io.compareAndWrite(args);
 }};
 const editor=createLosslessBoard02({auth:f.auth,io});
 await editor.refresh();editor.open('outfit-legacy-1');
 editor.editName('Stale token save must fail');
 await assert.rejects(editor.save(),/revoked|stale|session/i);
 assert.deepEqual((await f.read()).board,before.board);
 assert.deepEqual((await f.read()).cloud,before.cloud);
 assert.throws(()=>editor.inspect(),/owner\/session/);
 f.db.close();
});
test('shirt, jeans, dress, skirt, jacket, coat and shoe recategorizations never lose original slot IDs',()=>{
 const choices=[
  ['top','shirt','Tops','T-shirt'],['bottom','jeans','Bottoms','Jeans'],
  ['top','dress','Dresses','Casual dress'],['bottom','skirt','Bottoms','Skirt'],
  ['layer2','jacket','Outerwear','Jacket'],['layer3','coat','Outerwear','Coat'],
  ['shoes','shoes','Shoes','Sneakers']
 ];
 for(const [slot,id,category,itemType]of choices){
  const board={slots:{[slot]:id},slotSources:{[slot]:{categoryAtSave:category}}};
  const unchanged=JSON.stringify(board);
  const result=inspectOutfit02(board,[{id,ownerId:'A',category:'Uncategorized',itemType}],{ownerId:'A'});
  assert.equal(result.review.length,1,id+' recategorized piece is review');
  assert.equal(result.review[0].itemId,id);
  assert.equal(result.review[0].slot,slot);
  assert.equal(JSON.stringify(board),unchanged,'No recategorization may rewrite original source');
 }
});
