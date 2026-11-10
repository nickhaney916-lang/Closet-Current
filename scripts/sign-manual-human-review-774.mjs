#!/usr/bin/env node
/**
 * Offline, human-operated signing only. Do not run with an AI-generated
 * annotation, share key files, or store private original JPEGs in GitHub.
 *
 *  node scripts/sign-manual-human-review-774.mjs \
 *    SEALED_COHORT.json REVIEWER_PUBLIC_KEYS.json reviewerA \
 *    hold-photo-id ORIGINAL.jpg HUMAN_POLYGONS.json \
 *    HUMAN_DECLARATION.json PRIVATE_ED25519_KEY.pem OUTPUT_RECEIPT.json
 *
 * The external coordinator must physically verify reviewer identity and
 * attest blindness; Ed25519 proves possession of a key, not a human.
 */
import {readFileSync,statSync,writeFileSync} from 'node:fs';
import {
 signActualReviewerAnnotation774
} from '../research/mission1-reviewer-774/offline-human-polygon-receipt.mjs';

const args=process.argv.slice(2);
if(args.length!==9)throw Error('usage: seal.json registry.json reviewerA|reviewerB|adjudicator photoId original.jpg manually-drawn-polygons.json self-attestation.json reviewer-ed25519-private.pem output-receipt.json');
const [sealFile,registryFile,reviewerId,photoId,originalJpeg,manualFile,declarationFile,keyFile,outputFile]=args;
const readJson=path=>JSON.parse(readFileSync(path,'utf8'));
if(statSync(originalJpeg).size>8*1024*1024)
 throw Error('original JPEG exceeds review size limit');
if((statSync(keyFile).mode&0o077)!==0)
 throw Error('private signing key must have local file permission 0600; do not commit or upload this file');
const receipt=signActualReviewerAnnotation774({
 seal:readJson(sealFile),reviewerPublicKeys:readJson(registryFile),
 reviewerId,photoId,photoJPEG:readFileSync(originalJpeg),
 annotations:readJson(manualFile),reviewerDeclaration:readJson(declarationFile),
 privateKeyPEM:readFileSync(keyFile,'utf8'),
 ...(reviewerId==='adjudicator'?{
  adjudicationRationale:readJson(manualFile)?.adjudicationRationale
 }: {})
});
writeFileSync(outputFile,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({
 receiptCreated:true,
 labelInstances:receipt.label.instances.length,
 signingIdentityRole:reviewerId,
 receiptIsActualHumanTruthIndependentlyVerified:false,
 publicDisclosureOfPrivateKey:false,
 photographUploaded:false,
 sourceBlindnessExternallyAudited:false,
 releaseAuthorized:false,
 familyAlpha:'HOLD'
}));
