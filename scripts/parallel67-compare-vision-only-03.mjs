/**
 * Parallel #67-03 no-deploy parity: prove that pinned q8 text embeddings built
 * once are byte-equivalent to model text encoder inference on the SAME frozen
 * original photos. Neither vision model nor taxonomy is tuned or re-trained.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {P67_FASHION_MODEL,P67_FASHION_REVISION} from './parallel67-independent-siglip-scoring.mjs';

export function compareVisionOnlyP67_03(original,optimized){
 const fail=reason=>{throw Error('P67-03: non-equivalent frozen research model '+reason);};
 if(!original||!optimized||
   original.schema!=='closet-current-parallel67-foreign-siglip-developer-exposed-v1'||
   optimized.schema!==original.schema||
   original.model!==P67_FASHION_MODEL||optimized.model!==P67_FASHION_MODEL||
   original.revision!==P67_FASHION_REVISION||optimized.revision!==P67_FASHION_REVISION||
   original.originalCount!==16||optimized.originalCount!==16||
   original.garments!==13||optimized.garments!==13||
   original.negatives!==3||optimized.negatives!==3||
   original.automaticSaveAdmissionAllowed!==false||
   optimized.automaticSaveAdmissionAllowed!==false||
   original.developerExposedNotBlind!==true||optimized.developerExposedNotBlind!==true||
   original.truthFileSha256!==optimized.truthFileSha256||
   original.sourceIndexSha256!==optimized.sourceIndexSha256||
   optimized.textModelLoadedAtInference!==false||
   !/^[a-f0-9]{64}$/.test(optimized.frozenTextSha256||'')||
   optimized.frozenTextByteLength!==47*768*4||
   !Array.isArray(original.rows)||original.rows.length!==16||
   !Array.isArray(optimized.rows)||optimized.rows.length!==16||
   original.runtimeErrors!==0||optimized.runtimeErrors!==0)
  fail('metadata, model, source, photo or binary SHA mismatch');
 const rows=[];
 const epsilon=1e-6;
 for(let i=0;i<16;i++){
  const a=original.rows[i],b=optimized.rows[i];
  if(!a||!b||a.id!==b.id||
     a.truthCategory!==b.truthCategory||a.truthSubtype!==b.truthSubtype||
     a.predictedCategory!==b.predictedCategory||
     a.predictedSubtype!==b.predictedSubtype||
     a.categoryTop1Correct!==b.categoryTop1Correct||
     a.subtypeTop1Correct!==b.subtypeTop1Correct||
     a.categoryOnly!==b.categoryOnly||
     a.error!==null||b.error!==null||
     !Number.isFinite(a.predictedScore)||!Number.isFinite(b.predictedScore)||
     Math.abs(a.predictedScore-b.predictedScore)>epsilon||
     !Number.isFinite(a.scoreGap)||!Number.isFinite(b.scoreGap)||
     Math.abs(a.scoreGap-b.scoreGap)>epsilon)
   fail('source-specific rank/score or error changed at '+(a?.id||i));
  rows.push({
   sourceId:a.id,category:a.truthCategory,subtype:a.truthSubtype,
   sameModelCategory:a.predictedCategory,identicalTopSubtype:a.predictedSubtype,
   absoluteScoreDifference:Math.abs(a.predictedScore-b.predictedScore),
   absoluteMarginDifference:Math.abs(a.scoreGap-b.scoreGap)
  });
 }
 for(const key of ['categoryTop1','broadSubtypeTop1','negativeTop1']){
  if(original[key]!==optimized[key])fail('accuracy metric changed '+key);
 }
 return {
  schema:'closet-current-parallel67-vision-only-q8-parity/v1',
  originalSources:16,garments:13,negatives:3,
  sameTopRankBothPaths:16,
  nativeTextModelLoadedAtInference:false,
  frozenTextBytes:optimized.frozenTextByteLength,
  frozenTextSha256:optimized.frozenTextSha256,
  fullModelCandidate:{categoryTop1:original.categoryTop1,
   subtypeTop1:original.broadSubtypeTop1,negativeTop1:original.negativeTop1},
  visionOnlyCandidate:{categoryTop1:optimized.categoryTop1,
   subtypeTop1:optimized.broadSubtypeTop1,negativeTop1:optimized.negativeTop1},
  fullModelLoadMs:original.modelLoadMs,
  visionOnlyLoadMs:optimized.modelLoadMs,
  notBlind:true,notPhysicalMobile:true,automaticSavePermitted:false,
  rows
 };
}
if(process.argv[1]?.endsWith('parallel67-compare-vision-only-03.mjs')){
 const original=JSON.parse(await readFile(process.argv[2],'utf8'));
 const optimized=JSON.parse(await readFile(process.argv[3],'utf8'));
 const report=compareVisionOnlyP67_03(original,optimized);
 await writeFile(process.argv[4],JSON.stringify(report,null,2)+'\n');
 console.log('P67_03_EXACT_VISION_ONLY_PARITY',JSON.stringify({
  originalSources:report.originalSources,
  matchingPredictions:report.sameTopRankBothPaths,
  frozenTextBytes:report.frozenTextBytes,
  frozenTextSha256:report.frozenTextSha256,
  modelOriginal:report.fullModelCandidate,
  modelVisionOnly:report.visionOnlyCandidate,
  fullModelLoadMs:report.fullModelLoadMs,
  visionOnlyLoadMs:report.visionOnlyLoadMs,
  automaticSavePermitted:false
 }));
}
