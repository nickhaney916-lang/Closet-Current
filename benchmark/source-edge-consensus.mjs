// Experimental second-model agreement for original-pixel edge proposals.
// The second mask must come from a separate segmentation or object-matting
// model, not the coarse-mask algorithm being evaluated. Cross-model agreement
// is NOT a human-approved garment outline or proof of shadow-free clipping.
// Never imported by the customer app or used to change recognition or colors.
import {scoreSyntheticEdgeTrial} from './source-resolution-edge-trial.mjs';

export function intersectIndependentEdgeSupport(trial,objectAlpha,{
 threshold=224,sourceWidth,sourceHeight
}={}){
 const base=trial?.baseline,proposal=trial?.candidate;
 const n=sourceWidth*sourceHeight;
 if(!Number.isInteger(sourceWidth)||!Number.isInteger(sourceHeight)||
    sourceWidth<12||sourceHeight<12||n>4_000_000||
    !base||!proposal||base.length!==n||proposal.length!==n||
    !objectAlpha||objectAlpha.length!==n||
    !Number.isInteger(threshold)||threshold<192||threshold>255)
  throw Error('Invalid independent-object edge evidence or dimensions');
 const candidate=new Uint8Array(n);
 let modelProposed=0,agreed=0,rejectedBySecondModel=0;
 for(let i=0;i<n;i++){
  const old=base[i],newPixel=proposal[i],support=objectAlpha[i];
  if((old!==0&&old!==1)||(newPixel!==0&&newPixel!==1)||
    !Number.isInteger(support)||support<0||support>255||
    (old&&!newPixel))throw Error('Invalid edge model output');
  if(old){candidate[i]=1;continue;}
  if(!newPixel)continue;
  modelProposed++;
  if(support>=threshold){candidate[i]=1;agreed++;}
  else rejectedBySecondModel++;
 }
 return {baseline:new Uint8Array(base),candidate,modelProposed,addedPixels:agreed,
  rejectedBySecondModel,secondModelAgreement:agreed,
  sourcePixelsOnly:true,originalAndRecognitionUntouched:true,
  verifiedIndependentModel:false,verifiedRealShadowRemoval:false,
  realPhotoAccuracyMeasured:false,productionAuthorized:false};
}

// Acceptance is based on *actual* reference scores supplied by the evaluator,
// never on the number of changed pixels or a visual improvement alone.
// Synthetic tests exercise this rule but cannot approve a real customer model.
export function assessSyntheticEdgeSafety(scenarios){
 if(!Array.isArray(scenarios)||scenarios.length<3)throw Error('Expected clean, ambiguous, and pale validation cases');
 const names=new Set(),results=[];
 for(const entry of scenarios){
  if(!['clean','shadow','pale'].includes(entry?.name)||names.has(entry.name)||
    !entry.score||!Number.isFinite(entry.score.candidate?.falsePositive)||
    !Number.isFinite(entry.score.baseline?.falsePositive)||
    !Number.isFinite(entry.score.candidate?.recall)||
    !Number.isFinite(entry.score.baseline?.recall))
   throw Error('Invalid synthetic edge reference case');
  names.add(entry.name);
  results.push({name:entry.name,addedBackground:entry.score.candidate.falsePositive-entry.score.baseline.falsePositive,
   gainedRecall:entry.score.candidate.recall-entry.score.baseline.recall});
 }
 if(!['clean','shadow','pale'].every(name=>names.has(name))||names.size!==3)
  throw Error('All three independent synthetic stress cases are required');
 const clean=results.find(x=>x.name==='clean'),pale=results.find(x=>x.name==='pale'),
  failures=results.filter(x=>x.addedBackground>0||x.gainedRecall<0);
 if(clean.gainedRecall<=0)failures.push({name:'clean-no-improvement'});
 if(pale.addedBackground>0)failures.push({name:'pale-background-admission'});
 const syntheticQualityGatePassed=failures.length===0;
 return {status:syntheticQualityGatePassed?'synthetic-tests-only':
   'rejected-synthetic-contamination-or-regression',
  syntheticQualityGatePassed,failedScenarios:[...new Set(failures.map(x=>x.name))],
  results,independentlyApprovedRealReferences:0,
  candidateEligibleForCustomerUse:false,productionAuthorized:false};
}
export function scoreSyntheticConsensus(name,truth,trial,width,height){
 return {name,score:scoreSyntheticEdgeTrial(truth,trial,width,height,{label:'synthetic-'+name})};
}
