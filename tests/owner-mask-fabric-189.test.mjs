import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import sharp from 'sharp';
import {inspectOwnerMaskRecord189,attestOwnerMaskPNGBytes189}
 from '../research/owner-mask-fabric-189/mask-contract.mjs';
import {captureReviewedCutoutLease187}
 from '../research/pre-webgl-owner-cutout-187/cutout-lease.mjs';

const SRC='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const sha=x=>createHash('sha256').update(x).digest('hex');
const original=readFileSync('benchmark/fixtures/commons-0016.jpg');
const jpeg=readFileSync('benchmark/fixtures/commons-0003.jpg');
const base64=b=>b.toString('base64');
const png=async()=>{
 const width=96,height=128,pixels=Buffer.alloc(width*height*4);
 for(let y=9;y<height-9;y++)for(let x=10;x<width-10;x++){
  const a=1-Math.pow((x-width/2)/(width*.43),2)-
   Math.pow((y-height/2)/(height*.44),2);
  if(a>0){const o=(y*width+x)*4;
   pixels[o]=242;pixels[o+1]=243;pixels[o+2]=239;pixels[o+3]=230;}
 }
 return sharp(pixels,{raw:{width,height,channels:4}}).png({compressionLevel:8}).toBuffer();
};
const make=async()=>{
 const bytes=await png(),maskSHA=sha(bytes),jpg=sha(jpeg);
 const row={id:'saved-blouse',ownerId:'owner-A',sourceId:'commons-0016',
  sourceSHA256:SRC,sourceHash:SRC,sourceHashVerified:true,
  category:'Tops',itemType:'Blouse',ownerReviewed:true,humanReviewedSource:true,
  reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',
  originalPhoto:{sha256:SRC,image:'data:image/jpeg;base64,'+base64(original)},
  cutoutSHA256:jpg,
  segmentHint:{verified:true,ownerReviewedInstance:true,originalSHA256:SRC,
   cutoutSHA256:jpg,cutoutImage:'data:image/jpeg;base64,'+base64(jpeg),
   ownerAlphaPNG189:'data:image/png;base64,'+base64(bytes),
   ownerAlphaSHA256189:maskSHA,ownerAlphaOwnerId189:'owner-A',
   ownerAlphaSourceId189:'commons-0016',
   ownerAlphaReviewState189:'owner-asserted-reviewed-not-independently-witnessed'}};
 const review={ownerId:'owner-A',garmentId:'saved-blouse',sourceId:'commons-0016',
  originalSourceSHA256:SRC,cutoutSHA256:jpg,ownerReviewed:true,
  humanReviewedSource:true,reviewedInstance:true,
  verifiedCutoutSeparatedFromOriginal:true,
  originalJPEGBytesSHA256Verified:true,cutoutJPEGBytesSHA256Verified:true,
  releaseAuthorized:false,familyAlpha:'HOLD'};
 return {row,review,maskSHA,opts:{row,review,ownerId:'owner-A',cryptoImpl:webcrypto,decodeBase64:atob}};
};
test('P189 independently WebCrypto SHA-verifies real RGBA private PNG with distinct JPEG source identities',async()=>{
 const x=await make();
 const m=inspectOwnerMaskRecord189(x.opts);
 assert.equal(m.privatePNG_SHA256,x.maskSHA);
 assert.notEqual(m.privatePNG_SHA256,m.sourceJPEG_SHA256);
 assert.notEqual(m.privatePNG_SHA256,m.cutoutJPEG_SHA256);
 const proof=await attestOwnerMaskPNGBytes189(x.opts);
 assert.equal(proof.width,96);assert.equal(proof.height,128);
 assert.equal(proof.actualPNGBytesWebCryptoVerified,true);
 assert.equal(proof.segmentationAccuracyCertified,false);
 assert.equal(proof.independentlyHumanReviewed,false);
 assert.equal(proof.releaseAuthorized,false);
});
test('P189 wrong owner, stale review, fake PNG and unsupported identity all fail closed',async()=>{
 for(const alter of [
  x=>{x.row.ownerId='owner-B';},
  x=>{x.row.segmentHint.ownerAlphaOwnerId189='owner-B';},
  x=>{x.row.segmentHint.ownerAlphaSourceId189='commons-0003';},
  x=>{x.row.segmentHint.ownerAlphaReviewState189='automatic';},
  x=>{x.row.segmentHint.ownerAlphaSHA256189=SRC;},
  x=>{x.row.segmentHint.ownerAlphaSHA256189=x.row.cutoutSHA256;},
  x=>{x.row.segmentHint.ownerAlphaPNG189='data:image/jpeg;base64,abc';},
  x=>{x.row.ownerReviewed=false;},
  x=>{x.review.cutoutJPEGBytesSHA256Verified=false;},
  x=>{x.review.originalSourceSHA256='f'.repeat(64);}
 ]){
  const x=await make();alter(x);
  assert.throws(()=>inspectOwnerMaskRecord189(x.opts),/P189/);
 }
});
test('P189 rejects altered actual PNG bytes or wrong dimensions despite unchanged saved SHA',async()=>{
 const x=await make();
 const wrong=await sharp({create:{width:96,height:128,channels:4,
  background:{r:220,g:220,b:220,alpha:.9}}}).png().toBuffer();
 x.row.segmentHint.ownerAlphaPNG189='data:image/png;base64,'+base64(wrong);
 await assert.rejects(()=>attestOwnerMaskPNGBytes189(x.opts),/P189/);
 const y=await make();
 y.row.segmentHint.ownerAlphaSHA256189='f'.repeat(64);
 await assert.rejects(()=>attestOwnerMaskPNGBytes189(y.opts),/P189/);
});
test('P189 P187 active lease invalidates if private mask bytes or mask approval state mutates in-place',async()=>{
 for(const field of ['ownerAlphaPNG189','ownerAlphaSHA256189',
  'ownerAlphaReviewState189','ownerAlphaOwnerId189']){
  const x=await make();
  const guard=captureReviewedCutoutLease187({
   row:x.row,receipt:x.review,ownerId:'owner-A',generation:12,revision:3});
  guard.assertCurrent({row:x.row,ownerId:'owner-A',generation:12,revision:3});
  x.row.segmentHint[field]='changed';
  assert.throws(()=>guard.assertCurrent({
   row:x.row,ownerId:'owner-A',generation:12,revision:3}),/P187/);
 }
});
test('P189 isolation and browser source render receipt: never claim geometry or independently witnessed review',()=>{
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 const app=readFileSync('research/native-consumer-board-04/consumer-board-controller.mjs','utf8');
 const donor=readFileSync('scripts/install-owner-reviewed-cutout-texture-188.mjs','utf8');
 const browser=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 const texture=readFileSync('research/owner-reviewed-cutout-texture-188/private-cutout-texture.mjs','utf8');
 for(const t of ['photoOwnerAlpha189','ownerAlphaMaskTextureApplied189:active',
  'ownerAlphaMaskSourceGeometryChanged189:false','ownerAlphaMaskHumanReviewIndependentlyWitnessed189:false'])
  assert.ok(bridge.includes(t),t);
 for(const t of ['await attestOwnerMaskPNGBytes189','maskEnabled189',
  'requireReviewedCutoutLease187(receipt)','ownerAlphaPNG189:row.segmentHint.ownerAlphaPNG189'])
  assert.ok(app.includes(t),t);
 for(const t of ['ownerMaskPixelsOnSkinnedGarment189','reviewedPrivateOwnerMaskSHA189',
  'OWNER-ASSERTED PNG alpha','GEOMETRY still uses the licensed source silhouette'])
  assert.ok(donor.includes(t),t);
 for(const t of ['decodeReviewedOwnerMask189','originalMask=reviewedAlpha189.mask',
  'privateOwnerAlphaPixelMask189:reviewedAlpha189!==null'])
  assert.ok(texture.includes(t),t);
 for(const t of ['PHOTO_OWNER_ALPHA189','ownerAlphaMaskTextureApplied189,true',
  'ownerMaskWebCryptoVerifiedBeforeAndAfterDonor189:true',
  'ownerAlphaMutationRevokedReal3D189=true'])
  assert.ok(browser.includes(t),t);
});
