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
}else if(command==='screen'){
 if(args.length!==4)error('screen EXPOSURE_LEDGER_JSON CANDIDATE_SOURCE_MANIFEST_JSON CANDIDATE_JPEG_FOLDER OUTPUT_PRIVATE_JSON');
 const [ledgerPath,candidatesPath,candidateDir,outFile]=args;
 const items=read(candidatesPath);
 const report=await screenProspectiveImages({
  ledger:read(ledgerPath),known65,candidates:items,
  readCandidate:fromDirectory(candidateDir)
 });
 // Deliberately local; do not upload private candidate reports as CI artifacts.
 writeFileSync(outFile,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({
  status:report.nearDuplicateFlagCount?'SOURCE_OVERLAP_FLAGGED_NOT_ADMITTED':'NEEDS_INDEPENDENT_SOURCE_REVIEW',
  scanned:report.candidateOriginals,
  suspectedVisualOverlaps:report.nearDuplicateFlagCount,
  independentlyAdmitted:0,releaseAuthorized:false,familyAlpha:'HOLD'
 },null,2));
}else error('usage: build HISTORICAL_JPEG_FOLDER PUBLISHED_JPEG_FOLDER OUTPUT_JSON | screen LEDGER_JSON CANDIDATE_MANIFEST_JSON CANDIDATE_JPEG_FOLDER OUTPUT_PRIVATE_JSON');
