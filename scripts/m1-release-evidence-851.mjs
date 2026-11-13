/** Mission 1 P851: owner-pinned, source-bound acceptance EVIDENCE gate.
 * Never a deployment authorization. A valid signature proves custody of an
 * approved public key, NOT by itself physical hardware, real human identity,
 * rights or an accurate garment label: that proof is separately vetted by
 * independent custodians and device operators, outside this public repo.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {canonical,isHex64} from './p75-dataset-core.mjs';

export const SCHEMA='m1-release-evidence-851-v1';
export const METRICS=Object.freeze(['category','subtype','primaryColor','instanceSeparation','ownedFootwearUnit','noWrongSave']);
const ROLES=['ownerPolicy','independentBlind','physicalDevices','signedCloud'];
const sensitive=new Set(['image','imageData','photo','photoBytes','photoUrl','filePath','name','email','phone','ownerId','userId','accessToken','refreshToken','rawLabels','blindLabels','annotations','authHeader','privateKey']);
const sha=x=>createHash('sha256').update(x).digest('hex');
function cleanReport(issues,details={}){
 return {schema:SCHEMA,status:issues.length?'BLOCKED':'EVIDENCE_REVIEW_ELIGIBLE_NOT_RELEASE',
  noDeploy:true,shouldLiftFamilyAlphaHold:false,checkedRoles:details.checkedRoles||0,
  countOfIndependentHumanBlindSources:details.humanBlind||0,
  countOfPhysicalDevicePlatforms:details.physicalPlatforms||0,
  issues:[...new Set(issues)].sort()};
}
function isNonnegativeInteger(x){return Number.isSafeInteger(x)&&x>=0;}
function containsSensitive(v,depth=0){
 if(depth>18)return true;
 if(Array.isArray(v))return v.length>5000||v.some(x=>containsSensitive(x,depth+1));
 if(v&&typeof v==='object')return Object.entries(v).some(([k,x])=>sensitive.has(k)||containsSensitive(x,depth+1));
 return false;
}
function envelopeValid(e,expectedRole,approved){
 if(!e||e.role!==expectedRole||!e.payload||typeof e.payload!=='object'||e.payload.schema!==SCHEMA||containsSensitive(e.payload))return false;
 if(!/^[a-f0-9]{64}$/.test(approved||'')||typeof e.signature!=='string'||!/^[A-Za-z0-9+/=]+$/.test(e.signature))return false;
 try{
  const pk=createPublicKey(e.publicKey);
  if(pk.asymmetricKeyType!=='ed25519'||sha(pk.export({type:'spki',format:'der'}))!==approved)return false;
  return verify(null,Buffer.from(canonical({role:e.role,payload:e.payload})),pk,Buffer.from(e.signature,'base64'));
 }catch{return false;}
}
function asDate(s){const n=Date.parse(s);return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(s)&&Number.isFinite(n)?n:NaN;}
export function evaluateMission1Evidence(bundle,trusted={},now=new Date()){
 const issues=[],details={checkedRoles:0,humanBlind:0,physicalPlatforms:0};
 if(!bundle||bundle.schema!==SCHEMA||typeof bundle.roles!=='object'||Array.isArray(bundle.roles))
  return cleanReport(['no externally signed evidence bundle']);
 if(bundle.fixture===true||containsSensitive(bundle))return cleanReport(['test fixture or private payload forbidden in acceptance bundle']);
 if(!Number.isFinite(now.getTime()))return cleanReport(['invalid audit time']);
 const payload={},fingerprints=new Set(),nowMs=now.getTime();
 for(const role of ROLES){
  const e=bundle.roles[role];
  if(!envelopeValid(e,role,trusted[role])){
   issues.push('missing or invalid owner-pinned '+role+' signature');
   continue;
  }
  const fp=trusted[role];
  if(fingerprints.has(fp))issues.push('review duties not independently separated');
  fingerprints.add(fp);
  details.checkedRoles++;
  payload[role]=e.payload;
  const signedAt=asDate(e.payload.signedAt);
  if(!Number.isFinite(signedAt)||signedAt>nowMs||signedAt<nowMs-120*86400000)
   issues.push(role+' signature timestamp invalid or stale');
 }
 if(Object.keys(payload).length!==4)return cleanReport(issues,details);
 const policy=payload.ownerPolicy,blind=payload.independentBlind,phones=payload.physicalDevices,cloud=payload.signedCloud;
 const commit=policy.targetCommit,model=policy.modelSha256,manifest=policy.blindManifestSha256;
 if(!isHex64(commit)||!isHex64(model)||!isHex64(manifest))issues.push('owner policy lacks pinned source/model/blind manifest');
 if(policy.familyAlphaHold!==true||policy.releaseAuthorized===true)issues.push('owner policy must preserve Family Alpha HOLD');
 const preapproved=asDate(policy.approvedAt),scoredAt=asDate(blind.scoredAt);
 if(!Number.isFinite(preapproved)||!Number.isFinite(scoredAt)||preapproved>=scoredAt)
  issues.push('independent blind thresholds were not frozen before scoring');
 for(const obj of [blind,phones,cloud]){
  if(obj.targetCommit!==commit||obj.modelSha256!==model||obj.blindManifestSha256!==manifest)
   issues.push('source/model/blind evidence is not bound to owner-approved revision');
 }
 if(blind.independentRegistrarVetted!==true||blind.sourceDisjoint!==true||
    blind.historicalExposureCount!==0||blind.crossSplitLeakageCount!==0||
    blind.predictionsVisibleToReviewers!==false||blind.originalBytesVerified!==true||
    blind.curatorRightsApproved!==true||blind.sealedBeforeScoring!==true||
    blind.p75OfflineAuditVerified!==true)
  issues.push('independently verified source-disjoint human ground truth or rights missing');
 for(const [key,v] of Object.entries({
    newSealedBlindSources:blind.newSealedBlindSources,
    originalSourcesVerified:blind.originalSourcesVerified,
    twoIndependentHumanConsensus:blind.twoIndependentHumanConsensus,
    eligibleScoredSources:blind.eligibleScoredSources
 })){
  if(!isNonnegativeInteger(v))issues.push('invalid independent '+key+' count');
 }
 const sources=blind.newSealedBlindSources;
 if(!isNonnegativeInteger(sources)||sources<60||
    blind.originalSourcesVerified!==sources||
    blind.twoIndependentHumanConsensus!==sources||
    blind.eligibleScoredSources!==sources)
  issues.push('at least 60 separately sourced, doubly human-rated sealed originals must be scored');
 details.humanBlind=isNonnegativeInteger(blind.twoIndependentHumanConsensus)?blind.twoIndependentHumanConsensus:0;
 if(!policy.thresholds||typeof policy.thresholds!=='object'||!blind.metrics||typeof blind.metrics!=='object')
  issues.push('predeclared acceptance threshold and real metric denominators missing');
 for(const metric of METRICS){
  const plan=policy.thresholds?.[metric],observed=blind.metrics?.[metric];
  if(!plan||!observed||
     !isNonnegativeInteger(plan.minimumSamples)||plan.minimumSamples<1||
     typeof plan.minimumAccuracy!=='number'||!Number.isFinite(plan.minimumAccuracy)||
     plan.minimumAccuracy<0||plan.minimumAccuracy>1||
     !isNonnegativeInteger(observed.total)||!isNonnegativeInteger(observed.correct)||
     observed.total<plan.minimumSamples||observed.correct>observed.total){
   issues.push('invalid or underpowered '+metric+' acceptance denominator');
   continue;
  }
  if(observed.total>sources)issues.push(metric+' denominator exceeds blind source count');
  else if(observed.correct/observed.total+Number.EPSILON<plan.minimumAccuracy)
   issues.push(metric+' below preapproved accuracy threshold');
 }
 const acceptedDevices=new Set(),devices=phones.devices;
 if(!Array.isArray(devices)||devices.length>10)issues.push('real device evidence missing or unbounded');
 else{
  for(const d of devices){
   if(!d||d.physical!==true||d.emulated===true||d.witnessedByIndependentOperator!==true||
      d.genuineOriginalPhotoUsed!==true||d.ownerConfirmedEachSave!==true||
      d.noWrongSave!==true||d.privateDataIsolationVerified!==true||
      d.captureToPrivateClosetPass!==true||
      typeof d.osVersion!=='string'||!d.osVersion||
      typeof d.browserVersion!=='string'||!d.browserVersion||
      !isHex64(d.testEvidenceSha256))continue;
   if(d.platform==='Android'&&d.browser==='Chrome')acceptedDevices.add('Android Chrome');
   if(d.platform==='iPhone'&&d.browser==='Safari')acceptedDevices.add('iPhone Safari');
  }
 }
 details.physicalPlatforms=acceptedDevices.size;
 if(!acceptedDevices.has('Android Chrome')||!acceptedDevices.has('iPhone Safari'))
  issues.push('witnessed genuine Android Chrome and iPhone Safari physical end-to-end acceptance missing');
 if(phones.syntheticOnly===true||phones.realDeviceRuns<2||!isNonnegativeInteger(phones.realDeviceRuns))
  issues.push('physical device execution count missing');
 if(cloud.ownerAuthorizedTest!==true||cloud.signedTwoAccountPrivateEndToEnd!==true||
   cloud.ownerIsolationPass!==true||cloud.backupRestorePass!==true||
   cloud.sessionRevocationPass!==true||cloud.crossTabRacePass!==true||
   !isHex64(cloud.privateAuditSha256)||cloud.fakeAccountsOnly===true)
  issues.push('authorized signed two-owner cloud/privacy acceptance missing');
 return cleanReport(issues,details);
}
function externalFile(p){
 if(!p||!isAbsolute(p))throw Error('Owner-vetted private evidence requires absolute external path');
 const r=resolve(p),rel=relative(process.cwd(),r);
 if(!rel||(!rel.startsWith('..')&&!isAbsolute(rel)))throw Error('Private signed evidence must be outside public repository');
 return r;
}
async function main(){
 if(process.env.CI||process.env.GITHUB_ACTIONS){
  console.log('M1_P851_RELEASE_EVIDENCE '+JSON.stringify(evaluateMission1Evidence(null)));
  return;
 }
 const args=process.argv.slice(2);
 if(!args.length){
  console.log('M1_P851_RELEASE_EVIDENCE '+JSON.stringify(evaluateMission1Evidence(null)));
  return;
 }
 if(args.length!==2)throw Error('Usage: node scripts/m1-release-evidence-851.mjs /external/bundle.json /external/trusted-pins.json');
 const bundle=JSON.parse(await readFile(externalFile(args[0]),'utf8'));
 const trusted=JSON.parse(await readFile(externalFile(args[1]),'utf8'));
 const result=evaluateMission1Evidence(bundle,trusted);
 // Numeric counts/status only. Never echo secret keys, original photos, IDs or label rows.
 console.log('M1_P851_RELEASE_EVIDENCE '+JSON.stringify(result));
 if(result.issues.length)process.exitCode=3;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
