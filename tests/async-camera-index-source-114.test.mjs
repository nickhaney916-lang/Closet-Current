import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {evaluateOwnerSavedRecognition04} from '../research/index-04/verified-saved-recognition.mjs';

const jpeg=Buffer.from([255,216,255,224,0,16,74,70,73,70,0,1,0,0,255,217]);
const photo='data:image/jpeg;base64,'+jpeg.toString('base64');
const sha=createHash('sha256').update(jpeg).digest('hex');
const record=()=>({
 id:'new-reviewed-camera-item',image:photo,sourceSHA256:sha,
 sourceHashVerified:true,singleGarmentVerified:true,
 category:'Uncategorized',itemType:'Unknown',color:'Blue',confirmedColor:true
});
const recognition=()=>({
 strong:true,choices:[{category:'Bottoms',itemType:'Jeans',score:.97}],
 details:{color:'Blue'}
});
const savedRecord=()=>({
 id:'already-owned-shirt',ownerId:'owner-A',
 category:'Tops',itemType:'T-shirt',color:'Black',
 sourceSHA256:'a'.repeat(64),sourceHashVerified:true,
 singleGarmentVerified:true
});
const pending=(setup={},savedItems=[])=>{
 let release;
 let calls=0;
 const owner=()=>{calls++;return 'owner-A';};
 const cryptoProvider={subtle:{digest:()=>new Promise(resolve=>{release=resolve;})}};
 const item=setup.item||record(),model=setup.model||recognition();
 const params={ownerId:'owner-A',record:item,recognition:model,savedItems,
  currentOwner:setup.currentOwner||owner,
  independent:setup.independent||null,cryptoProvider};
 const result=evaluateOwnerSavedRecognition04(params);
 assert.equal(typeof release,'function','real source verification must await digest');
 return {result,item,model,savedItems,release:()=>{
  release(new Uint8Array(Buffer.from(sha,'hex')).buffer);
 },calls:()=>calls};
};
const rejectEdit=async(mutation,setup={},savedItems=[])=>{
 const p=pending(setup,savedItems);
 mutation(p);
 p.release();
 await assert.rejects(p.result,/INDEX-04 (source, reviewed color or recognition changed|saved closet changed|cross-owner-record)/);
};
test('PHOTO114 unchanged SHA-verified original JPEG, reviewed color, saved wardrobe and subtype are still eligible',async()=>{
 const p=pending();
 p.release();
 const out=await p.result;
 assert.equal(out.autoSaveSafe,true);
 assert.equal(out.needsReview,false);
 assert.deepEqual(out.suggestion,{category:'Bottoms',itemType:'Jeans',color:'Blue'});
 assert.deepEqual(out.reviewReasons,[]);
 assert.ok(Object.isFrozen(out));
});
test('PHOTO114 changes to color and human category correction during original SHA digest fail closed',async()=>{
 await rejectEdit(({item})=>{item.color='Navy';});
 await rejectEdit(({item})=>{item.confirmedColor=false;});
 await rejectEdit(({item})=>{item.userAdjusted=true;item.itemType='Skirt';});
 await rejectEdit(({item})=>{item.confirmedCategory=true;item.category='Dresses';});
 await rejectEdit(({item})=>{item.colorSource='photo-estimate';});
});
test('PHOTO114 original JPEG, proof SHA and segment provenance cannot change while digest is pending',async()=>{
 await rejectEdit(({item})=>{item.sourceSHA256='b'.repeat(64);});
 await rejectEdit(({item})=>{item.image='data:image/jpeg;base64,'+Buffer.from([255,216,0,0,255,217]).toString('base64');});
 await rejectEdit(({item})=>{item.originalPhoto={image:photo,sha256:sha};});
 await rejectEdit(({item})=>{item.sourceHashVerified=false;});
 await rejectEdit(({item})=>{item.singleGarmentVerified=false;});
 await rejectEdit(({item})=>{item.cropBounds={left:10};});
 await rejectEdit(({item})=>{item.outfitSourceId='changed-outfit';});
 await rejectEdit(({item})=>{item.segmentHint={verified:true,originalSHA256:sha,cutoutSHA256:'c'.repeat(64)};});
});
test('PHOTO114 model category/subtype or proposed color cannot silently change while original JPEG proof is pending',async()=>{
 await rejectEdit(({model})=>{model.choices[0].category='Dresses';model.choices[0].itemType='Casual dress';});
 await rejectEdit(({model})=>{model.strong=false;});
 await rejectEdit(({model})=>{model.details.color='Red';});
 await rejectEdit(({model})=>{model.reason='skirt_dress_independent_agreement';});
 await rejectEdit(({model})=>{model.diagnostics={skirtDressConflict:{requiresManualReview:true}};});
});
test('PHOTO114 independently executed subtype proof must not mutate during JPEG digest',async()=>{
 const independent={
  executed:true,fullVocabulary:true,differentViews:true,
  primary:{category:'Shoes',itemType:'Ankle boots'},
  confirmation:{category:'Shoes',itemType:'Ankle boots'}
 };
 const model={strong:true,choices:[{category:'Shoes',itemType:'Ankle boots',score:.96}],
  details:{color:'Brown'}};
 await rejectEdit(({model})=>{model.choices[0].itemType='Tall boots';},{independent,model});
 await rejectEdit(()=>{independent.confirmation.itemType='Tall boots';},{independent,model});
});
test('PHOTO114 saved closet mutation while source digest is pending blocks stale automatic indexed save',async()=>{
 await rejectEdit(({savedItems})=>{savedItems.push({...savedRecord(),id:'late-record'});},
  {},[savedRecord()]);
 await rejectEdit(({savedItems})=>{savedItems[0].color='Navy';},
  {},[savedRecord()]);
 await rejectEdit(({savedItems})=>{savedItems[0].sourceSHA256='b'.repeat(64);},
  {},[savedRecord()]);
 await rejectEdit(({savedItems})=>{savedItems[0].id='changed-saved-id';},
  {},[savedRecord()]);
 // Saved source becomes an exact clone of the incoming JPEG only after digest
 await rejectEdit(({savedItems})=>{savedItems[0].sourceSHA256=sha;},
  {},[savedRecord()]);
});
test('PHOTO114 owner-check callbacks cannot change candidate or closet before last decision and then authorize old source',async()=>{
 let calls=0;const item=record(),model=recognition(),savedItems=[savedRecord()];
 const provider={subtle:{digest:async()=>new Uint8Array(Buffer.from(sha,'hex')).buffer}};
 const currentOwner=()=>{
  calls++;
  if(calls===4)item.color='Red';
  return 'owner-A';
 };
 await assert.rejects(evaluateOwnerSavedRecognition04({
  ownerId:'owner-A',currentOwner,record:item,recognition:model,savedItems,
  cryptoProvider:provider
 }),/source, reviewed color or recognition changed/);
 assert.equal(calls,4);
});
test('PHOTO114 unrelated ephemeral visual metadata cannot trigger false deny, customer bytes never appear in result',async()=>{
 const p=pending({},[savedRecord()]);
 p.item._hoveredTile=true;
 p.item._localAnimationFrame=42;
 p.release();
 const out=await p.result;
 assert.equal(out.autoSaveSafe,true);
 const output=JSON.stringify(out);
 assert.ok(!output.includes('data:image/'));
 assert.ok(!output.includes(sha));
 assert.ok(!output.includes('owner-A'));
 assert.ok(!output.includes(p.item.id));
});
test('PHOTO114 source code proof remains research-only and original app opt-in save gate remains intact',()=>{
 const source=readFileSync('research/index-04/verified-saved-recognition.mjs','utf8');
 const app=readFileSync('public/app.js','utf8');
 for(const evidence of [
  'decisionFingerprint114(record,recognition,independent)',
  'const inputFingerprint114=',
  'const savedFingerprint114=',
  'assertSourceUnchanged114();',
  'const liveSavedIndex=buildOwnerWardrobeIndex(ownerId,savedItems)',
  'source, reviewed color or recognition changed during original JPEG proof',
  'saved closet changed during original JPEG proof'
 ])assert.ok(source.includes(evidence),evidence);
 assert.doesNotMatch(source,/fetch\s*\(|XMLHttpRequest|localStorage|indexedDB\.open|postMessage|new Worker/);
 assert.ok(app.includes("get('index04')==='after'"));
 assert.ok(app.includes('if(!decision.autoSaveSafe)'));
 assert.ok(app.includes('const wasSaved=await saveIndexed(item,index04ApprovedOwner)'));
});
