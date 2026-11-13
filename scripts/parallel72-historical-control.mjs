/**
 * P72 measured genuine FashionCLIP historical-original controls.
 * Inputs: actual pinned P834 worker receipts from SHA-verified Commons JPEGs
 * in Chromium/WebKit. Owner-labeled learning does NOT exist for these images:
 * report eligible owner-learning denominator 0, not a fake accuracy gain.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {aggregateReal16Audit834} from './aggregate-m1-real-16-834.mjs';
const home=resolve(process.argv[2]||'benchmark/p72-real-original');
const mb=await readFile('benchmark/manifest-holdout-16.json');
const sb=await readFile('benchmark/locked-photo-sources.json');
const manifest=JSON.parse(mb),sources=JSON.parse(sb);
const sh=x=>createHash('sha256').update(x).digest('hex');
if(manifest.length!==16||new Set(manifest.map(x=>x.id)).size!==16)throw Error('P72_HISTORICAL_SOURCE_SET_CHANGED');
const byId=new Map(sources.map(x=>[x.id,x]));
for(const row of manifest){
 const source=byId.get(row.id);
 if(!source?.verified||!source?.attribution?.license||!source?.sha256||
    !/^[a-f0-9]{64}$/.test(source.sha256)||source.image!==row.image||
    row.source!==source.attribution.source||!row.verified||
    !row.conditions?.includes('visual-review'))throw Error('P72_UNVERIFIED_ORIGINAL '+row.id);
}
const parts={};
for(const engine of ['chromium','webkit'])for(const half of ['a','b']){
 const folder=join(home,'p72-'+engine+'-'+half);
 const receipt=JSON.parse(await readFile(join(folder,'source-receipt.json')));
 const ids=manifest.filter((_,i)=>i%2===(half==='a'?0:1)).map(x=>x.id);
 if(receipt.browser!==engine||receipt.partition!==half||
    receipt.manifestSha256!==sh(mb)||receipt.sourceIndexSha256!==sh(sb)||
    JSON.stringify(receipt.sourceIds)!==JSON.stringify(ids))
  throw Error('P72_INCOMPLETE_OR_FORGED_SOURCE_RECEIPT '+engine+half);
 parts[engine+'-'+half]=JSON.parse(await readFile(join(folder,'audit.json')));
}
const results=aggregateReal16Audit834(manifest,parts);
const counts=engine=>{
 const r=results.browsers[engine];
 return {
  clothingPhotos:r.garments,negativePhotos:r.negatives,
  categoryMatched:r.categoryMatches,categoryAutomaticallyCorrect:r.automaticCorrectCategory,
  categoryAutomaticallyWrong:r.automaticWrongCategory,
  wrongAutomaticSubtype:r.automaticWrongSubtype,
  knownExactTypeMatched:r.exactTypeMatches,knownExactTypeDenominator:r.knownTypeCount,
  acceptedBroadTypeMatched:r.acceptedTypeMatches,acceptedBroadTypeDenominator:r.broadTypeCount,
  nonclothingRejected:r.negativeRejected,runtimeFailures:r.errors
 };
};
const report={
 mode:'parallel72-existing-historical-genuine-photo-control',
 frozenManifestSha256:sh(mb),frozenOriginalIndexSha256:sh(sb),
 originalPublicPublisherJpegs:16,developerExposed:true,blindHumanOwnerTruth:false,
 actualModel:'unchanged-P842-FashionCLIP-original-worker',
 results:{chromium:counts('chromium'),webkit:counts('webkit')},
 correctionLearning:{
  status:'UNKNOWN_NO_INDEPENDENT_OWNER_CONFIRMED_ORIGINALS',
  ownerConfirmedTrainingSamples:0,ownerConfirmedValidationSamples:0,
  sealedOwnerConfirmedTestSamples:0,
  beforeCorrectSuggestions:null,afterCorrectSuggestions:null,
  heldOutLearningAccuracyDenominator:0,heldOutLearningAccuracyDelta:null,
  colorAccuracy:null,pairPrecision:null,confidenceCalibration:null
 },
 privateWardrobeWrites:0,noAutomaticLearningClaim:true
};
await mkdir(home,{recursive:true});
await writeFile(join(home,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log('P72_REAL_ORIGINAL_MODEL_DIAGNOSTIC_NOT_OWNER_LEARNING',JSON.stringify(report));
