import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {
 buildExposureLedger,screenProspectiveImages
} from '../research/mission1-visual-source-overlap-769/original-perceptual-ledger.mjs';
import {P59_EXPOSED_DIGESTS_774,P772_EXPOSED_DIGESTS_774,P792_EXPOSED_DIGESTS_792}
 from '../research/mission1-exposure-774/pinned-exposed-source-history.mjs';
import {P66_EXPOSED_DIGESTS} from '../research/mission1-sealed-human-holdout-768/prospective-gate.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const expected=[...P59_EXPOSED_DIGESTS_774,...P66_EXPOSED_DIGESTS,
 ...P772_EXPOSED_DIGESTS_774,...P792_EXPOSED_DIGESTS_792];
const forgedSourceMathFixture=()=>{
 assert.equal(expected.length,83);
 const fingerprints=expected.map((sourceSHA256,i)=>({
  sourceSHA256,width:144,height:136,
  views:Array.from({length:7},(_,j)=>(BigInt(i*47+j*991+7)*BigInt(i+3)).toString(16).padStart(16,'0'))
 }));
 // These 83 fingerprints are SYNTHETIC math oracles and do not pretend to be
 // built from actual original JPEG source bytes. Only CI's build-83 does that.
 const ledger={schema:'closet-current-exposed-photo-visual-ledger-769/v1',
  realSourcePhotos:83,historicalSourcePhotos:59,publishedHumanMaskSourcePhotos:6,
  newerPublisherDevelopmentSources:8,newestPublisherDevelopmentSources:10,
  completeProspectiveVisualQuarantine:true,
  allActualOriginalsShaVerified:true,referenceOnly:true,independentGroundTruthNewlyCreated:0,
  exactSourceSetSHA256:sha([...expected].sort().join('\n')),fingerprints,familyAlpha:'HOLD'};
 return ledger;
};
async function candidate(){
 const bytes=await sharp({create:{width:128,height:132,channels:3,
  background:{r:30,g:90,b:140}}}).jpeg({quality:85}).toBuffer();
 return {bytes,entry:{image:'synthetic-actual-bytes-not-human.jpg',sha256:sha(bytes)}};
}
test('P793 exact 83-development-source hash ledger includes ten newly exposed real model sources',()=>{
 assert.equal(new Set(expected).size,83);
 assert.equal(P792_EXPOSED_DIGESTS_792.length,10);
 assert.deepEqual(expected.slice(-10),P792_EXPOSED_DIGESTS_792);
});
test('P793 older 65/73 source visual ledgers cannot screen a new prospective test photo',async()=>{
 const x=await candidate(),ledger=forgedSourceMathFixture();
 for(const n of [65,73]){
  const legacy={...ledger,realSourcePhotos:n,completeProspectiveVisualQuarantine:false,
   fingerprints:ledger.fingerprints.slice(0,n),
   exactSourceSetSHA256:sha(expected.slice(0,n).sort().join('\n'))};
  await assert.rejects(screenProspectiveImages({ledger:legacy,
   knownExposedSHA256:expected.slice(0,n),requireComplete83:true,
   candidates:[x.entry],readCandidate:async()=>x.bytes}),/complete original-decoded 83-source registry/);
 }
});
test('P793 source-complete 83 math-receipt does NOT approve visual nonmatches as human truth',async()=>{
 const x=await candidate();
 const report=await screenProspectiveImages({
  ledger:forgedSourceMathFixture(),knownExposedSHA256:expected,requireComplete83:true,
  candidates:[x.entry],readCandidate:async()=>x.bytes
 });
 assert.equal(report.verifiedExposedSources,83);
 assert.equal(report.all83GenuineOriginalsVisuallyScreened,true);
 assert.equal(report.prospectiveScreeningReady,true);
 assert.equal(report.candidatesApprovedAsUnseen,0);
 assert.equal(report.rightsAndTrainingExposureIndependentlyVerified,false);
 assert.equal(report.releaseAuthorized,false);
 assert.equal(report.familyAlpha,'HOLD');
});
test('P793 cannot omit, substitute or duplicate any P792 original while claiming 83-image visual quarantine',async()=>{
 const x=await candidate(),base=forgedSourceMathFixture();
 for(const alteration of [
  l=>l.fingerprints.pop(),
  l=>l.fingerprints[82].sourceSHA256='f'.repeat(64),
  l=>l.fingerprints[82].sourceSHA256=l.fingerprints[81].sourceSHA256,
  l=>l.exactSourceSetSHA256='e'.repeat(64),
  l=>l.fingerprints[10].views=['0'.repeat(16)]
 ]){
  const l=structuredClone(base);alteration(l);
  await assert.rejects(screenProspectiveImages({
   ledger:l,knownExposedSHA256:expected,requireComplete83:true,
   candidates:[x.entry],readCandidate:async()=>x.bytes
  }),/all exact previously exposed originals|exact source SHA set|crop fingerprint|strict visual review/);
 }
});
test('P793 cannot relabel a fake 83-item expected list with 10 newly fabricated unknown hashes',async()=>{
 const x=await candidate(),fakes=[...expected];
 fakes.splice(73,10,...Array.from({length:10},(_,i)=>(i+1000).toString(16).padStart(64,'0')));
 const ledger=forgedSourceMathFixture();
 await assert.rejects(screenProspectiveImages({
  ledger,knownExposedSHA256:fakes,requireComplete83:true,
  candidates:[x.entry],readCandidate:async()=>x.bytes
 }),/strict visual review/);
});
test('P793 source ledger construction refuses arbitrary 10-source extension without all genuine 8 pinned originals',async()=>{
 const originals=expected.map((sha256,i)=>({image:'synthetic-'+i+'.jpg',sha256}));
 await assert.rejects(buildExposureLedger({
  historical59:originals.slice(0,59),published6:originals.slice(59,65),
  additionalExposed10:originals.slice(-10),readOriginal:async()=>new Uint8Array([255,216,255,217])
 }),/full eight, then full ten/);
});
