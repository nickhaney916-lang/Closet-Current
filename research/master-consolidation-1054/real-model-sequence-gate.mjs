// Numeric public-source diagnostic validator. A structural receipt does not
// establish independent inference custody, human accuracy or hardware proof.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
export function verifyRealModelSequence(r,{engine,target,commit,sourceHashes}){
 const issues=[];
 const check=(ok,why)=>{if(!ok)issues.push(why);};
 check(['chromium','webkit'].includes(engine)&&[2,4,8,16].includes(target)&&/^[a-f0-9]{40}$/.test(commit||''),'invalid expected source');
 check(r?.codeCommit===commit&&r?.engine===engine,'wrong commit or engine');
 check(r?.photoAttemptsTarget===target&&r?.completedPhotos===target&&r?.rows?.length===target,'incomplete sequence');
 check(r?.status==='COMPLETE_OBSERVED'&&Array.isArray(r?.failures)&&r.failures.length===0,'observed failure');
 check(r?.session==='one-continuous-browser-one-page-sequential-disposable-workers','session changed');
 check(r?.sourceHashesVerified===true&&r?.originalPhotoModified===false&&r?.autoAdmissions===0&&r?.persistedPrivateWardrobeWrites===0,'source or save violation');
 check(r?.ownerSessionIdentityChanged===false&&r?.authorizedHostedCloud===false&&r?.ownerAccount==='synthetic-only','owner scope');
 check(r?.blindAccuracy===null&&r?.independentHumanPhotoLabels===0&&r?.physicalMobileDevices===0&&r?.officialSafariOnIPhone===false&&r?.acceptanceForRelease===false&&r?.familyAlpha==='HOLD','unsupported acceptance claim');
 check(r?.networkBlocked===0&&Array.isArray(r?.pageErrors)&&r.pageErrors.length===0,'resource or JS failure');
 check(['pageCrash','pageClosed','browserDisconnected'].every(k=>r?.pageEvents?.[k]===0),'browser failed');
 check(r?.pageEvents?.workerCreated>=target,'missing real worker events');
 check(sha(r?.workerSourceCodeSha256),'missing worker source digest');
 let previous=0;const unique=new Set();
 for(const row of Array.isArray(r?.rows)?r.rows:[]){
  const expected=sourceHashes?.[row.id];unique.add(row.id);
  check(row.iteration===++previous,'nonsequential row');
  check(sha(expected)&&row.sourceSHA256===expected&&row.observedOriginalSHA256===expected&&row.sourceValid===true,'original JPEG changed or unpinned');
  check(sha(row.workerSourceCodeSha256)&&row.workerSourceCodeSha256===r.workerSourceCodeSha256,'worker source changed');
  check(Array.isArray(row.realModelFamilies)&&row.realModelFamilies.length===2&&new Set(row.realModelFamilies).size===2&&row.realModelFamilies.includes('fashionclip')&&row.realModelFamilies.includes('fashionSiglip'),'missing model family');
  check(Number.isSafeInteger(row.verifiedAssets)&&row.verifiedAssets>=2&&Number.isFinite(row.elapsedInferenceMs)&&row.elapsedInferenceMs>0,'invalid inference receipt');
  check(row.privateWrites===0&&row.automaticAdmissions===0,'unexpected write');
 }
 check(unique.size>=2&&Number.isInteger(r?.uniquePublicPhotoSources)&&r.uniquePublicPhotoSources>=2&&r.uniquePublicPhotoSources<=8&&unique.size===Math.min(target,r.uniquePublicPhotoSources),'missing distinct original sources');
 for(const n of [2,4,8,16])check(r?.gateCounts?.[n]?.requested===(target>=n)&&r?.gateCounts?.[n]?.met===(target>=n),'incorrect checkpoint');
 return {status:issues.length?'BLOCKED':'COMPLETE_OBSERVED_NOT_RELEASE',engine,target,completed:r?.completedPhotos??0,issues:[...new Set(issues)],releaseAuthorized:false,familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [path,engine,target,commit]=process.argv.slice(2);
 const r=JSON.parse(await readFile(path,'utf8'));
 const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 const sourceHashes=Object.fromEntries(manifest.filter(x=>x.verified).map(x=>[x.id,x.sha256]));
 const result=verifyRealModelSequence(r,{engine,target:Number(target),commit,sourceHashes});
 console.log('MASTER_REAL_MODEL_SEQUENCE_GATE',JSON.stringify(result));
 if(result.status==='BLOCKED')process.exitCode=2;
}
