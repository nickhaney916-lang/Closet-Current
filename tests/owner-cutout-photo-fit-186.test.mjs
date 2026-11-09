import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {inspectOwnerReviewedCutout186,attestOwnerReviewedCutoutBytes186}
 from '../research/owner-cutout-photo-fit-186/review-contract.mjs';

const SHA='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const original=readFileSync('benchmark/fixtures/commons-0016.jpg');
const unrelatedFixture=readFileSync('benchmark/fixtures/commons-0003.jpg');
const hash=b=>createHash('sha256').update(b).digest('hex');
const jpg=b=>'data:image/jpeg;base64,'+b.toString('base64');
const cutoutSHA=hash(unrelatedFixture);
function sampleRow(){
 assert.equal(hash(original),SHA,'licensed original bytes must match pinned source hash');
 return {id:'owner-saved-blouse',ownerId:'owner-A',sourceId:'commons-0016',
  sourceSHA256:SHA,sourceHashVerified:true,sourceHash:SHA,category:'Tops',
  itemType:'Blouse',ownerReviewed:true,humanReviewedSource:true,
  reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',
  originalPhoto:{image:jpg(original),sha256:SHA},cutoutSHA256:cutoutSHA,
  segmentHint:{verified:true,ownerReviewedInstance:true,originalSHA256:SHA,
   cutoutSHA256:cutoutSHA,cutoutImage:jpg(unrelatedFixture)}};
}
function admission(proof){
 return {
  selection:{ownerId:'owner-A',slots:{top:'owner-saved-blouse'}},
  sources:{ownerId:'owner-A',sources:[{id:'owner-saved-blouse',sha256:SHA,
   category:'Tops',itemType:'Blouse'}]},
  proof62:{admitted:true,ownerId:'owner-A',itemId:'owner-saved-blouse',
   sourceSHA256:SHA,cutoutSHA256:cutoutSHA},
  render:{privateVisible:true,viewerReady:true,bones:163,viewerMode:'shirt',
   productionDeployed:false,releaseAuthorized:false,
   fitReceipts171:{shirt:{silhouette62:{sourcePhotoSilhouetteFit62:true,
    sourceShoulderEased185:true,shoulderHemWorldAxisCorrected185:true,
    independentShoulderCapSeamsRetained185:true,
    independentlyJoinedShoulderCapMeshes185:2,silhouetteSourceSHA256:SHA,
    cutoutSHA256:cutoutSHA}}}},
  verifiedCutout:proof
 };
}
const digest=async row=>attestOwnerReviewedCutoutBytes186({
 row,ownerId:'owner-A',cryptoImpl:webcrypto,decodeBase64:atob
});
test('P186 WebCrypto rehashes TWO genuinely different licensed research JPEG byte streams',async()=>{
 const receipt=await digest(sampleRow());
 assert.equal(receipt.originalSourceSHA256,SHA);
 assert.equal(receipt.cutoutSHA256,cutoutSHA);
 assert.equal(receipt.originalJPEGBytesSHA256Verified,true);
 assert.equal(receipt.cutoutJPEGBytesSHA256Verified,true);
 assert.notEqual(receipt.cutoutSHA256,receipt.originalSourceSHA256);
 const admitted=inspectOwnerReviewedCutout186(admission(receipt));
 assert.equal(admitted.admitted,true);
 assert.equal(admitted.ownerReviewMetadataMatched,true);
 assert.equal(admitted.independentlyReviewedByHuman,false,
  'synthetic test metadata never proves genuine independent human approval');
 assert.equal(admitted.releaseAuthorized,false);
 assert.equal(admitted.arbitraryPrivatePhotosSupported,false);
});
test('P186 rejects missing human source review, incorrect class, cutout SHA and injected cross-owner',async()=>{
 for(const tamper of [
  r=>{r.ownerReviewed=false;},r=>{r.humanReviewedSource=false;},
  r=>{r.ownerId='owner-B';},r=>{r.sourceId='foreign';},
  r=>{r.reviewProvenance='model-prediction';},r=>{r.itemType='Dress';},
  r=>{r.segmentHint.ownerReviewedInstance=false;},
  r=>{r.segmentHint.verified=false;},
  r=>{r.cutoutSHA256=SHA;},r=>{r.segmentHint.cutoutSHA256=SHA;},
  r=>{r.segmentHint.cutoutImage=jpg(original);},
  r=>{r.originalPhoto.image=jpg(unrelatedFixture);}
 ]){
  const row=sampleRow();tamper(row);
  await assert.rejects(digest(row),/P186|NATIVE92/);
 }
});
test('P186 late owner, source, fit and cutout receipt mismatches always retain honest 2D fallback',async()=>{
 const receipt=await digest(sampleRow()),base=admission(receipt);
 for(const change of [
  r=>{r.selection.ownerId='owner-B';},r=>{r.sources.ownerId='owner-B';},
  r=>{r.sources.sources[0].sha256='a'.repeat(64);},
  r=>{r.proof62.admitted=false;},r=>{r.render.bones=162;},
  r=>{r.render.fitReceipts171.shirt.silhouette62.cutoutSHA256='c'.repeat(64);},
  r=>{r.render.fitReceipts171.shirt.silhouette62.sourceShoulderEased185=false;},
  r=>{r.verifiedCutout.ownerId='owner-B';},
  r=>{r.verifiedCutout.cutoutSHA256='a'.repeat(64);},
  r=>{r.verifiedCutout.ownerReviewed=false;},
  r=>{r.verifiedCutout.cutoutJPEGBytesSHA256Verified=false;},
  r=>{r.verifiedCutout.originalJPEGBytesSHA256Verified=false;}
 ]){
  const candidate=structuredClone(base);change(candidate);
  const verdict=inspectOwnerReviewedCutout186(candidate);
  assert.equal(verdict.admitted,false);
  assert.equal(verdict.mode,'original-photo-2d-fallback');
  assert.equal(verdict.releaseAuthorized,false);
 }
 assert.equal(inspectOwnerReviewedCutout186({...base,verifiedCutout:null}).admitted,false);
});
test('P186 is actually wired to the live private native controller and preview, no public or release mutation',()=>{
 const controller=readFileSync('research/native-consumer-board-04/consumer-board-controller.mjs','utf8');
 const native=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 const browser=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 for(const token of ['attestReviewedCutout186=async(garmentId)',"photoOwnerCutout186')!=='research'",
  'row.segmentHint!==hint','wardrobeRevision93','attestOwnerReviewedCutoutBytes186'])
  assert.ok(controller.includes(token),'NATIVE owner-private proof '+token);
 for(const token of ["params?.get('photoOwnerCutout186')==='research'",
  'await consumer.attestReviewedCutout186(selected.slots.top)',
  'inspectOwnerReviewedCutout186({','await attestOriginalBytes92();requireFresh()',
  'verifiedOwnerCutout186=verdict','photoOwnerCutout186:active&&'])
  assert.ok(native.includes(token),'NATIVE owner preview proof '+token);
 for(const token of ["PHOTO_OWNER_CUTOUT186","02-provisional-cutout-review-required-2d-fallback",
  'provisionalBlouseOwnerCutoutReviewRejected186:true','screens.length,photoOwnerCutout186?6'])
  assert.ok(browser.includes(token),'actual browser fail-closed '+token);
});

test('P186 revokes review/byte metadata changed during either asynchronous WebCrypto digest',async()=>{
 for(const index of [1,2]){
  const row=sampleRow();let calls=0;
  const cryptoImpl={subtle:{digest:async(...args)=>{
   const bytes=await webcrypto.subtle.digest(...args);
   if(++calls===index){
    if(index===1)row.reviewProvenance='unreviewed-while-hashing';
    else row.segmentHint.cutoutImage=jpg(original);
   }
   return bytes;
  }}};
  await assert.rejects(attestOwnerReviewedCutoutBytes186({
   row,ownerId:'owner-A',cryptoImpl,decodeBase64:atob
  }),/P186 owner review or cutout changed during JPEG SHA verification/);
 }
});
