/**
 * Mission #88 -> independently governed #75/#79 -> #71 blind evaluation.
 * Strict PUBLIC model-definition freeze + PRIVATE, two-authority SIGNATURE
 * verification only. Does NOT read originals, human labels, masks, reviewers,
 * score any model, sign a receipt, or authorize a release/production save.
 * The #75 custodian must independently complete their FULL ORIGINAL/BYTES,
 * rights, source-group, duplicate, human and sealed-ledger audit beforehand.
 */
import {createHash,createPublicKey,verify as cryptoVerify} from 'node:crypto';
import {readFile,stat} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
export const P88_BLIND_HANDOFF_SCHEMA='p88-blind-evaluator-handoff/v1';
export const P88_FROZEN_CANDIDATE=Object.freeze({
 schema:'p88-fashion-onnx-candidate-freeze/v1',
 model:'louisJLN/yolo8-fashionpedia',architecture:'yolov8n',
 modelOnnxSha256:'6b581af3abe2b4ae97a84cbe9aef5ae37207a68ee966d22b0b8d7969d79e6920',
 modelSourceRevision:'3d5c557',
 sourceExperimentCommit:'d6733249e96dba914c8cba2fcb936efef6fd8c35',
 inputSize:640,scoreCutoff:0.10,nonMaxSuppressionIoU:0.50,
 matchedOriginalBoxIoU:0.50,
 perClassMatch:'exact-fashionpedia-category-one-to-one',
 outputScope:'27 main classes; 13/13 historical accessory categories representable',
 nativeAppUnaffected:true,ownerReviewMandatory:true,
 automaticClosetSave:false,modelsNeverTrainedHere:true,
 developmentEvidenceOnly:true,notProspectiveBlindAccuracy:true,
 originalExposedPhotoManifestSha256:'b76e9890bda49c58c6adbbafb6f7dd738f4dcf604357fc56aa0b6e770ebe35bd'
});
const SHA=/^[a-f0-9]{64}$/;
export const sha256=x=>createHash('sha256').update(x).digest('hex');
export function canonicalP88(value){
 if(value===null)return 'null';
 if(typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
 if(typeof value==='number'){
  if(!Number.isFinite(value))throw Error('P88_NONFINITE_CANONICAL');
  return JSON.stringify(value);
 }
 if(Array.isArray(value))return '['+value.map(canonicalP88).join(',')+']';
 if(value&&typeof value==='object'){
  const keys=Object.keys(value).sort();
  if(keys.some(k=>value[k]===undefined))throw Error('P88_UNDEFINED_CANONICAL');
  return '{'+keys.map(k=>JSON.stringify(k)+':'+canonicalP88(value[k])).join(',')+'}';
 }
 throw Error('P88_UNSUPPORTED_CANONICAL');
}
export const frozenCandidateDigest88=sha256(canonicalP88(P88_FROZEN_CANDIDATE));
const sourceFields=[
 'schema','candidateDigest','auditDigest','historicalExposureLedgerDigest',
 'sealedBlindCommitment','rightsEvidenceDigest','sourceGroupCount',
 'sealedBlindPhotoCount','approvedOriginalsCount','dualHumanReviewedCount',
 'verifiedIndependentHumanReviewers','unresolvedDisagreements',
 'historicalExposureComplete','prospectiveSourceAndPhotographerDisjoint',
 'fullSourceBytesAndLicenseVerified','humanRightsAndConsentApproved',
 'sourceGroupsIndependentlyVerified','noPriorModelOrAnswerExposure',
 'answerKeysOutsideRepository','auditedAt','expiresAt','signature'
];
const evaluatorFields=[
 'schema','candidateDigest','sourceAuditPayloadDigest',
 'sealedBlindCommitment','independentEvaluatorAuthorized',
 'independentFromModelDevelopment','willEvaluateBlindOnlyOnce',
 'answersNotPreviouslyExposed','acceptedAt','signature'
];
const packetFields=['schema','sourceAudit','sourceAuditPublicKey','evaluatorApproval','evaluatorPublicKey'];
const exactKeys=(obj,keys)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&
 Object.keys(obj).length===keys.length&&keys.every(k=>Object.hasOwn(obj,k));
const ISO=x=>typeof x==='string'&&
 /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(x)&&
 Number.isFinite(Date.parse(x));
const isSha=x=>typeof x==='string'&&SHA.test(x);
function identityKey(pem,fingerprint){
 if(!isSha(fingerprint)||typeof pem!=='string'||pem.length>8192)return null;
 try{
  const key=createPublicKey(pem);
  if(key.asymmetricKeyType!=='ed25519')return null;
  const actual=sha256(key.export({format:'der',type:'spki'}));
  return actual===fingerprint?key:null;
 }catch{return null;}
}
function verifiedApproval(body,signature,key){
 if(!key||typeof signature!=='string'||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(signature)||signature.length>256)return false;
 try{return cryptoVerify(null,Buffer.from(canonicalP88(body)),
  key,Buffer.from(signature,'base64'));}
 catch{return false;}
}
/** Structure & cryptographic custody preflight only, NEVER model approval. */
export function verifyBlindEvaluatorHandoff88(packet,{
 p75RegistrarFingerprint=null,p71EvaluatorFingerprint=null,now=new Date()
}={}){
 const errors=[];
 if(!exactKeys(packet,packetFields)||packet.schema!==P88_BLIND_HANDOFF_SCHEMA)
  return {status:'BLOCKED',errors:['INVALID_PRIVATE_HANDOFF_SCHEMA'],
   modelPromotionAllowed:false,accuracyMeasured:false,familyAlphaHold:true};
 const a=packet.sourceAudit,b=packet.evaluatorApproval;
 if(!exactKeys(a,sourceFields)||a.schema!=='p88-p75-signed-audit/v1')
  errors.push('INVALID_P75_AUDIT_CONTRACT');
 if(!exactKeys(b,evaluatorFields)||b.schema!=='p88-p71-evaluator-authorization/v1')
  errors.push('INVALID_P71_AUTHORIZATION_CONTRACT');
 if(errors.length)return {status:'BLOCKED',errors,modelPromotionAllowed:false,
  accuracyMeasured:false,familyAlphaHold:true};
 const candidate=frozenCandidateDigest88;
 if(a.candidateDigest!==candidate||b.candidateDigest!==candidate)
  errors.push('CANDIDATE_FREEZE_MISMATCH');
 for(const k of ['auditDigest','historicalExposureLedgerDigest',
  'sealedBlindCommitment','rightsEvidenceDigest'])
  if(!isSha(a[k]))errors.push('MISSING_DIGEST_'+k.toUpperCase());
 if(a.sealedBlindCommitment===P88_FROZEN_CANDIDATE.originalExposedPhotoManifestSha256)
  errors.push('EXPOSED_DEVELOPMENT_MANIFEST_NOT_BLIND');
 for(const k of ['sourceGroupCount','sealedBlindPhotoCount',
  'approvedOriginalsCount','dualHumanReviewedCount','verifiedIndependentHumanReviewers',
  'unresolvedDisagreements'])
  if(!Number.isSafeInteger(a[k])||a[k]<0||a[k]>100000)
   errors.push('INVALID_AUDIT_COUNT_'+k.toUpperCase());
 if(a.sourceGroupCount<60||a.sealedBlindPhotoCount<60||
    a.approvedOriginalsCount<a.sealedBlindPhotoCount||
    a.dualHumanReviewedCount<a.sealedBlindPhotoCount||
    a.verifiedIndependentHumanReviewers<2||
    a.unresolvedDisagreements!==0)errors.push('P75_BLIND_HUMAN_COVERAGE_INCOMPLETE');
 for(const k of ['historicalExposureComplete','prospectiveSourceAndPhotographerDisjoint',
  'fullSourceBytesAndLicenseVerified','humanRightsAndConsentApproved',
  'sourceGroupsIndependentlyVerified','noPriorModelOrAnswerExposure',
  'answerKeysOutsideRepository'])
  if(a[k]!==true)errors.push('P75_REQUIRED_AUDIT_FLAG_'+k.toUpperCase());
 if(!ISO(a.auditedAt)||!ISO(a.expiresAt)||
    Date.parse(a.auditedAt)>Date.parse(a.expiresAt)||
    Date.parse(a.expiresAt)-Date.parse(a.auditedAt)>7*86400000||
    now.getTime()<Date.parse(a.auditedAt)-60000||
    now.getTime()>Date.parse(a.expiresAt))
  errors.push('EXPIRED_OR_UNTRUSTED_P75_ATTESTATION');
 if(b.sourceAuditPayloadDigest!==sha256(canonicalP88(
   Object.fromEntries(sourceFields.filter(k=>k!=='signature').map(k=>[k,a[k]]))))||
    b.sealedBlindCommitment!==a.sealedBlindCommitment)
  errors.push('P71_NOT_BOUND_TO_THIS_P75_AUDIT');
 for(const k of ['independentEvaluatorAuthorized','independentFromModelDevelopment',
  'willEvaluateBlindOnlyOnce','answersNotPreviouslyExposed'])
  if(b[k]!==true)errors.push('P71_EVALUATOR_SCOPE_NOT_APPROVED');
 if(!ISO(b.acceptedAt)||Date.parse(b.acceptedAt)<Date.parse(a.auditedAt)||
    Date.parse(b.acceptedAt)>Date.parse(a.expiresAt)||
    now.getTime()<Date.parse(b.acceptedAt)-60000)
  errors.push('UNTRUSTED_P71_ACCEPTANCE_TIME');
 if(!isSha(p75RegistrarFingerprint)||!isSha(p71EvaluatorFingerprint)||
    p75RegistrarFingerprint===p71EvaluatorFingerprint)
  errors.push('SEPARATE_EXTERNALLY_PINNED_AUTHORITIES_REQUIRED');
 const p75=identityKey(packet.sourceAuditPublicKey,p75RegistrarFingerprint);
 const p71=identityKey(packet.evaluatorPublicKey,p71EvaluatorFingerprint);
 if(!p75||!p71)errors.push('REGISTRAR_OR_EVALUATOR_KEY_NOT_INDEPENDENTLY_APPROVED');
 if(!verifiedApproval(Object.fromEntries(sourceFields.filter(k=>k!=='signature')
  .map(k=>[k,a[k]])),a.signature,p75))errors.push('INVALID_SIGNED_P75_AUDIT');
 if(!verifiedApproval(Object.fromEntries(evaluatorFields.filter(k=>k!=='signature')
  .map(k=>[k,b[k]])),b.signature,p71))errors.push('INVALID_SIGNED_P71_AUTHORIZATION');
 // Never output sensitive source photo IDs, label contents, signatures, keys,
 // source URL, split assignments or private per-item SHA receipts.
 return {
  status:errors.length?'BLOCKED':'SIGNED_CUSTODY_PREFLIGHT_ONLY',
  errors:[...new Set(errors)].sort(),
  candidateDigest:candidate,
  independentBlindScorePerformed:false,accuracyMeasured:false,
  canSendRestrictedHandoffToP71:errors.length===0,
  modelPromotionAllowed:false,automaticSaveAllowed:false,
  familyAlphaHold:true,releaseApproval:false
 };
}
function externalPrivateFile(path){
 if(typeof path!=='string'||!isAbsolute(path))throw Error('PRIVATE_ABSOLUTE_PATH_REQUIRED');
 const full=resolve(path),rel=relative(process.cwd(),full);
 if(!rel||(!rel.startsWith('..')&&!isAbsolute(rel)))
  throw Error('PRIVATE_CUSTODY_MUST_STAY_OUTSIDE_GIT');
 return full;
}
if(process.argv[1]&&new URL('file:'+resolve(process.argv[1])).href===import.meta.url){
 // Private, externally approved custodian-only preflight; never run in Actions.
 if(process.argv[2]!=='inspect'||process.argv.length!==4)
  throw Error('Usage: node blind-evaluator-handoff-88.mjs inspect ABS_PRIVATE_SIGNED_ENVELOPE');
 if(process.env.CI||process.env.GITHUB_ACTIONS)
  throw Error('PRIVATE_BLIND_HANDOFF_FORBIDDEN_IN_CI');
 const name=externalPrivateFile(process.argv[3]);
 if((await stat(name)).size>50000)throw Error('PRIVATE_HANDOFF_TOO_LARGE');
 const packet=JSON.parse(await readFile(name,'utf8'));
 const outcome=verifyBlindEvaluatorHandoff88(packet,{
  p75RegistrarFingerprint:process.env.P88_APPROVED_P75_REGISTRAR_FINGERPRINT,
  p71EvaluatorFingerprint:process.env.P88_APPROVED_P71_EVALUATOR_FINGERPRINT
 });
 console.log('P88_PRIVATE_CUSTODY_PREFLIGHT '+JSON.stringify(outcome));
 if(outcome.status==='BLOCKED')process.exitCode=3;
}
