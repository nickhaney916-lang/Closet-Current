/** Source-proportion rest-pose extension, not inferred garment measurements or cloth simulation. */
import {prepareSourceProjection} from './source-projection.mjs';
import {createPosedBodyIntersectionAudit,measurePosedTriangleContacts,comparePosedTriangleContacts} from './posed-intersections.mjs';
import {validatePhotoGarmentTargets} from '../user-photo-to-anatomical-3d-62/silhouette-fit.mjs';
const SOURCE='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const fail=m=>{throw Error('M2 source length '+m);};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(x,a,b)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export function deriveSourceLength({profile,minY,maxY,spanX}={}){
 if(profile?.accepted!==true||profile.sourceSHA256!==SOURCE||
    profile.inferredBack!==true||profile.releaseAuthorized!==false||
    !/^[a-f0-9]{64}$/.test(profile.cutoutSHA256||'')||
    !Number.isFinite(profile.silhouetteAspect)||profile.silhouetteAspect<.48||profile.silhouetteAspect>1.9||
    !Array.isArray(profile.bands)||profile.bands.length!==8||
    !profile.bands.every(v=>Number.isFinite(v)&&v>0&&v<=1)||
    ![minY,maxY,spanX].every(Number.isFinite)||maxY-minY<.25||maxY-minY>.9||spanX<.5||spanX>1.6)
  fail('current registered source contour and anatomical garment bounds required');
 const observedLength=spanX/profile.silhouetteAspect;
 const targetLength=clamp(observedLength,.70,.95);
 const extension=clamp(targetLength-(maxY-minY),.08,.38);
 const flare=clamp(profile.bands[6]/profile.bands[4],1,1.35);
 return Object.freeze({extension,flare,minY,maxY,pivot:minY+.22,
  observedPhotoAspect:profile.silhouetteAspect,sourceProportionLength:observedLength,
  boundedTargetLength:targetLength,absoluteSizeMeasured:false});
}
export function fitSourceLength(shirt,root,profile,{projectSourceRGB=false,traceTriangleContacts=false,
 strictTriangleContacts=false,extensionScale=1,previewOnly=false,radialLoftMeters=0}={}){
 if(!Number.isFinite(extensionScale)||extensionScale<.25||extensionScale>1||
   (previewOnly&&projectSourceRGB))fail('finite bounded extension scale and no projection in dry-run required');
 if(!Number.isFinite(radialLoftMeters)||radialLoftMeters<0||radialLoftMeters>.08)
  fail('M2 finite bounded radial loft required');
 if(strictTriangleContacts&&!traceTriangleContacts)fail('strict triangle gate requires actual triangle measurements');
 const started=performance.now();
 if(shirt?.stats?.sourceSHA256!==SOURCE||shirt.stats.ownerAlphaMaskBasedPhysicalGeometry190!==true||
    shirt.stats.ownerPhysicalBilateralReadbackVerified196!==true||shirt.stats.cutoutSHA256!==profile?.cutoutSHA256||
    !Array.isArray(shirt.meshes)||typeof root?.traverse!=='function')fail('verified source and existing private owner fitting required');
 const targets=shirt.meshes.filter(m=>m.name==='Work56-independent-shirt-shell'||['L','R'].includes(m.userData?.work45IndependentShoulderCap));
 if(targets.some(m=>!m.isSkinnedMesh||m.skeleton?.bones?.length!==163))fail('original 163-bone garment required');
 validatePhotoGarmentTargets(targets,fail);
 let minY=Infinity,maxY=-Infinity,minX=Infinity,maxX=-Infinity;
 for(const mesh of targets){
  const a=mesh.geometry.getAttribute('position');
  for(let i=0;i<a.count;i++){
   const w=mesh.position.clone().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld);
   minX=Math.min(minX,w.x);maxX=Math.max(maxX,w.x);
   if(Math.abs(w.x)<.23){minY=Math.min(minY,w.y);maxY=Math.max(maxY,w.y);}
  }
 }
 const shape=deriveSourceLength({profile,minY,maxY,spanX:maxX-minX});
 const staged=[];let moved=0,lowest=Infinity,maximum=0;
 const center=shirt.stats.envelope?.center;
 if(!Number.isFinite(center))fail('original anatomical front/back center required');
 for(const mesh of targets){
  const p=mesh.geometry.getAttribute('position'),next=p.array.slice(),inv=mesh.matrixWorld.clone().invert();
  for(let i=0;i<p.count;i++){
   const old=mesh.position.clone().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),w=old.clone();
   const lower=1-smooth(w.y,shape.minY,shape.pivot);
   const torso=1-smooth(Math.abs(w.x),.23,.32),weight=lower*torso;
   w.y-=shape.extension*extensionScale*weight;
   w.x*=1+(shape.flare-1)*extensionScale*weight;
   w.z=center+(w.z-center)*(1+.18*extensionScale*weight);
   // Outward-loft the lower source envelope, never the photographed shoulder/caps.
   // Rest-pose radial proxy only; not a measured signed body normal or cloth physics.
   if(radialLoftMeters>0&&weight>0){
    const radial=Math.hypot(w.x,w.z-center);
    if(radial>.045){const offset=radialLoftMeters*weight/radial;
     w.x+=w.x*offset;w.z+=(w.z-center)*offset;}
   }
   const delta=w.distanceTo(old);maximum=Math.max(maximum,delta);
   if(delta>.0001)moved++;
   lowest=Math.min(lowest,w.y);w.applyMatrix4(inv);
   next[i*3]=w.x;next[i*3+1]=w.y;next[i*3+2]=w.z;
  }
  if(!next.every(Number.isFinite))fail('nonfinite staged extension');
  staged.push({mesh,p,next});
 }
 if(moved<100||maximum>.42||lowest>minY-.07||lowest<.55)fail('bounded actual lower garment extension not established');
 const sourceProjection=projectSourceRGB?prepareSourceProjection(shirt,staged,
  [(minX+maxX)/2,maxX-minX,maxY-lowest,lowest]):null;
 const audit=createPosedBodyIntersectionAudit(root);let before,after;
 try{before=audit.measure(targets);after=audit.measure(targets,new Map(staged.map(r=>[r.mesh,r.next])));}
 finally{audit.dispose();}
 if(after.intersectingPairs>before.intersectingPairs)fail('new posed body intersection pairs '+before.intersectingPairs+' -> '+after.intersectingPairs);
 let triangleEvidence=null;
 if(traceTriangleContacts){
  const baseline=measurePosedTriangleContacts(root,targets);
  const proposed=measurePosedTriangleContacts(root,targets,new Map(staged.map(r=>[r.mesh,r.next])));
  triangleEvidence=comparePosedTriangleContacts(baseline,proposed);
  if(strictTriangleContacts&&!triangleEvidence.nonregression)
   fail('new posed body triangle contacts '+triangleEvidence.newlyIntersecting+' (mesh pairs alone would miss)');
 }
 if(!previewOnly){
  for(const {mesh,p,next} of staged){p.array.set(next);p.needsUpdate=true;
   mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}
  sourceProjection?.commit();
 }
 return {...shirt,stats:{...shirt.stats,sourceProjectionRGB:sourceProjection!==null,
  sourceProjectionMaterialCount:sourceProjection?.materialCount||0,sourceProjectionRuntime:sourceProjection?.runtime||null,sourceProjectionRearPhotographed:false,sourceLengthFit:!previewOnly,sourceLengthDryRun:previewOnly,sourceLengthExtensionScale:extensionScale,
  sourceLengthSHA256:SOURCE,
  sourceLengthMovedVertices:moved,sourceLengthOldHemY:minY,sourceLengthNewHemY:lowest,
  sourceLengthExtension:shape.extension*extensionScale,
  sourceLengthRadialLoftMeters:radialLoftMeters,sourceLengthRadialLoftPhysicalMeasured:false,
  sourceLengthFlare:1+(shape.flare-1)*extensionScale,
  sourceLengthOriginalUVPreserved:true,sourceLengthRearInferred:true,
  sourceLengthPhysicalSizeMeasured:false,sourceLengthCollisionCertified:false,
  sourceLengthRestPoseOnly:true,sourceLengthTriangleContactAudit:triangleEvidence!==null,sourceLengthTriangleContactStrictlyAccepted:triangleEvidence!==null&&strictTriangleContacts&&triangleEvidence.nonregression,
  sourceLengthTriangleContactBefore:triangleEvidence?.before??null,sourceLengthTriangleContactAfter:triangleEvidence?.after??null,
  sourceLengthNewTriangleContacts:triangleEvidence?.newlyIntersecting??null,
  sourceLengthConstructionMs:performance.now()-started,sourceLengthIntersectionPairsBefore:before.intersectingPairs,
  sourceLengthIntersectionPairsAfter:after.intersectingPairs,sourceLengthTestedPairs:after.testedPairs,releaseAuthorized:false}};
}


/**
 * Source-constrained, one-pose alternative sampler. The dry-run stages each
 * candidate from the unchanged current original mesh and never writes any
 * geometry/texture/owner field. It does not infer physical drape or hidden rear.
 * A candidate is only eligible when it creates NO new body/garment triangle
 * intersections at this sampled pose. Existing intersections remain unapproved.
 */
export function planNoNewContactSourceLength(shirt,root,profile){
 const attempts=[];
 for(const scale of [1,.75,.5,.25]){
  try{
   const result=fitSourceLength(shirt,root,profile,{
    traceTriangleContacts:true,extensionScale:scale,previewOnly:true});
   const v=result.stats;
   const accepted=v.sourceLengthNewTriangleContacts===0&&
    v.sourceLengthTriangleContactAfter<=v.sourceLengthTriangleContactBefore&&
    v.sourceLengthNewHemY<v.sourceLengthOldHemY-.07;
   attempts.push(Object.freeze({scale,accepted,
    newlyIntersecting:v.sourceLengthNewTriangleContacts,
    baseline:v.sourceLengthTriangleContactBefore,
    after:v.sourceLengthTriangleContactAfter,
    movedVertices:v.sourceLengthMovedVertices,
    extension:v.sourceLengthExtension,
    sourceSHA256:v.sourceLengthSHA256}));
   if(accepted)break;
  }catch(e){
   attempts.push(Object.freeze({scale,accepted:false,error:String(e.message||e)}));
  }
 }
 const winner=attempts.find(a=>a.accepted);
 return Object.freeze({accepted:!!winner,selectedScale:winner?.scale??null,
  attempts:Object.freeze(attempts),noNewContactAtOnePose:!!winner,
  existingIntersectionsUnresolved:true,
  originalPhotographOnly:!winner,releaseAuthorized:false});
}
export function applyNoNewContactSourceLength(shirt,root,profile,{projectSourceRGB=false}={}){
 const decision=planNoNewContactSourceLength(shirt,root,profile);
 if(!decision.accepted)
  fail('new-body-triangle-contacts: original-photo/2D fallback required; no garment geometry committed');
 const result=fitSourceLength(shirt,root,profile,{
  projectSourceRGB,traceTriangleContacts:true,strictTriangleContacts:true,
  extensionScale:decision.selectedScale});
 return {...result,stats:{...result.stats,
  sourceLengthAdaptiveCandidateCount:decision.attempts.length,
  sourceLengthAdaptiveOnePoseNonregression:true,
  sourceLengthExistingContactsNotCertified:true,
  releaseAuthorized:false}};
}


/**
 * M2-C2: search bounded outward radial lower-body source envelopes while
 * retaining the exact photographed texture and a wholly inferred back.
 * The radial direction is a rest-pose proxy, not a measured body normal.
 * Each candidate must independently pass the old body pair audit and the
 * actual P843 triangle-ID nonregression; otherwise retain photo/2D only.
 */
export function planRadialLoftSourceLength(shirt,root,profile){
 const trials=[
  [1,.08],[.75,.08],[.5,.08],[.25,.08],
  [1,.04],[.75,.04],[.5,.04],[.25,.04]
 ];
 const attempts=[];
 for(const [scale,radialLoftMeters] of trials){
  try{
   const v=fitSourceLength(shirt,root,profile,{extensionScale:scale,
    radialLoftMeters,traceTriangleContacts:true,previewOnly:true}).stats;
   const accepted=v.sourceLengthNewTriangleContacts===0&&
     v.sourceLengthTriangleContactAfter<=v.sourceLengthTriangleContactBefore&&
     v.sourceLengthNewHemY<v.sourceLengthOldHemY-.07;
   attempts.push(Object.freeze({scale,radialLoftMeters,accepted,
    newTriangleContacts:v.sourceLengthNewTriangleContacts,
    totalContactsBefore:v.sourceLengthTriangleContactBefore,
    totalContactsAfter:v.sourceLengthTriangleContactAfter,
    hemDeltaMeters:v.sourceLengthOldHemY-v.sourceLengthNewHemY}));
   if(accepted)break;
  }catch(e){
   attempts.push(Object.freeze({scale,radialLoftMeters,accepted:false,
    error:String(e.message||e)}));
  }
 }
 const winner=attempts.find(x=>x.accepted);
 return Object.freeze({
  accepted:!!winner,selectedScale:winner?.scale??null,
  selectedRadialLoftMeters:winner?.radialLoftMeters??null,
  attempts:Object.freeze(attempts),
  sampledPoseOnly:true,sourcePhotoAuthoritative:true,
  unobservedRearInferred:true,physicallyMeasuredClearance:false,
  releaseAuthorized:false});
}
export function applyRadialLoftSourceLength(shirt,root,profile,{projectSourceRGB=false}={}){
 const decision=planRadialLoftSourceLength(shirt,root,profile);
 if(!decision.accepted)
  fail('radial-loft-contact-blocked: photographed garment remains original-photo/2D fallback; no unsafe mesh committed');
 const result=fitSourceLength(shirt,root,profile,{projectSourceRGB,
  traceTriangleContacts:true,strictTriangleContacts:true,
  radialLoftMeters:decision.selectedRadialLoftMeters,
  extensionScale:decision.selectedScale});
 return {...result,stats:{...result.stats,
  sourceLengthRadialLoftCandidateCount:decision.attempts.length,
  sourceLengthRadialLoftOnePoseAccepted:true,
  sourceLengthCollisionCertified:false,releaseAuthorized:false}};
}
