import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {
 P59_EXPOSED_DIGESTS_774,P772_EXPOSED_DIGESTS_774,P792_EXPOSED_DIGESTS_792,
 MISSION1_P772_PUBLISHED_DEVELOPMENT_SOURCES_774,
 MISSION1_MINIMUM_KNOWN_EXPOSED_ORIGINALS_774
} from '../research/mission1-exposure-774/pinned-exposed-source-history.mjs';
import {
 P66_EXPOSED_DIGESTS,sealProspectiveHoldout,sha256
} from '../research/mission1-sealed-human-holdout-768/prospective-gate.mjs';
import {screenProspectiveImages} from '../research/mission1-visual-source-overlap-769/original-perceptual-ledger.mjs';
import {signActualReviewerAnnotation774} from '../research/mission1-reviewer-774/offline-human-polygon-receipt.mjs';

const old=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const shaList=[...P59_EXPOSED_DIGESTS_774,...P66_EXPOSED_DIGESTS,...P772_EXPOSED_DIGESTS_774,...P792_EXPOSED_DIGESTS_792];
function fixture(){
 const keys={};
 for(const role of ['coordinator','reviewerA','reviewerB','adjudicator']){
  const pair=generateKeyPairSync('ed25519');
  keys[role]=pair.publicKey.export({type:'spki',format:'pem'});
 }
 const image=Buffer.alloc(256,5);
 image.set([255,216,255,192,0,17,8,0,32,0,32],0);
 image.set([255,217],254);
 const photo={id:'hold-new-synthetic-source',image:'new-synthetic-source.jpg',
  sha256:sha256(image),width:32,height:32,
  originalSourceURL:'https://example.invalid/synthetic-file',
  sourceLicenseURL:'https://example.invalid/no-real-rights',
  creatorCredit:'not a genuine photograph or real human label',
  rightsClaim:'source-reviewed'};
 const enroll=exposedSHA256=>sealProspectiveHoldout({
  photos:[photo],registrationId:'m1-cohort-synthetic-83-exclusion-test',
  modelSHA256:'8'.repeat(64),modelIndexSHA256:'9'.repeat(64),
  exposedSHA256,reviewerPublicKeys:keys
 },()=>image);
 return {keys,photo,image,enroll};
}
test('Mission1 immutable known source-history now covers all 59 historic + six P66 + eight P772 + ten P792 genuine exposed originals',()=>{
 assert.equal(old.length,59);
 assert.deepEqual(old.map(x=>x.sha256),P59_EXPOSED_DIGESTS_774);
 assert.equal(P66_EXPOSED_DIGESTS.length,6);
 assert.equal(P772_EXPOSED_DIGESTS_774.length,8);
 assert.equal(P792_EXPOSED_DIGESTS_792.length,10);
 assert.equal(MISSION1_MINIMUM_KNOWN_EXPOSED_ORIGINALS_774,83);
 assert.equal(new Set(shaList).size,83);
 assert.deepEqual(MISSION1_P772_PUBLISHED_DEVELOPMENT_SOURCES_774.map(x=>x.id),
  [17971,18204,12246,18179,18418,18406,9973,10927]);
 assert.equal(MISSION1_P772_PUBLISHED_DEVELOPMENT_SOURCES_774.filter(x=>x.visualSimilarityQuarantined).length,1);
});
test('Mission1 independent photo prospective admission cannot omit any of the 83 exposed original photo source SHA identities',()=>{
 const f=fixture();
 assert.equal(f.enroll(shaList).photos.length,1);
 for(const omission of [0,29,58,59,64,65,72,73,78,82]){
  const oldHashes=shaList.filter((_,i)=>i!==omission);
  assert.throws(()=>f.enroll(oldHashes),
   /exact model|historic|exposed source/);
 }
});
test('Mission1 83 source enroll refuses replacement of a known 59, 6, 8, or 10 SHA with counterfeit unrelated digest',()=>{
 const f=fixture();
 for(const replace of [2,60,71,73,80]){
  const bad=[...shaList];bad[replace]='f'.repeat(64);
  assert.throws(()=>f.enroll(bad),/exact model|historic/);
 }
});
test('Mission1 pre-existing 65-only visual candidate ledger must not be misrepresented as complete 73-original prospective independence screening',async()=>{
 const partial={schema:'closet-current-exposed-photo-visual-ledger-769/v1',
  realSourcePhotos:65,allActualOriginalsShaVerified:true,
  fingerprints:[],exactSourceSetSHA256:'0'.repeat(64)};
 await assert.rejects(screenProspectiveImages({
  ledger:partial,knownExposedSHA256:shaList,
  candidates:[{image:'anything.jpg',sha256:'f'.repeat(64)}],
  readCandidate:async()=>new Uint8Array([255,216,255,217]),
  requireComplete73:true
 }),/complete original-decoded source registry/);
});
test('Mission1 actual previously examined P772 source bytes cannot be rebranded as unseen human annotation by falsifying reviewer enrollment',()=>{
 const f=fixture();
 for(const exposed of P772_EXPOSED_DIGESTS_774){
  const altered={...f.photo,sha256:exposed};
  assert.throws(()=>sealProspectiveHoldout({
   photos:[altered],registrationId:'m1-cohort-synthetic-83-exclusion-test',
   modelSHA256:'8'.repeat(64),modelIndexSHA256:'9'.repeat(64),
   exposedSHA256:shaList,reviewerPublicKeys:f.keys
  },()=>f.image),/previously exposed source image/);
 }
});

test('P792 all ten SHA-pinned genuine B0-tested publisher originals can never be enrolled as an unseen human benchmark',()=>{
 const f=fixture();
 for(const exposed of P792_EXPOSED_DIGESTS_792){
  const altered={...f.photo,sha256:exposed};
  assert.throws(()=>sealProspectiveHoldout({
   photos:[altered],registrationId:'m1-cohort-synthetic-83-exclusion-test',
   modelSHA256:'8'.repeat(64),modelIndexSHA256:'9'.repeat(64),
   exposedSHA256:shaList,reviewerPublicKeys:f.keys
  },()=>f.image),/previously exposed source image/);
 }
});
test('P792 human signer refuses every model-exposed original SHA despite an otherwise correctly registered reviewer key set',()=>{
 const f=fixture();
 for(const digest of P792_EXPOSED_DIGESTS_792){
  const sealed=f.enroll(shaList);
  // Attempt transplant of previously model-exposed SHA into a pre-existing
  // signature-compatible seal. No real source-original is relabeled human.
  sealed.photos[0].sha256=digest;
  assert.throws(()=>signActualReviewerAnnotation774({
   seal:sealed,reviewerPublicKeys:f.keys,reviewerId:'reviewerA',
   photoId:f.photo.id,photoJPEG:f.image,
   annotations:{sourceId:f.photo.id,sourceSHA256:digest,regions:[]},
   reviewerDeclaration:{directHumanTracing:true,notShownModelPredictions:true,
    notModelGenerated:true,annotationPreparedIndependently:true}
  }),/no registered new holdout JPEG source/);
 }
});
