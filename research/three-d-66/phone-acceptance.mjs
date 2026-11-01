/** Physical device acceptance must be completed by an actual human on
 * an Android/iPhone; an emulated UA or Playwright is not acceptance.
 * On-device report stays local until the user explicitly downloads it.
 */
import {approvedPrivateIosOrigins,allowedResearchPhoneOrigin} from './approved-phone-origins.mjs';
const $=id=>document.getElementById(id);
const params='pantsDrape=after&seatFairing=after&envelope=after&loft=after&crotchPanel=after&waistFit=after&waistContact=after&hanging=after&clothFall=after&construction=after&sweep=after&sleeve44=after&caps45=after&contour46=after&volume47=after&collar48=after&rear53=after&round54=after&hang55=after&move56=after&fit59=after&crisp58=after&slope61=after&crest64=after&drape66=after';
let source='31',measure=null,report=null;
const trustedOrigin=allowedResearchPhoneOrigin(location,approvedPrivateIosOrigins);
if(!trustedOrigin){
 $('verdict').textContent='BLOCKED: localhost Android USB or explicitly approved private iPhone HTTPS research origin required. No public staging or production authorized.';
 $('record').disabled=true;$('sample').disabled=true;
 throw Error('3D66 physical handset QA origin not explicitly approved');
}
const browser=navigator.userAgent||'';
const handheld=/Android|iPhone|iPad|iPod/i.test(browser);
const touch=navigator.maxTouchPoints||0;
const allowed=['physical','front','side','pose','touch','privacy'];
function launch(id){
 source=id;
 report=null;$('save').disabled=true;
 $('preview').src='../three-d-'+id+'/index.html?'+params;
 $('verdict').textContent='New source selected. Perform visual tests on the physical phone; no acceptance yet.';
 $('measure').textContent='Awaiting original photographed shirt+jeans outfit in the actual viewer.';
}
$('jeans31').addEventListener('click',()=>launch('31'));
$('jeans37').addEventListener('click',()=>launch('37'));
launch('31');
function readState(){
 try{return $('preview').contentWindow?.cc31Diagnostics?.()||null}
 catch{return null}
}
function sample(){
 const x=readState(),cloth=x?.outfit?.shirt,denim=x?.outfit?.pants;
 if(!x||!cloth||x.outfit.mode!=='shirt-pants'||denim?.photoApplied!==true){
  $('measure').textContent='Not ready: select the photo review gate and original shirt + jeans in the actual viewer.';
  measure=null;return null;
 }
 measure={
  source,
  physicalDeviceClaimed:false,
  userAgent:browser,
  isMobileUserAgent:handheld,
  touchPoints:touch,
  viewport:{width:window.innerWidth,height:window.innerHeight,dpr:window.devicePixelRatio||1},
  secureContext:isSecureContext,
  browserFrameCount:x.frames,renderTimeMs:x.lastRenderMs,
  totalWebGLDrawPixels:x.drawPixels,pixelRatio:x.pixelRatio,
  geometries:x.geometries,textures:x.textures,
  skeletonBones:x.stats?.bones,
  skinnedGarmentMode:x.outfit.mode,
  actualLicensedJeansId:denim.sourceId,
  originalShirtSHA256:cloth.sourceSHA256,
  originalDenimSHA256:denim.sourceSHA256,
  originalPhotoUVSkinUnchanged:cloth.originalPhotoUVSkinAndColorUnmodified===true,
  originalPhotoClarity:x.sourceDetailRendering?.enabled===true,
  actualUpperSleeveDrape:cloth.sourceArticulatedUpperSleeveDrape===true,
  originalSewnSeamGap:cloth.upperSleeveDrapeSeamGap,
  posedTriangleContacts:cloth.poseTriangleContact?.after?.count,
  pose:x.pose,model:x.kind,
  realPhoneHardwareConfirmed:false,
  humanVisualApproved:false,
  physicalPhoneAcceptanceApproved:false,
  releaseAuthorized:false
 };
 $('measure').textContent=JSON.stringify(measure,null,2);
 return measure;
}
$('sample').addEventListener('click',sample);
$('record').addEventListener('click',()=>{
 const values=Object.fromEntries(allowed.map(id=>[id,$(id).checked]));
 const m=sample();
 const realAsset=m?.skeletonBones===163&&m.actualUpperSleeveDrape===true&&
   m.originalPhotoUVSkinUnchanged===true&&m.originalPhotoClarity===true&&
   m.posedTriangleContacts===0&&m.originalSewnSeamGap<=5e-5&&
   /^[a-f0-9]{64}$/.test(m.originalShirtSHA256||'')&&
   /^[a-f0-9]{64}$/.test(m.originalDenimSHA256||'')&&
   m.browserFrameCount>1&&Number.isFinite(m.renderTimeMs);
 // Browser UA / touch is weak corroboration, never proof of physical hardware.
 // The tester's explicit real device attestation remains necessary.
 const claimedPhysical=handheld&&touch>0&&values.physical===true;
 const acceptable=Boolean(realAsset&&claimedPhysical&&
    allowed.every(k=>values[k]));
 const evidence={
  type:'ClosetCurrent-3D66-PhysicalPhoneAcceptance',
  recordedAt:new Date().toISOString(),
  source,
  diagnostics:m||null,
  manualReview:values,
  userAttestedPhysicalHardware:claimedPhysical,
  userDeclaredPass:acceptable,
  verifiedByAutomatedHardwareProbe:false,
  independentlyWitnessedPhysicalTest:false,
  humanPhotorealismApproval:acceptable,
  productionDeploymentAuthorized:false,
  familyAlphaApproval:false,
  note:acceptable?'Tester attests real-phone visual PASS. Independent release review still required.':
    'FAIL/HOLD. Missing real source renderer, actual handset attestation, or one or more manual visual checks.'
 };
 report=evidence;
 $('save').disabled=false;
 $('verdict').textContent=JSON.stringify({
  verdict:acceptable?'TESTER REPORTED PASS — independently unverified':'HOLD / NOT ACCEPTED',
  physicalHardwareIndependentlyVerified:false,
  familyAlpha:'HOLD',
  missing:allowed.filter(k=>!values[k]),
  actualSourceRendererValid:Boolean(realAsset),
  standalonePhysicalPhoneSignoffRequired:!acceptable
 },null,2);
});
$('save').addEventListener('click',()=>{
 if(!report)return;
 const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='closet-current-3d66-physical-device-qa.json';a.click();
 URL.revokeObjectURL(url);
});