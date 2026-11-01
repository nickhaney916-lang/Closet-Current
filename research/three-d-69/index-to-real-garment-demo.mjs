/** 3D69 real authorized ORIGINAL benchmark garment pixels + closet slot → 3D.
 * Source public licenses, never user's wardrobe/AI-created clothes.
 * Real authenticated personal wardrobe integration is NOT enabled.
 */
import {mountAnatomicalShowroom} from '../three-d-15/showroom.mjs';
import {createPoseContact} from '../three-d-42/posed-contact.mjs';
import {planIndexedBoardToAnatomical3D} from '../three-d-68/saved-closet-3d-adapter.mjs';
import {loadSourceVetted3D69ResearchBundle} from './sha-verified-original-garment-sources.mjs';
import {prepareIndexedGarmentsFor3D,applyIndexed3DSelection,VERIFIED_PUBLIC_SHIRT_SHA256} from './index-to-real-garment-viewer.mjs';
const $=id=>document.getElementById(id);
if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))throw Error('Public licensed source 3D research must run on localhost only');
const setStatus=s=>$('status').textContent=s;
let app,first,second,ready=false,closed=false,currentSelection='public',lastResult=null;
const session=Object.freeze({authenticated:true,ownerId:'non-user-licensed-research-3d69',generation:1});
function fixtureRecord(id,category,itemType,color,sourceSHA256){
 return Object.freeze({id,ownerId:session.ownerId,sourceId:id,sourceSHA256,category,itemType,color,
  originalOutfitGroup:id,sourceFrom:'locked-public-commons-research-fixture',
  garmentMeshVerified:true,sourcePhotoOriginal:true,ownerReviewed:true,
  photographic3DReconstructionApproved:false,releaseAuthorized:false});
}
function indexRecord(source){
 return Object.freeze({ownerId:session.ownerId,generation:session.generation,releaseAuthorized:false,
  byId:new Map([
   ['licensed-shirt',fixtureRecord('licensed-shirt','Tops','T-shirt','Black',VERIFIED_PUBLIC_SHIRT_SHA256)],
   ['licensed-jeans-1',fixtureRecord('licensed-jeans-1','Bottoms','Jeans','Blue',first.pants.sourceSHA256)],
   ['licensed-jeans-2',fixtureRecord('licensed-jeans-2','Bottoms','Jeans','Blue',second.pants.sourceSHA256)]
  ])});
}
const format=(result,plan)=>({
 demoOnly:"public licensed original photos, never a user's private closet",
 sourceIndexOwner:'synthetic benchmark (NOT authenticated production)',
 categoryItemType:['Tops/T-shirt','Bottoms/Jeans'],
 actualOriginalShirtSHA256:VERIFIED_PUBLIC_SHIRT_SHA256,
 selectedOriginalDenimSHA256:plan.selected.bottom.sourceSHA256,
 selectedOriginalItemIds:result?.selectedIds,
 sourcePixelsOnSeparateSkinned3DMeshes:result?.real3DSkinnedGarmentMeshes,
 full360DegreeCameraOrbit:app?.getState().premium360Enabled,
 sourceFrontOnly:true,backOriginalPhotoVerified:false,
 AIClassificationOfNewPersonalPhoto:false,
 arbitraryUserPhotoTo3DReady:false,authIntegratedIntoProduction:false,
 humanPhotorealismApproved:false,physicalPhonesVerified:false,releaseAuthorized:false
});
function sourceOutfit(denim){
 const indexed=indexRecord(denim);
 return planIndexedBoardToAnatomical3D({slots:{
  top:'licensed-shirt',
  bottom:denim==='public'?'licensed-jeans-1':'licensed-jeans-2'
 }},indexed);
}
function apply(denim){
 const selected=denim==='public'?first:second;
 const plan=sourceOutfit(denim);
 const prepared=prepareIndexedGarmentsFor3D(plan,{shirtCandidate:selected.shirt,pantsCandidate:selected.pants});
 if(prepared.status!=='source-bound-3d-ready-for-provisional-preview')
  throw Error('Original verified source 3D cannot be invented: '+prepared.reason);
 const result=applyIndexed3DSelection(app,prepared,{checkCurrentSession:()=>session});
 if(!result.realPhotoApplied||result.real3DSkinnedGarmentMeshes<2)
  throw Error('Actual original photographed shirt and denim are not independent 3D surfaces');
 lastResult=result;currentSelection=denim;
 $('evidence').textContent=JSON.stringify(format(result,plan),null,2);
 setStatus((denim==='public'?'Public-domain':'CC BY-SA 4.0')+' original photo denim plus actual original shirt on skinned 3D male/female. Provisional visual REVIEW · HOLD.');
 return result;
}
async function start(){
 app=mountAnatomicalShowroom($('avatar'),{
  premiumTurntable67:true,independentGarments:true,
  poseContactFactory:createPoseContact,
  crispSourcePhotoClarity:true,
  jeansPanelFall:true,tailoredShoulderSleeves:true,independentShoulderCaps:true,
  realisticShoulderContour:true,upperArmFabricVolume:true,
  sourceNeutralCollarRoll:true,rearShirtFabricRelief:true,
  naturalShoulderSleeveTransition:true,sourceMeasuredSleeveHang:true,
  anatomicalShirtSideFlow:true,naturalShoulderFall61:true,
  trueShoulderTop64:true,poseConditionedSleeveDrape:true,
  photoDenimRearDrape73:new URLSearchParams(location.search).get('denimDrape73')==='after'||new URLSearchParams(location.search).get('calf74')==='after'||new URLSearchParams(location.search).get('folds75')==='after'||new URLSearchParams(location.search).get('continuity76')==='after'||new URLSearchParams(location.search).get('contact77')==='on'||new URLSearchParams(location.search).get('knee78')==='on',
  photoDenimCalfHang74:new URLSearchParams(location.search).get('calf74')==='after'||new URLSearchParams(location.search).get('folds75')==='after'||new URLSearchParams(location.search).get('continuity76')==='after'||new URLSearchParams(location.search).get('contact77')==='on'||new URLSearchParams(location.search).get('knee78')==='on',
  photoDenimFolds75:new URLSearchParams(location.search).get('folds75')==='after'||new URLSearchParams(location.search).get('continuity76')==='after'||new URLSearchParams(location.search).get('contact77')==='on'||new URLSearchParams(location.search).get('knee78')==='on',
  photoDenimContinuity76:new URLSearchParams(location.search).get('continuity76')==='after'||new URLSearchParams(location.search).get('contact77')==='on'||new URLSearchParams(location.search).get('knee78')==='on',
  photoDenimContactAudit77:new URLSearchParams(location.search).get('contact77')==='on'||new URLSearchParams(location.search).get('knee78')==='on',
  photoDenimKneePose78:new URLSearchParams(location.search).get('knee78')==='on'
 });
 app.start();
 try{
  [first,second]=await Promise.all([
   loadSourceVetted3D69ResearchBundle({denim:'public'}),
   loadSourceVetted3D69ResearchBundle({denim:'second'})
  ]);
  await app.load('female');
  ready=true;
  setStatus('Both SHA-locked original denim sources + original photographed shirt verified. Check license review before placing garments. HOLD.');
  $('evidence').textContent=JSON.stringify({originalShirtSHA256:VERIFIED_PUBLIC_SHIRT_SHA256,
   originalPublicDenimSHA256:first.pants.sourceSHA256,originalSecondDenimSHA256:second.pants.sourceSHA256,
   originalSourceRGBPixelsVerified:[first.originalVisibleSourcePixels,second.originalVisibleSourcePixels],
   referenceType:'public-domain and CC BY-SA original-source examples; not private user clothes',
   originalPhotoToMeshSupportForArbitraryUsers:false,humanPhotorealismApproved:false},null,2);
 }catch(e){setStatus('Original photographed cloth blocked: '+String(e.message||e));throw e;}
 $('review').addEventListener('change',()=>{$('wear').disabled=!ready||!$('review').checked;$('swap').disabled=!ready||!$('review').checked;});
 $('wear').addEventListener('click',e=>{if(!e.isTrusted||!$('review').checked)return;try{apply('public');}catch(err){setStatus('Actual 3D garment source unavailable: '+err.message);}});
 $('swap').addEventListener('click',e=>{if(!e.isTrusted||!$('review').checked)return;try{apply(currentSelection==='public'?'second':'public');}catch(err){setStatus('Original photographed denim swap failed: '+err.message);}});
 $('clear').addEventListener('click',()=>{if(!ready)return;app.applyOutfit('none');lastResult=null;setStatus('Original photographed clothing removed; 3D figure remains.');});
 $('model').addEventListener('change',async()=>{ready=false;$('review').checked=false;$('wear').disabled=true;$('swap').disabled=true;await app.load($('model').value);ready=true;lastResult=null;setStatus('Genuine original 3D figure changed; review the same licensed images again.');});
 for(const angle of ['front','side','back'])$(angle).addEventListener('click',()=>{app[angle]();});
 $('angle').addEventListener('input',()=>app.viewAt(Number($('angle').value)));
 $('turn').addEventListener('click',()=>app.setSpin(!app.getState().spinEnabled));
 // Only local, original verified, no image-bearing response from diagnostic API.
 window.cc69Diagnostics=()=>({loaded:ready,currentSelection,
  figure:app.getState().kind,rig:app.getState().stats,
  camera:app.getState().viewAngle,actual3DGarment:lastResult,
  sourcePhotoGenuine:true,humanApproved:false,phoneTested:false,
  production:false});
 window.cc69SetView=angle=>{app.viewAt(angle);return window.cc69Diagnostics();};
 if(new URLSearchParams(location.search).get('knee78')==='on')
  window.cc78KneePose=pose=>app.auditKneePose78(pose);
 // Genuine garment geometry diagnostics only: no original decoded image data.
 window.cc73State=()=>({figure:app.getState().kind,sourceBones:app.getState().stats?.bones,
  denim:app.getState().outfit?.pants||null,shirt:app.getState().outfit?.shirt||null,
  selectedDenim:currentSelection,photoDenimDrapeEnabled:new URLSearchParams(location.search).get('denimDrape73')==='after'||new URLSearchParams(location.search).get('calf74')==='after'||new URLSearchParams(location.search).get('folds75')==='after'||new URLSearchParams(location.search).get('continuity76')==='after'||new URLSearchParams(location.search).get('contact77')==='on'||new URLSearchParams(location.search).get('knee78')==='on',
  photoDenimCalfHang74Enabled:new URLSearchParams(location.search).get('calf74')==='after'||new URLSearchParams(location.search).get('folds75')==='after'||new URLSearchParams(location.search).get('continuity76')==='after'||new URLSearchParams(location.search).get('contact77')==='on'||new URLSearchParams(location.search).get('knee78')==='on',
  photoDenimFolds75Enabled:new URLSearchParams(location.search).get('folds75')==='after'||new URLSearchParams(location.search).get('continuity76')==='after'||new URLSearchParams(location.search).get('contact77')==='on'||new URLSearchParams(location.search).get('knee78')==='on',
  photoDenimContinuity76Enabled:new URLSearchParams(location.search).get('continuity76')==='after'||new URLSearchParams(location.search).get('contact77')==='on'||new URLSearchParams(location.search).get('knee78')==='on',
  photoDenimContactAudit77Enabled:new URLSearchParams(location.search).get('contact77')==='on'||new URLSearchParams(location.search).get('knee78')==='on',
  photoDenimKneePose78Enabled:new URLSearchParams(location.search).get('knee78')==='on',
  sourceHash:app.getState().outfit?.pants?.sourceSHA256||null,
  familyAlpha:'HOLD',releaseAuthorized:false});
 window.addEventListener('pagehide',()=>{closed=true;app.stop();first?.dispose();second?.dispose();});
}
start().catch(e=>{setStatus('No fabricated 3D wardrobe: '+String(e.message||e));$('wear').disabled=$('swap').disabled=true;});
