#!/usr/bin/env node
import fs from 'node:fs';
import {evaluateFootwearLayerTradeoffs} from '../benchmark/footwear-layer-tradeoffs.mjs';
const [manifest32,results32,manifest16,results16,manifest11,results11,locked,framing,cross,output]=process.argv.slice(2);
if(!output)throw Error('Usage: node scripts/evaluate-footwear-layer-tradeoffs.mjs manifest32 results32 manifest16 results16 manifest11 results11 locked-source-list third-frame-audit cross-model-report output');
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const r=evaluateFootwearLayerTradeoffs([
 {name:'reviewed32',manifest:read(manifest32),results:read(results32)},
 {name:'holdout16',manifest:read(manifest16),results:read(results16)},
 {name:'fresh11',manifest:read(manifest11),results:read(results11)}
],read(locked),read(framing),read(cross));
fs.mkdirSync((await import('node:path')).dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(r,null,2));
console.log('FOOTWEAR_LAYER_TRADEOFF '+JSON.stringify({
 originals:r.actualOriginalPhotoCount,
 shoes:r.verifiedShoesTotal,
 blanketAnkleBootReview:{
  reviewed32:r.cohorts.reviewed32.correctSpecificFormDeferredVsUnreviewedManifest,
  holdout16:r.cohorts.holdout16.wrongSpecificFormDeferredVsUnreviewedManifest,
  fresh11:r.cohorts.fresh11.wouldDeferIds
 },
 sameModelStillWrong:r.wrongFormRemainsUnanimousAcrossSameModelOriginalFrames,
 crossModelScenes:r.wholeOutfitCrossModelReview.map(x=>({id:x.originalSourceId,disagreements:x.independentModelDisagreements})),
 productionChanged:r.productionScannerModified,
 modelImproved:false,
 releaseApproved:r.releaseApproved
}));
