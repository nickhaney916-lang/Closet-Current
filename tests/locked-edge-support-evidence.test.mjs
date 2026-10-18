import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectLockedSecondModelEvidence,summarizeLockedEdgeReadiness}
 from '../benchmark/locked-edge-support-evidence.mjs';
const SHA='a'.repeat(64),REV='de15b22ba131738a16dff04aab8bdf8dc32e3ac1';
function fixture(id='commons-0079',threshold=128){
 const image=id+'.jpg',entry={id,image,sourceSha256:SHA,reviewStatus:'pending',referenceMask:null};
 const baseline={image,sourceSha256:SHA,model:'Xenova/modnet',
  width:4,height:4,runs:[5,4,7],foregroundPixels:4};
 const candidate={image,sourceSha256:SHA,modelId:'onnx-community/BiRefNet_lite-ONNX',
  revision:REV,width:4,height:4,runs:[6,4,6],foregroundPixels:4,foregroundThreshold:threshold};
 return {entry,baseline,candidate};
}
test('actual threshold-128 BiRefNet comparison cannot pass high-alpha evidence gate',()=>{
 const x=fixture(),result=inspectLockedSecondModelEvidence(x.entry,x.baseline,x.candidate);
 assert.equal(result.status,'blocked-weak-binary-alpha-evidence');
 assert.equal(result.candidateBinaryThreshold,128);
 assert.equal(result.meetsRequestedAlphaThreshold,false);
 assert.equal(result.garmentAccuracyMeasured,false);
 assert.equal(result.productionAuthorized,false);
 assert.equal(result.modelComputationIndependentlyVerified,false);
 assert.deepEqual(result.maskDifferences,{addedPixels:1,removedPixels:1,sharedPixels:3,
  notAccuracy:true,verifiedShadowRemoval:false,verifiedGarmentRecovery:false});
});
test('higher alpha threshold can be recorded as experimental input, never approved as real accuracy',()=>{
 const x=fixture('commons-0049',224),result=inspectLockedSecondModelEvidence(x.entry,x.baseline,x.candidate);
 assert.equal(result.meetsRequestedAlphaThreshold,true);
 assert.equal(result.status,'eligible-for-experimental-input-only');
 assert.equal(result.fullAlphaConfidenceAvailable,false,'binary mask lacks native per-pixel alpha data');
 assert.equal(result.productionAuthorized,false);
});
test('wrong source digest, filename, unrelated photo, or dimensions are rejected',()=>{
 for(const alter of [
  x=>{x.candidate.sourceSha256='b'.repeat(64);},
  x=>{x.baseline.image='commons-0049.jpg';},
  x=>{x.candidate.image='commons-0094.jpg';},
  x=>{x.candidate.width=5;},
  x=>{x.entry.sourceSha256='invalid';}
 ]){
  const x=fixture();alter(x);
  assert.throws(()=>inspectLockedSecondModelEvidence(x.entry,x.baseline,x.candidate),
   /Source identity|Invalid locked|mismatch/i);
 }
});
test('same model pretending to be independent and an unpinned revision fail closed',()=>{
 for(const alter of [
  x=>{x.candidate.modelId='Xenova/modnet';},
  x=>{x.baseline.model='onnx-community/BiRefNet_lite-ONNX';},
  x=>{x.candidate.modelId='random/other-model';},
  x=>{x.candidate.revision='main';},
  x=>{delete x.candidate.foregroundThreshold;}
 ]){
  const x=fixture();alter(x);
  assert.throws(()=>inspectLockedSecondModelEvidence(x.entry,x.baseline,x.candidate),
   /provenance|threshold evidence/i);
 }
});
test('six real cases stay blocked without native high-confidence masks and human-approved outlines',()=>{
 const ids=['commons-0035','commons-0049','commons-0053','commons-0065','commons-0079','commons-0094'];
 const x=ids.map(id=>fixture(id));
 const manifest={schemaVersion:1,cases:x.map(y=>y.entry)};
 const baselines=new Map(x.map(y=>[y.entry.id,y.baseline]));
 const candidates=new Map(x.map(y=>[y.entry.id,y.candidate]));
 const result=summarizeLockedEdgeReadiness(manifest,baselines,candidates);
 assert.equal(result.photos,6);
 assert.equal(result.highConfidenceMaskCases,0);
 assert.equal(result.independentlyApprovedReferenceCases,0);
 assert.equal(result.accuracyMeasured,false);
 assert.equal(result.liveEdgeRecoveryEnabled,false);
 assert.equal(result.productionAuthorized,false);
 assert.equal(result.status,'blocked-incomplete-confidence-or-human-references');
});
