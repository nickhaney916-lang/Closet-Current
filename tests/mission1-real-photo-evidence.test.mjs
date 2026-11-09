import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {auditMission1RealPhotos} from '../scripts/audit-mission1-real-photos.mjs';

function fixture(){
 const groups=[['curated',32],['holdout',16],['fresh',11]],
  locked=[],manifests={},predictions={},images={};
 let n=0;
 for(const [group,count] of groups){
  manifests[group]=[];predictions[group]=[];
  for(let i=0;i<count;i++){
   const id='commons-'+String(++n).padStart(4,'0'),
    image=id+'.jpg',negative=group==='holdout'&&i<3,
    expectedCategory=negative?'Uncategorized':i%3===0?'Tops':i%3===1?'Bottoms':'Shoes',
    expectedType=negative?'Unknown':i%3===0?'Blouse':i%3===1?'Jeans':'Sneakers',
    bytes=Buffer.alloc(700,i+11);bytes[0]=255;bytes[1]=216;
   bytes[bytes.length-2]=255;bytes[bytes.length-1]=217;
   // Different actual bytes with an independent stable synthetic fixture SHA.
   bytes[3]=n;images[image]=bytes;
   const source='https://commons.wikimedia.org/wiki/File:Test_'+id+'.jpg';
   locked.push({id,image,verified:true,
    sha256:createHash('sha256').update(bytes).digest('hex'),
    attribution:{license:'CC BY 4.0',source,author:'Fixture author'}});
   manifests[group].push({id,image,mode:'single',expectedCategory,expectedType,
    verified:true,source});
   predictions[group].push({id,prediction:negative?{category:null,type:null}:
    {category:expectedCategory,type:expectedType},strong:!negative,
    categoryConfirmed:false,elapsedMs:120});
  }
 }
 const run=()=>auditMission1RealPhotos({locked,manifests,predictions,
  photoBytes:image=>images[image],execution:'live-browser-ci',
  model:{indexSHA256:'a'.repeat(64),workerSHA256:'b'.repeat(64)}});
 return {run,locked,manifests,predictions,images};
}
test('Mission1 all 59 actual source bytes and 3 disjoint sets: denominator includes negatives, no fabricated segmentation labels',()=>{
 const f=fixture(),r=f.run();
 assert.equal(r.total.photos,59);assert.equal(r.total.garments,56);assert.equal(r.total.negatives,3);
 assert.equal(r.total.correctTopCategory,56);assert.equal(r.total.correctAcceptedType,56);
 assert.equal(r.total.autoIndexed,56);assert.equal(r.total.correctAutomatic,56);
 assert.equal(r.total.negativeRejected,3);assert.equal(r.total.categoryTopOnePercent,100);
 assert.equal(r.sourceProof.distinctSourcePhotos,59);
 assert.equal(r.sourceProof.inferenceHashLocked,true);
 assert.equal(r.labels.newIndependentHumanAdjudications,0);
 assert.equal(r.labels.verifiedIndependentPixelMasks,0);
 assert.equal(r.segmentationIoUPercent,null);assert.equal(r.colorAccuracyPercent,null);
 assert.equal(r.missionOneCompleted,false);assert.equal(r.releaseAuthorized,false);
 assert.equal(r.familyAlpha,'HOLD');
});
test('Mission1 wrong image byte SHA, duplicate identity, or tainted license cannot be used as real ground truth',()=>{
 const f=fixture();
 f.images['commons-0001.jpg']=Buffer.from(f.images['commons-0001.jpg']);
 f.images['commons-0001.jpg'][80]^=255;
 assert.throws(f.run,/JPEG bytes do not match locked SHA-256/);
 const b=fixture();b.locked[1].sha256=b.locked[0].sha256;
 assert.throws(b.run,/JPEG bytes do not match locked SHA-256|duplicate image identity/);
 const c=fixture();c.locked[1].attribution.license='Unknown proprietary';
 assert.throws(c.run,/source missing independent byte identity/);
});
test('Mission1 no score may silently drop missing predictions, duplicate outcomes, or overlap tune/holdout',()=>{
 const a=fixture();a.predictions.fresh.pop();
 assert.throws(a.run,/include all 11 photos/);
 const b=fixture();b.predictions.curated[1].id=b.predictions.curated[0].id;
 assert.throws(b.run,/duplicate\/invalid result/);
 const c=fixture();c.manifests.holdout[0].id=c.manifests.curated[0].id;
 assert.throws(c.run,/wrong split/);
});
test('Mission1 runtime error is not counted correct even if a stale prediction claims strong and correct',()=>{
 const f=fixture();f.predictions.curated[0].error='simulated-live-worker-failure';
 const r=f.run();assert.equal(r.total.runtimeErrors,1);
 assert.equal(r.total.autoIndexed,55);assert.equal(r.total.correctTopCategory,55);
 assert.equal(r.total.correctAcceptedType,55);
 assert.equal(r.missionOneCompleted,false);
});
test('Mission1 wrong auto-indexing remains visible separately from category review and abstention',()=>{
 const f=fixture();f.predictions.curated[0].prediction={category:'Bottoms',type:'Jeans'};
 f.predictions.curated[1].strong=false;f.predictions.curated[1].categoryConfirmed=true;
 f.predictions.curated[1].prediction.type='Unknown';
 f.predictions.curated[2].strong=false;f.predictions.curated[2].categoryConfirmed=false;
 f.predictions.curated[2].prediction={category:null,type:null};
 const r=f.run();assert.equal(r.total.unsafeAutomatic,1);
 assert.equal(r.splits.curated.summary.reviewSuggested,1);
 assert.equal(r.splits.curated.summary.abstained,1);
 assert.equal(r.splits.curated.summary.correctReviewCategory,1);
 assert.ok(r.splits.curated.failures.some(x=>x.reason==='incorrect_automatic_index'));
 assert.ok(r.splits.curated.summary.automaticCorrectConfidence95Percent[1]<=100);
 assert.equal(r.missionOneCompleted,false);
});
test('Mission1 no review subtype guessing and no fake negative auto-label',()=>{
 const f=fixture();f.predictions.holdout[3].strong=false;
 f.predictions.holdout[3].categoryConfirmed=true;
 assert.ok(f.run().splits.holdout.failures.some(x=>x.reason==='review_claimed_subtype'));
 const g=fixture();g.predictions.holdout[0].strong=true;
 g.predictions.holdout[0].prediction={category:'Tops',type:'T-shirt'};
 const r=g.run();assert.equal(r.total.negativeRejected,2);
 assert.equal(r.total.negativeFalsePositive,1);
});
test('Mission1 refuses generated release-grade claims from untrusted scores, wrong source, or missing model',()=>{
 const f=fixture();f.manifests.curated[0].source='https://commons.wikimedia.org/wiki/File:OTHER.jpg';
 assert.throws(f.run,/wrong split, invalid label or source/);
 const g=fixture();const r=auditMission1RealPhotos({
  locked:g.locked,manifests:g.manifests,predictions:g.predictions,
  photoBytes:image=>g.images[image],execution:'historical-replay'});
 assert.equal(r.sourceProof.actualBrowserInferenceIndependentlyObserved,false);
 assert.equal(r.sourceProof.inferenceHashLocked,false);
 assert.equal(r.eligibleToAdvanceToMissionTwo,false);
});
