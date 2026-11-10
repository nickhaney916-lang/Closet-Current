/**
 * Mission 1 P779: compare two frozen real-model raster proposals without using
 * human annotations during candidate admission. Research-only, no deploy.
 *
 * Original source mask and publisher truth are carried as exact binary RLE
 * and SHA-256. Neither a source SHA nor an RLE is a human verification.
 */
import {createHash} from 'node:crypto';
import {scoreInstances} from '../mission1-external-human-evidence/instance-metrics.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=x=>{throw Error('M1_CONSENSUS_779: '+x)};
const HEX=/^[a-f0-9]{64}$/;
const classes=new Set([4,5,6,7,9]);
const revisions={b0:'a2489ea8e7ec1ee912190546bad31a4906ccca76',b2:'cb6ac44e641faa309f29561c1afe08d87ef52631'};
export function packModelMasks779(rows,width,height){
 const size=width*height;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||size>512*512||!Array.isArray(rows)||rows.length>128)
  fail('invalid model mask bounds');
 const keys=new Set();
 return rows.map(row=>{
  if(!row||typeof row.id!=='string'||!row.id||keys.has(row.id)||!classes.has(row.region)||
     !(Array.isArray(row.mask)||row.mask instanceof Uint8Array)||row.mask.length!==size)
   fail('invalid or duplicated original mask');
  keys.add(row.id);
  const raw=Uint8Array.from(row.mask);
  if(!raw.some(Boolean)||raw.some(v=>v!==0&&v!==1))fail('invalid or empty binary mask');
  const rle=[];let bit=0,count=0;
  for(const v of raw){if(v===bit)count++;else{rle.push(count);bit=v;count=1;}}
  rle.push(count);
  return {id:row.id,region:row.region,sourceMaskSHA256:hash(raw),rle};
 });
}
export function unpackModelMasks779(rows,width,height){
 const size=width*height;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||size>512*512||
    !Array.isArray(rows)||rows.length>128)fail('invalid raster evidence size');
 const keys=new Set();
 return rows.map(row=>{
  if(!row||typeof row.id!=='string'||!row.id||keys.has(row.id)||!classes.has(row.region)||
    !HEX.test(row.sourceMaskSHA256)||!Array.isArray(row.rle)||
    row.rle.length<2||row.rle.length>size+1)fail('invalid or duplicated pinned mask evidence');
  keys.add(row.id);
  const mask=new Uint8Array(size);let at=0,bit=0,positive=0;
  for(const n of row.rle){
   if(!Number.isSafeInteger(n)||n<0||at+n>size)fail('invalid original source mask RLE');
   if(bit){mask.fill(1,at,at+n);positive+=n;}
   at+=n;bit^=1;
  }
  if(at!==size||positive===0||hash(mask)!==row.sourceMaskSHA256)fail('corrupted original mask SHA or incomplete RLE');
  return {id:row.id,region:row.region,mask:Array.from(mask)};
 });
}
function overlap(a,b){
 let intersection=0,union=0;
 for(let i=0;i<a.mask.length;i++){intersection+=a.mask[i]&b.mask[i];union+=a.mask[i]|b.mask[i];}
 return union?intersection/union:0;
}
function validateRun(run,variant,sourceCohort,engine,expected){
 if(run?.modelComparisonVariant!==variant||run.sourceCohort!==sourceCohort||
   run.engine!==engine||run.releaseAuthorized!==false||run.familyAlpha!=='HOLD'||
   run.modelPromotionAuthorized!==false||run.licenseIndependentlyCleared!==false||
   !Array.isArray(run.rows)||run.rows.length!==expected.length||
   run.photos!==expected.length||!Number.isInteger(run.publisherHumanInstances))
  fail('untrusted or release-enabled actual model evidence');
 const bySHA=new Map();
 for(const r of run.rows){
  if(!HEX.test(r.sourceSHA256)||!expected.includes(r.sourceSHA256)||bySHA.has(r.sourceSHA256)||
     r.revision!==revisions[variant]||r.model!=='Xenova/segformer_'+variant+'_clothes'||
     !r.maskEvidence||!Number.isInteger(r.maskEvidence.width)||!Number.isInteger(r.maskEvidence.height))
   fail('unregistered, duplicate or wrong frozen-model/source original');
  const {width,height}=r.maskEvidence;
  const truth=unpackModelMasks779(r.maskEvidence.publisherTruth,width,height);
  const proposals=unpackModelMasks779(r.maskEvidence.seededReviewProposals,width,height);
  if(truth.length!==r.publisherHumanInstances||r.maskEvidence.sourceCohort!==sourceCohort)
   fail('human publisher or model image mask count mismatch');
  if(proposals.some(x=>!r.candidateReceipts?.some(y=>y.id===x.id&&y.maskSHA256===hash(Uint8Array.from(x.mask)))))
   fail('mask receipt was not observed in original SegFormer worker');
  const scored=scoreInstances({truth,predictions:proposals,width,height});
  if(scored.truePositives!==r.candidateInstances.truePositives||
     scored.falsePositives!==r.candidateInstances.falsePositives||
     scored.falseNegatives!==r.candidateInstances.falseNegatives)
   fail('model instance diagnostic inconsistent with actual pinned raster masks');
  bySHA.set(r.sourceSHA256,{row:r,truth,proposals,width,height,scored});
 }
 if(bySHA.size!==expected.length)fail('missing original photos');
 return bySHA;
}
/**
 * Fixed, blind-to-publisher, same-family overlap rule. Two independent frozen
 * source models must corroborate a B2 review proposal by IoU >= .25.
 * One B0 source proposal may corroborate at most one B2 source proposal.
 *
 * Threshold was fixed before calculating this development experiment; it is
 * NOT an optimized or validated release threshold.
 */
export function scoreTwoModelConsensus779({b0,b2,expectedSources,engine,sourceCohort='prior6'}={}){
 if(!['chromium','webkit'].includes(engine)||!['prior6','p772'].includes(sourceCohort)||
   !Array.isArray(expectedSources)||expectedSources.length<1||expectedSources.length>32||
   expectedSources.some(s=>!HEX.test(s))||new Set(expectedSources).size!==expectedSources.length)
  fail('exact source registry, browser and cohort required');
 const left=validateRun(b0,'b0',sourceCohort,engine,expectedSources);
 const right=validateRun(b2,'b2',sourceCohort,engine,expectedSources);
 const record=[],sum={b0:{tp:0,fp:0,fn:0},b2:{tp:0,fp:0,fn:0},consensus:{tp:0,fp:0,fn:0}};
 for(const sha of expectedSources){
  const a=left.get(sha),b=right.get(sha);
  if(a.width!==b.width||a.height!==b.height||a.truth.length!==b.truth.length)
   fail('incompatible frozen source resolution or human truth');
  const t0=new Map(a.truth.map(x=>[x.id,x]));
  for(const t of b.truth){
   const prev=t0.get(t.id);
   if(!prev||prev.region!==t.region||hash(Uint8Array.from(prev.mask))!==hash(Uint8Array.from(t.mask)))
    fail('publisher human polygon raster differs across model variants');
  }
  // Pairing is prediction-only. Do NOT inspect publisher polygons here.
  const edges=[];
  for(let i=0;i<a.proposals.length;i++)for(let j=0;j<b.proposals.length;j++){
   if(a.proposals[i].region!==b.proposals[j].region)continue;
   const iou=overlap(a.proposals[i],b.proposals[j]);
   if(iou>=.25)edges.push({i,j,iou});
  }
  edges.sort((x,y)=>y.iou-x.iou||x.i-y.i||x.j-y.j);
  const usedA=new Set(),usedB=new Set(),matched=[];
  for(const e of edges)if(!usedA.has(e.i)&&!usedB.has(e.j)){
   usedA.add(e.i);usedB.add(e.j);matched.push(e);
  }
  // This scoring uses the pre-existing publisher truth only AFTER the blind
  // model-to-model consensus candidates are frozen.
  const chosen=matched.map(e=>b.proposals[e.j]);
  const cm=scoreInstances({truth:b.truth,predictions:chosen,width:a.width,height:a.height});
  for(const [key,result] of [['b0',a.scored],['b2',b.scored],['consensus',cm]]){
   sum[key].tp+=result.truePositives;
   sum[key].fp+=result.falsePositives;
   sum[key].fn+=result.falseNegatives;
  }
  record.push({
   sourceSHA256:sha,b0Predictions:a.proposals.length,b2Predictions:b.proposals.length,
   corroboratedReviewOnly:chosen.length,matchCount:cm.truePositives,
   falsePositives:cm.falsePositives,missedPublisherInstances:cm.falseNegatives,
   matchedPredictionPairs:matched.map(e=>({
    b0MaskSHA256:hash(Uint8Array.from(a.proposals[e.i].mask)),
    b2MaskSHA256:hash(Uint8Array.from(b.proposals[e.j].mask)),overlapIoU:e.iou
   })),
   autoAccepted:0,ownerReviewed:0
  });
 }
 const metrics=x=>({truePositives:x.tp,falsePositives:x.fp,falseNegatives:x.fn,
  precision:x.tp+x.fp?x.tp/(x.tp+x.fp):null,
  recall:x.tp+x.fn?x.tp/(x.tp+x.fn):null,
  f1:2*x.tp+x.fp+x.fn?2*x.tp/(2*x.tp+x.fp+x.fn):null});
 return {
  schema:'mission1-exposed-frozen-model-mask-consensus-779/v1',
  browser:engine,cohort:sourceCohort,photos:expectedSources.length,
  originalPublisherHumanInstances:sum.b0.tp+sum.b0.fn,
  overlapThresholdFixedBeforeEvaluation:.25,
  rawB0SeededReview:metrics(sum.b0),rawB2SeededReview:metrics(sum.b2),
  twoModelCorroboratedOnly:metrics(sum.consensus),photoEvidence:record,
  humanIndependentBlindReviewVerified:false,rightsAndModelLicenseIndependentlyCleared:false,
  newUnseenHoldout:false,productionDeploymentAuthorized:false,
  modelPromotionAuthorized:false,missionOneCompleted:false,familyAlpha:'HOLD'
 };
}
