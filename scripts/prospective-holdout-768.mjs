#!/usr/bin/env node
/**
 * Mission1 prospective source-enrollment / after-registration evaluation.
 * Browser/model inference and blind human annotation happen in SEPARATE
 * processes. This CLI never writes private photographs to GitHub.
 *
 * IMPORTANT: Git commit ancestry and signatures cannot prove independent
 * human identities, image rights, training-set absence, or human blindness.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {
 P66_EXPOSED_DIGESTS,sha256,sealProspectiveHoldout,evaluateProspectiveHoldout
} from '../research/mission1-sealed-human-holdout-768/prospective-gate.mjs';
import {P772_EXPOSED_DIGESTS_774} from '../research/mission1-exposure-774/pinned-exposed-source-history.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const fail=x=>{throw Error('Mission1 holdout CLI: '+x);};
const historical=()=>[
 ...read('benchmark/locked-photo-sources.json').map(x=>x.sha256),
 ...P66_EXPOSED_DIGESTS,...P772_EXPOSED_DIGESTS_774
];
const cwdPhotoReader=directory=>name=>readFileSync(join(resolve(directory),name));
const commitExists=id=>{
 if(!/^[a-f0-9]{40}$/.test(id||''))fail('full pinned 40-hex Git commit required');
 return execFileSync('git',['rev-parse',id],{encoding:'utf8'}).trim()===id;
};
function verifyGitChronology(metadata,sealFile,predictionsFile){
 const {registrationCommit,inferenceCommit,registrationFilePath,inferenceFilePath}=metadata||{};
 if(!commitExists(registrationCommit)||!commitExists(inferenceCommit)||
    registrationCommit===inferenceCommit)fail('distinct exact enrollment and inference commits required');
 for(const path of [registrationFilePath,inferenceFilePath])
  if(typeof path!=='string'||!/^research\/mission1-seals\/[A-Za-z0-9_./-]+\.json$/.test(path)||
     path.split('/').includes('..'))
   fail('only explicit immutable research/mission1-seals JSON commit paths are accepted');
 try{execFileSync('git',['merge-base','--is-ancestor',registrationCommit,inferenceCommit]);}
 catch{fail('registration is not a strict ancestor of inference commit');}
 const committedSeal=execFileSync('git',['show',registrationCommit+':'+registrationFilePath]);
 const committedResults=execFileSync('git',['show',inferenceCommit+':'+inferenceFilePath]);
 if(sha256(committedSeal)!==sha256(readFileSync(sealFile)))
  fail('cohort registration bytes are not the immutable pre-inference Git blob');
 if(sha256(committedResults)!==sha256(readFileSync(predictionsFile)))
  fail('actual model prediction bytes are not in the independent later inference commit');
 return {
  registrationCommitAncestors:[registrationCommit],
  registrationCommittedBeforeInference:true,predictionBatchCommittedAfterRegistration:true
 };
}
const [cmd,...args]=process.argv.slice(2);
if(cmd==='seal'){
 if(args.length!==3)fail('seal ENROLLMENT_JSON SOURCE_JPEG_DIRECTORY OUT_JSON');
 const [enrollPath,photoDirectory,out]=args;
 const input=read(enrollPath);
 const modelWorkerSHA256=sha256(readFileSync('public/local-worker.mjs'));
 const modelIndexSHA256=sha256(readFileSync('public/recognition-vectors.bin'));
 const seal=sealProspectiveHoldout({
  ...input,modelSHA256:modelWorkerSHA256,modelIndexSHA256,
  exposedSHA256:historical()
 },cwdPhotoReader(photoDirectory));
 writeFileSync(out,JSON.stringify(seal,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({
  status:'ENROLLMENT_SEALED_NOT_YET_INDEPENDENT',
  registrationId:seal.registrationId,
  sealSHA256:seal.sealSHA256,
  photoCount:seal.photos.length,sourceExclusions:historical().length,
  requiresExternallySignedWitness:true,
  requiresGitCommitBeforeInference:true,
  independentlyHumanLabeledPhotos:0,releaseAuthorized:false,familyAlpha:'HOLD'
 },null,2));
}else if(cmd==='audit'){
 if(args.length!==7)fail('audit SEAL_JSON WITNESS_JSON REVIEWERS_JSON PREDICTIONS_JSON GIT_CHRONOLOGY_JSON SOURCE_JPEG_DIRECTORY OUT_JSON');
 const [sealPath,witnessPath,reviewerPath,predictionsPath,chronoPath,photoDirectory,out]=args;
 const seal=read(sealPath),registered=verifyGitChronology(read(chronoPath),sealPath,predictionsPath);
 const liveModelHash=sha256(readFileSync('public/local-worker.mjs'));
 const liveIndexHash=sha256(readFileSync('public/recognition-vectors.bin'));
 if(liveModelHash!==seal.modelSHA256||liveIndexHash!==seal.modelIndexSHA256)
  fail('actual local worker or catalog differs from pre-registered model hash');
 const report=evaluateProspectiveHoldout({
  seal,registrationWitness:read(witnessPath),reviewers:read(reviewerPath),
  predictions:read(predictionsPath),readPhoto:cwdPhotoReader(photoDirectory),
  knownExposedSHA256:historical(),externalChronology:registered
 });
 writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({
  status:'PROSPECTIVE_SIGNED_RESEARCH_AUDITED_NOT_RELEASE',
  evidence:report.counts,sourceOnly:report.records.length,
  externalIndependentIdentityNotCertified:!report.distinctHumanIdentitiesIndependentlyConfirmed,
  modelTrainingOverlapNotExcluded:!report.trainingSetOverlapIndependentlyExcluded,
  missionOneCompleted:false,eligibleToAdvanceToMissionTwo:false,
  familyAlpha:'HOLD'
 },null,2));
}else fail('usage: seal ENROLLMENT_JSON SOURCE_JPEG_DIRECTORY OUT_JSON | audit SEAL_JSON WITNESS_JSON REVIEWERS_JSON PREDICTIONS_JSON GIT_CHRONOLOGY_JSON SOURCE_JPEG_DIRECTORY OUT_JSON');
