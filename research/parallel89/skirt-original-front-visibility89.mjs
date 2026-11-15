/**
 * P89 real-source photographed skirt rendered center-front photo coverage
 * diagnostic, NOT fabric/physical-fit, containment, physics or owner approval.
 *
 * This is intentionally a source/camera-locked native WebGL pixel witness,
 * not a general-purpose skin-color / fashion classifier. It compares the
 * same ORIGINAL SHA-locked public CC0 monochrome body and real Commons-0043
 * front photo before/after +45mm against the invariant camera viewport.
 * Gray body pixels occluding the source cream panel are a visible 3D bug,
 * EVEN IF strict skinned source triangle intersection counts happen to be 0.
 *
 * The measured pixels never leave the process. Receipts include aggregate
 * fractions only, not body pixels, owner silhouettes, screenshots or vertices.
 * Never use it on private wardrobes / people.
 */
const PHOTOGRAPH_SHA='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const WIDTH=390,HEIGHT=690;
const fail=reason=>Object.freeze({
 schema:'P89-actual-public-skirt-original-photo-front-visibility/v1',
 status:'ACTUAL_SOURCE_FRONT_VISIBILITY_NOT_VERIFIED',reason,
 sourcePhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 humanVisualFitAccepted:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const clamp=(n)=>Math.round(n*10000)/10000;
const finite=x=>Number.isFinite(x);
export function auditOriginalSkirtResearchFrontCoverage89({
 originalRGB,candidateRGB,width,height,avatar,pose,sourceSHA256
}={}){
 if(!(originalRGB instanceof Uint8Array)||
  !(candidateRGB instanceof Uint8Array)||
  width!==WIDTH||height!==HEIGHT||
  originalRGB.length!==3*WIDTH*HEIGHT||
  candidateRGB.length!==originalRGB.length||
  sourceSHA256!==PHOTOGRAPH_SHA||
  !['female','male'].includes(avatar)||
  !['source','blend-50','relaxed'].includes(pose))
  return fail('authentic-original-public-photo-3d-native-RGB-capture-required');
 try{
  // The actual P89 native renderer has fixed original webcam-free view
  // (390x690 and world-referenced 163-bone gray CC0 mannequin).
  // This central stripe is the original photographed *beige panel*, not
  // photographed body data. Body-color calibration is from the original
  // public mannequin's center chest, well above the skirt waist.
  const center=Math.floor(WIDTH/2),chestY=Math.round(HEIGHT*.355);
  const chest=(ch)=>candidateRGB[(chestY*WIDTH+center)*3+ch];
  const bodyColor=[0,1,2].map(chest);
  if(bodyColor.some(v=>!finite(v)||v<50||v>235))
   throw Error('genuine-gray-original-source-body-color-unverifiable');
  const ranges={
   x0:Math.round(WIDTH*.448),x1:Math.round(WIDTH*.552),
   y0:Math.round(HEIGHT*.478),y1:Math.round(HEIGHT*.58)
  };
  if(ranges.x1<=ranges.x0||ranges.y1<=ranges.y0)
   throw Error('photographed-source-panel-native-viewport-invalid');
  let bodyOld=0,bodyTrial=0,panelOld=0,panelTrial=0,changed=0,pixels=0;
  for(let y=ranges.y0;y<ranges.y1;y++)for(let x=ranges.x0;x<ranges.x1;x++){
   const i=(y*WIDTH+x)*3,old=[originalRGB[i],originalRGB[i+1],originalRGB[i+2]],
    moved=[candidateRGB[i],candidateRGB[i+1],candidateRGB[i+2]];
   const distance=rgb=>rgb.reduce((n,v,c)=>n+Math.abs(v-bodyColor[c]),0);
   if(distance(old)<50)bodyOld++;
   if(distance(moved)<50)bodyTrial++;
   // This licensed Commons-0043 photograph has a light cream panel down
   // the center; only observe source-specific central RGB in a fixed
   // instrumented native research scene.
   if(old[0]>200&&old[1]>185&&old[2]>170)panelOld++;
   if(moved[0]>200&&moved[1]>185&&moved[2]>170)panelTrial++;
   if(old.reduce((n,v,c)=>n+Math.abs(v-moved[c]),0)>40)changed++;
   pixels++;
  }
  if(!pixels||pixels>10000)
   throw Error('original-panel-visibility-crop-invalid');
  const bodyOcclusionOld=bodyOld/pixels,bodyOcclusionTrial=bodyTrial/pixels,
   sourcePanelOld=panelOld/pixels,sourcePanelTrial=panelTrial/pixels;
  const better=bodyOcclusionOld-bodyOcclusionTrial>.04&&
   bodyOcclusionTrial<.07&&sourcePanelTrial>.85&&
   sourcePanelTrial>sourcePanelOld+.05&&changed/pixels>.07;
  return Object.freeze({
   schema:'P89-actual-public-skirt-original-photo-front-visibility/v1',
   status:better?'ORIGINAL_PHOTOGRAPH_CENTER_FRONT_COVERAGE_IMPROVED_RESEARCH_ONLY':
    'ORIGINAL_PHOTO_CENTER_FRONT_COVERAGE_NOT_YET_VERIFIED',
   avatar,pose,sourceId:'commons-0043',
   originalPublicMannequinAndPhotoOnly:true,
   cameraOriginalPublicRendererSourceLocked:true,
   originalSourcePhotoSHA256:sourceSHA256,
   originalCenterFrontalVisibleMannequinFraction:clamp(bodyOcclusionOld),
   rigid45mmCenterFrontalVisibleMannequinFraction:clamp(bodyOcclusionTrial),
   originalCreamPanelPixelFraction:clamp(sourcePanelOld),
   rigid45mmCreamPanelPixelFraction:clamp(sourcePanelTrial),
   centerFrontChangedRGBFraction:clamp(changed/pixels),
   originalPhotoCenterFrontOcclusionReduced:better,
   originalFrontPhotoPixelsUnmodified:true,
   inferredRearStillUnphotographed:true,
   figureAndGarment3DPhysicalFitNotProven:true,
   continuousMotionAndGarmentContainmentNotCertified:true,
   originalPhoto2DFallbackRequired:true,
   humanVisualFitAccepted:false,consumer3DAdmitted:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const reasons=new Set([
   'genuine-gray-original-source-body-color-unverifiable',
   'photographed-source-panel-native-viewport-invalid',
   'original-panel-visibility-crop-invalid'
  ]);
  return fail(reasons.has(e?.message)?e.message:
   'original-photographed-center-panel-pixels-unverifiable');
 }
}
