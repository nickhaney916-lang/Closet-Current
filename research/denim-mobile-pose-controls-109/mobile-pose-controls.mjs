/**
 * PHOTO109 — real original photographed-denim interactive mobile bilateral
 * source 3D pose controls. Research fixture ONLY, not the wardrobe app.
 * No private account, images, localStorage, telemetry or cloth physics.
 */
import {validateBilateralSourcePose108}
 from '../denim-bilateral-pose-replay-108/bilateral-pose-policy.mjs';

const SOURCES=Object.freeze({
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
});
const ORIGINAL_SHIRT='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const PRESETS=Object.freeze([
 Object.freeze({id:'cc109Left8',left:8,right:0,label:'Left knee 8°'}),
 Object.freeze({id:'cc109Right8',left:0,right:8,label:'Right knee 8°'}),
 Object.freeze({id:'cc109Both8',left:8,right:8,label:'Both knees 8°'}),
 Object.freeze({id:'cc109Left16',left:16,right:0,label:'Left knee 16°'}),
 Object.freeze({id:'cc109Right16',left:0,right:16,label:'Right knee 16°'}),
 Object.freeze({id:'cc109Both16',left:16,right:16,label:'Both knees 16°'}),
 Object.freeze({id:'cc109Reset',left:0,right:0,label:'Straighten / Reset'})
]);

/** Reject anything other than approved and expressly reviewed source photos. */
export function mobileSourcePoseAdmission109({loaded,reviewed,figure,selected,
 rigBones,realPhoto,sourceDenimSHA,sourceShirtSHA,hasPoseAdapter}={}){
 return loaded===true&&reviewed===true&&
  ['female','male'].includes(figure)&&
  (selected==='public'||selected==='second')&&
  rigBones===163&&realPhoto===true&&hasPoseAdapter===true&&
  sourceDenimSHA===SOURCES[selected]&&sourceShirtSHA===ORIGINAL_SHIRT;
}
export function checkedMobileSourcePose109(left,right){
 const pose=validateBilateralSourcePose108(left,right);
 return Object.freeze({
  left:pose.leftDegrees,right:pose.rightDegrees,
  sampledAnatomicalSourceOnly:true,
  originalPhotographedSourceOnly:true,
  customerWardrobeAvailable:false,autoplay:false,
  physicallyContinuousCloth:false,
  humanPhotorealismApproved:false,
  physicalPhonesVerified:false,
  familyAlpha:'HOLD',releaseAuthorized:false
 });
}
/** PHOTO110: deterministic, fail-closed browser/mobile lifecycle boundary. */
export function mobileSourceLifecycleRevocation110({eventType,hidden=false,
 visibilityState='visible',persisted=false}={}){
 if(eventType==='freeze'||eventType==='pagehide')return true;
 if(eventType==='pageshow')return persisted===true;
 if(eventType==='visibilitychange')
  return hidden===true||visibilityState==='hidden'||visibilityState==='prerender';
 return false;
}
export function mountSourceDenimMobilePoseControls109(doc,host){
 if(!doc?.getElementById||!host?.addEventListener)
  throw Error('PHOTO109 original local document and browser required');
 if(!['localhost','127.0.0.1','[::1]'].includes(host.location?.hostname)||
    new URLSearchParams(host.location.search).get('knee109')!=='on')
  throw Error('PHOTO109 only gated original licensed localhost research URL');
 if(doc.getElementById('cc109MobileControls'))
  throw Error('PHOTO109 only one interface per original 3D source session');
 const anchor=doc.getElementById('wear')?.closest('section.panel');
 if(!anchor||!doc.getElementById('avatar')||
  !doc.getElementById('review')||
  !doc.getElementById('status')||
  !doc.getElementById('model')||
  !doc.getElementById('swap'))
  throw Error('PHOTO109 original reviewed, actual WebGL research viewer required');
 const style=doc.createElement('style');
 style.id='cc109MobilePoseStyle';
 style.textContent=[
  '#cc109MobileControls{margin-top:12px;border:1px solid #90b3a2;background:#eff6f1;border-radius:12px;padding:12px;min-width:0}',
  '#cc109MobileControls h2{font-size:18px;margin:0 0 6px}',
  '#cc109MobileControls p{font-size:13px;margin:5px 0 10px}',
  '#cc109PoseButtons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
  '#cc109PoseButtons button{min-height:48px;padding:10px 7px;width:100%;font-size:14px;overflow-wrap:break-word;white-space:normal}',
  '#cc109PoseButtons button[aria-pressed="true"]{border:2px solid #315e4b;background:#dfede4;font-weight:700}',
  '#cc109PoseMessage{min-height:34px;overflow-wrap:break-word}',
  '@media(max-width:350px){#cc109PoseButtons button{font-size:13px;padding:8px 5px}}'
 ].join('\n');
 doc.head.append(style);
 const root=doc.createElement('section');
 root.id='cc109MobileControls';
 root.setAttribute('aria-label','Genuine jeans bilateral 3D knee poses');
 root.innerHTML=[
  '<h2>Move photographed jeans in 3D</h2>',
  '<p>Controls the actual public-license 163-bone mannequin and photographed jeans,',
  'not a private closet, photographed back, or physical fabric simulation.</p>',
  '<div id="cc109PoseButtons" role="group" aria-label="Independent knee movement"></div>',
  '<p id="cc109PoseMessage" role="status" aria-live="polite" data-pose="none">',
  'Review and wear original licensed jeans to enable poses. Family Alpha HOLD.</p>'
 ].join('\n');
 anchor.after(root);
 const bar=doc.getElementById('cc109PoseButtons');
 const msg=doc.getElementById('cc109PoseMessage');
 const buttons=new Map();
 let busy=false,invalidated=false,last=null,disposed=false,lifecycleRevoked=false;
 const source=()=>{
  const d=host.cc69Diagnostics?.();
  const p=d?.actual3DGarment;
  return {
   loaded:d?.loaded===true&&d?.figure===doc.getElementById('model').value,
   reviewed:doc.getElementById('review').checked===true,
   figure:d?.figure,selected:d?.currentSelection,
   rigBones:d?.rig?.bones,realPhoto:p?.realPhotoApplied===true,
   sourceDenimSHA:p?.originalPhotoSHA256s?.bottom,
   sourceShirtSHA:p?.originalPhotoSHA256s?.top,
   hasPoseAdapter:typeof host.cc108BilateralPose==='function'
  };
 };
 const eligible=()=>!busy&&!invalidated&&!disposed&&!lifecycleRevoked&&
  doc.hidden!==true&&!['hidden','prerender'].includes(doc.visibilityState)&&
  mobileSourcePoseAdmission109(source());
 const update=()=>{
  const good=eligible();
  for(const b of buttons.values())b.disabled=!good;
  if(!good&&!busy&&!disposed){
   msg.dataset.pose='none';
   if(lifecycleRevoked)
    msg.textContent='Mobile viewer hidden, frozen or restored from history. Reload, verify original photo and review again. Family Alpha HOLD.';
   else if(invalidated)
    msg.textContent='Original photographed garment source changed or pose rejected. Re-review and wear verified denim. HOLD.';
   else
    msg.textContent='Review and wear original licensed jeans to enable poses. Family Alpha HOLD.';
  }
  return good;
 };
 const clear=()=>{
  last=null;if(!lifecycleRevoked)invalidated=false;msg.dataset.pose='none';
  for(const b of buttons.values())b.setAttribute('aria-pressed','false');
  update();
 };
 const activate=(preset,event)=>{
  // Real, trusted physical or browser-dispatched user interaction only.
  if(!event.isTrusted||!eligible())return;
  const before=source();
  const pose=checkedMobileSourcePose109(preset.left,preset.right);
  busy=true;update();
  try{
   const output=host.cc108BilateralPose(pose.left,pose.right);
   const stats=output?.pants;
   const f=stats?.perLegCalfVertexMovement108;
   const after=source();
   if(!stats?.bilateralDenimPoseReplayVerified108||
      stats?.sourceSHA256!==SOURCES[before.selected]||
      stats?.sourceSHA256!==SOURCES[after.selected]||
      stats?.sourceSHA256!==before.sourceDenimSHA||
      !mobileSourcePoseAdmission109(after)||
      stats?.independentOriginalBilateralKnees108?.leftDegrees!==pose.left||
      stats?.independentOriginalBilateralKnees108?.rightDegrees!==pose.right||
      !Number.isSafeInteger(f?.sampledTriangleCrossingsBefore)||
      !Number.isSafeInteger(f?.sampledTriangleCrossingsAfter)||
      f.sampledTriangleCrossingsAfter>f.sampledTriangleCrossingsBefore||
      stats?.familyAlpha!=='HOLD'||stats?.releaseAuthorized!==false||
      stats?.photorealisticPhysicalClothDynamicsVerified108!==false)
    throw Error('PHOTO109 real source/pose/contact verification refused');
   last=Object.freeze({
    left:pose.left,right:pose.right,figure:after.figure,
    denim:after.selected,sourceSHA256:stats.sourceSHA256,
    contactNonworsening:true,
    leftKneeCalfVertices:f.leftKneeAppliedRightMeshLeg,
    rightKneeCalfVertices:f.rightKneeAppliedLeftMeshLeg,
    humanRealismApproved:false,physicalPhonesVerified:false,
    familyAlpha:'HOLD',releaseAuthorized:false
   });
   for(const [id,b] of buttons)
    b.setAttribute('aria-pressed',String(id===preset.id));
   msg.dataset.pose=pose.left+':'+pose.right;
   msg.textContent='Original photographed denim · left '+pose.left+
    '° / right '+pose.right+'°. Real skinned calf: '+
    last.leftKneeCalfVertices+' / '+last.rightKneeCalfVertices+
    ' vertices. Original photo preserved · Family Alpha HOLD.';
  }catch(e){
   invalidated=true;last=null;msg.dataset.pose='blocked';
   msg.textContent='Original photographed source/pose rejected. Re-review required. Family Alpha HOLD.';
  }finally{
   busy=false;
   for(const b of buttons.values())b.disabled=!eligible();
  }
 };
 for(const p of PRESETS){
  const b=doc.createElement('button');
  b.type='button';b.id=p.id;b.textContent=p.label;b.disabled=true;
  b.setAttribute('aria-pressed','false');
  b.addEventListener('click',e=>activate(p,e));
  buttons.set(p.id,b);bar.append(b);
 }
 // The original viewer remains source-of-truth after review, swaps,
 // clear and figure change. Never persist artificial poses or photo bytes.
 const onClick=e=>{
  if(['wear','swap','clear'].includes(e.target?.id)){
   clear();host.queueMicrotask?.(update);
  }
 };
 const onChange=e=>{
  if(['review','model'].includes(e.target?.id)){
   clear();host.queueMicrotask?.(update);
  }
 };
 doc.addEventListener('click',onClick);
 doc.addEventListener('change',onChange);
 const observer=new MutationObserver(()=>update());
 observer.observe(doc.getElementById('status'),{
  childList:true,characterData:true,subtree:true
 });
 // PHOTO110: tab switch, prerender/freeze, navigation and BFCache restore
 // permanently revoke this document's reviewed source session.
 // A click/change or re-checking consent MUST NOT make a stale pose usable.
 const revokeForLifecycle=(eventType,persisted=false)=>{
  if(!mobileSourceLifecycleRevocation110({
   eventType,hidden:doc.hidden,visibilityState:doc.visibilityState,persisted
  }))return false;
  lifecycleRevoked=true;busy=false;invalidated=true;last=null;
  for(const b of buttons.values())b.setAttribute('aria-pressed','false');
  const avatar=doc.getElementById('avatar');
  if(avatar)avatar.style.visibility='hidden';
  update();
  return true;
 };
 const onVisibilityChange=()=>revokeForLifecycle('visibilitychange');
 const onFreeze=()=>revokeForLifecycle('freeze');
 const onPageShow=e=>revokeForLifecycle('pageshow',e?.persisted===true);
 const onHide=()=>revokeForLifecycle('pagehide');
 doc.addEventListener('visibilitychange',onVisibilityChange);
 host.addEventListener('freeze',onFreeze);
 host.addEventListener('pageshow',onPageShow);
 host.addEventListener('pagehide',onHide);
 const report=()=>Object.freeze({
  mounted:!disposed,enabled:eligible(),
  lifecycleRevoked,requiresFreshSourceReviewAfterReload:lifecycleRevoked,
  sourceRenderConcealed:doc.getElementById('avatar')?.style.visibility==='hidden',
  originalLicensedSourceOnly:true,
  publiclyLicensedSource:source().selected,
  currentFigure:source().figure,
  lastPose:last,
  sourceProtected:true,customerWardrobeIntegrated:false,
  genuinePhotographedBackAvailable:false,
  realClothPhysics:false,independentHumanPhotorealismApproved:false,
  physicalMobilePhoneTested:false,releaseAuthorized:false,
  familyAlpha:'HOLD'
 });
 const dispose=()=>{
  disposed=true;busy=false;invalidated=true;last=null;
  observer.disconnect();
  doc.removeEventListener('click',onClick);
  doc.removeEventListener('change',onChange);
  host.removeEventListener('pagehide',onHide);
  host.removeEventListener('freeze',onFreeze);
  host.removeEventListener('pageshow',onPageShow);
  doc.removeEventListener('visibilitychange',onVisibilityChange);
  root.remove();style.remove();
  if(host.cc109PoseUIState===report)delete host.cc109PoseUIState;
 };
 host.cc109PoseUIState=report;
 host.addEventListener('pagehide',dispose,{once:true});
 if(doc.hidden===true||['hidden','prerender'].includes(doc.visibilityState))
  revokeForLifecycle('visibilitychange');
 update();
 return {report,dispose};
}
if(typeof document!=='undefined'&&typeof window!=='undefined'&&
 new URLSearchParams(window.location.search).get('knee109')==='on'){
 const init=()=>mountSourceDenimMobilePoseControls109(document,window);
 if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
}
