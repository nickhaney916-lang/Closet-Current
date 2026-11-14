#!/usr/bin/env node
/**
 * P878 offline SCORER-CUSTODY handoff. This signs evidence only; neither
 * signature nor CLI attestation proves that the model actually ran, that
 * the signer is independent, or that any human reviewers exist. Independent
 * operator approval is external and is rechecked by the private evaluator.
 */
import {readFile,writeFile,stat} from 'node:fs/promises';
import {resolve,dirname,basename,join} from 'node:path';
import {createPrivateKey,createPublicKey,sign} from 'node:crypto';
import {canonical,sha256} from './p75-dataset-core.mjs';
import {externalPath} from './p79-workstation-core.mjs';
import {PAIR_SCHEMA878,SEAL_SCHEMA878,policy878,validPair878,verifySignedPair878} from './p878-private-siglip-framing.mjs';

const args=process.argv.slice(2);
if(process.env.CI||process.env.GITHUB_ACTIONS)throw Error('P878_NO_PRIVATE_SCORER_OR_KEYS_IN_CI');
if(args.length!==5)throw Error('Usage: p878-sign-private-pairs.mjs ABS_PAIRED_SCORES ABS_ED25519_SCORER_KEY ABS_PREVIOUS_P80_SEAL ABS_PREAPPROVED_TRUSTED_JSON ABS_NEW_OUTPUT_SEAL');
if(process.env.P878_SCORER_PERSONAL_ATTESTATION!=='I independently scored these originals with the pinned models before human label reveal')
 throw Error('P878_REQUIRES_SCORER_ATTESTATION_NOT_PROOF_OF_INDEPENDENCE');
const [pScores,pKey,pPrior,pTrusted]=await Promise.all(args.slice(0,4).map(p=>externalPath(p)));
for(const p of [pScores,pKey,pPrior,pTrusted]){
 const s=await stat(p);if(!s.isFile()||s.size>16*1024*1024)throw Error('P878_EXTERNAL_FILE_LIMIT');
}
const target=resolve(args[4]),root=await externalPath(dirname(target));
if(join(root,basename(target))!==target)throw Error('P878_OUTSIDE_CHECKOUT_SYMLINK_PARENT');
const [pairs,privatePem,baseSeal,trusted]=await Promise.all([
 readFile(pScores,'utf8').then(JSON.parse),readFile(pKey,'utf8'),
 readFile(pPrior,'utf8').then(JSON.parse),readFile(pTrusted,'utf8').then(JSON.parse)]);
const key=createPrivateKey(privatePem),publicKeyObj=createPublicKey(key);
if(key.asymmetricKeyType!=='ed25519'||sha256(publicKeyObj.export({type:'spki',format:'der'}))!==trusted.scorerFingerprint)
 throw Error('P878_EXTERNAL_SCORER_FINGERPRINT_UNAPPROVED');
if(!Array.isArray(pairs)||pairs.length!==60||pairs.some(p=>!validPair878(p,trusted.targetCommit))||
 new Set(pairs.map(p=>p.sourceSha256)).size!==60||
 sha256(canonical(policy878(trusted.targetCommit)))!==trusted.p878PolicySha256)
 throw Error('P878_UNTRUSTED_PRECOMMITTED_PAIR_TRANSCRIPT');
const scoredAt=new Date().toISOString();
if(!(Date.parse(trusted.approvedAt)<Date.parse(scoredAt))||
 !(Date.parse(baseSeal.scoredAt)<=Date.parse(scoredAt)))throw Error('P878_PREAPPROVAL_TIMING');
const payload={schema:SEAL_SCHEMA878,targetCommit:trusted.targetCommit,
 policySha256:trusted.p878PolicySha256,
 pairSha256:sha256(canonical(pairs)),
 precedingSealSha256:sha256(canonical(baseSeal)),sourceCount:60,scoredAt};
const seal={...payload,publicKey:publicKeyObj.export({type:'spki',format:'pem'}),
 signature:sign(null,Buffer.from(canonical(payload)),key).toString('base64')};
if(!verifySignedPair878(pairs,seal,trusted,baseSeal))throw Error('P878_SCORER_SIGNATURE_SELF_CHECK_FAILED');
await writeFile(target,JSON.stringify(seal,null,2)+'\n',{flag:'wx',mode:0o600});
console.log('P878_SYNTHETIC_OR_REAL_SCORER_CLAIM_SEALED: PRIVATE / source_count=60 / release_authorized=false / independent_review_not_proven');
