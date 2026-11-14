/* MAIN1054 M44 source-only reviewer navigation, NOT mask correction.
 * Actual licensed JPG/Work47/P93 are embedded locally by M43. This code
 * only moves the side-by-side viewport to SHA-locked candidate sample tiles.
 * No annotation, auto-editing, score, reviewer identity or 3D grant.
 */
(function(){
 'use strict';
 const src=window.M44_PUBLIC_SOURCE_REVIEW_TARGETS;
 const $=id=>document.getElementById(id);
 const hardFail=reason=>{
  const n=$('targetStatus');
  if(n)n.textContent='BLOCKED SOURCE REGION GUIDE — '+reason;
 };
 const valid=()=>{
  if(!src||src.schema!=='MAIN1054_M44_ORIGINAL_LICENSED_EDGE_REVIEW_TARGETS/v1'||
   src.sourceId!=='commons-0053'||
   src.originalJpegSHA256!==
    'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019'||
   src.baselinePngSHA256!==
    'ab7c7caa43fe32b1e0ba5c58e64a59ba49e5a9fe881a3a7a7791c20aab9007c4'||
   src.p93ProposalSHA256!==
    'caf1e8b5e292e9397262333ba6a3d2f673bd6c81b6b1694b5abf69aa90676a31'||
   !Array.isArray(src.targets)||src.targets.length!==14||
   src.totalFlaggedWarmEdgeSamples!==301||
   src.targets.some(t=>!Number.isInteger(t.x)||!Number.isInteger(t.y)||
     t.x<0||t.x>=1920||t.y<0||t.y>=2880||
     !Number.isInteger(t.flaggedSourceSamples)||t.flaggedSourceSamples<1||
     t.pixelsApprovedForMaskChange!==0||t.pixelsProvenBackground!==0)||
   src.targets.reduce((n,t)=>n+t.flaggedSourceSamples,0)!==301||
   src.noAlphaPixelsModified!==true||
   src.maskApproved!==false||src.releaseAuthorized!==false||
   src.consumer3DAdmitted!==false||src.familyAlpha!=='HOLD')
   return false;
  return true;
 };
 let ready=false,index=0;
 const state=()=>Object.freeze({
  ready,index,total:src?.targets?.length||0,
  flaggedSourceSamples:src?.totalFlaggedWarmEdgeSamples||0,
  navigationNeverChangesOriginalOrCandidateAlpha:true,
  independentlyApprovedMask:false,
  releaseAuthorized:false,consumer3DAdmitted:false,familyAlpha:'HOLD'
 });
 function focus(i){
  if(!ready||!Number.isInteger(i)||i<0||i>=src.targets.length)return false;
  index=i;
  const t=src.targets[i];
  // M43's controlled local focus only repositions its two canvases.
  // It does not call the brush nor alter original JPG/P93 or local export.
  window.M43_RESEARCH_TEST.focusOn(t.x,t.y);
  $('targetSelect').value=String(i);
  $('targetStatus').textContent='Source review region '+(i+1)+' of '+src.targets.length+
   ' • '+t.flaggedSourceSamples+' warm-colored edge samples near P93 transparency'+
   (t.samplesNearProtectedBrightPixels>0?
   ' • '+t.samplesNearProtectedBrightPixels+
   ' close to protected white piping (do NOT assume background)':'')+
   '\nLocation '+t.x+','+t.y+' in immutable 1920×2880 original photo. '+
   'These are candidate inspection coordinates, NOT verified defects or approved pixel changes.';
  $('targetPrevious').disabled=i<=0;
  $('targetNext').disabled=i>=src.targets.length-1;
  return true;
 }
 function start(){
  if(!valid()){hardFail('candidate manifest is not the exact source-locked M44 data');return;}
  const getM43=()=>window.M43_RESEARCH_TEST?.state();
  let trials=0;
  const poll=()=>{
   const s=getM43();
   if(s?.ready){
    ready=true;
    for(let i=0;i<src.targets.length;i++){
     const t=src.targets[i],o=document.createElement('option');
     o.value=String(i);o.textContent='Region '+(i+1)+
      ' · '+t.flaggedSourceSamples+' candidate samples'+
      ' · '+t.x+','+t.y;
     $('targetSelect').appendChild(o);
    }
    $('targetSelect').disabled=false;
    focus(0);return;
   }
   if(++trials>200){hardFail('underlying genuine original photo editor not ready');return;}
   setTimeout(poll,250);
  };
  poll();
 }
 $('targetSelect').addEventListener('change',()=>{
  focus(Number($('targetSelect').value));
 });
 $('targetPrevious').addEventListener('click',()=>focus(index-1));
 $('targetNext').addEventListener('click',()=>focus(index+1));
 window.M44_RESEARCH_TEST=Object.freeze({state,focus});
 start();
})();
