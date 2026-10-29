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
import {fitAnatomicalDress,finishAnatomicalOpenings} from '../three-d-24/anatomical-dress.mjs';
export const OUTFITS=Object.freeze(['none','pants','shirt','shirt-pants','dress']);
export function sourceForOutfit(mode){if(!OUTFITS.includes(mode))throw Error('Unsupported outfit');return mode==='dress'?'commons-0053':mode.includes('shirt')?'commons-0003':null;}
export function createOutfitController(root,{refineFit=true,enableCuffFix=true,enableCuffFacing=true,enableCuffBridge=true,naturalFit=true,dressNeckline=true,dressAnatomy=true}={}){
 // Canonical normals must be captured before the existing presentation clone.
 const fitPants=createPantsFitter(root),shoulders=captureShoulderSurface(root);prepareBodyPresentation(root);
 let parts={},mode='none',pose='relaxed',changes=0,closed=false;
 const all=p=>Object.values(p).flatMap(g=>g.meshes);
 const summarize=()=>({mode,pose,changes,slots:Object.keys(parts),garmentMeshes:all(parts).length,shirt:parts.shirt?{...parts.shirt.stats,sharedSkeleton:parts.shirt.sharedSkeleton}:null,pants:parts.pants?.stats||null,dress:parts.dress?.stats||null,releaseAuthorized:false});
 function setOutfit(next,candidate,{reviewed=false}={}){
  if(closed)throw Error('Outfit controller closed');const id=sourceForOutfit(next);
  // Reject invalid review/source before detaching an existing valid outfit.
  if(id==='commons-0053')requireDress(candidate,reviewed);
  if(id==='commons-0003')requireAnatomicalShirtPreview(candidate,{acknowledged:reviewed});
  const held=all(parts).map(mesh=>({mesh,parent:mesh.parent})),built={};held.forEach(({mesh})=>mesh.removeFromParent());setFashionPose(root,'source');
  try{
   // Build shirt FIRST, while the rig contains no other garments.
   if(next.includes('shirt')){built.shirt=attachReviewedShirt(root,candidate,{acknowledged:reviewed,pose:'source',improved:true});if(refineFit)built.shirt=protectShirtShoulders(built.shirt,shoulders);if(refineFit&&enableCuffFix)built.shirt=protectShirtCuffClearance(built.shirt,root);if(refineFit&&enableCuffFix&&enableCuffFacing)built.shirt=finishInnerCuffs(built.shirt,root);if(refineFit&&enableCuffFix&&enableCuffFacing&&enableCuffBridge)built.shirt=bridgeSourceCuffHem(built.shirt,root);if(naturalFit)built.shirt=fitContinuousShirt(built.shirt,root);}
   if(next==='pants'||next==='shirt-pants')built.pants=fitPants({pose:'source'});
   if(next==='dress'){
    const raw=buildSourceDress(root,candidate,{reviewed});
    try{const shaped=shapePhysicalDressNeckline(raw,{enabled:dressNeckline});const fitted=dressAnatomy?fitAnatomicalDress(shaped,root):shaped;built.dress=refineFit?(dressAnatomy?finishAnatomicalOpenings(fitted):finishDressEdges(fitted)):fitted;}catch(e){raw.dispose();throw e;}
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
