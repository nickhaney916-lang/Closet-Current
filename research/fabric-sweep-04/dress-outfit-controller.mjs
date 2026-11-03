import {tailorSourceDress74} from '../dress-mobile-01/source-true-dress-tailoring.mjs';
import {createSourceTrueSkirtMotion} from '../fabric-motion-01/bounded-skirt-motion.mjs';
import {createSourceNeutralPosePleats03} from './pose-conditioned-source-pleats.mjs';
import {createPhotographedDressStaticFit05} from '../dress-fit-05/static-source-dress-fit.mjs';
import {createPhotoDenimStaticFitter06} from '../denim-fit-06/static-source-denim-fit.mjs';
import {measureReviewedDenimOriginalWidth17} from '../denim-fit-06/original-photo-leg-width-17.mjs';
import {posedGeometry,triangleContacts} from '../three-d-42/posed-contact.mjs';
import {createPoseConditionedSleeveContact} from '../three-d-56/pose-conditioned-sleeves.mjs';
/** Atomic single-rig outfit slots. No persistence or account data; source review stays provisional. */
import {createPantsFitter} from '../three-d-13/canonical-pants-fit.mjs';
import {prepareBodyPresentation,attachReviewedShirt,releaseBodyPresentation} from '../three-d-11/dress-in-source-pose.mjs';
import {setFashionPose} from '../three-d-09/pose-source.mjs';
import {setResearchPose} from '../three-d-43/intermediate-pose.mjs';
import {buildSourceDress,requireDress} from '../three-d-14/dress-shell.mjs';
import {requireAnatomicalShirtPreview} from '../three-d-07/rig-shirt-transfer.mjs';
import {finishDressEdges} from '../three-d-15/dress-finish.mjs';
import {shapePhysicalDressNeckline} from '../three-d-23/dress-neckline.mjs';
import {captureShoulderSurface,protectShirtShoulders} from '../three-d-15/shoulder-clearance.mjs';
import {protectShirtCuffClearance} from '../three-d-16/cuff-clearance.mjs';
import {finishInnerCuffs} from '../three-d-17/inner-cuff-facing.mjs';
import {bridgeSourceCuffHem} from '../three-d-18/wrist-hem-bridge.mjs';
import {fitContinuousShirt} from '../three-d-20/surface-fit.mjs';
import {finishNecklineAndSeams} from '../three-d-22/neckline-seams.mjs';
import {fitAnatomicalDress,finishAnatomicalOpenings} from '../three-d-24/anatomical-dress.mjs';
import {bindDressContact} from '../three-d-26/contact-presentation.mjs';
import {softenAnatomicalSkirt} from '../three-d-27/skirt-drape.mjs';
import {requireReviewedPhotoPants,projectReviewedPhotoPants,isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';
import {drapeSourceJeans} from '../three-d-32/natural-jeans-drape.mjs';
import {fairPhotographedJeansSeat} from '../three-d-33/posterior-fabric-fairing.mjs';
import {hangOriginalDenimEnvelope} from '../three-d-34/hanging-pants-envelope.mjs';
import {fitIndependentDenimLoft} from '../three-d-35/independent-jeans-loft.mjs';
import {supportOriginalDenimCrotch} from '../three-d-36/crotch-seat-panel.mjs';
import {alignOriginalShirtOverJeans} from '../three-d-38/shirt-over-denim-waist.mjs';
import {fitPhotographedOutfitContact} from '../three-d-39/actual-garment-contact.mjs';
import {drapeOriginalPhotographedShirtTorso,hangOriginalPhotographedDenimPanels} from '../three-d-40/independent-hanging-silhouettes.mjs';
import {fallSourceMeasuredJeansLegPanels} from '../three-d-41/patterned-leg-fall.mjs';
import {easeSourcePhotographedDenimSeat73} from '../three-d-73/photographed-denim-rear-drape.mjs';
import {hangOriginalPhotographedDenimCalf74} from '../three-d-74/source-photographed-denim-calf-hang.mjs';
import {constructSourcePhotoDenimFolds75} from '../three-d-75/source-photo-structural-denim-folds.mjs';
import {relaxOriginalPhotoDenimFoldContinuity76} from '../three-d-76/source-photo-denim-seam-fold-relaxation.mjs';
import {auditTrueSkinnedPhotographedDenimContact77} from '../three-d-77/true-skinned-denim-body-intersections.mjs';
import {auditSourcePhotoDenimAlternativeKneePose78} from '../three-d-78/genuine-skinned-denim-knee-poses.mjs';
import {bendSourceTrueDenim79} from '../dress-mobile-01/pose-responsive-source-denim.mjs';
import {sewPatternTrousers} from '../three-d-42/pattern-trousers.mjs';
import {clearShirtPatternWaist,relaxShirtSidePanels} from '../three-d-42/shirt-waist.mjs';
import {hangSleevePanels} from '../three-d-42/sleeve-loft.mjs';
import {constructShirtPanels} from '../three-d-42/shirt-pattern.mjs';
import {tailorOriginalShirtShoulderSleeves} from '../three-d-44/shoulder-sleeve-tailoring.mjs';
import {constructIndependentShoulderCaps} from '../three-d-45/independent-shoulder-cap.mjs';
import {reprofileIndependentShoulderSilhouette} from '../three-d-46/independent-shoulder-contour.mjs';
import {tailorIndependentUpperArmVolume} from '../three-d-47/upper-arm-fabric-volume.mjs';
import {shapeSourceNeutralCollarRoll} from '../three-d-48/source-neutral-collar-roll.mjs';
import {easeSourceNeutralRearFabric} from '../three-d-53/source-neutral-rear-relief.mjs';
import {roundRealShoulderSleeveCrest} from '../three-d-54/round-shoulder-sleeve-crest.mjs';
import {hangPhotographedSleeveCloth} from '../three-d-55/source-measured-sleeve-hang.mjs';
import {fitPhotographedShirtSideFlow} from '../three-d-59/anatomical-shirt-side-flow.mjs';
import {easePhotographedShoulderFall} from '../three-d-61/source-rig-shoulder-fall.mjs';
import {slopeTruePhotographedShoulderTop} from '../three-d-64/source-shoulder-top-slope.mjs';
import {registerDressNeckline,clearNeckTriangleInteriors} from '../three-d-29/registered-neckline.mjs';
export const OUTFITS=Object.freeze(['none','pants','shirt','shirt-pants','dress']);
export function sourceForOutfit(mode){if(!OUTFITS.includes(mode))throw Error('Unsupported outfit');return mode==='dress'?'commons-0053':mode.includes('shirt')?'commons-0003':null;}
export function createOutfitController(root,{refineFit=true,enableCuffFix=true,enableCuffFacing=true,enableCuffBridge=true,naturalFit=true,necklineSeams=true,dressNeckline=true,dressAnatomy=true,dressContact=true,skirtDrape=true,dressMobile74=false,registeredNeckline=true,naturalPantsDrape=true,posteriorJeansFairing=true,structuralPantsEnvelope=true,independentJeansLoft=true,crotchSeatPanel=true,sourceShirtWaistFit=true,clothWaistContact=true,shirtHangingSilhouette=true,denimHangingSilhouette=true,jeansPanelFall=false,independentGarments=false,poseContactFactory=null,tailoredShoulderSleeves=false,independentShoulderCaps=false,realisticShoulderContour=false,upperArmFabricVolume=false,sourceNeutralCollarRoll=false,rearShirtFabricRelief=false,naturalShoulderSleeveTransition=false,sourceMeasuredSleeveHang=false,poseConditionedSleeveDrape=false,anatomicalShirtSideFlow=false,naturalShoulderFall61=false,trueShoulderTop64=false,photoDenimRearDrape73=false,photoDenimCalfHang74=false,photoDenimFolds75=false,photoDenimContinuity76=false,photoDenimContactAudit77=false,photoDenimKneePose78=false,photoDenimFlex79=false,skirtSecondaryMotion01=false,posePleats03=false,staticDressFit05=false,staticDenimFit06=false,sourceDenimSilhouette07=false,sourceDenimCuffFairing08=false,sourceDenimRearThigh14=false,sourceDenimSideThigh15=false,sourceDenimPosteriorContour16=false,sourceDenimPhotoWidth17=false,sourceDenimProfile18=false,sourceDenimSigned19=false,sourceDenimLine20=false,sourceDenimFold21=false,sourceDenimCuffStack22=false}={}){
 if(independentGarments&&typeof poseContactFactory!=='function')throw Error('Independent garment triangle solver must be explicitly loaded');
 if(photoDenimCalfHang74&&!photoDenimRearDrape73)throw Error('3D74 requires exact 3D73 source photographed denim baseline');
 if(photoDenimFolds75&&!photoDenimCalfHang74)throw Error('3D75 requires exact 3D74 source photographed calf geometry baseline');
 if(photoDenimContinuity76&&!photoDenimFolds75)throw Error('3D76 requires exact 3D75 real photographed sewn denim structural folds');
 if(photoDenimContactAudit77&&!photoDenimContinuity76)throw Error('3D77 exact skinned-contact audit requires genuine 3D76 denim');
 if(photoDenimKneePose78&&!photoDenimContactAudit77)throw Error('3D78 actual bone-bent denim contact requires exact 3D77 source audit');
 if(photoDenimFlex79&&!photoDenimKneePose78)throw Error('DENIM-FLEX needs authenticated original 3D78 anatomical knee pose');
 if(skirtSecondaryMotion01&&(!dressMobile74||!skirtDrape))throw Error('Skirt secondary motion needs the genuine tailored source dress');
 if(posePleats03&&!skirtSecondaryMotion01)throw Error('Pose-driven photographed drape must retain verified canonical spring');
 // Canonical normals must be captured before the existing presentation clone.
 const fitPants=createPantsFitter(root),shoulders=captureShoulderSurface(root);prepareBodyPresentation(root);
 let contact=null;
 let parts={},mode='none',pose='relaxed',changes=0,closed=false,motion01=null,folds03=null,staticFit05=null,staticFit06=null;
 const all=p=>Object.values(p).flatMap(g=>g.meshes);
 const summarize=()=>({mode,pose,changes,slots:Object.keys(parts),garmentMeshes:all(parts).length,shirt:parts.shirt?{...parts.shirt.stats,sharedSkeleton:parts.shirt.sharedSkeleton}:null,pants:parts.pants?.stats||null,dress:parts.dress?.stats||null,fabricMotion:motion01?.state()||null,posePleats03:folds03?.state()||null,dressStaticFit05:staticFit05?.state()||null,denimStaticFit06:staticFit06?.state()||null,releaseAuthorized:false});
 function setOutfit(next,candidate,{reviewed=false,pantsCandidate=null,pantsReviewed=false}={}){
  if(closed)throw Error('Outfit controller closed');const id=sourceForOutfit(next);
  // Reject invalid review/source before detaching an existing valid outfit.
  if(id==='commons-0053')requireDress(candidate,reviewed);
  if(id==='commons-0003')requireAnatomicalShirtPreview(candidate,{acknowledged:reviewed});
  if(pantsCandidate){if(next!=='pants'&&next!=='shirt-pants')throw Error('Photo pants only allowed in lower-body outfit slots');requireReviewedPhotoPants(pantsCandidate,{reviewed:pantsReviewed});}
  let builtContact=null,newMotion01=null,newFolds03=null,newFit05=null,newFit06=null;const held=all(parts).map(mesh=>({mesh,parent:mesh.parent})),built={};held.forEach(({mesh})=>mesh.removeFromParent());setFashionPose(root,'source');
  try{
   // Build shirt FIRST, while the rig contains no other garments.
   if(next.includes('shirt')){built.shirt=attachReviewedShirt(root,candidate,{acknowledged:reviewed,pose:'source',improved:true});if(refineFit)built.shirt=protectShirtShoulders(built.shirt,shoulders);if(refineFit&&enableCuffFix)built.shirt=protectShirtCuffClearance(built.shirt,root);if(refineFit&&enableCuffFix&&enableCuffFacing)built.shirt=finishInnerCuffs(built.shirt,root);if(refineFit&&enableCuffFix&&enableCuffFacing&&enableCuffBridge)built.shirt=bridgeSourceCuffHem(built.shirt,root);if(naturalFit)built.shirt=fitContinuousShirt(built.shirt,root);if(necklineSeams)built.shirt=finishNecklineAndSeams(built.shirt,root);if(shirtHangingSilhouette&&necklineSeams)built.shirt=drapeOriginalPhotographedShirtTorso(built.shirt);}
   if(next==='pants'||next==='shirt-pants'){
    built.pants=fitPants({pose:'source'});
    if(pantsCandidate){
     built.pants=projectReviewedPhotoPants(built.pants,pantsCandidate,{reviewed:pantsReviewed});
     if(naturalPantsDrape&&isSourceVerifiedDenimId(pantsCandidate.id)){
      built.pants=drapeSourceJeans(built.pants,root);
      if(posteriorJeansFairing){
       built.pants=fairPhotographedJeansSeat(built.pants,root);
       if(structuralPantsEnvelope){
        built.pants=hangOriginalDenimEnvelope(built.pants,root);
        if(independentJeansLoft){
         built.pants=fitIndependentDenimLoft(built.pants,root);
         if(crotchSeatPanel){
          built.pants=supportOriginalDenimCrotch(built.pants,root);
          if(denimHangingSilhouette){
           built.pants=hangOriginalPhotographedDenimPanels(built.pants);
           if(jeansPanelFall)built.pants=fallSourceMeasuredJeansLegPanels(built.pants);
          }
         }
        }
       }
      }
     }
    }
   }
   if(next==='shirt-pants'&&built.shirt&&built.pants?.stats?.photoApplied&&sourceShirtWaistFit&&isSourceVerifiedDenimId(pantsCandidate?.id)){
    built.shirt=alignOriginalShirtOverJeans(built.shirt,built.pants);
    if(clothWaistContact)built.shirt=fitPhotographedOutfitContact(built.shirt,built.pants);
   }
   if(independentGarments&&built.pants?.stats?.originalPhotographedHangingLegPanels)built.pants=sewPatternTrousers(built.pants,root);
   if(photoDenimRearDrape73&&built.pants?.stats?.independentSewnPattern)built.pants=easeSourcePhotographedDenimSeat73(built.pants,root);
   if(photoDenimCalfHang74&&built.pants?.stats?.sourcePhotographedDenimRearDrape73)built.pants=hangOriginalPhotographedDenimCalf74(built.pants,root);
   if(photoDenimFolds75&&built.pants?.stats?.sourcePhotographedDenimCalfHang74)built.pants=constructSourcePhotoDenimFolds75(built.pants,root);
   if(photoDenimContinuity76&&built.pants?.stats?.sourcePhotoDenimStructuralFolds75)built.pants=relaxOriginalPhotoDenimFoldContinuity76(built.pants,root);
   if(independentGarments&&built.shirt){built.shirt=constructShirtPanels(hangSleevePanels(relaxShirtSidePanels(built.shirt),root));if(tailoredShoulderSleeves)built.shirt=tailorOriginalShirtShoulderSleeves(built.shirt,root);if(independentShoulderCaps)built.shirt=constructIndependentShoulderCaps(built.shirt,root);if(realisticShoulderContour)built.shirt=reprofileIndependentShoulderSilhouette(built.shirt,root);if(upperArmFabricVolume)built.shirt=tailorIndependentUpperArmVolume(built.shirt,root);if(sourceNeutralCollarRoll)built.shirt=shapeSourceNeutralCollarRoll(built.shirt,root);if(rearShirtFabricRelief)built.shirt=easeSourceNeutralRearFabric(built.shirt,root);if(naturalShoulderSleeveTransition)built.shirt=roundRealShoulderSleeveCrest(built.shirt,root);if(sourceMeasuredSleeveHang)built.shirt=hangPhotographedSleeveCloth(built.shirt,root);if(anatomicalShirtSideFlow)built.shirt=fitPhotographedShirtSideFlow(built.shirt,root);if(naturalShoulderFall61)built.shirt=easePhotographedShoulderFall(built.shirt,root);if(trueShoulderTop64)built.shirt=slopeTruePhotographedShoulderTop(built.shirt,root);if(built.pants?.stats?.independentSewnPattern)built.shirt=clearShirtPatternWaist(built.shirt,built.pants);}
   if(next==='dress'){
    const raw=buildSourceDress(root,candidate,{reviewed});
    try{
     const shaped=shapePhysicalDressNeckline(raw,{enabled:dressNeckline});
     if(registeredNeckline&&dressAnatomy&&dressNeckline)registerDressNeckline(shaped,candidate);
     // The original anatomical fitter requires a real physical V-neck boundary.
     // A V-neck rollback also leaves anatomical cutting OFF; never silently
     // substitute a deeper, unreviewed neck profile to satisfy the fitter.
     const anatomyEnabled=dressAnatomy&&dressNeckline;
     let fitted=anatomyEnabled?fitAnatomicalDress(shaped,root,{clearHipEnvelope:dressContact}):shaped;
     if(anatomyEnabled&&registeredNeckline)clearNeckTriangleInteriors(fitted,root);
     if(anatomyEnabled&&dressContact)bindDressContact(fitted,root);
     if(anatomyEnabled&&skirtDrape)fitted=softenAnatomicalSkirt(fitted,root);
     if(anatomyEnabled&&skirtDrape&&dressMobile74)fitted=tailorSourceDress74(fitted,root);
     built.dress=refineFit?(anatomyEnabled?finishAnatomicalOpenings(fitted):finishDressEdges(fitted)):fitted;
     if(skirtSecondaryMotion01)newMotion01=createSourceTrueSkirtMotion(built.dress,root);
      if(posePleats03)newFolds03=createSourceNeutralPosePleats03(built.dress,root,newMotion01);
     if(staticDressFit05)newFit05=createPhotographedDressStaticFit05(built.dress,root);
    }catch(e){raw.dispose();throw e;}
   }
   const skeletons=new Set();root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.work56Garment)skeletons.add(o.skeleton);});
   if(!all(built).every(m=>skeletons.has(m.skeleton)))throw Error('Garment skeleton mismatch');
   if(independentGarments&&built.shirt){builtContact=poseConditionedSleeveDrape?createPoseConditionedSleeveContact(root,built.shirt,built.pants,poseContactFactory):poseContactFactory(root,built.shirt,built.pants);setFashionPose(root,pose);builtContact.fit(pose);}
   if(photoDenimContactAudit77&&built.pants?.stats?.sourcePhotoDenimSeamContinuity76)built.pants=auditTrueSkinnedPhotographedDenimContact77(built.pants,root,{pose});
   if(staticDenimFit06&&built.pants?.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77)newFit06=createPhotoDenimStaticFitter06(built.pants,root,{sourceSilhouette07:sourceDenimSilhouette07,sourceFairing08:sourceDenimCuffFairing08,sourceRearThigh14:sourceDenimRearThigh14,sourceSideThigh15:sourceDenimSideThigh15,sourcePosteriorContour16:sourceDenimPosteriorContour16,
    sourcePhotoWidth17:sourceDenimPhotoWidth17,
    sourcePhotoProfile18:sourceDenimProfile18,
    sourcePhotoSigned19:sourceDenimSigned19,
    sourceAnatomicalLine20:sourceDenimLine20,
    sourceKneeBreak21:sourceDenimFold21,
    sourceCuffStack22:sourceDenimCuffStack22,
    originalPhotoWidth17:sourceDenimPhotoWidth17?measureReviewedDenimOriginalWidth17(pantsCandidate):null});
  }catch(e){newFit06?.dispose();newFit05?.dispose();newFolds03?.dispose();newMotion01?.dispose();builtContact?.dispose();Object.values(built).forEach(g=>g.dispose());held.forEach(({mesh,parent})=>parent.add(mesh));throw e;}
  finally{setResearchPose(root,pose);}
  staticFit06?.dispose();staticFit06=newFit06;
  staticFit05?.dispose();staticFit05=newFit05;
  folds03?.dispose();folds03=newFolds03;
  motion01?.dispose();motion01=newMotion01;
  contact?.dispose();Object.values(parts).forEach(g=>g.dispose());parts=built;mode=next;contact=builtContact;changes++;return summarize();
 }
 function setPose(next){if(closed)throw Error('Outfit controller closed');if(staticFit05?.state().frozen)staticFit05.restore();if(staticFit06?.state().frozen)staticFit06.restore();if(!independentGarments&&next.startsWith('blend-'))throw Error('Intermediate garment pose requires isolated independent research mode');setResearchPose(root,next);pose=next;contact?.fit(next);return summarize();}
 function dispose(){if(closed)return;staticFit05?.dispose();staticFit05=null;staticFit06?.dispose();staticFit06=null;folds03?.dispose();folds03=null;motion01?.dispose();motion01=null;contact?.dispose();Object.values(parts).forEach(g=>g.dispose());parts={};mode='none';closed=true;releaseBodyPresentation(root);}
 function kickFabricMotion01(strength=1){if(closed||mode!=='dress'||!motion01)throw Error('Current real source dress required for bounded fabric movement');motion01.kick(strength);return motion01.state();}
 function stepFabricMotion01(dt){if(closed||mode!=='dress'||!motion01)throw Error('Current real source dress required for bounded fabric step');return { ...motion01.step(dt),...motion01.state()};}
 function resetFabricMotion01(){if(closed||mode!=='dress'||!motion01)throw Error('Current real source dress required for restoring fabric');motion01.reset();return motion01.state();}
 function applyPosePleats03(phase){if(closed||mode!=='dress'||!folds03)throw Error('Source true body-driven skirt pleats unavailable');return folds03.apply(phase);}
 function resetPosePleats03(){if(closed||mode!=='dress'||!folds03)throw Error('Source true body-driven skirt pleats unavailable');folds03.reset();return folds03.state();}
 function freezeDressFit05(){
  if(closed||mode!=='dress'||!staticFit05||!motion01||
     parts.dress?.stats?.sourceSHA256!=='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019')
   throw Error('Verified original SHA-locked skinned dress and static fitting research required');
  motion01.reset();
  if(folds03)folds03.reset();
  return staticFit05.freeze();
 }
 function restoreDressFit05(){if(!staticFit05||mode!=='dress')throw Error('No original dress to restore');staticFit05.restore();return staticFit05.state();}
 function auditDenimFit06(){
  if(closed||!['pants','shirt-pants'].includes(mode)||!staticFit06||!parts.pants||
    !parts.pants.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77)
   throw Error('Original photographed source denim and exact 3D77 audit required');
  const jeans=parts.pants.meshes,body=[];
  root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.work56Garment)body.push(o);});
  if(jeans.length!==1||body.length<1||body.some(m=>m.skeleton.bones.length!==163))
   throw Error('Real anatomical body and one exact reviewed skinned denim garment required');
  let d,b;
  try{
   d=posedGeometry(jeans);b=posedGeometry(body);
   const contacts=triangleContacts(d.g,b.g);
   return {actualSkinnedDenimBodyTriangleCrossings:contacts.count,
     actual163BoneGarment:true,
     actualDenimTriangles:d.g.index.count/3,
     actualBodyTriangles:b.g.index.count/3,
     sourceSHA256:parts.pants.stats.sourceSHA256,
     notSignedWatertightVolume:true,releaseAuthorized:false};
  }finally{d?.g?.dispose();b?.g?.dispose();}
 }
 function freezeDenimFit06(){
  if(closed||!['pants','shirt-pants'].includes(mode)||!staticFit06||
   !parts.pants?.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77||
   !parts.pants?.stats?.photoApplied)
   throw Error('Exact source-photographed 163-bone independent jeans required');
  return staticFit06.freeze();
 }
 function restoreDenimFit06(){
  if(!staticFit06||!['pants','shirt-pants'].includes(mode))
   throw Error('No source verified photographed jeans to restore');
  staticFit06.restore();return staticFit06.state();
 }
 function auditKneePose78(next){
  if(!photoDenimKneePose78||!parts.pants?.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77)
   throw Error('3D78 only original SHA-vetted 3D77 research denim can bend knee');
  if(staticFit06?.state().frozen)staticFit06.restore();
  const base=parts.pants.restoreGeometry79?.()||parts.pants;
  parts.pants=auditSourcePhotoDenimAlternativeKneePose78(base,root,{pose:next});
  if(photoDenimFlex79)parts.pants=bendSourceTrueDenim79(parts.pants,root,{pose:next});
  return summarize();
 }
 setPose(pose);return {setOutfit,setPose,getState:summarize,auditKneePose78,kickFabricMotion01,stepFabricMotion01,resetFabricMotion01,applyPosePleats03,resetPosePleats03,freezeDressFit05,restoreDressFit05,freezeDenimFit06,restoreDenimFit06,auditDenimFit06,dispose};
}
