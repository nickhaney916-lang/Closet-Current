'use strict';
/*
 * Parallel #78 — local, OPT-IN physical-device evidence recorder.
 * Research branch only. NEVER infer a physical phone from user-agent strings.
 * No storage, fetch, analytics, cloud access, photos in reports, or auto-save.
 * Operator claims require separate independent verification before release.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.ClosetDeviceAcceptance78=api;
 if(root?.document&&root?.location?.search&&new URLSearchParams(root.location.search).get('deviceLab78')==='1')
  api.mount(root.document);
})(typeof globalThis==='object'?globalThis:this,function(root){
 const VERSION='parallel78-device-evidence-v1',SHA=/^[a-f0-9]{64}$/,COMMIT=/^[a-f0-9]{40}$/;
 const SOURCE_PARENT='9ee284f501aff50c810a05caf69fc103bc0393b4';
 const PLATFORMS=['ANDROID_CHROME','IPHONE_SAFARI','OTHER_UNVERIFIED'];
 const STATUS=['NOT_RUN','PASS','FAIL','BLOCKED'];
 const NETWORK=['wifi','limited','offline','unknown'];
 const CACHE=['cold','warm','unknown'];
 const MODELS=['Samsung Galaxy','Google Pixel','iPhone','Other Android','Other iOS','Unknown'];
 const CASES=Object.freeze([
  ['capture_camera','Real camera photo, permission allow'],
  ['camera_denied','Camera permission denied/retry'],
  ['gallery_import','Gallery original JPEG import/re-import'],
  ['background_resume','Background/foreground interrupted capture'],
  ['rotation_reload','Rotate, reload, recover pending draft'],
  ['cold_wifi','Cold recognition/model download over Wi-Fi'],
  ['warm_cache','Warm recognition with cached model'],
  ['limited_network','Limited/offline recognition and recovery'],
  ['batch_1','One-photo capture/review'],
  ['batch_10','Ten-photo batch, no missing originals'],
  ['batch_25','Twenty-five-photo batch, bounded memory'],
  ['owner_review_843','Mandatory category/type/color owner approval'],
  ['repeat_save_844','Fast repeat save and failure retry single-write'],
  ['photo_advice_845','Dark/white photo quality advisory only'],
  ['shoe_pair_846','Two shoe regions become one owned pair'],
  ['learning_847','Correction learning separately consented'],
  ['color_848','Mask-aware color only advises; owner approves'],
  ['duplicate_849','Similar purchased clothes are never auto-merged'],
  ['review_queue_850','Skip and return retains every original'],
  ['source_sha','Original JPEG SHA before/after private save'],
  ['private_owner','Owner-scoped local closet, no other account data'],
  ['quota_recovery','Quota/store failure, preserved pending draft'],
  ['restore_cloud','Authenticated cloud/restore requires separate authorization']
 ]);
 const ALLOWED_CASES=new Set(CASES.map(x=>x[0]));
 const error=code=>{throw Error('P78_'+code);};
 const digestOk=s=>typeof s==='string'&&SHA.test(s);
 const smallVersion=s=>typeof s==='string'&&/^\d{1,3}(?:\.\d{1,3}){0,2}$/.test(s)?s:'unknown';
 const number=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max?Math.round(n):null;
 const fixed=(v,set,fallback)=>set.includes(v)?v:fallback;
 function create({platform='OTHER_UNVERIFIED',modelFamily='Unknown',osVersion='unknown',browserVersion='unknown',
    viewportWidth=null,pixelRatio=null,memoryTier='unknown',network='unknown',cache='unknown',
    operatorDeclaredPhysical=false,sourceCommit=SOURCE_PARENT,createdAt=new Date().toISOString()}={}){
  if(!COMMIT.test(sourceCommit))error('COMMIT_REQUIRED');
  if(!Number.isFinite(Date.parse(createdAt))||!/\d{4}-\d\d-\d\dT/.test(createdAt))error('DATE_REQUIRED');
  return {version:VERSION,sourceCommit,createdAt,platform:fixed(platform,PLATFORMS,'OTHER_UNVERIFIED'),
   modelFamily:fixed(modelFamily,MODELS,'Unknown'),
   osVersion:smallVersion(osVersion),browserVersion:smallVersion(browserVersion),
   viewportWidth:number(viewportWidth,200,1600),pixelRatio:number(pixelRatio*100,50,800)/100||null,
   memoryTier:fixed(memoryTier,['low','medium','high','unknown'],'unknown'),
   network:fixed(network,NETWORK,'unknown'),cache:fixed(cache,CACHE,'unknown'),
   operatorDeclaredPhysical:operatorDeclaredPhysical===true,records:new Map()};
 }
 function record(session,{caseId,status='NOT_RUN',observedAt=new Date().toISOString(),durationMs=null,
  originalSha256=null,evidenceSha256=null,sourcePreserved=null,ownerGate=null,itemCountBefore=null,itemCountAfter=null}={}){
  if(!session||session.version!==VERSION||!(session.records instanceof Map))error('SESSION_REQUIRED');
  if(!ALLOWED_CASES.has(caseId)||!STATUS.includes(status))error('INVALID_CASE');
  if(!Number.isFinite(Date.parse(observedAt))||!/\d{4}-\d\d-\d\dT/.test(observedAt))error('DATE_REQUIRED');
  if(Date.parse(observedAt)<Date.parse(session.createdAt)-60000||
     Date.parse(observedAt)>Date.now()+60000)error('DATE_OUT_OF_RANGE');
  if((originalSha256!==null&&!digestOk(originalSha256))||
     (evidenceSha256!==null&&!digestOk(evidenceSha256)))error('INVALID_DIGEST');
  if(status==='PASS'||status==='FAIL'){
   if(!session.operatorDeclaredPhysical||session.platform==='OTHER_UNVERIFIED'||!digestOk(evidenceSha256))
    error('UNVERIFIED_DEVICE_EVIDENCE');
  }
  const result={caseId,status,observedAt,durationMs:number(durationMs,0,600000),
   originalSha256,evidenceSha256,sourcePreserved:sourcePreserved===true?true:sourcePreserved===false?false:null,
   ownerGate:ownerGate===true?true:ownerGate===false?false:null,
   itemCountBefore:number(itemCountBefore,0,20000),itemCountAfter:number(itemCountAfter,0,20000)};
  // A status is a human claim, never a signed or independently verified proof.
  session.records.set(caseId,Object.freeze(result));return result;
 }
 function privateReport(session){
  if(!session||session.version!==VERSION||!(session.records instanceof Map))error('SESSION_REQUIRED');
  return {format:VERSION,sourceCommit:session.sourceCommit,createdAt:session.createdAt,
   device:{platform:session.platform,modelFamily:session.modelFamily,osVersion:session.osVersion,
    browserVersion:session.browserVersion,viewportWidth:session.viewportWidth,pixelRatio:session.pixelRatio,
    memoryTier:session.memoryTier,network:session.network,cache:session.cache},
   operatorDeclaredPhysical:session.operatorDeclaredPhysical,
   evidenceClassification:'UNVERIFIED_OPERATOR_CLAIMS_NOT_INDEPENDENT_DEVICE_PROOF',
   cases:CASES.map(([id])=>session.records.get(id)||{caseId:id,status:'NOT_RUN'}),
   releaseStatus:'BLOCKED',deviceAccepted:false,humanPhotoAccuracy:'UNKNOWN',
   privateHandling:'KEEP_PRIVATE_NEVER_POST_PHOTO_OR_ACCOUNT_DATA'};
 }
 function publicReport(session){
  const report=privateReport(session);
  // Deliberately never export fine-grained model/version, source/evidence
  // digests, precise timestamps, wardrobe counts or per-item error metadata.
  const counts=Object.fromEntries(STATUS.map(s=>[s,report.cases.filter(c=>c.status===s).length]));
  return {format:VERSION,sourceCommit:report.sourceCommit,
   platform:report.device.platform,scenarioCount:CASES.length,counts,
   cases:report.cases.map(c=>({caseId:c.caseId,status:c.status})),
   operatorClaimsAreIndependentProof:false,independentlyVerifiedPhysicalRuns:0,
   releaseStatus:'BLOCKED',familyAlpha:'HOLD',humanPhotoAccuracy:'UNKNOWN'};
 }
 function validatePublic(value){
  if(!value||value.format!==VERSION||!COMMIT.test(value.sourceCommit)||
   !PLATFORMS.includes(value.platform)||value.scenarioCount!==CASES.length||
   value.releaseStatus!=='BLOCKED'||value.familyAlpha!=='HOLD'||
   value.operatorClaimsAreIndependentProof!==false||value.independentlyVerifiedPhysicalRuns!==0||
   value.humanPhotoAccuracy!=='UNKNOWN'||!Array.isArray(value.cases)||
   value.cases.length!==CASES.length)error('FORGED_OR_UNVERIFIED_REPORT');
  const expected=Object.fromEntries(STATUS.map(s=>[s,0]));
  for(let i=0;i<CASES.length;i++){
   const c=value.cases[i];if(!c||c.caseId!==CASES[i][0]||!STATUS.includes(c.status)||
      Object.keys(c).sort().join(',')!=='caseId,status')error('INVALID_CASE');
   expected[c.status]++;
  }
  if(JSON.stringify(expected)!==JSON.stringify(value.counts)||Object.keys(value).sort().join(',')!==
   ['format','sourceCommit','platform','scenarioCount','counts','cases','operatorClaimsAreIndependentProof',
    'independentlyVerifiedPhysicalRuns','releaseStatus','familyAlpha','humanPhotoAccuracy'].sort().join(','))
   error('FORGED_OR_UNVERIFIED_REPORT');
  return true;
 }
 function releaseGate(publicReports=[],{independentlyReviewedPairs=0,cloudOwnerIsolationVerified=false}={}){
  // The report alone cannot attest physical hardware, independent labels,
  // hosted RLS or signed owner consent. An external reviewer owns acceptance.
  const reports=Array.isArray(publicReports)?publicReports:[];
  for(const report of reports)validatePublic(report);
  return Object.freeze({status:'BLOCKED',independentlyVerifiedPhysicalRuns:0,
   independentlyReviewedPairs:number(independentlyReviewedPairs,0,100000)||0,
   cloudOwnerIsolationVerified:cloudOwnerIsolationVerified===true,
   reason:'Operator-generated receipts are NOT physical device attestations; independent Android and iPhone witness verification plus blind real-photo results and signed-account checks required.'});
 }
 async function shaBytes(bytes){
  if(!root.crypto?.subtle)error('CRYPTO_UNAVAILABLE');
  const hash=await root.crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
 }
 async function hashPrivateFile(file,{jpegOnly=false}={}){
  if(!file||typeof file.arrayBuffer!=='function'||!Number.isFinite(file.size)||file.size<4||
     file.size>20*1024*1024)error('FILE_UNAVAILABLE_OR_TOO_LARGE');
  const buffer=await file.arrayBuffer(),bytes=new Uint8Array(buffer);
  if(jpegOnly&&(bytes[0]!==255||bytes[1]!==216||bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217))
   error('ORIGINAL_JPEG_REQUIRED');
  const result={sha256:await shaBytes(buffer),bytes:buffer.byteLength};
  // The file name, path, EXIF, body, owner and image bytes never enter a receipt.
  return Object.freeze(result);
 }
 function mount(document){
  if(!document?.createElement||document.querySelector('#deviceLab78Launcher'))return false;
  const launch=document.createElement('button');launch.id='deviceLab78Launcher';
  launch.type='button';launch.textContent='Enable local device QA (research only)';
  launch.style.cssText='position:fixed;bottom:12px;left:12px;z-index:2147483640;padding:12px;background:#24194a;color:white;border:2px solid white;border-radius:8px;min-height:48px;max-width:calc(100vw - 24px)';
  document.body.append(launch);
  launch.onclick=()=>{
   launch.remove();
   const panel=document.createElement('aside');panel.id='deviceLab78Panel';panel.setAttribute('aria-label','Parallel 78 local device QA');
   panel.style.cssText='position:fixed;inset:8px;z-index:2147483640;overflow:auto;box-sizing:border-box;width:auto;max-width:580px;max-height:calc(100dvh - 16px);margin:auto;background:#fff;color:#17152e;padding:14px;border:3px solid #251449;border-radius:10px;font:16px system-ui;overflow-wrap:anywhere';
   // Local diagnostics use strictly whitelisted selection values, never notes,
   // filenames, image previews, account IDs, raw user-agent or URLs.
   panel.innerHTML='<h2 style="margin:0">Closet Current · Physical-device QA #78</h2>'+
    '<p><strong>Physical acceptance BLOCKED until independently witnessed.</strong> This is a local, optional diagnostics tool. No photographs or tokens are transmitted or stored.</p>'+
    '<label>Device family <select id="p78platform"><option value="OTHER_UNVERIFIED">Unverified</option><option value="ANDROID_CHROME">Physical Android Chrome (operator claim)</option><option value="IPHONE_SAFARI">Physical iPhone Safari (operator claim)</option></select></label> '+
    '<label>Model family <select id="p78model"><option>Unknown</option><option>Samsung Galaxy</option><option>Google Pixel</option><option>iPhone</option><option>Other Android</option><option>Other iOS</option></select></label>'+
    '<p><label>OS version <input id="p78os" size="6" inputmode="decimal" placeholder="e.g. 17"></label> <label>Browser version <input id="p78browser" size="6" inputmode="decimal" placeholder="e.g. 130"></label></p>'+
    '<label><input id="p78physical" type="checkbox"> I am operating an actual physical phone, not a desktop emulator.</label>'+
    '<p><button type="button" id="p78start">Start memory-only session</button></p>'+
    '<p><label>Test case <select id="p78case"></select></label></p>'+
    '<p><label>Observed result <select id="p78status"><option>NOT_RUN</option><option>BLOCKED</option><option>FAIL</option><option>PASS</option></select></label></p>'+
    '<p><label>Original JPEG (hash locally, never retain bytes) <input id="p78jpeg" type="file" accept="image/jpeg"></label></p>'+
    '<p><label>Private supporting artifact (hash locally, never retain bytes) <input id="p78proof" type="file"></label></p>'+
    '<p><button type="button" id="p78timer">Start timing</button> <button type="button" id="p78finish">End timing</button> <button type="button" id="p78mark">Record manual observation</button></p>'+
    '<p><button type="button" id="p78public">Export shareable BLOCKED summary</button> <button type="button" id="p78private">Export PRIVATE receipt</button> <button type="button" id="p78close">Close and discard</button></p>'+
    '<p id="p78message" role="status" aria-live="polite">No device verification has occurred.</p>';
   document.body.append(panel);
   const $=id=>panel.querySelector('#'+id);
   for(const [id,label]of CASES){const option=document.createElement('option');option.value=id;option.textContent=label;$('p78case').append(option);}
   for(const input of panel.querySelectorAll('input,select,button'))input.style.maxWidth='100%';
   for(const button of panel.querySelectorAll('button'))button.style.minHeight='44px';
   let session=null,started=null,elapsed=null,originalSha256=null,evidenceSha256=null;
   const say=t=>{$('p78message').textContent=t;};
   const download=(report,filename)=>{
    const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   };
   $('p78start').onclick=()=>{session=create({
    platform:$('p78platform').value,modelFamily:$('p78model').value,
    osVersion:$('p78os').value,browserVersion:$('p78browser').value,
    operatorDeclaredPhysical:$('p78physical').checked,
    viewportWidth:root.innerWidth,pixelRatio:root.devicePixelRatio,
    memoryTier:'unknown',network:'unknown',cache:'unknown'});
    started=null;elapsed=null;originalSha256=null;evidenceSha256=null;
    say('Session started in memory. Manual observations do not prove physical acceptance.');};
   $('p78jpeg').onchange=async()=>{try{const file=$('p78jpeg').files?.[0];
    originalSha256=(await hashPrivateFile(file,{jpegOnly:true})).sha256;
    $('p78jpeg').value='';say('Original JPEG hashed locally; no pixels stored.');}
    catch{originalSha256=null;say('Invalid original JPEG. No pixels retained.');}};
   $('p78proof').onchange=async()=>{try{const file=$('p78proof').files?.[0];
    evidenceSha256=(await hashPrivateFile(file)).sha256;$('p78proof').value='';
    say('Private artifact hashed locally. Keep evidence private.');}
    catch{evidenceSha256=null;say('Evidence could not be hashed.');}};
   $('p78timer').onclick=()=>{started=root.performance.now();elapsed=null;say('Manual stage timer started.');};
   $('p78finish').onclick=()=>{if(started===null){say('Start timing first.');return;}
    elapsed=Math.max(0,Math.round(root.performance.now()-started));started=null;
    say('Manual stage interval recorded: '+elapsed+' ms. Not a model-only time.');};
   $('p78mark').onclick=()=>{try{if(!session)error('SESSION_REQUIRED');
    const c=record(session,{caseId:$('p78case').value,status:$('p78status').value,
     durationMs:elapsed,originalSha256,evidenceSha256});
    say('Recorded '+c.caseId+' as '+c.status+' (operator claim only). Release remains BLOCKED.');
   }catch(e){say('Not recorded: '+e.message.replace(/^P78_/,'').slice(0,70));}};
   $('p78public').onclick=()=>{try{if(!session)error('SESSION_REQUIRED');
    download(publicReport(session),'parallel78-shareable-BLOCKED.json');say('Shareable summary excludes photos and digests. NOT physical proof.');
   }catch{say('Start a session first.');}};
   $('p78private').onclick=()=>{try{if(!session)error('SESSION_REQUIRED');
    download(privateReport(session),'parallel78-PRIVATE-evidence.json');say('Private receipt exported. Do NOT post to a public issue.');
   }catch{say('Start a session first.');}};
   $('p78close').onclick=()=>{session=null;panel.remove();say=()=>{};};
  };
  return true;
 }
 return Object.freeze({VERSION,SOURCE_PARENT,CASES,create,record,privateReport,publicReport,
  validatePublic,releaseGate,hashPrivateFile,mount});
});