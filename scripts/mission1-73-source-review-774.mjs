#!/usr/bin/env node
/**
 * P774 strict 73-original-photo perceptual visual contamination review.
 *
 * The old 65-source P769 research experiments remain reproducible. Prospective
 * NEW independent human cohort admission MUST scan against all 73 originals
 * used during the entire M1 recognition development series through P773.
 * Source photos stay local. No upload or network requests here.
 *
 * Usage:
 *   node scripts/mission1-73-source-review-774.mjs build \
 *     OLD59_DIR P66_SIX_DIR P772_EIGHT_DIR LEDGER.json
 *   node scripts/mission1-73-source-review-774.mjs screen \
 *     LEDGER.json NEW_PHOTO_MANIFEST.json NEW_JPEG_DIR PRIVATE_REPORT.json
 */
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {resolve,join,basename} from 'node:path';
import {P66_EXPOSED_DIGESTS} from '../research/mission1-sealed-human-holdout-768/prospective-gate.mjs';
import {
 P59_EXPOSED_DIGESTS_774,P772_EXPOSED_DIGESTS_774,
 MISSION1_P772_PUBLISHED_DEVELOPMENT_SOURCES_774
} from '../research/mission1-exposure-774/pinned-exposed-source-history.mjs';
import {
 buildExposureLedger,screenProspectiveImages
} from '../research/mission1-visual-source-overlap-769/original-perceptual-ledger.mjs';

const fail=x=>{throw Error('M1_73_HISTORY_774: '+x)};
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const historical=read('benchmark/locked-photo-sources.json');
if(historical.length!==59||!historical.every(x=>P59_EXPOSED_DIGESTS_774.includes(x.sha256)))
 fail('canonical historical 59 source identities changed');
const pinnedSix=P66_EXPOSED_DIGESTS,pinnedEight=P772_EXPOSED_DIGESTS_774;
const known73=[...P59_EXPOSED_DIGESTS_774,...pinnedSix,...pinnedEight];
if(known73.length!==73||new Set(known73).size!==73)
 fail('pinned original photo identities not exactly 73 distinct byte digests');
const filename=s=>{
 if(typeof s!=='string'||!/^[-a-zA-Z0-9_.]+\.jpe?g$/i.test(s)||basename(s)!==s)
  fail('unsafe source JPEG filename');
 return s;
};
const fileReader=folder=>row=>{
 const file=join(resolve(folder),filename(row.image));
 if(statSync(file).size>8*1024*1024)fail('too large original source JPEG');
 return readFileSync(file);
};
const [cmd,...args]=process.argv.slice(2);
if(cmd==='build'){
 if(args.length!==4)fail('build HISTORIC59_FOLDER P66_SIX_FOLDER P772_EIGHT_FOLDER OUT_LEDGER_JSON');
 const [oldFolder,p66Folder,p772Folder,out]=args;
 const old=historical.map(x=>({image:x.image,sha256:x.sha256,origin:'historical'}));
 // Existing parallel P66 manifest is the original immutable six-source receipt
 // with publishers' source JPEG names, not any model-generated masks.
 const p66Index=read('research/real-garment-acceptance-66/fashionpedia-sample.json');
 if(p66Index.rows?.length!==6||
    !pinnedSix.every(x=>p66Index.rows.some(row=>row.sha256===x)))
  fail('prior six original publisher JPEG metadata do not match source SHA archive');
 const pub6=p66Index.rows.map(x=>({image:x.file_name,sha256:x.sha256,origin:'p66'}));
 const pub8=MISSION1_P772_PUBLISHED_DEVELOPMENT_SOURCES_774.map(x=>({
  image:x.image,sha256:x.sha256,origin:'p772'
 }));
 const readers={historical:fileReader(oldFolder),p66:fileReader(p66Folder),p772:fileReader(p772Folder)};
 const ledger=await buildExposureLedger({
  historical59:old,published6:pub6,additionalExposed8:pub8,
  readOriginal:async row=>readers[row.origin](row)
 });
 if(ledger.realSourcePhotos!==73||ledger.newerPublisherDevelopmentSources!==8)
  fail('complete 73 actual original real photo source receipt required');
 writeFileSync(out,JSON.stringify(ledger,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({
  status:'73_ACTUAL_JPEG_SOURCES_BYTE_VERIFIED_AND_FINGERPRINTED',
  exposedSourceOriginals:73,
  protectedHistoric59:59,protectedP66Six:6,protectedP772Eight:8,
  perOriginalSourceVisualWindows:7,newlyAdmittedHumanHoldoutImages:0,
  photoRightsAndModelTrainingUnseenNotCertified:true,releaseAuthorized:false,
  familyAlpha:'HOLD'
 }));
}else if(cmd==='screen'){
 if(args.length!==4)fail('screen STRICT73_LEDGER.json CANDIDATES.json NEW_IMAGE_DIR PRIVATE_REPORT.json');
 const [ledgerPath,candidatesPath,candidateFolder,out]=args;
 const candidates=read(candidatesPath);
 if(!Array.isArray(candidates)||!candidates.length)fail('actual new candidate rows required');
 const report=await screenProspectiveImages({
  ledger:read(ledgerPath),knownExposedSHA256:known73,candidates,
  readCandidate:async row=>fileReader(candidateFolder)(row),
  requireComplete73:true
 });
 writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({
  status:report.nearDuplicateFlagCount?'SOURCE_OVERLAP_REQUIRES_EXTERNAL_REVIEW':
   'SOURCE_NONMATCH_REQUIRES_EXTERNAL_IDENTITY_TRAINING_RIGHTS_REVIEW',
  comparedSourceOriginals:73,screenedNewSources:report.candidateOriginals,
  potentialContamination:report.nearDuplicateFlagCount,
  newlyAdmittedHumanGroundTruth:0,autoAcceptedSourceImages:0,
  independentHumanIdentityVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'
 }));
}else fail('usage: build 59_DIR six_DIR eight_DIR out.json | screen ledger.json new.json new_DIR private.json');
