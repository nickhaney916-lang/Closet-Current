import test from 'node:test';
import assert from 'node:assert/strict';
import {compareMission1Guard} from '../scripts/compare-mission1-guard.mjs';
function fixture(){
 const counts={curated:32,holdout:16,fresh:11},manifest={},baseline={},candidate={};let id=0;
 for(const [group,n] of Object.entries(counts)){
  manifest[group]=[];baseline[group]=[];candidate[group]=[];
  for(let k=0;k<n;k++){
   const negative=group==='holdout'&&k<3,photo='photo-'+(++id),category=negative?'Uncategorized':'Tops';
   const m={id:photo,mode:'single',expectedCategory:category,expectedType:negative?'Unknown':'T-shirt'};
   const row={id:photo,strong:!negative,categoryConfirmed:false,
    prediction:{category:negative?null:'Tops',type:negative?null:'T-shirt'}};
   manifest[group].push(m);baseline[group].push(row);candidate[group].push(structuredClone(row));
  }
 }
 return {manifest,baseline,candidate,run:()=>compareMission1Guard(manifest,baseline,candidate)};
}
test('Mission1 59 real inference row comparator never calls a benign missing ground truth score progress',()=>{
 const f=fixture(),x=f.run();
 assert.equal(x.summary.totalPhotos,59);assert.equal(x.summary.garmentPhotos,56);
 assert.equal(x.summary.negativesRejected,3);assert.equal(x.summary.after.unsafeAutomatic,0);
 assert.equal(x.humanGroundTruthIndependentlyAdjudicated,false);
 assert.equal(x.independentlyUnseenHoldout,false);
 assert.equal(x.familyAlpha,'HOLD');
});
test('Mission1 valid block of a wrong automatic type is safely preserved for category review',()=>{
 const f=fixture(),b=f.baseline.curated[0],a=f.candidate.curated[0];
 b.prediction.type='Sweatshirt';a.strong=false;a.categoryConfirmed=true;
 a.prediction.type='Unknown';
 a.diagnostics={mission1CrossFrame:{required:true,verified:false,sourceFramesCompared:2}};
 const x=f.run();
 assert.equal(x.summary.before.unsafeAutomatic,1);
 assert.equal(x.summary.after.unsafeAutomatic,0);
 assert.equal(x.summary.blockedUnsafeAutomatic,1);
});
test('Mission1 reject forged guard that changes previously auto-approved type without review',()=>{
 const f=fixture();f.candidate.curated[0].prediction.type='Sweatshirt';
 assert.throws(f.run,/silently mutate/);
});
test('Mission1 reject fake implicit new auto indexing, source-id leak and incorrect review downgrade',()=>{
 const a=fixture();a.baseline.curated[0].strong=false;assert.throws(a.run,/invent automatic/);
 const b=fixture();b.candidate.holdout[0].strong=true;
 b.candidate.holdout[0].prediction={category:'Tops',type:'T-shirt'};
 assert.throws(b.run,/nonclothing wrongly indexed/);
 const c=fixture();c.candidate.curated[0].strong=false;
 c.candidate.curated[0].categoryConfirmed=true;
 c.candidate.curated[0].prediction.type='Unknown';
 assert.throws(c.run,/did not safely preserve/);
});
