import test from 'node:test';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {digest,objectDigest,verifyReference,measureQuality,evaluateEvidence,thresholdFailures,FEATURES} from '../benchmark/verified-mask-quality.mjs';
const risk=createRequire(import.meta.url)('../benchmark/dark-edge-diagnostic.cjs');
const policy={status:'proposed-unapproved',falseRemovalRateMax:.005,backgroundInclusionRateMax:.005,boundaryRecallMin:.99,featureRetentionMin:.995,alphaThreshold:128,boundaryTolerancePixels:0};
function sample(){
 const sourceBytes=Buffer.from('synthetic fixture, never a real approved label'),reference={image:'unit.png',sourceSha256:digest(sourceBytes),width:3,height:3,runs:[4,1,4],features:Object.fromEntries(FEATURES.map(f=>[f,{status:'not-applicable',reason:'synthetic unit test only'}]))};
 const proof=Buffer.from('synthetic test evidence'),rights={status:'verified-for-test-redistribution',license:'unit-only',sourceUrl:'https://example.invalid',evidencePath:'rights',evidenceSha256:digest(proof)};
 const record={referenceSha256:objectDigest(reference),image:reference.image,sourceSha256:reference.sourceSha256,scope:'full-visible-garment',method:'manual-independent-annotation',reviewStatus:'approved',annotator:'unit annotator',reviewer:'unit reviewer',reviewDate:'2026-10-19',reviewEvidence:'review',reviewEvidenceSha256:digest(proof),imageRights:rights,annotationRights:rights};
 const sourceRgba=new Uint8Array(36).fill(255),predictedAlpha=new Uint8Array(9);predictedAlpha[4]=255;
 const candidateRgba=sourceRgba.slice();for(let i=0;i<9;i++)candidateRgba[i*4+3]=predictedAlpha[i];
 return {sourceBytes,reference,registry:{schemaVersion:1,references:[record],policy},evidenceFiles:{rights:proof,review:proof},sourceRgba,predictedAlpha,candidateRgba};
}
test('missing full truth blocks without invented zero accuracy',()=>{const r=evaluateEvidence({reference:null});assert.equal(r.passed,false);assert.equal(r.metrics,null);});
test('reference provenance binds source, complete annotation, rights and review bytes',()=>{
 const s=sample();assert.equal(verifyReference(s).mask[4],1);
 for(const mutate of [x=>x.sourceBytes=Buffer.from('different'),x=>x.registry.references=[],x=>x.registry.references[0].method='model-output',x=>x.registry.references[0].reviewer='unit annotator',x=>x.registry.references[0].imageRights.status='unknown',x=>x.evidenceFiles.review=Buffer.from('changed')]){
  const x=sample();mutate(x);assert.throws(()=>verifyReference(x));
 }
 const x=sample();x.reference.runs=[0,9];assert.throws(()=>verifyReference(x));
});
test('exact false removal and background inclusion denominators, not pixel accuracy',()=>{
 const s=sample();s.predictedAlpha[4]=0;s.predictedAlpha[0]=255;for(let i=0;i<9;i++)s.candidateRgba[i*4+3]=s.predictedAlpha[i];
 const m=measureQuality(s.reference,s.predictedAlpha,s.sourceRgba,s.candidateRgba,policy);
 assert.equal(m.falseNegative,1);assert.equal(m.falsePositive,1);assert.equal(m.falseRemovalRate,1);assert.equal(m.falseInclusionRate,1/8);assert.equal(m.boundaryRecall,0);
});
test('boundary tolerance explicit; no resizing; RGB and fractional alpha measured separately',()=>{
 const s=sample();s.predictedAlpha[4]=127;s.candidateRgba[19]=127;s.candidateRgba[16]=250;
 const m=measureQuality(s.reference,s.predictedAlpha,s.sourceRgba,s.candidateRgba,policy);
 assert.equal(m.falseRemovalRate,1);assert.ok(Math.abs(m.alphaWeightedGarmentRemoval-128/255)<1e-12);assert.equal(m.rgbBytesChanged,1);
 assert.ok(thresholdFailures(m,policy).includes('originalRgbChanged'));
 assert.throws(()=>measureQuality(s.reference,new Uint8Array(4),s.sourceRgba,s.candidateRgba,policy));
 s.candidateRgba[19]=255;assert.throws(()=>measureQuality(s.reference,s.predictedAlpha,s.sourceRgba,s.candidateRgba,policy));
});
test('feature retention requires independently bound feature masks; unknown features block',()=>{
 const s=sample();s.reference.features={collars:{width:3,height:3,runs:[4,1,4]}};
 const m=measureQuality(s.reference,s.predictedAlpha,s.sourceRgba,s.candidateRgba,policy);assert.equal(m.features.collars.retention,1);assert.equal(m.features.hems.retention,null);
 assert.ok(thresholdFailures(m,policy).includes('feature:hems'));
 s.reference.features.collars.runs=[0,1,8];assert.throws(()=>measureQuality(s.reference,s.predictedAlpha,s.sourceRgba,s.candidateRgba,policy));
});
test('perfect synthetic silhouette does not approve thresholds, translucency or layering',()=>{
 const s=sample(),r=evaluateEvidence(s);assert.equal(r.metrics.intersectionOverUnion,1);assert.equal(r.passed,false);
 assert.ok(r.reasons.includes('quality-threshold-policy-unapproved'));assert.ok(r.reasons.includes('independent-transparency-evidence'));assert.ok(r.reasons.includes('independent-layering-evidence'));assert.equal(r.productionAuthorized,false);
});
test('dark-trim ambiguity is diagnostic only with immutable input and no error claim',()=>{
 const rgba=new Uint8Array(5*5*4).fill(25),a=new Uint8Array(25);a[12]=255;const before=rgba.slice(),ba=a.slice(),d=risk(rgba,a,5,5);
 assert.equal(d.removedDarkPixelsNearRetainedEdge,24);assert.equal(d.independentErrorCount,null);assert.equal(d.maskAltered,false);assert.deepEqual(rgba,before);assert.deepEqual(a,ba);
 assert.throws(()=>risk(rgba,a,6,5));
});
test('boundary tolerance never substitutes for exact garment retention',()=>{
 const s=sample();s.predictedAlpha[4]=0;s.predictedAlpha[5]=255;
 for(let i=0;i<9;i++)s.candidateRgba[i*4+3]=s.predictedAlpha[i];
 const m=measureQuality(s.reference,s.predictedAlpha,s.sourceRgba,s.candidateRgba,{...policy,boundaryTolerancePixels:1});
 assert.equal(m.boundaryRecall,1);assert.equal(m.exactReferenceBoundaryRetention,0);assert.equal(m.falseRemovalRate,1);
});
