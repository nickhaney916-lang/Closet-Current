import test from 'node:test';
import assert from 'node:assert/strict';
import {PHOTO149,requiredVisualMatrix149,evaluateVisualEvidence149}
 from '../research/dual-humanoid-visual-evidence-149/source-visual-gate.mjs';

const frame=(engine='chromium',figure='female',width=320,denim='public',view='front')=>({
 engine,figure,width,denim,view,
 angle:PHOTO149.viewDegrees[view],
 originalShirtSHA256:PHOTO149.lockedShirt,
 originalDenimSHA256:PHOTO149.licensedDenim[denim],
 imageSHA256:'a'.repeat(64),
 imageWidth:Math.max(200,width-40),imageHeight:400,
 file:[engine,figure,width,denim,view].join('-')+'.png',
 rigBones:163,realSourceSkinnedGarments:true,genuineWebGLRendered:true,
 privateUserPhoto:false,releaseAuthorized:false
});
const k=x=>[x.engine,x.figure,x.width,x.denim,x.view].join('|');
test('P149 exact 144 photo-backed all-views male/female engine × width × source evidence cells',()=>{
 assert.equal(requiredVisualMatrix149.length,144);
 assert.equal(new Set(requiredVisualMatrix149).size,144);
 for(const figure of ['female','male'])for(const engine of ['chromium','webkit'])
 for(const width of [320,390,430])for(const source of ['public','second'])
  for(const v of Object.keys(PHOTO149.viewDegrees))
   assert.ok(requiredVisualMatrix149.includes([engine,figure,width,source,v].join('|')));
 assert.equal(PHOTO149.familyAlpha,'HOLD');
});
test('P149 missing entire matrix explicitly blocks release and any photorealistic claim',()=>{
 const x=evaluateVisualEvidence149();
 assert.equal(x.expectedFrames,144);
 assert.equal(x.missingFrameCount,144);
 assert.equal(x.independentHumanRealismReviewComplete,false);
 assert.equal(x.result,'RESEARCH_EVIDENCE_ONLY_HOLD');
 assert.equal(x.releaseAuthorized,false);
});
test('P149 valid genuine-source-shaped evidence is only research even if user injects human or hardware claims',()=>{
 const f=frame(),x=evaluateVisualEvidence149({
  frames:[f],verifiedImageKeys:[k(f)],
  independentHumanReview:true,physicalPhoneProof:true
 });
 assert.equal(x.inputFrames,1);
 assert.equal(x.independentlyByteVerifiedFrames,1);
 assert.equal(x.missingFrameCount,143);
 assert.equal(x.independentHumanRealismReviewComplete,false);
 assert.equal(x.physicalPhoneAcceptanceComplete,false);
 assert.equal(x.discardedUntrustedHumanClaim,true);
 assert.equal(x.discardedUntrustedPhoneClaim,true);
});
test('P149 correct all 144 manifest entries may prove coverage but never human appearance, live device or release',()=>{
 const frames=requiredVisualMatrix149.map(k=>{const [e,f,w,d,v]=k.split('|');return frame(e,f,+w,d,v);});
 const x=evaluateVisualEvidence149({frames,verifiedImageKeys:frames.map(k)});
 assert.equal(x.completeSourceGarmentViewportAngleCoverage,true);
 assert.equal(x.missingFrameCount,0);
 assert.equal(x.dressShoesJacketLayeringVerified,false);
 assert.equal(x.actualRealPersonalPhotoReconstructionAccepted,false);
 assert.equal(x.result,'RESEARCH_EVIDENCE_ONLY_HOLD');
 assert.equal(x.releaseAuthorized,false);
});
test('P149 rejects mismatched photo, forged source hashes, screenshot, mesh, account or missing byte verification',()=>{
 const good=frame();
 for(const change of [
  {rigBones:0},{rigBones:162},{angle:360},{genuineWebGLRendered:false},
  {originalShirtSHA256:'1'.repeat(64)},{originalDenimSHA256:'1'.repeat(64)},
  {imageSHA256:'0'},{imageWidth:150},{imageHeight:120},
  {realSourceSkinnedGarments:false},{privateUserPhoto:true},{releaseAuthorized:true},
  {file:'data:image/jpeg;base64,SECRET'},{file:'../garment.png'}
 ])assert.throws(()=>evaluateVisualEvidence149({
  frames:[{...good,...change}],verifiedImageKeys:[k(good)]
 }),/PHOTO149/);
 assert.throws(()=>evaluateVisualEvidence149({frames:[good],verifiedImageKeys:[]}),/PHOTO149/);
 assert.throws(()=>evaluateVisualEvidence149({frames:[good,good],verifiedImageKeys:[k(good)]}),/PHOTO149/);
 assert.throws(()=>evaluateVisualEvidence149({frames:[good],verifiedImageKeys:[k(good),k(good)]}),/PHOTO149/);
 assert.throws(()=>evaluateVisualEvidence149({donorHead:'forged',frames:[]}),/PHOTO149/);
});
