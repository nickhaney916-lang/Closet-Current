import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {inspectPrivateCutoutTextureInputs188}
 from '../research/owner-reviewed-cutout-texture-188/private-cutout-texture.mjs';
import {inspectOwnerReviewedCutout186,attestOwnerReviewedCutoutBytes186}
 from '../research/owner-cutout-photo-fit-186/review-contract.mjs';
import {captureReviewedCutoutLease187}
 from '../research/pre-webgl-owner-cutout-187/cutout-lease.mjs';

const SOURCE='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const MASK='a'.repeat(64);
const jpg=b=>'data:image/jpeg;base64,'+b.toString('base64');
const original=readFileSync('benchmark/fixtures/commons-0016.jpg');
const cutout=readFileSync('benchmark/fixtures/commons-0003.jpg');
const sha=b=>createHash('sha256').update(b).digest('hex');
const CUTOUT=sha(cutout);
const asset=()=>({sourceId:'commons-0016',originalSourceSHA256:SOURCE,
 privateCutoutJPEGBytesSHA256:CUTOUT,cutoutImage:jpg(cutout),
 ownerReviewed:true,originalJPEGVerified:true,cutoutJPEGVerified:true,
 familyAlpha:'HOLD',releaseAuthorized:false});
const blouse=()=>({id:'commons-0016',sourceSHA256:SOURCE,
 originalVerified:true,cutoutVerified:true,sourceAssetsVerified:true,
 silhouette62:{accepted:true},cutoutSHA256:MASK});

function row(){
 return {id:'blouse',ownerId:'owner-A',sourceId:'commons-0016',
  sourceSHA256:SOURCE,sourceHashVerified:true,sourceHash:SOURCE,
  category:'Tops',itemType:'Blouse',ownerReviewed:true,
  humanReviewedSource:true,reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',
  originalPhoto:{sha256:SOURCE,image:jpg(original)},cutoutSHA256:CUTOUT,
  segmentHint:{verified:true,ownerReviewedInstance:true,originalSHA256:SOURCE,
   cutoutSHA256:CUTOUT,cutoutImage:jpg(cutout)}};
}
const digest=async r=>attestOwnerReviewedCutoutBytes186({
 row:r,ownerId:'owner-A',cryptoImpl:webcrypto,decodeBase64:atob
});
function evidence(r){
 return {selection:{ownerId:'owner-A',slots:{top:'blouse'}},
  sources:{ownerId:'owner-A',sources:[{id:'blouse',sha256:SOURCE,category:'Tops',itemType:'Blouse'}]},
  proof62:{admitted:true,ownerId:'owner-A',itemId:'blouse',sourceSHA256:SOURCE,cutoutSHA256:MASK},
  render:{privateVisible:true,viewerReady:true,bones:163,viewerMode:'shirt',
   productionDeployed:false,releaseAuthorized:false,
   fitReceipts171:{shirt:{silhouette62:{sourcePhotoSilhouetteFit62:true,
    sourceShoulderEased185:true,shoulderHemWorldAxisCorrected185:true,
    independentShoulderCapSeamsRetained185:true,
    independentlyJoinedShoulderCapMeshes185:2,
    silhouetteSourceSHA256:SOURCE,cutoutSHA256:MASK}}},
   privateCutoutTexelsOnMesh188:true,
   reviewedPrivateCutoutJPEG_SHA188:CUTOUT,
   reviewedSourceMaskSHA188:MASK,
   ownerCutoutMaskFromOwnerPhoto188:false,
   privateCutoutHumanApprovalIndependentlyVerified188:false},
  verifiedCutout:r
 };
}
test('P188 separates verified owner JPEG fabric from public source PNG mask—never falsely identical',async()=>{
 assert.equal(sha(original),SOURCE);
 assert.notEqual(CUTOUT,SOURCE);
 assert.notEqual(CUTOUT,MASK);
 const review=await digest(row());
 const meta=inspectPrivateCutoutTextureInputs188({blouse:blouse(),asset:asset()});
 assert.equal(meta.sourceMaskSHA256,MASK);
 assert.equal(meta.ownerPrivateCutoutJPEG_SHA256,CUTOUT);
 assert.equal(meta.maskIsOwnerGenerated,false);
 const verdict=inspectOwnerReviewedCutout186(evidence(review));
 assert.equal(verdict.admitted,true);
 assert.equal(verdict.actualPrivateJPEGTexelsOnSkinnedMesh188,true);
 assert.equal(verdict.ownerSpecificAlphaSegmentationVerified188,false);
 assert.equal(verdict.independentlyReviewedByHuman,false);
 assert.equal(verdict.inferredRearNotPhotographed,true);
 assert.equal(verdict.releaseAuthorized,false);
 const guard=captureReviewedCutoutLease187({
  row:row(),receipt:review,ownerId:'owner-A',generation:12,revision:1
 });
 assert.equal(guard.receipt.cutoutSHA256,CUTOUT);
 assert.equal(guard.receipt.cutoutJPEGBytesSHA256Verified,true);
 assert.equal('cutoutImage' in guard.receipt,false);
});
test('P188 missing actual private skinned-mesh proof fails closed, even when JPEG review bytes pass',async()=>{
 const reviewed=await digest(row());
 for(const alter of [
  x=>{x.render.privateCutoutTexelsOnMesh188=false;},
  x=>{x.render.reviewedPrivateCutoutJPEG_SHA188=MASK;},
  x=>{x.render.reviewedSourceMaskSHA188=CUTOUT;},
  x=>{x.render.ownerCutoutMaskFromOwnerPhoto188=true;},
  x=>{x.render.privateCutoutHumanApprovalIndependentlyVerified188=true;},
  x=>{x.render.fitReceipts171.shirt.silhouette62.cutoutSHA256='b'.repeat(64);},
  x=>{x.proof62.cutoutSHA256='b'.repeat(64);},
  x=>{x.verifiedCutout.cutoutSHA256=MASK;},
  x=>{x.verifiedCutout.ownerId='owner-B';},
  x=>{x.render.bones=162;},
  x=>{x.sources.sources[0].itemType='Jacket';}
 ]){
  const candidate=structuredClone(evidence(reviewed));alter(candidate);
  const verdict=inspectOwnerReviewedCutout186(candidate);
  assert.equal(verdict.admitted,false,'P188 must reject forged provenance or absent pixels');
  assert.equal(verdict.mode,'original-photo-2d-fallback');
 }
});
test('P188 strictly checks private in-memory JPEG inputs before donor texture composition',()=>{
 for(const change of [
  a=>{a.cutoutImage='bad';},a=>{a.ownerReviewed=false;},
  a=>{a.originalJPEGVerified=false;},a=>{a.cutoutJPEGVerified=false;},
  a=>{a.privateCutoutJPEGBytesSHA256=SOURCE;},
  a=>{a.privateCutoutJPEGBytesSHA256=MASK;},
  a=>{a.sourceId='commons-0003';},
  a=>{a.releaseAuthorized=true;},
  a=>{a.familyAlpha='PASS';}
 ]){
  const candidate=asset();change(candidate);
  assert.throws(()=>inspectPrivateCutoutTextureInputs188({blouse:blouse(),asset:candidate}),/P188/);
 }
 for(const change of [
  b=>{b.silhouette62.accepted=false;},b=>{b.sourceSHA256='b'.repeat(64);},
  b=>{b.originalVerified=false;},b=>{b.cutoutVerified=false;}
 ]){
  const candidate=blouse();change(candidate);
  assert.throws(()=>inspectPrivateCutoutTextureInputs188({blouse:candidate,asset:asset()}),/P188/);
 }
});
test('P188 live controller and real detached 163-bone browser integration must be wired, isolated and honest',()=>{
 const controller=readFileSync('research/native-consumer-board-04/consumer-board-controller.mjs','utf8');
 const preview=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 const donor=readFileSync('scripts/install-owner-reviewed-cutout-texture-188.mjs','utf8');
 const browser=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 for(const token of ['withReviewedCutoutForRenderer188=async(receipt,renderer)=>',
  'requireReviewedCutoutLease187(receipt)',
  'await attestReviewedCutout186(row.id)',
  'const result=await renderer(asset);',
  'P188_OWNER_REVIEW_CHANGED_DURING_PRIVATE_TEXTURE_RENDER'])
  assert.ok(controller.includes(token),'missing actual private owner source handoff '+token);
 for(const token of ["params?.get('photoOwnerPositive188')==='research'",
  'consumer.withReviewedCutoutForRenderer188(preflightLease187,asset=>',
  'privateCutoutTexelsOnMesh188','inspectOwnerReviewedCutout186({',
  'ownerReviewedCutoutTextureOnMesh188:active&&',
  'ownerCutoutMaskFromUser188:false'])
  assert.ok(preview.includes(token),'missing native skinned-render gate '+token);
 for(const token of ['compositeOwnerReviewedCutout188',
  "canvas.getContext('2d'","globalCompositeOperation='destination-in'"])
  assert.ok(readFileSync('research/owner-reviewed-cutout-texture-188/private-cutout-texture.mjs','utf8')
   .includes(token),'missing private source cutout actual pixels '+token);
 for(const token of ['loadVettedOutfit3D01Sources({ownerReviewedCutout188=null}',
  'privateCutoutTexelsOnMesh188','OwnerTextureDisclosure188','scene'])
  assert.ok(donor.includes(token)||token==='scene','detached donor source missing '+token);
 for(const token of ['PHOTO_OWNER_POSITIVE188',
  'ownerReviewedCutoutTextureOnMesh188',
  'reviewRevocationClosesGenuineWebGL188=true',
  'originalAndOwnerCutoutJPEGIndependentlyWebCryptoVerified188'])
  assert.ok(browser.includes(token),'actual dual-browser acceptance missing '+token);
});
