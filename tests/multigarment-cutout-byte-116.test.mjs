import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {evaluateOwnerSavedRecognition04} from '../research/index-04/verified-saved-recognition.mjs';

const bytes=Buffer.from([255,216,255,224,0,16,74,70,73,70,0,1,0,0,255,217]);
const original='data:image/jpeg;base64,'+bytes.toString('base64');
const originalSHA=createHash('sha256').update(bytes).digest('hex');
const cut1=Buffer.from([255,216,11,21,31,41,255,217]);
const cut2=Buffer.from([255,216,12,22,32,42,255,217]);
const jpg=v=>'data:image/jpeg;base64,'+v.toString('base64');
const sha=v=>createHash('sha256').update(v).digest('hex');
const owner='synthetic-owner-116';
const recog=()=>({strong:true,choices:[{category:'Bottoms',itemType:'Jeans',score:.96}],
 details:{color:'Blue'}});
const make=(cut=cut1,extra={})=>({
 id:'outfit-clothing-cutout',ownerId:owner,image:original,
 originalPhoto:{image:original,sha256:originalSHA},
 recognitionPhoto:{image:original},sourceSHA256:originalSHA,
 sourceHashVerified:true,singleGarmentVerified:false,
 cropBounds:{left:8,top:8,width:12,height:12},outfitSourceId:'outfit-116',
 category:'Uncategorized',itemType:'Unknown',color:'Blue',confirmedColor:true,
 segmentHint:{verified:true,ownerReviewedInstance:true,clipped:false,
  originalSHA256:originalSHA,cutoutSHA256:sha(cut),cutoutImage:jpg(cut)},
 ...extra
});
const evaluate=(record,savedItems=[],settings={})=>evaluateOwnerSavedRecognition04({
 ownerId:owner,currentOwner:()=>owner,record,recognition:recog(),
 savedItems,cryptoProvider:webcrypto,...settings
});
test('PHOTO116 exact original and a different actual cutout JPEG both independently hash; multi-photo cannot auto-label',async()=>{
 for(const cut of [cut1,cut2]){
  const result=await evaluate(make(cut));
  assert.equal(result.sourceKind,'verified-cutout');
  assert.equal(result.duplicateStatus,'allow');
  assert.equal(result.autoSaveSafe,false);
  assert.equal(result.needsReview,true);
  assert.ok(result.reviewReasons.includes('multi-garment-category-and-type-needs-owner-review'));
  assert.ok(Object.isFrozen(result.reviewReasons));
 }
});
test('PHOTO116 metadata-only cutout assertions, false source identity, user denial or JPEG mismatch must never be verified',async()=>{
 const variations=[
  v=>delete v.segmentHint.cutoutImage,
  v=>{v.segmentHint.cutoutSHA256='b'.repeat(64);},
  v=>{v.segmentHint.originalSHA256='c'.repeat(64);},
  v=>{v.segmentHint.verified=false;},
  v=>{v.segmentHint.ownerReviewedInstance=false;},
  v=>{v.segmentHint.clipped=true;},
  v=>{v.segmentHint.cutoutImage=original;v.segmentHint.cutoutSHA256=originalSHA;},
  v=>{v.segmentHint.cutoutImage='data:image/png;base64,iVBORw0KGgo=';},
  v=>{v.segmentHint.cutoutImage='data:image/jpeg;base64,SGVsbG8=';},
  v=>{v.segmentHint.cutoutImage=jpg(Buffer.from([255,216,0,0,1,2]));},
  v=>{v.segmentHint.cutoutImage=jpg(cut2);},
  v=>{v.originalPhoto.sha256='d'.repeat(64);}
 ];
 for(const mutate of variations){
  const record=make();mutate(record);
  const result=await evaluate(record);
  assert.equal(result.autoSaveSafe,false,mutate.toString());
  assert.notEqual(result.sourceKind,'verified-cutout',mutate.toString());
  assert.ok(result.reviewReasons.includes('multi-garment-category-and-type-needs-owner-review'));
 }
});
test('PHOTO116 two distinct verified cutouts of ONE original are not duplicate; exact repeated cutout is duplicate',async()=>{
 const previous={
  id:'already-saved-cutout',ownerId:owner,category:'Bottoms',itemType:'Jeans',
  color:'Blue',sourceSHA256:originalSHA,sourceHashVerified:true,
  cutoutSHA256:sha(cut1),singleGarmentVerified:false
 };
 const distinct=await evaluate(make(cut2),[previous]);
 assert.equal(distinct.sourceKind,'verified-cutout');
 assert.equal(distinct.duplicateStatus,'allow');
 assert.equal(distinct.autoSaveSafe,false);
 const repeat=await evaluate(make(cut1),[previous]);
 assert.equal(repeat.duplicateStatus,'reject');
 assert.ok(repeat.reviewReasons.includes('verified-source-and-segment-duplicate'));
});
test('PHOTO116 original-photo JPEG byte identity still controls the source of every cutout',async()=>{
 const r=make();
 r.sourceSHA256='e'.repeat(64);
 const result=await evaluate(r);
 assert.notEqual(result.sourceKind,'verified-cutout');
 assert.equal(result.autoSaveSafe,false);
 assert.ok(result.reviewReasons.includes('original-JPEG-identity-not-verified'));
});
test('PHOTO116 changing source or reviewed cutout while SECOND async hash pending must fail closed',async()=>{
 let resume,call=0;
 const provider={subtle:{digest:async(_,b)=>{
  call++;
  if(call===1)return webcrypto.subtle.digest('SHA-256',b);
  return new Promise(resolve=>{resume=()=>webcrypto.subtle.digest('SHA-256',b).then(resolve);});
 }}};
 const r=make();
 const promise=evaluate(r,[],{cryptoProvider:provider});
 for(let i=0;i<100&&typeof resume!=='function';i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(typeof resume,'function');
 r.segmentHint.cutoutImage=jpg(cut2);
 resume();
 await assert.rejects(promise,/INDEX-04 source, reviewed color or recognition changed during original JPEG proof/);
 assert.equal(call,2);
});
test('PHOTO116 owner switch during cutout SHA verification is rejected before any private index decision',async()=>{
 let resume,second=0,currentOwner=owner;
 const provider={subtle:{digest:async(_,b)=>{
  second++;
  if(second===1)return webcrypto.subtle.digest('SHA-256',b);
  return new Promise(resolve=>{resume=()=>webcrypto.subtle.digest('SHA-256',b).then(resolve);});
 }}};
 const pending=evaluate(make(),[],{cryptoProvider:provider,currentOwner:()=>currentOwner});
 for(let i=0;i<100&&typeof resume!=='function';i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(typeof resume,'function');
 currentOwner='different-owner';
 resume();
 await assert.rejects(pending,/INDEX-04 owner changed during cutout JPEG proof/);
});
test('PHOTO116 single-garment original flow remains unchanged and safe for genuine SHA verified toy JPEG',async()=>{
 const src={id:'single-piece',ownerId:owner,image:original,
  sourceSHA256:originalSHA,sourceHashVerified:true,singleGarmentVerified:true,
  category:'Uncategorized',itemType:'Unknown',color:'Blue',confirmedColor:true};
 const result=await evaluate(src);
 assert.equal(result.sourceKind,'verified-original');
 assert.equal(result.autoSaveSafe,true);
 assert.equal(result.needsReview,false);
});
test('PHOTO116 result never exposes owner IDs, image bytes, cutout JPEG, or exact source hashes',async()=>{
 const r=await evaluate(make());
 const json=JSON.stringify(r);
 for(const privateValue of [owner,original,jpg(cut1),originalSHA,sha(cut1),'outfit-clothing-cutout'])
  assert.ok(!json.includes(privateValue),privateValue.slice(0,12));
 assert.equal(r.autoSaveSafe,false);
});
test('PHOTO116 research module guards only evaluated data; no app or model or cloud edits/deploy',()=>{
 const code=readFileSync('research/index-04/verified-saved-recognition.mjs','utf8');
 for(const proof of [
  "const cutoutProof=await verifyOriginalSourceBytes(",
  "cutoutBytes,hint.cutoutSHA256,cryptoProvider",
  "hint.ownerReviewedInstance===true",
  "hint.cutoutImage!==src.original",
  "multi-garment-category-and-type-needs-owner-review",
  "garmentCount===1&&duplicate.status==='allow'"
 ])assert.ok(code.includes(proof),proof);
 assert.doesNotMatch(code,/fetch\s*\(|XMLHttpRequest|localStorage|indexedDB\.open|postMessage|new Worker/);
});
