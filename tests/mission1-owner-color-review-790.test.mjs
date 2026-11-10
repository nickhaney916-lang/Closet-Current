import test from 'node:test';
import assert from 'node:assert/strict';
import {admitSourceColorHint790 as admit} from '../research/mission1-source-color-owner-review-790/source-color-hint-gate.mjs';
const H='a'.repeat(64),M='b'.repeat(64);
const revision='a2489ea8e7ec1ee912190546bad31a4906ccca76';
const base=()=>({
 originalSHA256:H,
 sourceCategoryReview:{
  sourceSHA256:H,sourceLabelMapSHA256:M,modelRevision:revision,
  raster:[64,64],observedRegions:[{semanticRegionId:7}],
  possibleCategories:['Dresses'],ownerReviewed:false,
  verifiedIndependentHumanTruth:false,needsReview:true,autoSaveAllowed:false
 },
 colorReceipt:{
  schema:'m1-p789-real-semantic-mask-color-review/v1',
  sourceSHA256:H,modelLabelMapSHA256:M,modelRevision:revision,
  semanticFamily:'Dresses',modelSemanticRegionIds:[7],
  selectedSourcePixels:400,selectedFraction:+(400/4096).toFixed(5),
  sampledFromActualSourceRGBA:true,maskMembershipVerifiedBySHA:true,
  possiblePrimaryColor:'Blue',possibleSecondaryColor:null,
  palette:[{color:'Blue',share:.8}],
  candidateNeedsConfirmation:true,independentHumanColorVerified:false,
  modelGarmentIdentityVerified:false,modelGarmentMaskAccuracyVerified:false,
  sourcePixelOriginalPreserved:true,autoSaveAllowed:false,
  modelPromotionAuthorized:false,releaseAuthorized:false,familyAlpha:'HOLD'
 }
});
test('source-pinned real model color is a label-only, never-confirmed owner hint',()=>{
 const hint=admit(base());
 assert.equal(hint.possiblePrimaryColor,'Blue');
 assert.match(hint.displayHint,/manually enter the color/);
 assert.equal(hint.ownerColorConfirmed,false);
 assert.equal(hint.autoPopulateColor,false);
 assert.equal(hint.autoSaveAllowed,false);
 assert.equal('color' in hint,false);
 assert.equal('userAdjusted' in hint,false);
});
test('source-photo SHA or model source map transplant cannot display a forged color',()=>{
 for(const mutate of [
  x=>x.originalSHA256='f'.repeat(64),
  x=>x.sourceCategoryReview.sourceSHA256='f'.repeat(64),
  x=>x.colorReceipt.sourceSHA256='f'.repeat(64),
  x=>x.colorReceipt.modelLabelMapSHA256='f'.repeat(64),
  x=>x.colorReceipt.modelRevision='f'.repeat(40)
 ]){
  const x=base();mutate(x);assert.throws(()=>admit(x),/P790_OWNER_COLOR_REVIEW/);
 }
});
test('read-only owner hint requires the actual original source semantic family and bounds',()=>{
 for(const mutate of [
  x=>x.colorReceipt.semanticFamily='Shoes',
  x=>x.colorReceipt.modelSemanticRegionIds=[4],
  x=>x.sourceCategoryReview.raster=[128,128],
  x=>x.colorReceipt.selectedFraction=.99,
  x=>x.colorReceipt.selectedSourcePixels=9000,
  x=>x.sourceCategoryReview.observedRegions=[]
 ]){
  const x=base();mutate(x);assert.throws(()=>admit(x),/P790_OWNER_COLOR_REVIEW/);
 }
});
test('an assertion of model, owner or human approval is rejected, never merely displayed',()=>{
 for(const [field,value] of [
  ['independentHumanColorVerified',true],
  ['modelGarmentIdentityVerified',true],
  ['candidateNeedsConfirmation',false],
  ['autoSaveAllowed',true],
  ['releaseAuthorized',true],
  ['modelPromotionAuthorized',true],
  ['sampledFromActualSourceRGBA',false],
  ['sourcePixelOriginalPreserved',false]
 ]){
  const x=base();x.colorReceipt[field]=value;
  assert.throws(()=>admit(x),/P790_OWNER_COLOR_REVIEW/);
 }
});
test('unlisted output color and forged palette cannot become a native review hint',()=>{
 for(const mutate of [
  x=>x.colorReceipt.possiblePrimaryColor='Neon lime',
  x=>x.colorReceipt.palette=[{color:'Other',share:.8}],
  x=>x.colorReceipt.palette=[{color:'Blue',share:2}],
  x=>x.colorReceipt.palette=[{color:'Blue',share:-.3}]
 ]){
  const x=base();mutate(x);assert.throws(()=>admit(x),/P790_OWNER_COLOR_REVIEW/);
 }
});
test('uncertain real mask is allowed to remain a null color hint, not guessed',()=>{
 const x=base();x.colorReceipt.possiblePrimaryColor=null;
 x.colorReceipt.selectedSourcePixels=0;x.colorReceipt.selectedFraction=0;
 x.colorReceipt.palette=[];
 const r=admit(x);assert.equal(r.possiblePrimaryColor,null);
 assert.match(r.displayHint,/color unclear/);assert.equal(r.autoSaveAllowed,false);
});
test('wrong-category upper region cannot be presented as a dress color',()=>{
 const x=base();x.sourceCategoryReview.observedRegions=[{semanticRegionId:4}];
 assert.throws(()=>admit(x),/P790_OWNER_COLOR_REVIEW/);
});
