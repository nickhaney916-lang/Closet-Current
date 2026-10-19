#!/usr/bin/env node
// Offline, diagnostic-only comparison of THREE SAME-MODEL image framings.
// Never interprets frame agreement as a verified garment identity. No masks,
// original images, wardrobe records, thresholds or automatic saves are changed.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {clothingChoices} from '../public/local-catalog.mjs';
const sizes=[288,320,336];
const percent=(n,d)=>d?+(100*n/d).toFixed(2):null;
export function auditSubtypeFraming(manifest,results){
 if(!Array.isArray(manifest)||!manifest.length||!Array.isArray(results))throw Error('Expected source manifest and results arrays');
 const byId=new Map();
 for(const row of results){if(!row||typeof row.id!=='string'||!row.id||byId.has(row.id))throw Error('Invalid or duplicate result id');byId.set(row.id,row);}
 const cases=[];
 for(const source of manifest){
  if(source.mode!=='single'||!source.id||typeof source.expectedCategory!=='string')throw Error('Invalid source entry');
  const result=byId.get(source.id);
  if(!result)throw Error('Missing source result: '+source.id);
  const variants=result.framingComparison||[];
  const frames=sizes.map(size=>{
   const v=variants.find(x=>x.contentSize===size);
   if(!v||!Array.isArray(v.top))throw Error('Missing subtype frame '+size+': '+source.id);
   const choices=clothingChoices(v.top),top=choices[0]||null;
   return {contentSize:size,category:top?.category||null,type:top?.itemType||null,
    score:top?.score??null,secondScore:choices[1]?.score??null};
  });
  const emitted=!!result.prediction?.category&&result.prediction.category!=='Uncategorized';
  const predictedType=result.prediction?.type||null;
  const expectedTypes=source.acceptedTypes||[source.expectedType];
  const isClothing=source.expectedCategory!=='Uncategorized';
  const sameCategory=frames.every(v=>v.category===frames[0].category);
  const sameType=frames.every(v=>v.type===frames[0].type);
  const rawTypeAgree=emitted&&frames.every(v=>v.type===predictedType&&v.category===result.prediction.category);
  cases.push({id:source.id,expectedCategory:source.expectedCategory,expectedType:source.expectedType,
   baselineCategory:result.prediction?.category||null,baselineType:predictedType,
   baselineStrong:result.strong===true,baselineCorrectType:isClothing&&emitted&&
    result.prediction.category===source.expectedCategory&&expectedTypes.includes(predictedType),
   frames,frameCategoryAgreement:sameCategory,frameSubtypeAgreement:sameCategory&&sameType,
   baselineAndThreeFramesAgree:rawTypeAgree,
   originalRgbUntouched:true,sameModelNotIndependentValidation:true,
   humanConfirmedInstanceCount:0,autoSaveAuthorized:false});
 }
 const clothing=cases.filter(c=>c.expectedCategory!=='Uncategorized');
 const negatives=cases.filter(c=>c.expectedCategory==='Uncategorized');
 const wrongAutomaticType=clothing.filter(c=>c.baselineStrong&&!c.baselineCorrectType);
 const abstained=clothing.filter(c=>!c.baselineCategory);
 const agreeingWrong=wrongAutomaticType.filter(c=>c.baselineAndThreeFramesAgree);
 const strong=clothing.filter(c=>c.baselineStrong);
 const retainedStrong=strong.filter(c=>c.baselineAndThreeFramesAgree);
 const rejectedStrong=strong.filter(c=>!c.baselineAndThreeFramesAgree);
 const retainedWrong=retainedStrong.filter(c=>!c.baselineCorrectType);
 const deferredCorrect=rejectedStrong.filter(c=>c.baselineCorrectType);
 // Counterfactual only. The existing scanner still uses the original
 // classifier untouched; don't claim this policy is calibrated or safe
 // outside the fixed observed sample.
 return {version:1,modelViewType:'same-model-three-original-photo-framings',
  requiredFramings:sizes,sourcePhotos:cases.length,clothingPhotos:clothing.length,negativeControls:negatives.length,
  baselineWrongAutomaticTypeCount:wrongAutomaticType.length,
  baselineWrongAutomaticTypeIds:wrongAutomaticType.map(c=>c.id),
  baselineWrongTypeWithFullFrameAgreementCount:agreeingWrong.length,
  baselineWrongTypeWithFullFrameAgreementIds:agreeingWrong.map(c=>c.id),
  baselineWrongTypeWithFramingDisagreementIds:wrongAutomaticType.filter(c=>!c.baselineAndThreeFramesAgree).map(c=>c.id),
  simulatedUnanimityGate:{policy:'defer-automatic-specific-type-if-any-of-three-same-model-framings-disagree',
   evaluatedStrong:strong.length,retainedStrong:retainedStrong.length,deferredStrong:rejectedStrong.length,
   retainedWrongTypeIds:retainedWrong.map(c=>c.id),deferredWrongTypeIds:rejectedStrong.filter(c=>!c.baselineCorrectType).map(c=>c.id),
   deferredCorrectTypeIds:deferredCorrect.map(c=>c.id),
   onlyCounterfactual:true,productionPolicyChanged:false},
  baselineAbstentionIds:abstained.map(c=>c.id),
  frameCategoryAgreementPercent:percent(clothing.filter(c=>c.frameCategoryAgreement).length,clothing.length),
  frameSubtypeAgreementPercent:percent(clothing.filter(c=>c.frameSubtypeAgreement).length,clothing.length),
  observedFrameAgreementProvesPhysicalType:false,
  physicalGarmentRecall:null,independentMaskIoU:null,canPromoteThresholds:false,
  autoSavedGarments:0,cases};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [manifestPath,resultsPath,outputPath]=process.argv.slice(2);
 if(!manifestPath||!resultsPath)throw Error('Usage: node scripts/audit-subtype-third-framing.mjs manifest.json results.json [report.json]');
 const audit=auditSubtypeFraming(JSON.parse(fs.readFileSync(manifestPath,'utf8')),JSON.parse(fs.readFileSync(resultsPath,'utf8')));
 if(outputPath)fs.writeFileSync(outputPath,JSON.stringify(audit,null,2));
 console.log('SUBTYPE_THIRD_FRAME_AUDIT '+JSON.stringify({
  sourcePhotos:audit.sourcePhotos,clothingPhotos:audit.clothingPhotos,
  wrongAutomaticTypes:audit.baselineWrongAutomaticTypeIds,
  wrongTypesThatStillAgreeAcrossFrames:audit.baselineWrongTypeWithFullFrameAgreementIds,
  wrongTypesWithFramingDisagreement:audit.baselineWrongTypeWithFramingDisagreementIds,
  baselineAbstentions:audit.baselineAbstentionIds,
  frameSubtypeAgreementPercent:audit.frameSubtypeAgreementPercent,
  provenImprovement:false,autoSavedGarments:0
 }));
}
