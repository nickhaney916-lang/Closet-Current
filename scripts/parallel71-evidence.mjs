/**
 * Parallel #71 — real-original numeric evidence ledger.
 * Original publisher files are SHA checked during P834 browser inference; this
 * consumes only source IDs and numerical results. NO photo or account outputs.
 * This cohort was previously developer-exposed: never blind/calibrated.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {aggregateReal16Audit834} from './aggregate-m1-real-16-834.mjs';

const fail=s=>{throw Error('P71_EVIDENCE_BLOCKED: '+s);};
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const sha=/^[a-f0-9]{64}$/;
const categories=new Set(['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories']);
export function verifyHistoricalSource71(manifest,sources){
 if(!Array.isArray(manifest)||manifest.length!==16||
    !Array.isArray(sources))fail('unfrozen historic source cohort');
 const byId=new Map(sources.map(s=>[s.id,s]));
 const ids=new Set(),hashes=new Set(),origins=new Set();
 const entries=[];
 for(const m of manifest){
  const s=byId.get(m.id),a=s?.attribution;
  if(ids.has(m.id)||!s||!s.verified||!m.verified||
    m.image!==s.image||m.mode!=='single'||!categories.has(m.expectedCategory)||
    !m.conditions?.includes('visual-review')||!m.conditions?.includes('commons-public-photo')||
    !sha.test(s.sha256)||hashes.has(s.sha256)||!a?.license||
    !/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(a.source||'')||
    origins.has(a.source)||m.source!==a.source||
    !(a.license==='Public domain'&&a.licenseUrl===''||
      /^https?:\/\/creativecommons\.org\//.test(a.licenseUrl||'')))
   fail('missing license, unique original, frozen source, or publisher truth '+m.id);
  ids.add(m.id);hashes.add(s.sha256);origins.add(a.source);
  entries.push({id:m.id,sourceSha256:s.sha256,license:a.license,
   expectedCategory:m.expectedCategory,
   hasHumanPrimaryColorLabel:false,hasHumanMaskLabel:false,hasHumanOwnedPairLabel:false,
   labelStatus:'historical-publisher-reviewed-development-exposed'});
 }
 return entries;
}
export function verifyPartitionReceipts71(manifest,receipt,manifestSha256,sourceIndexSha256,browser,half){
 const ids=manifest.filter((_,i)=>i%2===(half==='a'?0:1)).map(x=>x.id);
 if(receipt?.browser!==browser||receipt?.partition!==half||
    receipt?.manifestSha256!==manifestSha256||
    receipt?.sourceIndexSha256!==sourceIndexSha256||
    JSON.stringify(receipt?.sourceIds)!==JSON.stringify(ids))
  fail('source SHA or partition identity mismatch '+browser+' '+half);
 return true;
}
export function makeEvidence71(manifest,sources,parts,receipts,manifestSha256,sourceIndexSha256){
 const truth=verifyHistoricalSource71(manifest,sources);
 if(!sha.test(manifestSha256)||!sha.test(sourceIndexSha256))
  fail('missing immutable manifest/index SHA-256');
 for(const browser of ['chromium','webkit'])for(const half of ['a','b'])
  verifyPartitionReceipts71(manifest,receipts[browser+'-'+half],
    manifestSha256,sourceIndexSha256,browser,half);
 const aggregate=aggregateReal16Audit834(manifest,parts);
 const byId=new Map(truth.map(x=>[x.id,x]));
 const browsers={};
 for(const browser of ['chromium','webkit']){
  const b=aggregate.browsers[browser],ledger=b.rows.map(r=>{
   const t=byId.get(r.id);
   return {...t,predictedCategory:r.predictedCategory,
    predictedType:r.predictedType,categoryMatched:r.categoryMatch,
    exactTypeMatched:r.exactTypeMatch,acceptedTypeMatched:r.acceptedTypeMatch,
    automatic:r.strong,review:r.categoryConfirmed&&!r.strong,
    abstained:!r.strong&&!r.categoryConfirmed,negativeRejected:r.negativeRejected,
    runtimeError:r.error};
  });
  const confusion={};
  for(const r of ledger){
   const actual=r.expectedCategory;
   const predicted=r.runtimeError?'RUNTIME_ERROR':
    r.automatic||r.review?r.predictedCategory||'UNRESOLVED':'ABSTAIN';
   confusion[actual]??={};
   confusion[actual][predicted]=(confusion[actual][predicted]||0)+1;
  }
  browsers[browser]={
   garmentDenominator:b.garments,nonclothingDenominator:b.negatives,
   correctAcceptedCategory:b.categoryMatches,
   correctAutoCategory:b.automaticCorrectCategory,
   wrongAutoCategory:b.automaticWrongCategory,
   wrongAutoSubtype:b.automaticWrongSubtype,
   supportedExactTypeDenominator:b.knownTypeCount,
   correctExactSubtype:b.exactTypeMatches,
   predeclaredBroadTypeDenominator:b.broadTypeCount,
   correctPredeclaredBroadType:b.acceptedTypeMatches,
   negativeRejected:b.negativeRejected,runtimeFailures:b.errors,
   unresolvedGarments:ledger.filter(r=>r.expectedCategory!=='Uncategorized'&&r.abstained).length,
   confusion,ledger
  };
 }
 return {
  format:'parallel71-history-only-real-photo-diagnostic-v1',
  parent:'899f1962d53546ec15ff62e8af3a1bcbf937dbdb',
  commit:process.env.GITHUB_SHA||null,
  manifestSha256,sourceIndexSha256,
  dataset:{sourceCount:16,garmentPhotos:13,nonclothingPhotos:3,
   sourceUniqueCount:16,licensesRecorded:16,
   evaluationStatus:'HISTORICAL_EXPOSED_NOT_INDEPENDENT_BLIND',
   independentNewHumanLabeledOriginals:0,
   primaryColorGroundTruthCount:0,maskGroundTruthCount:0,
   ownedPairGroundTruthCount:0},
  browsers,
  crossBrowser:aggregate.crossBrowser,
  notScored:{
   primaryColor:'UNKNOWN_NO_INDEPENDENT_LABELS',
   segmentationIoU:'UNKNOWN_NO_MASK_RECEIPTS',
   boundaryRecall:'UNKNOWN_NO_MASK_RECEIPTS',
   footwearPairPrecision:'UNKNOWN_NO_OWNED_PAIR_LABELS',
   wearableUnitCount:'UNKNOWN_NO_OWNED_UNIT_LABELS',
   confidenceCalibration:'UNKNOWN_NO_RAW_CALIBRATED_PROBABILITIES',
   endToEndPhotoToPrivateCloset:'BLOCKED_NO_AUTHORIZED_ACCOUNT_OR_PHYSICAL_PHONE',
   externalBlindAcceptance:'BLOCKED_NO_SOURCE_DISJOINT_INDEPENDENT_HUMAN_TRUTH'
  },
  modelAccuracyImproved:false,
  familyAlphaRelease:'HOLD_255_NO_MERGE_NO_DEPLOY'
 };
}
const isCli=process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href;
if(isCli){
 const manifestBytes=await readFile('benchmark/manifest-holdout-16.json');
 const sourcesBytes=await readFile('benchmark/locked-photo-sources.json');
 const manifest=JSON.parse(manifestBytes),sources=JSON.parse(sourcesBytes);
 const sourceSummary=verifyHistoricalSource71(manifest,sources);
 if(process.argv[2]==='--manifest-only'){
  console.log('P71_HISTORICAL_PROVENANCE_VALID_NOT_BLIND',JSON.stringify({
   originals:sourceSummary.length,manifestSha256:digest(manifestBytes),
   sourceIndexSha256:digest(sourcesBytes),independentNewHumanLabeled:0
  }));
 }else{
  const input=resolve(process.argv[2]||'benchmark/parallel71-real16');
  const parts={},receipts={};
  for(const browser of ['chromium','webkit'])for(const half of ['a','b']){
   const k=browser+'-'+half,p=join(input,'p71-'+k);
   parts[k]=JSON.parse(await readFile(join(p,'audit.json'),'utf8'));
   receipts[k]=JSON.parse(await readFile(join(p,'source-receipt.json'),'utf8'));
  }
  const report=makeEvidence71(manifest,sources,parts,receipts,
   digest(manifestBytes),digest(sourcesBytes));
  await mkdir(input,{recursive:true});
  await writeFile(join(input,'parallel71-evidence.json'),JSON.stringify(report,null,2)+'\n');
  const publicFields=['garmentDenominator','nonclothingDenominator',
   'correctAcceptedCategory','correctAutoCategory','wrongAutoCategory',
   'wrongAutoSubtype','supportedExactTypeDenominator','correctExactSubtype',
   'predeclaredBroadTypeDenominator','correctPredeclaredBroadType',
   'negativeRejected','unresolvedGarments','runtimeFailures'];
  const publicCounts=browser=>Object.fromEntries(publicFields.map(k=>[k,report.browsers[browser][k]]));
  console.log('P71_ACTUAL_MODEL_HISTORICAL_16_DIAGNOSTIC',JSON.stringify({
   chromium:publicCounts('chromium'),webkit:publicCounts('webkit'),
   groundTruthStatus:report.dataset.evaluationStatus,
   blindAccuracy:report.notScored.externalBlindAcceptance}));
 }
}
