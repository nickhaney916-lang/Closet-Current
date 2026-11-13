#!/usr/bin/env node
/** P75 OFFLINE human annotation custody. NEVER run with blind labels inside CI.
 * Signatures prove key custody, not human identity; an externally vetted owner-
 * approved registrar must attest that the reviewers really are independent humans. */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {createPrivateKey,createPublicKey,sign,verify as cryptoVerify} from 'node:crypto';
import {canonical,sha256,SCHEMA,validateLabel,verifiedSource,priorExposures,
 checkOverlap,validatePartition,independentAgreement,verifyHumanReceipt,verifyCuratorApproval,sourceKey} from './p75-dataset-core.mjs';
function externalFile(p){
 if(!p)throw Error('An explicitly supplied absolute external path is required');
 const q=resolve(p),rel=relative(process.cwd(),q);
 if(!isAbsolute(p)||!rel||(!rel.startsWith('..')&&!isAbsolute(rel)))throw Error('Private annotations and keys MUST be outside Git checkout');
 return q;
}
function noCI(){
 if(process.env.CI||process.env.GITHUB_ACTIONS)throw Error('Private human annotations and seals are not permitted inside CI');
}
const [,,command,...args]=process.argv;
if(command==='sign'){
 noCI();
 if(process.env.P75_REVIEWER_HUMAN_CONFIRMATION!=='I independently reviewed the original clothing photograph')
  throw Error('A real human must attest to independent visual inspection');
 const [draftPath,keyPath,outputPath]=args.map(externalFile);
 const draft=JSON.parse(await readFile(draftPath,'utf8'));
 if(draft.schema!==SCHEMA||draft.method!=='independent-human'||draft.predictionsExposed!==false||
    !/^[a-f0-9]{64}$/.test(draft.sourceSha256||'')||!draft.reviewerId||
    !Number.isFinite(Date.parse(draft.reviewedAt))||validateLabel(draft.labels).length)throw Error('Untrusted or invalid independent review draft');
 if(draft.signature)throw Error('Existing signed receipt cannot be resigned automatically');
 const key=createPrivateKey(await readFile(keyPath,'utf8'));
 if(key.asymmetricKeyType!=='ed25519')throw Error('Use Ed25519 rater key');
 const signature=sign(null,Buffer.from(canonical(draft)),key).toString('base64');
 await writeFile(outputPath,JSON.stringify({...draft,signature},null,2)+'\n',{flag:'wx',mode:0o600});
 console.log('P75 signed local HUMAN-CLAIMED receipt; external registrar human-vetting still REQUIRED. No garment labels printed.');
}else if(command==='audit'){
 noCI();
 const [bundlePath,registryPath]=args.map(externalFile);
 const fingerprint=process.env.P75_APPROVED_REGISTRAR_FINGERPRINT;
 const bundle=JSON.parse(await readFile(bundlePath,'utf8')),registry=JSON.parse(await readFile(registryPath,'utf8'));
 const approved=/^[a-f0-9]{64}$/.test(fingerprint||'')&&
   sha256(createPublicKey(registry.registrarPublicKey).export({type:'spki',format:'der'}))===fingerprint;
 if(!approved)throw Error('Externally approved registrar fingerprint missing/mismatched');
 const oldNames=['benchmark/locked-photo-sources.json','benchmark/manifest-holdout-16.json',
  'benchmark/manifest-reviewed-32.json','benchmark/manifest-fresh-11.json'];
 const old=priorExposures(Object.fromEntries(await Promise.all(oldNames.map(async n=>[n,JSON.parse(await readFile(n,'utf8'))]))));
 if(!Array.isArray(bundle.sources)||bundle.sources.length>5000||!bundle.reviews||typeof bundle.reviews!=='object')throw Error('Private source/review bundle invalid');
 // Old public cohorts do not yet have full perceptual image hashes. A signed
 // independently audited old-hash ledger is REQUIRED before accepting blind.
 const map=bundle.exposedPerceptualHashes||{};
 const oldUnfingerprinted=old.filter(r=>!r.sha256||!/^[a-f0-9]{16}$/.test(map[r.sha256]||'')).length;
 const visualAuditPayload={oldManifestUniqueCount:old.length,
  exposedHashesSha256:sha256(canonical(Object.keys(map).sort().map(k=>[k,map[k]]))),verifiedAt:bundle.exposureAudit?.verifiedAt};
 let legacyLedgerOK=false;
 try{legacyLedgerOK=oldUnfingerprinted===0&&cryptoVerify(null,Buffer.from(canonical(visualAuditPayload)),
  createPublicKey(registry.registrarPublicKey),Buffer.from(bundle.exposureAudit?.signature||'','base64'));}catch{}
 if(legacyLedgerOK)for(const r of old)r.dhash64=map[r.sha256];
 const issues=validatePartition(bundle.sources,old);
 let singleHuman=0,dualHuman=0,blindEligible=0,trainEligible=0,developmentEligible=0;
 let agreementEqual=0,agreementTotal=0;
 for(const source of bundle.sources){
  const receipts=bundle.reviews[source.sha256]||[];
  if(!Array.isArray(receipts))throw Error('Invalid private reviewer receipts array');
  const valid=receipts.filter(receipt=>verifyHumanReceipt(source,receipt,registry,fingerprint).length===0);
  const independentDistinct=new Set(valid.map(r=>r.reviewerId));
  if(independentDistinct.size>=1)singleHuman++;
  const agreement=independentAgreement(source,valid,registry,fingerprint);
  if(independentDistinct.size>=2&&agreement.agreement){
   agreementEqual+=agreement.agreement.equal;agreementTotal+=agreement.agreement.total;
  }
  if(agreement.eligible)dualHuman++;
  if(source.split==='quarantine')continue;
  // Every promoted split, including train/dev, requires independently vetted
  // consent/rights note, verified physical group and a signed human label.
  const curatorOK=verifyCuratorApproval(source,registry,fingerprint);
  if(!curatorOK)issues.push('missing independently signed rights/consent/source-group evidence');
  if(independentDistinct.size<1)issues.push('non-quarantined group requires independently signed human annotation');
  if(independentDistinct.size>=2&&!agreement.eligible)issues.push('reviewer disagreement requires independent adjudication');
  if(verifiedSource(source).length)issues.push('promoted source original/rights metadata unverified');
  if(source.split==='train'&&curatorOK&&independentDistinct.size>=1)trainEligible++;
  if(source.split==='development'&&curatorOK&&independentDistinct.size>=1)developmentEligible++;
  if(source.split==='blind'){
   if(!legacyLedgerOK)issues.push('sealed blind requires complete signed fingerprint ledger for all historical exposed originals');
   const overlap=checkOverlap(source,old,bundle.sources.filter(x=>x!==source));
   if(overlap.length)issues.push('blind leakage or duplicate');
   if(!agreement.eligible)issues.push('two non-tuned independently verified human labels required');
   if(curatorOK&&agreement.eligible&&legacyLedgerOK&&!overlap.length&&verifiedSource(source).length===0)
     blindEligible++;
  }
 }
 const report={sources:bundle.sources.length,oldExposedSources:old.length,
  oldSourceFingerprintMissing:oldUnfingerprinted,atLeastOneAttestedHuman:singleHuman,
  twoHumanConsensus:dualHuman,
  comparisonAgreement:{equal:agreementEqual,total:agreementTotal,
   ratio:agreementTotal?agreementEqual/agreementTotal:null},
  trainVerified:issues.length===0?trainEligible:0,
  developmentVerified:issues.length===0?developmentEligible:0,
  sealedBlindVerified:issues.length===0?blindEligible:0,errors:[...new Set(issues)].sort(),
  scoring:'NOT PERFORMED',humanProvenance:'OWNER-VETTED ATTESTATIONS REQUIRED'};
 // No IDs, photos, per-row blind labels or model predictions in stdout.
 console.log('P75_PRIVATE_GOVERNANCE_AUDIT '+JSON.stringify(report));
 if(issues.length)process.exitCode=3;
 else if(bundle.sources.some(r=>r.split==='blind')){
  const salt=process.env.P75_PRIVATE_SEAL_SALT;
  if(!salt||salt.length<32)throw Error('Blind seal requires non-public 32+ byte custodian salt');
  console.log('P75_SEALED_BLIND_COMMITMENT '+JSON.stringify({
   count:blindEligible,commitment:sha256(salt+'|'+canonical(bundle.sources.filter(r=>r.split==='blind')
    .map(r=>({sha256:r.sha256,sourceGroupId:r.sourceGroupId})).sort((a,b)=>a.sha256.localeCompare(b.sha256)))),
   labelsPublished:0,photosPublished:0,modelScored:false}));
 }
}else{
 console.error('P75 offline usage: sign ABS_DRAFT ABS_RATER_PRIVATE_KEY ABS_NEW_RECEIPT | audit ABS_PRIVATE_BUNDLE ABS_OWNER_VETTED_REGISTRY');
 process.exitCode=2;
}
