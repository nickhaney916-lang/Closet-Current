// Evidence COMPLETENESS only. Cannot attest hardware, verify private captures,
// grant financial approval, activate a provider, merge code or approve release.
const SHA=/^[a-f0-9]{40}$/;
const DIGEST=/^[a-f0-9]{64}$/;
const REF=/^qa:[A-Za-z0-9._/-]{1,120}$/;
const LABEL=/^[A-Za-z0-9_-]{2,60}$/;
const checks=[
 'cameraDeniedThenGranted','originalPhotoDigestUnchangedAfterReload',
 'originalPhotoFirstRecognition','ownedTopPinnedAndOwnedBottomSwap',
 'disabledGenerationMakesZeroPaidCalls','lateResultHiddenAfterGarmentOrFigureChange',
 'lateResultHiddenAfterAccountChange','backgroundLockRotationAndNetworkRecovery',
 'screenReaderAndTextZoom','memoryAndResponsiveness'
];
const features=['category','color','pattern','fabric','seams','shapeAndLength'];
const nonempty=x=>typeof x==='string'&&x.trim().length>0&&x.length<=160;
function safeOrigin(value){
 try{const url=new URL(value);return url.protocol==='https:'&&url.origin===value&&!url.username&&!url.password;}catch{return false;}
}
const refs=x=>Array.isArray(x)&&x.length>0&&x.every(r=>typeof r==='string'&&REF.test(r));
const dated=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(x)&&Number.isFinite(Date.parse(x));
function phoneErrors(report,platform,sha){
 const errors=[],need=(valid,code)=>{if(!valid)errors.push(platform+'.'+code);};
 need(report?.schemaVersion===1,'schema');
 need(report?.status==='passed'&&report?.testKind==='physical-device'&&report?.actualDevice===true,'physicalRecord');
 need(report?.device?.platform===platform,'platform');
 need(report?.branchSha===sha,'branch');
 need(safeOrigin(report?.stagingOrigin),'stagingOrigin');
 need(dated(report?.testedAtWithOffset),'date');
 need(LABEL.test(report?.testerAlias||''),'testerAlias');
 need(['makeModel','osBuild','browserVersion','viewport','network'].every(k=>nonempty(report?.device?.[k])),'deviceDetails');
 need(checks.every(k=>report?.checks?.[k]===true),'checks');
 need(Array.isArray(report?.failures)&&report.failures.length===0,'failures');
 need(refs(report?.privateEvidenceReferences),'privateEvidence');
 // Complete hardware acceptance includes the live late-result checks. Basic
 // billing-disabled capture checks alone must remain a partial record.
 need(report?.billingEnabled===true&&report?.liveInferenceAuthorized===true&&
  Number.isSafeInteger(report?.actualProviderCalls)&&report.actualProviderCalls>=2,'livePhase');
 return errors;
}
function fidelityErrors(report,sha,stagingOrigin){
 const errors=[],need=(valid,code)=>{if(!valid)errors.push('fidelity.'+code);};
 need(report?.schemaVersion===1&&report?.testKind==='actual-provider'&&report?.status==='passed','actualProviderRecord');
 need(report?.branchSha===sha,'branch');
 need(safeOrigin(report?.stagingOrigin)&&report?.stagingOrigin===stagingOrigin,'stagingOrigin');
 need(dated(report?.testedAtWithOffset),'date');
 need(report?.liveInferenceAuthorized===true&&refs(report?.ownerApprovalReferences),'approvalEvidence');
 need(['licensedModelAssetsVerified','durableQuotasAndIdempotencyVerified','providerSpendCapVerified',
  'consentAndRetentionApproved'].every(k=>report?.prerequisites?.[k]===true),'prerequisites');
 need(refs(report?.privateEvidenceReferences),'privateEvidence');
 need(Array.isArray(report?.failures)&&report.failures.length===0,'failures');
 const cases=Array.isArray(report?.cases)?report.cases:[];
 const coverage=new Map(),keys=new Set();
 need(cases.length>=12,'caseCount');
 for(const [i,row] of cases.entries()){
  const prefix='case'+(i+1)+'.';
  const identity=LABEL.test(row?.pairId||'')&&['female','male'].includes(row?.figure)&&LABEL.test(row?.pose||'');
  need(identity,prefix+'identity');
  const key=[row?.pairId,row?.figure,row?.pose].join(':');
  need(!keys.has(key),prefix+'duplicate');keys.add(key);
  if(identity){
   if(!coverage.has(row.pairId))coverage.set(row.pairId,{female:new Set(),male:new Set(),
    top:row.topOriginalDigest,bottom:row.bottomOriginalDigest});
   const pair=coverage.get(row.pairId);pair[row.figure].add(row.pose);
   need(pair.top===row.topOriginalDigest&&pair.bottom===row.bottomOriginalDigest,prefix+'sameSourcePair');
  }
  const hashes=['topOriginalDigest','bottomOriginalDigest','firstPassOutputDigest','secondPassOutputDigest'].map(k=>row?.[k]);
  need(hashes.every(x=>typeof x==='string'&&DIGEST.test(x))&&new Set(hashes).size===4,prefix+'digests');
  need(row?.topPreservedAfterSecondPass===true&&['top','bottom'].every(garment=>
   features.every(k=>row?.finalGarmentChecks?.[garment]?.[k]===true)),prefix+'garmentFidelity');
  need(LABEL.test(row?.operatorAlias||'')&&LABEL.test(row?.reviewerAlias||'')&&
   row.operatorAlias!==row.reviewerAlias&&row?.independentReviewerVerdict==='pass',prefix+'independentReview');
  need(refs(row?.privateEvidenceReferences),prefix+'privateEvidence');
 }
 // Three contrasting owned pairs, both standard figures, two poses each.
 need(coverage.size>=3&&[...coverage.values()].every(x=>x.female.size>=2&&x.male.size>=2),'pairFigurePoseCoverage');
 need(new Set([...coverage.values()].map(x=>x.top+':'+x.bottom)).size>=3,'distinctSourcePairs');
 need(Number.isSafeInteger(report?.actualProviderCalls)&&report.actualProviderCalls>=cases.length*2,'providerCallCount');
 return errors;
}
export function auditTryOnAcceptance({branchSha,android=null,iphone=null,fidelity=null}={}){
 const branchValid=typeof branchSha==='string'&&SHA.test(branchSha);
 const androidErrors=phoneErrors(android,'android',branchSha),iphoneErrors=phoneErrors(iphone,'ios',branchSha);
 const independent=android?.testerAlias!==iphone?.testerAlias;
 const sameStaging=safeOrigin(android?.stagingOrigin)&&android.stagingOrigin===iphone?.stagingOrigin;
 const hardwareErrors=[...androidErrors,...iphoneErrors];
 if(!independent)hardwareErrors.push('hardware.independentTesters');
 if(!sameStaging)hardwareErrors.push('hardware.sameStaging');
 const liveErrors=fidelityErrors(fidelity,branchSha,android?.stagingOrigin);
 const errors=[...(!branchValid?['branch.invalid']:[]),...hardwareErrors,...liveErrors];
 return {
  schemaVersion:1,branchSha:branchValid?branchSha:null,status:errors.length?'blocked':'records-complete-review-required',
  hardwareRecordsComplete:branchValid&&hardwareErrors.length===0,
  fidelityRecordComplete:branchValid&&liveErrors.length===0,
  evidenceRecordsComplete:errors.length===0,actualHardwarePass:null,actualGarmentAccuracy:null,
  providerActivationAllowed:false,productionReleaseApproved:false,
  blockers:errors,
  limitation:'Validates supplied record completeness only; does not authenticate hardware, captures, reviewers, approval or provider output. Independent evidence review is still required.'
 };
}
