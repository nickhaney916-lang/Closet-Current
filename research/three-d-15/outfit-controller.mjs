import {createPoseConditionedSleeveContact} from '../three-d-56/pose-conditioned-sleeves.mjs';
/** Atomic single-rig outfit slots. No persistence or account data; source review stays provisional. */
import {createPantsFitter} from '../three-d-13/canonical-pants-fit.mjs';
import {prepareBodyPresentation,attachReviewedShirt,releaseBodyPresentation} from '../three-d-11/dress-in-source-pose.mjs';
import {setFashionPose} from '../three-d-09/pose-source.mjs';
import {setResearchPose} from '../three-d-43/intermediate-pose.mjs';
import {buildSourceDress,requireDress} from '../three-d-14/dress-shell.mjs';
import {requireAnatomicalShirtPreview} from '../three-d-07/rig-shirt-transfer.mjs';
import {finishDressEdges} from './dress-finish.mjs';
import {shapePhysicalDressNeckline} from '../three-d-23/dress-neckline.mjs';
import {captureShoulderSurface,protectShirtShoulders} from './shoulder-clearance.mjs';
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
import {registerDressNeckline,clearNeckTriangleInteriors} from '../three-d-29/registered-neckline.mjs';
export const OUTFITS=Object.freeze(['none','pants','shirt','shirt-pants','dress']);
export function sourceForOutfit(mode){if(!OUTFITS.includes(mode))throw Error('Unsupported outfit');return mode==='dress'?'commons-0053':mode.includes('shirt')?'commons-0003':null;}
export function createOutfitController(root,{refineFit=true,enableCuffFix=true,enableCuffFacing=true,enableCuffBridge=true,naturalFit=true,necklineSeams=true,dressNeckline=true,dressAnatomy=true,dressContact=true,skirtDrape=true,registeredNeckline=true,naturalPantsDrape=true,posteriorJeansFairing=true,structuralPantsEnvelope=true,independentJeansLoft=true,crotchSeatPanel=true,sourceShirtWaistFit=true,clothWaistContact=true,shirtHangingSilhouette=true,denimHangingSilhouette=true,jeansPanelFall=false,independentGarments=false,poseContactFactory=null,tailoredShoulderSleeves=false,independentShoulderCaps=false,realisticShoulderContour=false,upperArmFabricVolume=false,sourceNeutralCollarRoll=false,rearShirtFabricRelief=false,naturalShoulderSleeveTransition=false,sourceMeasuredSleeveHang=false,poseConditionedSleeveDrape=false}={}){
 if(independentGarments&&typeof poseContactFactory!=='function')throw Error('Independent garment triangle solver must be explicitly loaded');
 // Canonical normals must be captured before the existing presentation clone.
 const fitPants=createPantsFitter(root),shoulders=captureShoulderSurface(root);prepareBodyPresentation(root);
 let contact=null;
 let parts={},mode='none',pose='relaxed',changes=0,closed=false;
 const all=p=>Object.values(p).flatMap(g=>g.meshes);
 const summarize=()=>({mode,pose,changes,slots:Object.keys(parts),garmentMeshes:all(parts).length,shirt:parts.shirt?{...parts.shirt.stats,sharedSkeleton:parts.shirt.sharedSkeleton}:null,pants:parts.pants?.stats||null,dress:parts.dress?.stats||null,releaseAuthorized:false});
 function setOutfit(next,candidate,{reviewed=false,pantsCandidate=null,pantsReviewed=false}={}){
  if(closed)throw Error('Outfit controller closed');const id=sourceForOutfit(next);
  // Reject invalid review/source before detaching an existing valid outfit.
  if(id==='commons-0053')requireDress(candidate,reviewed);
  if(id==='commons-0003')requireAnatomicalShirtPreview(candidate,{acknowledged:reviewed});
  if(pantsCandidate){if(next!=='pants'&&next!=='shirt-pants')throw Error('Photo pants only allowed in lower-body outfit slots');requireReviewedPhotoPants(pantsCandidate,{reviewed:pantsReviewed});}
  let builtContact=null;const held=all(parts).map(mesh=>({mesh,parent:mesh.parent})),built={};held.forEach(({mesh})=>mesh.removeFromParent());setFashionPose(root,'source');
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
   if(independentGarments&&built.shirt){built.shirt=constructShirtPanels(hangSleevePanels(relaxShirtSidePanels(built.shirt),root));if(tailoredShoulderSleeves)built.shirt=tailorOriginalShirtShoulderSleeves(built.shirt,root);if(independentShoulderCaps)built.shirt=constructIndependentShoulderCaps(built.shirt,root);if(realisticShoulderContour)built.shirt=reprofileIndependentShoulderSilhouette(built.shirt,root);if(upperArmFabricVolume)built.shirt=tailorIndependentUpperArmVolume(built.shirt,root);if(sourceNeutralCollarRoll)built.shirt=shapeSourceNeutralCollarRoll(built.shirt,root);if(rearShirtFabricRelief)built.shirt=easeSourceNeutralRearFabric(built.shirt,root);if(naturalShoulderSleeveTransition)built.shirt=roundRealShoulderSleeveCrest(built.shirt,root);if(sourceMeasuredSleeveHang)built.shirt=hangPhotographedSleeveCloth(built.shirt,root);if(built.pants?.stats?.independentSewnPattern)built.shirt=clearShirtPatternWaist(built.shirt,built.pants);}
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
     built.dress=refineFit?(anatomyEnabled?finishAnatomicalOpenings(fitted):finishDressEdges(fitted)):fitted;
    }catch(e){raw.dispose();throw e;}
   }
   const skeletons=new Set();root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.work56Garment)skeletons.add(o.skeleton);});
   if(!all(built).every(m=>skeletons.has(m.skeleton)))throw Error('Garment skeleton mismatch');
   if(independentGarments&&built.shirt){builtContact=poseConditionedSleeveDrape?createPoseConditionedSleeveContact(root,built.shirt,built.pants,poseContactFactory):poseContactFactory(root,built.shirt,built.pants);setFashionPose(root,pose);builtContact.fit(pose);}
  }catch(e){builtContact?.dispose();Object.values(built).forEach(g=>g.dispose());held.forEach(({mesh,parent})=>parent.add(mesh));throw e;}
  finally{setResearchPose(root,pose);}
  contact?.dispose();Object.values(parts).forEach(g=>g.dispose());parts=built;mode=next;contact=builtContact;changes++;return summarize();
 }
 function setPose(next){if(closed)throw Error('Outfit controller closed');if(!independentGarments&&next.startsWith('blend-'))throw Error('Intermediate garment pose requires isolated independent research mode');setResearchPose(root,next);pose=next;contact?.fit(next);return summarize();}
 function dispose(){if(closed)return;contact?.dispose();Object.values(parts).forEach(g=>g.dispose());parts={};mode='none';closed=true;releaseBodyPresentation(root);}
 setPose(pose);return {setOutfit,setPose,getState:summarize,dispose};
}
