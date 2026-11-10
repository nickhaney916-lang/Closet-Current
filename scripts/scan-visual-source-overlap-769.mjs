#!/usr/bin/env node
/**
 * Research-only prospective visual-overlap scanner. The exposed baseline
 * includes 59 SHA-pinned Wikimedia originals plus SIX exact real published
 * Fashionpedia/Pexels originals. NEVER use private owner JPEGs in Actions.
 *
 * Local 'screen' results are PRIVATE local artifacts if user photographs
 * were supplied. Source similarity hits require separate independent review.
 * Nonhits do NOT certify independence, rights, or pretrained-model absence.
 */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join,resolve,basename} from 'node:path';
import {sha256, P66_EXPOSED_DIGESTS} from '../research/mission1-sealed-human-holdout-768/prospective-gate.mjs';
import {
 buildExposureLedger,screenProspectiveImages
} from '../research/mission1-visual-source-overlap-769/original-perceptual-ledger.mjs';
import {
 MISSION1_P772_PUBLISHED_DEVELOPMENT_SOURCES_774,
 MISSION1_P792_PUBLISHED_DEVELOPMENT_SOURCES_792,
 P772_EXPOSED_DIGESTS_774,P792_EXPOSED_DIGESTS_792
} from '../research/mission1-exposure-774/pinned-exposed-source-history.mjs';

const error=x=>{throw Error('M1_REAL_VISUAL_769_CLI: '+x);};
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const historical=read('benchmark/locked-photo-sources.json');
const publishedFile='research/real-garment-acceptance-66/fashionpedia-sample.json';
function getPublished(){
 if(!existsSync(publishedFile))
  error('P66 published six-source index unavailable; fetch pinned P66 reference, no incomplete 59-only acceptance');
 const sample=read(publishedFile);
 if(sample.rows?.length!==6||
    !P66_EXPOSED_DIGESTS.every(x=>sample.rows.some(row=>row.sha256===x)))
  error('six previously exposed publisher image digests did not match pinned source proof');
 return sample.rows.map(x=>({image:x.file_name,sha256:x.sha256}));
}
const published=getPublished();
const known65=[...historical.map(x=>x.sha256),...published.map(x=>x.sha256)];
const known83=[...known65,...P772_EXPOSED_DIGESTS_774,...P792_EXPOSED_DIGESTS_792];
if(new Set(known83).size!==83)error('full 83 source exposure ledger tampered');
const safeFile=x=>{
 if(typeof x!=='string'||!/^[a-zA-Z0-9._-]+\.jpe?g$/i.test(x)||basename(x)!==x)
  error('only safe original JPEG basenames allowed');
 return x;
};
function fromDirectory(dir){
 const root=resolve(dir);
 return async row=>readFileSync(join(root,safeFile(row.image)));
}
const [command,...args]=process.argv.slice(2);
if(command==='build'){
 if(args.length!==3)error('build HISTORICAL_JPEG_FOLDER PUBLISHED_SIX_JPEG_FOLDER OUTPUT_JSON');
 const [historicalDir,publishedDir,outFile]=args;
 const rows=historical.map(x=>({image:x.image,sha256:x.sha256}));
 const publicSource=fromDirectory(historicalDir),externalSource=fromDirectory(publishedDir);
 const ledger=await buildExposureLedger({
  historical59:rows,published6:published,
  readOriginal:async row=>rows.includes(row)?publicSource(row):externalSource(row)
 });
 writeFileSync(outFile,JSON.stringify(ledger,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({status:'65_ACTUAL_SOURCE_BYTES_VISUALLY_SCANNED_NOT_ADMISSION',
  totalExposedOriginals:ledger.realSourcePhotos,realJPEGHashChecks:65,
  visualLedgerSHA256:sha256(JSON.stringify(ledger)),familyAlpha:'HOLD'},null,2));
}else if(command==='build-83'){
 if(args.length!==4)error('build-83 HISTORIC_59_DIR P66_SIX_DIR PUBLISHER_P772_AND_P792_18_DIR OUT_JSON');
 const [historicDir,p66Dir,publisher18Dir,outFile]=args;
 const old59=historical.map(x=>({image:x.image,sha256:x.sha256}));
 const p772=MISSION1_P772_PUBLISHED_DEVELOPMENT_SOURCES_774.map(x=>({image:x.image,sha256:x.sha256}));
 const p792=MISSION1_P792_PUBLISHED_DEVELOPMENT_SOURCES_792.map(x=>({image:x.id+'.jpg',sha256:x.sha256}));
 const source59=fromDirectory(historicDir),source6=fromDirectory(p66Dir),source18=fromDirectory(publisher18Dir);
 const group59=new Set(old59.map(x=>x.sha256)),group6=new Set(published.map(x=>x.sha256));
 const ledger=await buildExposureLedger({
  historical59:old59,published6:published,additionalExposed8:p772,additionalExposed10:p792,
  readOriginal:async row=>group59.has(row.sha256)?source59(row):
   group6.has(row.sha256)?source6(row):source18(row)
 });
 if(ledger.realSourcePhotos!==83||ledger.completeProspectiveVisualQuarantine!==true||
    new Set(ledger.fingerprints.map(x=>x.sourceSHA256)).size!==83)
  error('missing genuine original full 83-source visual proof');
 writeFileSync(outFile,JSON.stringify(ledger,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({status:'83_ACTUAL_SOURCE_ORIGINALS_HASHED_SCREENING_READY',
  realJPEGs:83,sevenCropSourceHashes:ledger.fingerprints.length*7,
  exactSourceSetSHA256:ledger.exactSourceSetSHA256,
  legacy73Incomplete:false,independentHumanTruth:false,
  releaseAuthorized:false,familyAlpha:'HOLD'},null,2));
}else if(command==='screen'){
 if(args.length!==4)error('screen FULL_83_EXPOSURE_LEDGER_JSON CANDIDATE_SOURCE_MANIFEST_JSON CANDIDATE_JPEG_FOLDER OUTPUT_PRIVATE_JSON');
 const [ledgerPath,candidatesPath,candidateDir,outFile]=args;
 const items=read(candidatesPath);
 const report=await screenProspectiveImages({
  ledger:read(ledgerPath),knownExposedSHA256:known83,candidates:items,
  readCandidate:fromDirectory(candidateDir),requireComplete83:true
 });
 // Deliberately local; do not upload private candidate reports as CI artifacts.
 writeFileSync(outFile,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({
  status:report.nearDuplicateFlagCount?'SOURCE_OVERLAP_FLAGGED_NOT_ADMITTED':'NEEDS_INDEPENDENT_SOURCE_REVIEW',
  scanned:report.candidateOriginals,
  suspectedVisualOverlaps:report.nearDuplicateFlagCount,
  independentlyAdmitted:0,releaseAuthorized:false,familyAlpha:'HOLD'
 },null,2));
}else error('usage: build HISTORICAL_59_JPEG_FOLDER P66_SIX_JPEG_FOLDER OUT_JSON (legacy research only) | build-83 HISTORIC_59_DIR P66_SIX_DIR P772_P792_18_DIR OUT_JSON | screen FULL_83_LEDGER_JSON CANDIDATE_MANIFEST_JSON CANDIDATE_JPEG_FOLDER OUT_PRIVATE_JSON');
