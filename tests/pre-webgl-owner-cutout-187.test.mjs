import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {attestOwnerReviewedCutoutBytes186}
 from '../research/owner-cutout-photo-fit-186/review-contract.mjs';
import {captureReviewedCutoutLease187}
 from '../research/pre-webgl-owner-cutout-187/cutout-lease.mjs';

const SOURCE='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const original=readFileSync('benchmark/fixtures/commons-0016.jpg');
const other=readFileSync('benchmark/fixtures/commons-0003.jpg');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const url=bytes=>'data:image/jpeg;base64,'+bytes.toString('base64');
const cutoutHash=sha(other);
const row=()=>({
 id:'saved-blouse',ownerId:'owner-A',sourceId:'commons-0016',
 sourceSHA256:SOURCE,sourceHash:SOURCE,sourceHashVerified:true,
 originalPhoto:{image:url(original),sha256:SOURCE},
 category:'Tops',itemType:'Blouse',ownerReviewed:true,humanReviewedSource:true,
 reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',
 cutoutSHA256:cutoutHash,
 segmentHint:{verified:true,ownerReviewedInstance:true,originalSHA256:SOURCE,
  cutoutSHA256:cutoutHash,cutoutImage:url(other)}
});
const proof=async r=>attestOwnerReviewedCutoutBytes186({
 row:r,ownerId:'owner-A',cryptoImpl:webcrypto,decodeBase64:atob
});
const lease=async r=>captureReviewedCutoutLease187({
 row:r,receipt:await proof(r),ownerId:'owner-A',generation:12,revision:5
});
const current=r=>({row:r,ownerId:'owner-A',generation:12,revision:5});

test('P187 positive synthetic owner review only produces an opaque current WebCrypto-double-JPEG lease',async()=>{
 assert.equal(sha(original),SOURCE);
 const reviewed=row(),l=await lease(reviewed);
 assert.equal(l.assertCurrent(current(reviewed)),true);
 assert.ok(Object.isFrozen(l.receipt));
 assert.equal(l.receipt.originalJPEGBytesSHA256Verified,true);
 assert.equal(l.receipt.cutoutJPEGBytesSHA256Verified,true);
 assert.equal(l.receipt.independentHumanReviewerVerified,false);
 assert.equal(l.receipt.releaseAuthorized,false);
 assert.equal('image' in l.receipt,false);
 assert.equal('cutoutImage' in l.receipt,false);
 assert.equal(JSON.stringify(l).includes('data:image/jpeg'),false);
});
test('P187 instantly revokes after any byte/string in-place review, source, SHA or category change',async()=>{
 const mutate=[
  r=>{r.ownerReviewed=false;},r=>{r.humanReviewedSource=false;},
  r=>{r.reviewProvenance='unreviewed';},r=>{r.sourceId='different';},
  r=>{r.category='Dresses';},r=>{r.itemType='Coat';},
  r=>{r.sourceSHA256='a'.repeat(64);},r=>{r.originalPhoto.sha256='f'.repeat(64);},
  r=>{r.originalPhoto.image=url(other);},r=>{r.cutoutSHA256='c'.repeat(64);},
  r=>{r.segmentHint.verified=false;},r=>{r.segmentHint.ownerReviewedInstance=false;},
  r=>{r.segmentHint.originalSHA256='c'.repeat(64);},
  r=>{r.segmentHint.cutoutSHA256='b'.repeat(64);},
  r=>{r.segmentHint.cutoutImage=url(original);}
 ];
 for(const change of mutate){
  const reviewed=row(),l=await lease(reviewed);
  change(reviewed);
  assert.throws(()=>l.assertCurrent(current(reviewed)),/P187 original JPEG, reviewed cutout or review decision changed/,
   'must revoke private 3D without waiting for an IndexedDB wardrobe revision');
 }
});
test('P187 revokes source after refresh, id replacement, changed login or session generation',async()=>{
 const reviewed=row(),l=await lease(reviewed);
 for(const altered of [
  {...current(reviewed),row:row()},
  {...current(reviewed),revision:6},
  {...current(reviewed),generation:13},
  {...current(reviewed),ownerId:'owner-B'}
 ])assert.throws(()=>l.assertCurrent(altered),/P187 owner, saved garment or wardrobe epoch changed/);
});
test('P187 refuses a fake, incomplete or manually asserted receipt before viewer creation',async()=>{
 const reviewed=row(),good=await proof(reviewed);
 for(const changed of [
  {...good,ownerId:'owner-B'},
  {...good,cutoutSHA256:SOURCE},
  {...good,originalJPEGBytesSHA256Verified:false},
  {...good,cutoutJPEGBytesSHA256Verified:false},
  {...good,reviewedInstance:false},
  {...good,releaseAuthorized:true},
  {...good,familyAlpha:'PASS'}
 ])assert.throws(()=>captureReviewedCutoutLease187({
  row:reviewed,receipt:changed,ownerId:'owner-A',generation:12,revision:5
 }),/P187 exact owner-reviewed double-JPEG proof/);
});
test('P187 live integration preflights SHA before importing donor and revokes stale review in native state',()=>{
 const owner=readFileSync('research/native-consumer-board-04/consumer-board-controller.mjs','utf8');
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 const browser=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 for(const token of ['new WeakMap()','captureReviewedCutoutLease187({',
  'attestReviewedCutoutLease187=async garmentId=>',
  'const proof=await attestReviewedCutout186(garmentId)',
  'requireReviewedCutoutLease187=receipt=>',
  'cutoutLeases187.get(receipt)'])
  assert.ok(owner.includes(token),'native owner lease is missing '+token);
 const actual=bridge.indexOf('await consumer.attestReviewedCutoutLease187(selected.slots.top)');
 const donor=bridge.indexOf('const donor=await importPinnedDonor()');
 assert.ok(actual>0&&donor>actual,'P187 must establish owner review BEFORE any donor import');
 for(const token of ["params?.get('photoOwnerCutout187')==='research'",
  'if(displayedReviewLease187&&',
  'consumer.requireReviewedCutoutLease187(displayedReviewLease187)',
  'photoOwnerCutout187:active&&!!displayedReviewLease187',
  'await consumer.attestReviewedCutout186(selected.slots.top)',
  'displayedReviewLease187=preflightLease187'])
  assert.ok(bridge.includes(token),'P187 actual browser native 3D guard missing '+token);
 for(const token of ['PHOTO_CUTOUT_PREFLIGHT187',
  "'02-pre-webgl-unreviewed-owner-cutout-2d-fallback'",
  'donorRequests187,0','unreviewed3DSceneNeverCreated187:true'])
  assert.ok(browser.includes(token),'P187 actual browser denial missing '+token);
});
