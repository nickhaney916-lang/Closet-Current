/**
 * PHOTO110: in-memory reviewed saved-look -> real public photographed 163-bone
 * outfit preview, or explicit ORIGINAL PRIVATE PHOTO/2D FALLBACK. This is a
 * synthetic research account only; NO real auth, accounts or private photos.
 */
import {
 RESEARCH_OWNER_110,RESEARCH_SOURCE_110,
 planReviewedSourceLook110,requireUnchangedReviewedLook110
} from './owner-bound-look-policy.mjs';

const BENCHMARK_GEN=1;
export function mountReviewedLookResearchPanel110(doc,host){
 if(!doc?.getElementById||!host?.location||
  !['localhost','127.0.0.1','[::1]'].includes(host.location.hostname)||
  new URLSearchParams(host.location.search).get('look110')!=='on'||
  new URLSearchParams(host.location.search).get('knee109')!=='on')
  throw Error('PHOTO110 source-only localhost 3D mobile and saved-look research gate required');
 if(doc.getElementById('cc110LookPanel'))
  throw Error('PHOTO110 one original-source saved look research panel only');
 const anchor=doc.getElementById('cc109MobileControls');
 const originalReview=doc.getElementById('review');
 const clear=doc.getElementById('clear');
 if(!anchor||!originalReview||!clear||!doc.getElementById('wear')||
    !doc.getElementById('swap')||!doc.getElementById('status'))
  throw Error('PHOTO110 actual original reviewed 3D controls unavailable');
 const style=doc.createElement('style');
 style.id='cc110Style';
 style.textContent=[
  '#cc110LookPanel{border:1px solid #819e91;border-radius:12px;padding:12px;margin-top:12px;background:#f0f4f1}',
  '#cc110LookPanel h2{font-size:18px;margin:0 0 6px}',
  '#cc110LookPanel p{font-size:13px;line-height:1.4}',
  '#cc110Buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
  '#cc110Buttons button{width:100%;min-height:48px;font-size:13px;white-space:normal;padding:9px 5px}',
  '#cc110LookMessage{overflow-wrap:break-word;min-height:36px}',
  '@media(max-width:350px){#cc110Buttons button{font-size:12px}}'
 ].join('\n');
 doc.head.append(style);
 const root=doc.createElement('section');
 root.id='cc110LookPanel';
 root.setAttribute('aria-label','Research saved outfit to original photographed 3D');
 root.innerHTML=[
  '<h2>Reviewed saved look → photographed 3D</h2>',
  '<p>Research-only synthetic account. Only the two licensed source jeans',
  ' have verified 3D meshes. Other actual closet photos keep their original 2D view.</p>',
  '<div id="cc110Buttons" role="group" aria-label="Saved outfit review">',
  '<button type="button" id="cc110Save" disabled>Save reviewed licensed look</button>',
  '<button type="button" id="cc110Reopen" disabled>Reopen saved look in 3D</button>',
  '<button type="button" id="cc110Private" >Try an unverified personal outfit</button>',
  '<button type="button" id="cc110OwnerSwitch">Switch synthetic account</button>',
  '</div>',
  '<p id="cc110LookMessage" role="status" aria-live="polite">',
  'Review and wear approved public source garments to save a research look. Family Alpha HOLD.</p>'
 ].join('');
 anchor.after(root);
 const $=id=>doc.getElementById(id);
 const save=$('cc110Save'),reopen=$('cc110Reopen'),privateTest=$('cc110Private'),
  guest=$('cc110OwnerSwitch'),message=$('cc110LookMessage');
 let simulated=Object.freeze({authenticated:true,ownerId:RESEARCH_OWNER_110,generation:BENCHMARK_GEN});
 let saved=null,mode='none',disposed=false,busy=false,lastOutcome=null;
 const isOriginal=()=>simulated.ownerId===RESEARCH_OWNER_110&&
  simulated.generation===BENCHMARK_GEN;
 const sourceInfo=()=>{
  const d=host.cc69Diagnostics?.();
  const idx=host.cc110ResearchIndex?.();
  const live=host.cc110ResearchSession?.();
  return {d,idx,live};
 };
 const buildBoard=selected=>({slots:{
  top:'licensed-shirt',
  bottom:selected==='public'?'licensed-jeans-1':'licensed-jeans-2'
 }});
 const validateCurrent=()=>{
  if(!isOriginal()||!originalReview.checked)return null;
  const {d,idx,live}=sourceInfo();
  if(!d?.loaded||!d?.actual3DGarment?.realPhotoApplied||
     d.rig?.bones!==163||!['female','male'].includes(d.figure)||
     !['public','second'].includes(d.currentSelection)||
     live?.ownerId!==simulated.ownerId||live?.generation!==simulated.generation||
     d.actual3DGarment.originalPhotoSHA256s?.bottom!==RESEARCH_SOURCE_110[d.currentSelection]||
     d.actual3DGarment.originalPhotoSHA256s?.top!==RESEARCH_SOURCE_110.shirt)
   return null;
  return planReviewedSourceLook110({
   session:simulated,indexed:idx,board:buildBoard(d.currentSelection),
   readCurrentSession:()=>simulated
  });
 };
 const update=()=>{
  if(disposed)return;
  let valid=null;
  try{valid=validateCurrent();}catch{}
  save.disabled=busy||!valid||valid.status!=='verified-public-research-3d';
  reopen.disabled=busy||!saved||!isOriginal();
 };
 const saveCurrent=e=>{
  if(!e.isTrusted||save.disabled||disposed)return;
  try{
   const result=validateCurrent();
   if(!result||result.status!=='verified-public-research-3d')
    throw Error('source original 163-bone photo review required');
   saved=result;mode='saved-public';
   lastOutcome='licensed-original-look-saved-in-memory';
   message.textContent='Saved reviewed public source look in memory only. No customer photographs, cloud writes or deployment. Family Alpha HOLD.';
  }catch{lastOutcome='rejected';message.textContent='Unreviewed or invalid source blocked. Family Alpha HOLD.';}
  update();
 };
 const reopenSaved=e=>{
  if(!e.isTrusted||reopen.disabled||disposed||busy)return;
  busy=true;update();
  try{
   const {idx,live}=sourceInfo();
   if(!isOriginal()||live?.ownerId!==simulated.ownerId||
      live?.generation!==simulated.generation||!originalReview.checked)
    throw Error('stale source owner or review');
   const plan=requireUnchangedReviewedLook110(saved,{
    session:simulated,indexed:idx,readCurrentSession:()=>simulated
   });
   if(plan.status!=='verified-public-research-3d'||
      !['public','second'].includes(plan.selectedPublicDenimSource))
    throw Error('unsupported private garment must remain original-photo fallback');
   // Revoke old P109 knee pose controls before replacing the source mesh.
   clear.click();
   const receipt=host.cc110ResearchSelect?.(
    plan.selectedPublicDenimSource,simulated.ownerId,simulated.generation,
    plan.sourceSHA256s.bottom
   );
   const d=host.cc69Diagnostics?.();
   if(receipt?.sourceSHA256!==plan.sourceSHA256s.bottom||
      !d?.actual3DGarment?.realPhotoApplied||
      d.actual3DGarment.originalPhotoSHA256s?.bottom!==plan.sourceSHA256s.bottom)
    throw Error('actual research source garment was not safely restored');
   mode='restored-public';lastOutcome='actual-original-3d-restored';
   message.textContent='Reviewed saved look reopened on real original photographed 163-bone humanoid. Source SHA preserved · Family Alpha HOLD.';
  }catch{
   mode='blocked';lastOutcome='refused-stale-owner-source-or-mesh';
   clear.click();
   message.textContent='Saved look unavailable or source identity changed. Original photo/2D fallback required. Family Alpha HOLD.';
  }finally{busy=false;update();}
 };
 const privateFallback=e=>{
  if(!e.isTrusted||disposed||busy)return;
  // Only synthetic public-free METADATA. Never a real user's JPEG/image.
  const owner='synthetic-private-example-110',generation=1;
  const a={id:'synthetic-top-1',sourceId:'synthetic-top-1',
   ownerId:owner,category:'Tops',itemType:'T-shirt',
   ownerReviewed:true,sourcePhotoOriginal:true,
   sourceSHA256:'a'.repeat(64),photographic3DReconstructionApproved:false};
  const b={id:'synthetic-jeans-1',sourceId:'synthetic-jeans-1',
   ownerId:owner,category:'Bottoms',itemType:'Jeans',
   ownerReviewed:true,sourcePhotoOriginal:true,
   sourceSHA256:'b'.repeat(64),photographic3DReconstructionApproved:false};
  const selected=planReviewedSourceLook110({
   session:{authenticated:true,ownerId:owner,generation},
   indexed:{ownerId:owner,generation,releaseAuthorized:false,
    byId:new Map([[a.id,a],[b.id,b]])},
   board:{slots:{top:a.id,bottom:b.id}},
   readCurrentSession:()=>({authenticated:true,ownerId:owner,generation})
  });
  if(selected.status!=='original-photo-2d-fallback'||
    selected.genuineResearch163Bone3DReady)
   throw Error('PHOTO110 unsupported/private real photograph must not become invented mesh');
  clear.click();
  mode='private-fallback';lastOutcome='original-photo-2d-fallback';
  message.textContent='Other personal photos are NOT reconstructed as 3D. Use the saved original photo/2D board until a real garment fit is verified. No private photos were loaded. HOLD.';
  update();
 };
 const changeOwner=e=>{
  if(!e.isTrusted||disposed||busy)return;
  simulated=Object.freeze({authenticated:true,ownerId:'synthetic-other-account-110',
   generation:simulated.generation+1});
  clear.click();mode='owner-rotated';
  lastOutcome='previous-owner-saved-look-revoked';
  // Retain old saved token for a negative auth test; it is no longer usable.
  message.textContent='Synthetic account changed. Old saved look cannot be reopened or re-used. No real sign-in or cloud verification. HOLD.';
  update();
 };
 save.addEventListener('click',saveCurrent);
 reopen.addEventListener('click',reopenSaved);
 privateTest.addEventListener('click',privateFallback);
 guest.addEventListener('click',changeOwner);
 const observer=new MutationObserver(update);
 observer.observe(doc.getElementById('status'),{
  childList:true,characterData:true,subtree:true
 });
 const onReview=()=>update();
 originalReview.addEventListener('change',onReview);
 const onHide=()=>{mode='closed';saved=null;update();};
 host.addEventListener('pagehide',onHide);
 const report=()=>Object.freeze({
  mounted:!disposed,mode,hasSavedLook:!!saved,ownerMatchesSaved:!!saved&&
   saved.ownerId===simulated.ownerId&&saved.generation===simulated.generation,
  readyToSave:!save.disabled,readyToReopen:!reopen.disabled,
  lastOutcome,originalLicensedBenchmarkOnly:true,
  syntheticAccountOnly:true,realAuthenticatedAccount:false,
  arbitraryUserPhotosRenderedIn3D:false,
  signedCloudRLSVerified:false,sourceOriginalUnmodified:true,
  genuinePhotographedReverse:false,customerPhotoBytesAccessible:false,
  independentHumanPhotorealismApproved:false,realHardwarePhoneTested:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
 const dispose=()=>{
  disposed=true;mode='closed';saved=null;busy=false;
  observer.disconnect();
  save.removeEventListener('click',saveCurrent);
  reopen.removeEventListener('click',reopenSaved);
  privateTest.removeEventListener('click',privateFallback);
  guest.removeEventListener('click',changeOwner);
  originalReview.removeEventListener('change',onReview);
  host.removeEventListener('pagehide',onHide);
  root.remove();style.remove();
  if(host.cc110LookState===report)delete host.cc110LookState;
 };
 host.cc110LookState=report;
 host.addEventListener('pagehide',dispose,{once:true});
 update();
 return {report,dispose};
}
if(typeof document!=='undefined'&&typeof window!=='undefined'&&
 new URLSearchParams(window.location.search).get('look110')==='on'){
 const init=()=>mountReviewedLookResearchPanel110(document,window);
 if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
}
