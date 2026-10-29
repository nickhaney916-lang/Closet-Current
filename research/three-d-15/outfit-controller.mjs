/** Atomic single-rig outfit slots. No persistence or account data; source review stays provisional. */
import {createPantsFitter} from '../three-d-13/canonical-pants-fit.mjs';
import {prepareBodyPresentation,attachReviewedShirt,releaseBodyPresentation} from '../three-d-11/dress-in-source-pose.mjs';
import {setFashionPose} from '../three-d-09/pose-source.mjs';
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
import {requireReviewedPhotoPants,projectReviewedPhotoPants} from '../three-d-30/reviewed-photo-pants.mjs';
import {drapeSourceJeans} from '../three-d-32/natural-jeans-drape.mjs';
import {fairPhotographedJeansSeat} from '../three-d-33/posterior-fabric-fairing.mjs';
import {hangOriginalDenimEnvelope} from '../three-d-34/hanging-pants-envelope.mjs';
import {registerDressNeckline,clearNeckTriangleInteriors} from '../three-d-29/registered-neckline.mjs';
export const OUTFITS=Object.freeze(['none','pants','shirt','shirt-pants','dress']);
export function sourceForOutfit(mode){if(!OUTFITS.includes(mode))throw Error('Unsupported outfit');return mode==='dress'?'commons-0053':mode.includes('shirt')?'commons-0003':null;}
export function createOutfitController(root,{refineFit=true,enableCuffFix=true,enableCuffFacing=true,enableCuffBridge=true,naturalFit=true,necklineSeams=true,dressNeckline=true,dressAnatomy=true,dressContact=true,skirtDrape=true,registeredNeckline=true,naturalPantsDrape=true,posteriorJeansFairing=true,structuralPantsEnvelope=true}={}){
 // Canonical normals must be captured before the existing presentation clone.
 const fitPants=createPantsFitter(root),shoulders=captureShoulderSurface(root);prepareBodyPresentation(root);
 let parts={},mode='none',pose='relaxed',changes=0,closed=false;
 const all=p=>Object.values(p).flatMap(g=>g.meshes);
 const summarize=()=>({mode,pose,changes,slots:Object.keys(parts),garmentMeshes:all(parts).length,shirt:parts.shirt?{...parts.shirt.stats,sharedSkeleton:parts.shirt.sharedSkeleton}:null,pants:parts.pants?.stats||null,dress:parts.dress?.stats||null,releaseAuthorized:false});
 function setOutfit(next,candidate,{reviewed=false,pantsCandidate=null,pantsReviewed=false}={}){
  if(closed)throw Error('Outfit controller closed');const id=sourceForOutfit(next);
  // Reject invalid review/source before detaching an existing valid outfit.
  if(id==='commons-0053')requireDress(candidate,reviewed);
  if(id==='commons-0003')requireAnatomicalShirtPreview(candidate,{acknowledged:reviewed});
  if(pantsCandidate){if(next!=='pants'&&next!=='shirt-pants')throw Error('Photo pants only allowed in lower-body outfit slots');requireReviewedPhotoPants(pantsCandidate,{reviewed:pantsReviewed});}
  const held=all(parts).map(mesh=>({mesh,parent:mesh.parent})),built={};held.forEach(({mesh})=>mesh.removeFromParent());setFashionPose(root,'source');
  try{
   // Build shirt FIRST, while the rig contains no other garments.
   if(next.includes('shirt')){built.shirt=attachReviewedShirt(root,candidate,{acknowledged:reviewed,pose:'source',improved:true});if(refineFit)built.shirt=protectShirtShoulders(built.shirt,shoulders);if(refineFit&&enableCuffFix)built.shirt=protectShirtCuffClearance(built.shirt,root);if(refineFit&&enableCuffFix&&enableCuffFacing)built.shirt=finishInnerCuffs(built.shirt,root);if(refineFit&&enableCuffFix&&enableCuffFacing&&enableCuffBridge)built.shirt=bridgeSourceCuffHem(built.shirt,root);if(naturalFit)built.shirt=fitContinuousShirt(built.shirt,root);if(necklineSeams)built.shirt=finishNecklineAndSeams(built.shirt,root);}
   if(next==='pants'||next==='shirt-pants'){
    built.pants=fitPants({pose:'source'});
    if(pantsCandidate){
     built.pants=projectReviewedPhotoPants(built.pants,pantsCandidate,{reviewed:pantsReviewed});
     if(naturalPantsDrape&&pantsCandidate.id==='commons-public-domain-jeans-2005'){
      built.pants=drapeSourceJeans(built.pants,root);
      if(posteriorJeansFairing){
       built.pants=fairPhotographedJeansSeat(built.pants,root);
       if(structuralPantsEnvelope)built.pants=hangOriginalDenimEnvelope(built.pants,root);
      }
     }
    }
   }
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
  }catch(e){Object.values(built).forEach(g=>g.dispose());held.forEach(({mesh,parent})=>parent.add(mesh));throw e;}
  finally{setFashionPose(root,pose);}
  Object.values(parts).forEach(g=>g.dispose());parts=built;mode=next;changes++;return summarize();
 }
 function setPose(next){if(closed)throw Error('Outfit controller closed');setFashionPose(root,next);pose=next;return summarize();}
 function dispose(){if(closed)return;Object.values(parts).forEach(g=>g.dispose());parts={};mode='none';closed=true;releaseBodyPresentation(root);}
 setPose(pose);return {setOutfit,setPose,getState:summarize,dispose};
}
