/**
 * Assemble a SOURCE-PINNED, deliberately UNUSABLE Family Alpha recognition +
 * source-photo/2D avatar candidate from two distinct development trees.
 *
 * This creates an OFFLINE inspection artifact, NOT a release candidate.
 * The existing staging Auth/backup HOLD builder alone creates the Auth layer.
 * No real users, model inference, image uploads, credentials or cloud calls.
 *
 * Input Git refs must be explicitly fetched into the local object database.
 */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {resolve,relative,sep,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 STAGE_ID,PROD_ID,stageIndexSource,assertStagingAuthCandidate
} from './build-family-alpha-staging-auth-hold.mjs';
import {STAGING_REF,RECOGNITION_REF} from './audit-family-alpha-recognition-bridge.mjs';

export const OUTPUT='dist-family-alpha-recognition-integration-hold';
const STAGE_OUTPUT='dist-family-alpha-staging-auth-hold';
const sha256=x=>createHash('sha256').update(x).digest('hex');
const STAGED_AUTH_PROTECTED=new Set([
 'auth.js','cloud-backup.js','cloud-backup-engine.js','cloud-backup-bridge.js',
 'family-alpha-2d-auth-preflight.mjs','index.html','pwa.js','sw.js'
]);
// Parallel Chat #21 exact reviewed worker-response patch; no unrelated app
// changes from its earlier #279 parent may be imported into #283 source.
export const REVIEW_REF='1ecac1079e75f1f25dc70a4c712b2448eb87dca8';
export const WORKER_RECOVERY_REF='08ed6ac4a3fc921eae5d5d3df3bd3966429559d2';
const workerBlock=app=>{
 const begin=app.indexOf('function localRequest(type,image,itemId,hint){');
 const end=app.indexOf('\nasync function enableLocal()',begin);
 if(begin<0||end<=begin||app.indexOf('function localRequest(type,image,itemId,hint){',begin+1)>=0)
  throw Error('Scanner worker controller not uniquely identified');
 return {begin,end,body:app.slice(begin,end)};
};
export function applyPinnedWorkerRecovery(baseApp,recoveryApp){
 const original=workerBlock(baseApp),candidate=workerBlock(recoveryApp);
 if(!original.body.includes('if(data.type===\'error\'){localReady=false;')||
    original.body.includes('worker_response_invalid')||
    !candidate.body.includes("stopRecognitionWorker('Recognition returned an invalid response.")||
    !candidate.body.includes("const expected=job.type==='load'?'ready':'result';")||
    !candidate.body.includes("const recoverable=job.type!=='load'&&data.code==='image';")||
    !candidate.body.includes('error.recoverable=recoverable;job.reject(error);'))
  throw Error('Unexpected worker recovery source; do not import across branches');
 const failure='if(categoryStillCurrent()&&!item.userAdjusted)recognitionUnavailable=true;';
 const recovery='if(categoryStillCurrent()&&!item.userAdjusted&&!error?.recoverable)recognitionUnavailable=true;';
 if(baseApp.split(failure).length!==2||recoveryApp.split(recovery).length!==2)
  throw Error('Original-source guarded scan failure path cannot be reconciled');
 const merged=baseApp.slice(0,original.begin)+candidate.body+baseApp.slice(original.end);
 const result=merged.replace(failure,recovery);
 if(!result.includes('normalizeClothing(structuredClone(item))')||
    !result.includes("typeof nextBatch==='function'?nextBatch():nextBatch")||
    !result.includes('const verifiedColorAdmission=new WeakMap()'))
  throw Error('Scanner recovery lost previously verified wardrobe or original-source guards');
 return result;
}
// Parallel Chat #23 original-source manual review, reconciled with the later
// #283 queued-save supplier and independently approved #281 worker recovery.
// Extract ONLY the Adjust dialog and one photo-status label from PR #284;
// do not import its earlier app.js wholesale or lose current source integrity.
const photoEditorBlock=app=>{
 const begin=app.indexOf('function adjustPhoto(item){');
 const end=app.indexOf('\\nfunction renderRecognitionNotice()',begin);
 if(begin<0||end<=begin||app.indexOf('function adjustPhoto(item){',begin+1)>=0)
  throw Error('Manual photo editor cannot be uniquely reconciled');
 return {begin,end,body:app.slice(begin,end)};
};
export function applyPinnedMobileReview(baseApp,reviewApp){
 const current=photoEditorBlock(baseApp),candidate=photoEditorBlock(reviewApp);
 const expectedSource="await savePiece(value,batch.filter(x=>x.id!==item.id),editorCurrent);";
 const safeSource="await savePiece(value,()=>batch.filter(x=>x.id!==item.id),editorCurrent);";
 if(!candidate.body.includes(expectedSource)||candidate.body.includes(safeSource)||
    !candidate.body.includes('const editorHint=JSON.stringify(item.segmentHint??null);')||
    !candidate.body.includes('I checked the original photo, category, item type and color')||
    !candidate.body.includes('ClothingDetails.validColor(value.color)')||
    !candidate.body.includes('Original unmasked garment photo used for recognition')||
    !current.body.includes(safeSource))
  throw Error('Unexpected reviewed editor or missing prior queued-save safety');
 const reviewed=candidate.body.replace(expectedSource,safeSource);
 let merged=baseApp.slice(0,current.begin)+reviewed+baseApp.slice(current.end);
 const oldLabel="'Needs a clearer photo'";
 const newLabel="'Review garment details'";
 if(merged.split(oldLabel).length!==2||!reviewApp.includes(newLabel))
  throw Error('Unrecognized photo-result wording changed during review');
 merged=merged.replace(oldLabel,newLabel);
 if(!merged.includes(safeSource)||!merged.includes('normalizeClothing(structuredClone(item))')||
    !merged.includes('const verifiedColorAdmission=new WeakMap()')||
    !merged.includes("const recoverable=job.type!=='load'&&data.code==='image';"))
  throw Error('Manual review changed worker recovery / original-source data safety');
 return merged;
}
export function applyPinnedMobileReviewStyle(css,reviewCss){
 const marker='/* Assignment 23: readable, explicitly acknowledged photo review on phones. */';
 if(css.includes(marker)||reviewCss.split(marker).length!==2)
  throw Error('Expected mobile review style not unique');
 const addition=reviewCss.slice(reviewCss.indexOf(marker)).trimEnd();
 if(!addition.includes('.photo-review-acknowledgement')||
    !addition.includes('.photo-review-original')||
    !addition.includes('min-height:48px'))
  throw Error('Mobile review CSS controls missing');
 return css.trimEnd()+'\\n\\n'+addition+'\\n';
}
const isAlphaFile=name=>name.startsWith('family-alpha-')||name.startsWith('alpha-stage-')||
 name.startsWith('__alpha_research/');
const source=(path)=>{
 if(!/^public\/[A-Za-z0-9_./-]+$/.test(path)||path.includes('..'))
  throw Error('Unexpected recognition source path');
 try{
  return execFileSync('git',['show',RECOGNITION_REF+':'+path],
   {maxBuffer:50*1024*1024,stdio:['ignore','pipe','ignore']});
 }catch(e){throw Error('Pinned recognition source not locally available: '+path);}
};
const stageSource=(path)=>{
 if(!/^public\/[A-Za-z0-9_./-]+$/.test(path)||path.includes('..'))
  throw Error('Unexpected staging source path');
 try{return execFileSync('git',['show',STAGING_REF+':'+path],{
  maxBuffer:12*1024*1024,stdio:['ignore','pipe','ignore']
 });}catch{throw Error('Pinned staging source unavailable: '+path);}
};
export function listedRecognitionAssets({git='git'}={}){
 const result=execFileSync(git,['ls-tree','-r','-z','--name-only',
  RECOGNITION_REF,'public'],{maxBuffer:8*1024*1024}).toString('utf8');
 return result.split('\0').filter(Boolean).filter(p=>p.startsWith('public/'));
}
const unique=(str,needle)=>str.split(needle).length-1;
export function combineStageAndRecognitionMarkup(newIndex,stageIndex){
 const panel=stageIndex.match(/<section id="familyAlphaLocalPreview"[\s\S]*?<\/section>/)?.[0];
 if(!panel||unique(stageIndex,'id="familyAlphaPreviewStart"')!==1||
  unique(stageIndex,'id="familyAlphaPreviewReview"')!==1||
  unique(stageIndex,'id="familyAlphaPreviewAvatar"')!==1)
  throw Error('Staged reviewed-original 2D preview form not found exactly once');
 if(unique(newIndex,'<aside class="board-context">')!==1||
  unique(newIndex,'<script src="auth.js"></script>')!==1||
  unique(newIndex,'<script src="cloud-backup.js"></script>')!==1||
  newIndex.includes('family-alpha-preview-boot.js')||
  newIndex.includes('familyAlphaLocalPreview'))
  throw Error('Recognition HTML requires explicit re-review, not blind replacement');
 const anchor='</div><aside class="board-context">';
 if(unique(newIndex,anchor)!==1)
  throw Error('Recognition 2D preview placement not uniquely located');
 const withPanel=newIndex.replace(anchor,panel+anchor);
 const withBoot=withPanel.replace('</body>',
  '<script src="family-alpha-preview-boot.js"></script></body>');
 // A blocked Auth build must make ZERO third-party requests before sign-in.
 // Public fonts and trend refresh otherwise run eagerly. CSP prevents them
 // from leaving this offline inspection page without rewriting production
 // trend/model files or relying on a test-specific network interceptor.
 const csp='<meta http-equiv="Content-Security-Policy" content="default-src \'self\' data: blob:; connect-src \'self\'; img-src \'self\' data: blob:; font-src \'self\' data:; style-src \'self\' \'unsafe-inline\'; script-src \'self\'; worker-src \'self\' blob:; object-src \'none\'; base-uri \'self\'; form-action \'self\'">';
 // CSP must precede stylesheet declarations: the browser's speculative
 // preload scanner can start fetching @import Google Fonts before it reaches
 // a policy appended at the END of <head>.
 if(withBoot.split('<head>').length!==2)throw Error('Integrated CSP insertion point changed');
 const localOnly=withBoot.replace('<head>','<head>'+csp);
 const withStageAuth=stageIndexSource(localOnly);
 if(unique(withStageAuth,'id="familyAlphaLocalPreview"')!==1||
   unique(withStageAuth,'id="reusableFigureStage"')!==1||
   unique(withStageAuth,'src="alpha-stage-config.js"')!==1||
   unique(withStageAuth,'src="family-alpha-preview-boot.js"')!==1)
  throw Error('Combined stage Auth, 2D preview and reusable recognition figure not all present');
 return withStageAuth;
}
async function filePaths(directory,prefix=''){
 let result=[];
 for(const v of await readdir(directory,{withFileTypes:true})){
  if(v.isSymbolicLink())throw Error('Symlink in candidate');
  const p=prefix+v.name;
  if(v.isDirectory())result.push(...await filePaths(join(directory,v.name),p+'/'));
  else if(v.isFile())result.push(p);
  else throw Error('Unexpected candidate asset');
 }
 return result;
}
export async function buildDisabledIntegratedCandidate({root=resolve('.')}={}){
 const base=resolve(root),target=join(base,OUTPUT),staging=join(base,STAGE_OUTPUT);
 if(relative(base,target)!==OUTPUT||!target.startsWith(base+sep)||
  target===staging)throw Error('Unsafe integrated build destination');
 // For invocation in CI, run the existing full staging auth HOLD builder first.
 const stageGate=await assertStagingAuthCandidate({root:base});
 if(stageGate.releaseGate!=='HOLD'||stageGate.routingReadyForQa||
    stageGate.publishingAuthorized||stageGate.projectRef!==STAGE_ID)
  throw Error('Existing stage builder must still be blocked');
 const modernFiles=listedRecognitionAssets();
 if(modernFiles.length<55||modernFiles.length>800)throw Error('Unexpected recognition app asset inventory');
 if(modernFiles.filter(p=>p==='public/app.js').length!==1||
  modernFiles.filter(p=>p==='public/index.html').length!==1)
  throw Error('Modern app source manifest incomplete');
 await rm(target,{force:true,recursive:true});
 await cp(staging,target,{recursive:true});
 const modified=[],unchanged=[];
 for(const p of modernFiles){
  const targetPath=p.slice('public/'.length);
  if(isAlphaFile(targetPath)||STAGED_AUTH_PROTECTED.has(targetPath)){
   unchanged.push(targetPath);continue;
  }
  // All recognition JS/model/CSS assets are from ONE commit: no half-applied
  // classifier update, binary weights mismatch or stale recognition HTML.
  const original=source(p);
  await mkdir(dirname(join(target,targetPath)),{recursive:true});
  await writeFile(join(target,targetPath),original);
  modified.push({path:targetPath,sha256:sha256(original)});
 }
 // The newer recognition UI includes an unrelated production AI try-on
 // endpoint. No paid service, hidden production routing or provider request
 // may be present in this staging candidate. Preserve the local figure and
 // original-photo avatar; replace ONLY the paid generation surface.
 const noPaidTryOn=`'use strict';
 // Family Alpha offline HOLD: paid AI try-on is deliberately disabled.
 function onTryOnBoardChanged(){
  const button=document.getElementById('tryOnGenerate');
  const status=document.getElementById('tryOnStatus');
  if(button){button.disabled=true;button.hidden=true;}
  if(status)status.textContent='Paid AI generation is disabled for Family Alpha testing. Use your saved-clothing local figure.';
 }
 onTryOnBoardChanged();
 `;
 await writeFile(join(target,'ai-tryon.js'),noPaidTryOn);
 modified.push({path:'ai-tryon.js',sha256:sha256(noPaidTryOn),safetyOverride:'PAID_GENERATION_DISABLED'});
 // Avoid even attempting Google Fonts requests in a strict offline build:
 // CSP might prevent the response but the network request is still visible.
 // Only remove the ONE known public font @import from the pinned modern CSS;
 // leave all controls and styling rules unchanged with system fallbacks.
 const cssPath=join(target,'style.css');
 const originalCss=await readFile(cssPath,'utf8');
 const importLine="@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500&display=swap');";
 if(!originalCss.startsWith(importLine))
  throw Error('Unexpected Google Fonts import; review offline styling first');
 const previewCss=originalCss.slice(importLine.length);
 let mobileCss;
 try{mobileCss=execFileSync('git',['show',REVIEW_REF+':public/style.css'],
  {maxBuffer:8*1024*1024,stdio:['ignore','pipe','ignore']}).toString('utf8');}
 catch{throw Error('Missing pinned mobile review PR #284 style source');}
 const localCss=applyPinnedMobileReviewStyle(previewCss,mobileCss);
 if(localCss.includes('fonts.googleapis.com')||localCss.includes('fonts.gstatic.com'))
  throw Error('External font reference remains in offline style');
 await writeFile(cssPath,localCss);
 modified.push({path:'style.css',sha256:sha256(localCss),safetyOverride:'REMOTE_FONT_IMPORT_DISABLED'});
 const stageIndex=stageSource('public/index.html').toString('utf8');
 const modernIndex=source('public/index.html').toString('utf8');
 const index=combineStageAndRecognitionMarkup(modernIndex,stageIndex);
 await writeFile(join(target,'index.html'),index);
 const stageAuth=await readFile(join(staging,'auth.js'));
 const stageCloud=await readFile(join(staging,'cloud-backup.js'));
 for(const [path,expected]of [['auth.js',stageAuth],['cloud-backup.js',stageCloud]]){
  const actual=await readFile(join(target,path));
  if(!actual.equals(expected))throw Error('Integration overwrote gated stage '+path);
 }
 const modernApp=source('public/app.js');
 let workerRecovery;
 try{workerRecovery=execFileSync('git',['show',WORKER_RECOVERY_REF+':public/app.js'],
  {maxBuffer:50*1024*1024,stdio:['ignore','pipe','ignore']}).toString('utf8');}
 catch{throw Error('Missing pinned recovery PR #281 source SHA: fetch its immutable commit');}
 const workerMerged=applyPinnedWorkerRecovery(modernApp.toString('utf8'),workerRecovery);
 let mobileReview;
 try{mobileReview=execFileSync('git',['show',REVIEW_REF+':public/app.js'],
  {maxBuffer:50*1024*1024,stdio:['ignore','pipe','ignore']}).toString('utf8');}
 catch{throw Error('Missing pinned mobile review PR #284 app source');}
 const mergedApp=applyPinnedMobileReview(workerMerged,mobileReview);
 await writeFile(join(target,'app.js'),mergedApp);
 const app=await readFile(join(target,'app.js'),'utf8');
 if(sha256(app)!==sha256(mergedApp)||
    unique(app,'const verifiedColorAdmission=new WeakMap()')!==1||
    unique(app,'function recognitionSourcePhoto(item)')!==1||
    unique(app,'function canConfirmReviewedColor(item)')!==1)
  throw Error('Latest original-photo recognition and color review implementation not retained');
 // Verified Work Assignment #22 fixes are part of this coherent pinned
 // recognition source: late queue drafts, deep original JPEG/crop/hint isolation,
 // and explicit type-loss refusal on backup restore.
 const backup=await readFile(join(target,'wardrobe-backup-engine.js'),'utf8');
 if(sha256(backup)!==sha256(source('public/wardrobe-backup-engine.js'))||
    !app.includes("typeof nextBatch==='function'?nextBatch():nextBatch")||
    !app.includes("await savePiece(value,()=>batch.filter(x=>x.id!==item.id),editorCurrent)")||
    !app.includes("normalizeClothing(structuredClone(item))")||
    !backup.includes('Backup clothing type would lose confirmed detail. Nothing was restored.'))
  throw Error('Assignment #22 original-image / current draft / backup subtype protections missing');
 const boot=await readFile(join(target,'family-alpha-preview-boot.js'),'utf8');
 if(!boot.includes("host!=='localhost'&&host!=='127.0.0.1'")||
    !boot.includes('window.__CLOSET_CURRENT_FAMILY_ALPHA_LOCAL_PREVIEW__!==true'))
  throw Error('Development-only avatar boot not disabled outside localhost');
 const config=await readFile(join(target,'alpha-stage-config.js'),'utf8');
 if(!config.includes('HOLD-NO-CALLBACK-OR-KEY')||
   !config.includes('"key":""')||!config.includes('"redirect":""'))
  throw Error('Stage Auth has a key/callback or lost default HOLD state');
 // Explicit audit of actual runtime code; no production Supabase project ref
 // may survive among JS modules delivered in the held preview bundle.
 const external=[];
 for(const path of await filePaths(target)){
  if(!/\.(?:js|mjs|html)$/.test(path))continue;
  const value=await readFile(join(target,path),'utf8');
  if(value.includes(PROD_ID))external.push(path);
 }
 // The stage artifact may carry historical production-facing metadata in
 // inherited qa files; fail on executable scripts regardless of origin.
 if(external.length)throw Error('Integrated candidate still includes production Supabase reference in '+external.join(', '));
 const manifest={
  schemaVersion:1,kind:'Family Alpha + modern recognition — DISABLED, offline review ONLY',
  releaseGate:'HOLD',status:'UNAPPROVED_COMBINED_SOURCE_OFFLINE_ONLY',
  stagingRef:STAGING_REF,recognitionRef:RECOGNITION_REF,
  stagingProjectRef:STAGE_ID,productionProjectRef:PROD_ID,
  stageAuthBlocked:true,missingPublishableKey:true,missingApprovedCallback:true,
  previewOffOutsideLocalhost:true,
  cloudAuthorizationsTested:false,realPhotoAccuracyTested:false,
  nativePhonesTested:false,customerDataRead:false,
  originalJPEGRecognitionFromPinnedModernSource:true,
  modernHumanColorProofRetained:true,
  wardrobeDraftAndBackupIntegrityPinned:true,
  integrationBackupSha256:sha256(backup),
  stagePrivateAuthTransformationPreserved:true,
  stagedReviewed2DAvatarPresent:true,
  workerRecoveryRef:WORKER_RECOVERY_REF,workerRecoveryProtocolGuarded:true,
  recoverableImageErrorIsolated:true,
  mobileReviewRef:REVIEW_REF,sourcePinnedManualReview:true,queuedManualSavePreserved:true,
  integrationAppSha256:sha256(app),integrationIndexSha256:sha256(index),
  recognitionOverlayFiles:modified,retainedStageGatedAssets:unchanged,
  testingLimitations:[
   'No licensed photo classifier inference rerun against this mixed artifact',
   'No actual Supabase JWT row/Storage authorization or account signup',
   'No real-device camera, family photos, email delivery or hosted Cloudflare Access verification',
   'No release/merge/deploy authorization even if synthetic mobile checks pass'
  ]
 };
 await writeFile(join(target,'alpha-recognition-integration-hold-manifest.json'),
  JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
export async function assertDisabledIntegratedCandidate({root=resolve('.')}={}){
 const target=join(resolve(root),OUTPUT);
 const x=JSON.parse(await readFile(join(target,'alpha-recognition-integration-hold-manifest.json'),'utf8'));
 if(x.releaseGate!=='HOLD'||x.status!=='UNAPPROVED_COMBINED_SOURCE_OFFLINE_ONLY'||
  !x.stageAuthBlocked||!x.workerRecoveryProtocolGuarded||!x.recoverableImageErrorIsolated||
  x.workerRecoveryRef!==WORKER_RECOVERY_REF||x.mobileReviewRef!==REVIEW_REF||
  !x.sourcePinnedManualReview||!x.queuedManualSavePreserved||!x.modernHumanColorProofRetained||!x.wardrobeDraftAndBackupIntegrityPinned||!x.stagedReviewed2DAvatarPresent||
  !x.stagePrivateAuthTransformationPreserved||x.stagingProjectRef!==STAGE_ID||
  !x.missingApprovedCallback||!x.missingPublishableKey||
  x.cloudAuthorizationsTested||x.nativePhonesTested||x.customerDataRead||
  x.stagingRef!==STAGING_REF||x.recognitionRef!==RECOGNITION_REF)
  throw Error('Unsupported integrated candidate release claim');
 const [app,index,auth,config,boot,backup]=await Promise.all(
  ['app.js','index.html','auth.js','alpha-stage-config.js','family-alpha-preview-boot.js','wardrobe-backup-engine.js'].map(p=>
   readFile(join(target,p),'utf8')));
 if(sha256(app)!==x.integrationAppSha256||sha256(index)!==x.integrationIndexSha256||
  sha256(backup)!==x.integrationBackupSha256||
  !app.includes('const verifiedColorAdmission=new WeakMap()')||
  !app.includes('I checked the original photo, category, item type and color')||
  !app.includes('const editorHint=JSON.stringify(item.segmentHint??null);')||
  !app.includes('await savePiece(value,()=>batch.filter(x=>x.id!==item.id),editorCurrent);')||
  !app.includes("const recoverable=job.type!=='load'&&data.code==='image';")||
  !app.includes("const expected=job.type==='load'?'ready':'result';")||
  !index.includes('id="familyAlphaLocalPreview"')||
  !index.includes('id="reusableFigureStage"')||
  !config.includes('HOLD-NO-CALLBACK-OR-KEY')||
  !boot.includes("host!=='localhost'&&host!=='127.0.0.1'")||
  !auth.includes('https://'+STAGE_ID+'.supabase.co')||
  auth.includes('https://'+PROD_ID+'.supabase.co'))
  throw Error('Staged source and modern recognition integration HOLD content changed');
 return x;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('No authorization or secret arguments accepted');
 const x=await buildDisabledIntegratedCandidate();
 await assertDisabledIntegratedCandidate();
 console.log('FAMILY_ALPHA_RECOGNITION_COMBINED_HOLD',JSON.stringify({
  releaseGate:x.releaseGate,status:x.status,recognitionOverlayCount:x.recognitionOverlayFiles.length,
  modernSourceSHA256:x.integrationAppSha256,stageAuthBlocked:x.stageAuthBlocked,
  stage2DPreserved:x.stagedReviewed2DAvatarPresent
 }));
}
