import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {evaluateOwnerSavedRecognition04} from '../research/index-04/verified-saved-recognition.mjs';

const raw=Buffer.from([255,216,255,224,0,16,74,70,73,70,0,1,0,0,255,217]);
const original='data:image/jpeg;base64,'+raw.toString('base64');
const sha=createHash('sha256').update(raw).digest('hex'),otherSha='b'.repeat(64);
const recognition=(category='Bottoms',itemType='Jeans',more={})=>({
 strong:true,choices:[{category,itemType,label:'a pair of jeans',score:.96}],
 details:{color:'Blue'},...more
});
const candidate=(more={})=>({
 id:'new-photo',image:original,category:'Uncategorized',itemType:'Unknown',
 color:'Blue',confirmedColor:true,sourceSHA256:sha,
 sourceHashVerified:true,singleGarmentVerified:true,...more
});
let owner='owner-A';
const evaluate=(record=candidate(),model=recognition(),savedItems=[],more={})=>
 evaluateOwnerSavedRecognition04({
  ownerId:'owner-A',currentOwner:()=>owner,record,recognition:model,
  savedItems,cryptoProvider:webcrypto,...more
 });
test.beforeEach(()=>{owner='owner-A';});
test('01 safe, independently hashed original single JPEG, color and ordinary subtype permits auto-save',async()=>{
 const src=candidate(),m=recognition();
 const s=await evaluate(src,m);
 assert.equal(s.autoSaveSafe,true);assert.equal(s.needsReview,false);
 assert.deepEqual(s.reviewReasons,[]);
 assert.equal(s.sourceKind,'verified-original');
 assert.equal(s.duplicateStatus,'allow');
 assert.deepEqual(s.suggestion,{category:'Bottoms',itemType:'Jeans',color:'Blue'});
 assert.equal(src.category,'Uncategorized','never mutate original review draft');
 assert.equal(src.image,original,'never mutate JPEG');
});
test('02 missing independently verified original SHA or missing camera identity is review, not auto-save',async()=>{
 for(const change of [{sourceSHA256:''},{sourceHashVerified:false},{singleGarmentVerified:false},
  {image:'data:image/png;base64,iVBORw0KGgo='}]){
  const s=await evaluate(candidate(change));
  assert.equal(s.autoSaveSafe,false,JSON.stringify(change));
  assert.ok(s.reviewReasons.length>0);
 }
});
test('03 mismatched JPEG bytes or conflicting independent SHA blocks automatic save',async()=>{
 const changed=Buffer.from(raw);changed[9]^=1;
 for(const change of [
  {image:'data:image/jpeg;base64,'+changed.toString('base64')},
  {sourceSHA256:otherSha},
  {originalPhoto:{sha256:otherSha,image:original}}
 ]){
  const s=await evaluate(candidate(change));
  assert.equal(s.autoSaveSafe,false);
  assert.ok(s.reviewReasons.includes('original-JPEG-identity-not-verified'));
 }
});
test('04 cropped recognition versus retained original source must fail closed without source-bound cutout',async()=>{
 const cropped='data:image/jpeg;base64,'+Buffer.from([255,216,1,2,3,4,255,217]).toString('base64');
 const s=await evaluate(candidate({originalPhoto:{image:original,sha256:sha},
  recognitionPhoto:{image:cropped}}));
 assert.equal(s.autoSaveSafe,false);
 assert.ok(s.reviewReasons.includes('original-source-unverified'));
});
test('05 known confusable boots need executed independent full-vocabulary proof, not duplicated scores',async()=>{
 const r=candidate(),m=recognition('Shoes','Ankle boots');
 const deny=await evaluate(r,m);
 assert.equal(deny.autoSaveSafe,false);
 assert.ok(deny.reviewReasons.includes('confusable-type-needs-independent-confirmation'));
 const yes=await evaluate(r,m,[],{independent:{executed:true,fullVocabulary:true,
  differentViews:true,primary:{category:'Shoes',itemType:'Ankle boots'},
  confirmation:{category:'Shoes',itemType:'Ankle boots'}}});
 assert.equal(yes.autoSaveSafe,true);
});
test('06 same verified source and single garment already saved is an exact duplicate, not silently overwritten',async()=>{
 const previous=candidate({id:'already-saved',category:'Bottoms',itemType:'Jeans'});
 const r=await evaluate(candidate(),recognition(),[previous]);
 assert.equal(r.autoSaveSafe,false);
 assert.equal(r.duplicateStatus,'reject');
 assert.ok(r.reviewReasons.includes('verified-source-and-segment-duplicate'));
});
test('07 distinct cutout JPEG bytes from same outfit remain distinct but REQUIRE human category/type review',async()=>{
 const rawCutout=Buffer.from([255,216,7,8,9,10,255,217]);
 const cutoutImage='data:image/jpeg;base64,'+rawCutout.toString('base64');
 const cutoutSHA256=createHash('sha256').update(rawCutout).digest('hex');
 const proof={verified:true,ownerReviewedInstance:true,originalSHA256:sha,
  cutoutSHA256,cutoutImage,clipped:false};
 const record=candidate({singleGarmentVerified:false,
  outfitSourceId:'outfit-17',segmentHint:proof,
  originalPhoto:{image:original,sha256:sha},
  recognitionPhoto:{image:original},cropBounds:{left:10}});
 const previous=candidate({id:'other-cutout',category:'Bottoms',itemType:'Jeans',
  singleGarmentVerified:false,cutoutSHA256:'c'.repeat(64)});
 const r=await evaluate(record,recognition(),[previous]);
 assert.equal(r.duplicateStatus,'allow');
 assert.equal(r.autoSaveSafe,false,'model type from whole photo is not proven to belong to the cutout');
 assert.equal(r.sourceKind,'verified-cutout');
 assert.ok(r.reviewReasons.includes('multi-garment-category-and-type-needs-owner-review'));
 const notHashed=await evaluate({...record,segmentHint:{...proof,cutoutSHA256:'a'.repeat(64)}});
 assert.equal(notHashed.autoSaveSafe,false);
 assert.notEqual(notHashed.sourceKind,'verified-cutout');
 const notReviewed=await evaluate({...record,segmentHint:{...proof,ownerReviewedInstance:false}});
 assert.equal(notReviewed.autoSaveSafe,false);
 assert.notEqual(notReviewed.sourceKind,'verified-cutout');
});
test('08 manual corrections beat fresh wrong predictions; do not auto overwrite selected skirt',async()=>{
 const r=await evaluate(candidate({userAdjusted:true,category:'Bottoms',
  itemType:'Skirt',color:'Cream',colorSource:'user'}),recognition('Dresses','Casual dress'));
 assert.equal(r.autoSaveSafe,false);
 assert.equal(r.suggestion.category,'Bottoms');
 assert.equal(r.suggestion.itemType,'Skirt');
 assert.ok(r.reviewReasons.includes('manual-correction-must-win'));
});
test('09 foreign candidate, foreign saved snapshot or stale logged-out owner is rejected',async()=>{
 await assert.rejects(evaluate(candidate({ownerId:'owner-B'})),/foreign candidate/);
 await assert.rejects(evaluate(candidate(),recognition(),[candidate({id:'foreign',ownerId:'owner-B'})]),/cross-owner-record/);
 owner=null;
 await assert.rejects(evaluate(),/signed-in owner required/);
});
test('10 asynchronous logout during source digest cannot leak owner items or pass guard',async()=>{
 let release;
 const provider={subtle:{digest:()=>new Promise(resolve=>{release=resolve;})}};
 const pending=evaluate(candidate(),recognition(),[],{cryptoProvider:provider});
 // evaluation reaches digest promise before the first await.
 owner='owner-B';release(new Uint8Array(Buffer.from(sha,'hex')).buffer);
 await assert.rejects(pending,/owner changed during source proof/);
});
test('11 no photo bytes, metadata lists, source identifiers or private owner leak from decision',async()=>{
 const s=await evaluate(candidate(),recognition());
 const json=JSON.stringify(s);
 assert.ok(!json.includes('data:image/'));
 assert.ok(!json.includes('owner-A'));
 assert.ok(!json.includes(sha));
 assert.ok(!json.includes('new-photo'));
 assert.equal(Object.isFrozen(s),true);
 assert.equal(Object.isFrozen(s.reviewReasons),true);
});
test('12 real app opt-in import is before automatic saving and default mode stays unchanged',()=>{
 const app=readFileSync('public/app.js','utf8');
 const implementation=readFileSync('research/index-04/verified-saved-recognition.mjs','utf8');
 assert.ok(app.includes("get('index04')==='after'"));
 assert.ok(app.indexOf('const decision=await evaluateOwnerSavedRecognition04')<
   app.indexOf('  const corePartial='));
 assert.ok(app.includes('if(!decision.autoSaveSafe)'));
 assert.ok(app.includes("const wasSaved=await saveIndexed(item,index04ApprovedOwner)"));
 // New writer closes over exact owner DB + epoch and checks the pinned
 // approved owner before opening its atomic IDB transaction.
 assert.ok(app.includes("ownerDB.name!=='closet-current-user-'+owner"));
 assert.ok(app.includes("owner!==index04ApprovedOwner"));
 assert.ok(app.includes("epoch===captureOperationEpoch&&db===ownerDB"));
 assert.ok(!/fetch\s*\(|XMLHttpRequest|localStorage|indexedDB\.open|postMessage|new Worker/.test(implementation));
});
