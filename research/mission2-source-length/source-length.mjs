/** Source-proportion rest-pose extension, not inferred garment measurements or cloth simulation. */
import {prepareSourceProjection} from './source-projection.mjs';
import {createPosedBodyIntersectionAudit,measurePosedTriangleContacts,comparePosedTriangleContacts,measurePosedGarmentPartContacts,measurePosedGarmentSelfContacts,measureChangedFaceSelfContactDelta,summarizeChangedFaceSelfContactRegions,classifyNewSourceSelfContactTypes,summarizePosedBodyContactDistribution,summarizeNewPosedBodyContactRegions} from './posed-intersections.mjs';
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

/** P2-C5: expose only fixed safety-reason tags, never photos or private IDs. */
export function classifySourceLengthContactAttempt(v){
 const required=[
  'sourceLengthNewTriangleContacts','sourceLengthTriangleContactBefore','sourceLengthTriangleContactAfter',
  'sourceLengthNewGarmentPartContacts','sourceLengthGarmentPartContactsBefore','sourceLengthGarmentPartContactsAfter',
  'sourceLengthNewIntrapanelContacts','sourceLengthIntrapanelContactsBefore','sourceLengthIntrapanelContactsAfter',
  'sourceLengthOldHemY','sourceLengthNewHemY'
 ];
 if(!v||required.some(k=>!Number.isFinite(v[k]))||
    required.slice(0,9).some(k=>!Number.isSafeInteger(v[k])||v[k]<0))
  return Object.freeze({accepted:false,reason:'missing-contact-evidence',reasons:Object.freeze(['missing-contact-evidence'])});
 const problems=[];
 if(v.sourceLengthNewTriangleContacts>0)problems.push('new-body-contacts');
 if(v.sourceLengthTriangleContactAfter>v.sourceLengthTriangleContactBefore)problems.push('body-contact-count-regression');
 if(v.sourceLengthNewGarmentPartContacts>0)problems.push('new-panel-contacts');
 if(v.sourceLengthGarmentPartContactsAfter>v.sourceLengthGarmentPartContactsBefore)problems.push('panel-contact-count-regression');
 if(v.sourceLengthNewIntrapanelContacts>0)problems.push('new-intrapanel-contacts');
 if(v.sourceLengthIntrapanelContactsAfter>v.sourceLengthIntrapanelContactsBefore)problems.push('intrapanel-count-regression');
 if(!(v.sourceLengthNewHemY<v.sourceLengthOldHemY-.07))problems.push('hem-extension-under-minimum');
 return Object.freeze({accepted:problems.length===0,reason:problems[0]||'eligible',
  reasons:Object.freeze(problems)});
}
export const classifySourceLengthCandidateException=e=>{
 const message=String(e?.message||'');
 if(message.includes('new posed body intersection pairs'))return 'coarse-body-pair-regression';
 if(message.includes('M2 triangle audit exceeds bounded contact budget'))return 'body-contact-budget';
 if(message.includes('M2 garment part audit exceeds bounded contact budget'))return 'panel-contact-budget';
 if(message.includes('M2 self-contact exceeds bounded triangle comparison budget'))return 'self-comparison-budget';
 if(message.includes('M2 self-contact exceeds bounded contact budget'))return 'self-contact-budget';
 if(message.includes('M2 changed-face exceeds bounded comparison budget'))return 'changed-self-comparison-budget';
 if(message.includes('M2 changed-face exceeds bounded new-contact budget'))return 'changed-self-contact-budget';
 if(message.includes('M2 changed-face exceeds bounded moved-face budget'))return 'changed-face-count-budget';
 if(message.includes('M2 seam typing exceeds bounded original-face pair budget'))return 'self-topology-budget';
 if(message.includes('new posed body triangle contacts'))return 'new-body-contacts';
 if(message.includes('new posed garment part triangle contacts'))return 'new-panel-contacts';
 if(message.includes('new posed intrapanel self-intersections'))return 'new-intrapanel-contacts';
 return 'candidate-preflight-unavailable';
};

export function fitSourceLength(shirt,root,profile,{projectSourceRGB=false,traceTriangleContacts=false,
 strictTriangleContacts=false,traceGarmentPartContacts=false,strictGarmentPartContacts=false,traceSelfContacts=false,strictSelfContacts=false,extensionScale=1,depthClearance=0,depthEasingExponent=1,previewOnly=false}={}){
 if(!Number.isFinite(extensionScale)||extensionScale<.25||extensionScale>1||
   (previewOnly&&projectSourceRGB))fail('finite bounded extension scale and no projection in dry-run required');
 // Experimental *depth-only* offset is never inferred from a single front
 // photo. Bound it to 24mm and retain all independent collision vetoes.
 if(!Number.isFinite(depthClearance)||depthClearance<0||depthClearance>.024)
  fail('bounded inferred outward garment depth clearance required');
 if(!Number.isFinite(depthEasingExponent)||depthEasingExponent<1||depthEasingExponent>4)
  fail('bounded photographic hem depth taper exponent required');
 if(strictTriangleContacts&&!traceTriangleContacts)fail('strict triangle gate requires actual triangle measurements');
 if(strictGarmentPartContacts&&!traceGarmentPartContacts)fail('strict garment part gate requires measured contacts');
 if(strictSelfContacts&&!traceSelfContacts)fail('strict self-contact gate requires measured intersections');
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
   const initialDepth=w.z-center;
   w.z=center+initialDepth*(1+.18*extensionScale*weight)+
    depthClearance*Math.pow(lower,depthEasingExponent)*torso*Math.tanh(initialDepth/.035);
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
 let triangleEvidence=null,bodyContactDistribution=null,newBodyContactRegions=null;
 if(traceTriangleContacts){
  const baseline=measurePosedTriangleContacts(root,targets);
  bodyContactDistribution=summarizePosedBodyContactDistribution(baseline,targets.length);
  const proposed=measurePosedTriangleContacts(root,targets,new Map(staged.map(r=>[r.mesh,r.next])));
  triangleEvidence=comparePosedTriangleContacts(baseline,proposed);
  newBodyContactRegions=summarizeNewPosedBodyContactRegions(root,targets,baseline,proposed);
  if(newBodyContactRegions.newContactCount!==triangleEvidence.newlyIntersecting)
   fail('new posed body contact region tally did not reconcile with original-face identities');
  if(strictTriangleContacts&&!triangleEvidence.nonregression)
   fail('new posed body triangle contacts '+triangleEvidence.newlyIntersecting+' (mesh pairs alone would miss)');
 }
 let garmentPartEvidence=null;
 if(traceGarmentPartContacts){
  const beforeParts=measurePosedGarmentPartContacts(root,targets);
  const afterParts=measurePosedGarmentPartContacts(root,targets,new Map(staged.map(r=>[r.mesh,r.next])));
  garmentPartEvidence=comparePosedTriangleContacts(beforeParts,afterParts);
  if(strictGarmentPartContacts&&!garmentPartEvidence.nonregression)
   fail('new posed garment part triangle contacts '+garmentPartEvidence.newlyIntersecting);
 }
 let selfContactEvidence=null,selfDelta=null,selfContactRegions=null,selfContactTypes=null;
 if(traceSelfContacts){
  const selfOverrides=new Map(staged.map(r=>[r.mesh,r.next]));
  selfDelta=measureChangedFaceSelfContactDelta(root,targets,selfOverrides);
  selfContactRegions=summarizeChangedFaceSelfContactRegions(root,targets,selfOverrides,selfDelta);
  selfContactTypes=classifyNewSourceSelfContactTypes(root,targets,selfOverrides,selfDelta);
  if(selfContactRegions.newSelfContactCount!==selfDelta.newlyIntersecting||
     selfContactTypes.newSelfContactCount!==selfDelta.newlyIntersecting||
     selfContactTypes.noContactWaived!==true)
   fail('intrapanel original-face source region tally mismatch');
  // The complete before/after membership comparison only needs pairs touching
  // an altered source face: every unchanged/unchanged pair is geometrically
  // identical in the same pose. No pre-existing complete-contact claim.
  selfContactEvidence=Object.freeze({
   before:selfDelta.retainedExistingContacts,
   after:selfDelta.retainedExistingContacts+selfDelta.newlyIntersecting,
   newlyIntersecting:selfDelta.newlyIntersecting,
   nonregression:selfDelta.noNewSelfContacts&&selfDelta.completedUniqueAffectedPairComparison
  });
  if(strictSelfContacts&&!selfContactEvidence.nonregression)
   fail('new posed intrapanel self-intersections '+selfContactEvidence.newlyIntersecting);
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
  sourceLengthDepthClearance:depthClearance,
  sourceLengthDepthEasingExponent:depthEasingExponent,
  sourceLengthHemWeightedDepthTaper:depthEasingExponent>1,
  sourceLengthDepthFromPhotographVerified:false,
  sourceLengthDepthCorrectionDoesNotChangeProjectedXY:true,
  sourceLengthFlare:1+(shape.flare-1)*extensionScale,
  sourceLengthOriginalUVPreserved:true,sourceLengthRearInferred:true,
  sourceLengthPhysicalSizeMeasured:false,sourceLengthCollisionCertified:false,
  sourceLengthRestPoseOnly:true,sourceLengthTriangleContactAudit:triangleEvidence!==null,sourceLengthTriangleContactStrictlyAccepted:triangleEvidence!==null&&strictTriangleContacts&&triangleEvidence.nonregression,
  sourceLengthTriangleContactBefore:triangleEvidence?.before??null,sourceLengthTriangleContactAfter:triangleEvidence?.after??null,
  sourceLengthNewTriangleContacts:triangleEvidence?.newlyIntersecting??null,
  sourceLengthBodyContactDistribution:bodyContactDistribution,
  sourceLengthNewBodyContactRegions:newBodyContactRegions,
  sourceLengthGarmentPartContactAudit:garmentPartEvidence!==null,
  sourceLengthGarmentPartContactStrictlyAccepted:garmentPartEvidence!==null&&strictGarmentPartContacts&&garmentPartEvidence.nonregression,
  sourceLengthGarmentPartContactsBefore:garmentPartEvidence?.before??null,
  sourceLengthGarmentPartContactsAfter:garmentPartEvidence?.after??null,
  sourceLengthNewGarmentPartContacts:garmentPartEvidence?.newlyIntersecting??null,
  sourceLengthSelfLayerCollisionCertified:false,
  sourceLengthIntrapanelAudit:selfContactEvidence!==null,
  sourceLengthIntrapanelStrictlyAccepted:selfContactEvidence!==null&&strictSelfContacts&&selfContactEvidence.nonregression,
  sourceLengthIntrapanelContactsBefore:selfContactEvidence?.before??null,
  sourceLengthIntrapanelAffectedPairOnly:true,
  sourceLengthIntrapanelFullBaselineEnumerated:false,
  sourceLengthIntrapanelChangedFaces:selfDelta?.changedFaces??null,
  sourceLengthIntrapanelCandidateTests:selfDelta?.candidateTests??null,
  sourceLengthIntrapanelContactsAfter:selfContactEvidence?.after??null,
  sourceLengthNewIntrapanelContacts:selfContactEvidence?.newlyIntersecting??null,
  sourceLengthNewIntrapanelContactRegions:selfContactRegions,
  sourceLengthNewIntrapanelContactTypes:selfContactTypes,
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
export function planNoNewContactSourceLength(shirt,root,profile,{experimentalDepthTrial=false}={}){
 if(typeof experimentalDepthTrial!=='boolean')fail('bounded depth experiment opt-in required');
 const attempts=[];
 // Keep the established original four-candidate search unchanged.
 // Only an explicit research opt-in can add depth-only offset trials.
 const candidateStages=[1,.75,.5,.25].map(scale=>({scale,depthClearance:0,depthEasingExponent:1}));
 if(experimentalDepthTrial)
  for(const scale of [.25,.5])
   for(const depthClearance of [.008,.016,.024])
    candidateStages.push({scale,depthClearance,depthEasingExponent:1});
 if(experimentalDepthTrial)
  for(const scale of [.25,.5])
   for(const depthEasingExponent of [2,3,4])
    candidateStages.push({scale,depthClearance:.008,depthEasingExponent});
 for(const {scale,depthClearance,depthEasingExponent} of candidateStages){
  try{
   const result=fitSourceLength(shirt,root,profile,{
    traceTriangleContacts:true,traceGarmentPartContacts:true,traceSelfContacts:true,extensionScale:scale,depthClearance,depthEasingExponent,previewOnly:true});
   const v=result.stats;
   const classification=classifySourceLengthContactAttempt(v);
   const accepted=classification.accepted;
   attempts.push(Object.freeze({scale,depthClearance,depthEasingExponent,accepted,reason:classification.reason,
    reasons:classification.reasons,
    newlyIntersecting:v.sourceLengthNewTriangleContacts,
    bodyContactRegions:v.sourceLengthNewBodyContactRegions,
    newlyIntersectingGarmentParts:v.sourceLengthNewGarmentPartContacts,
    newlyIntersectingIntrapanel:v.sourceLengthNewIntrapanelContacts,
    selfContactRegions:v.sourceLengthNewIntrapanelContactRegions,
    selfContactTypes:v.sourceLengthNewIntrapanelContactTypes,
    baseline:v.sourceLengthTriangleContactBefore,
    after:v.sourceLengthTriangleContactAfter,
    movedVertices:v.sourceLengthMovedVertices,
    extension:v.sourceLengthExtension,
    sourceSHA256:v.sourceLengthSHA256}));
   if(accepted)break;
  }catch(e){
   attempts.push(Object.freeze({scale,depthClearance,depthEasingExponent,accepted:false,reason:classifySourceLengthCandidateException(e)}));
  }
 }
 const winner=attempts.find(a=>a.accepted);
 return Object.freeze({accepted:!!winner,selectedScale:winner?.scale??null,
  selectedDepthClearance:winner?.depthClearance??null,
  selectedDepthEasingExponent:winner?.depthEasingExponent??null,experimentalDepthTrial,
  attempts:Object.freeze(attempts),refusalReason:winner?null:(attempts.at(-1)?.reason||'candidate-preflight-unavailable'),
  noNewContactAtOnePose:!!winner,
  existingIntersectionsUnresolved:true,
  originalPhotographOnly:!winner,releaseAuthorized:false});
}
/**
 * Aggregate research-only witness, with fixed enumerated reasons and numbers.
 * Never forward source SHA, original face IDs, private photo pixels or wearer
 * geometry into browser console, saved outfits, or build artifacts.
 */
export function safeAdaptiveBodyContactDiagnostic(decision){
 if(!decision||!Array.isArray(decision.attempts)||decision.attempts.length<1||decision.attempts.length>16)
  fail('bounded adaptive source diagnostic required');
 const attempts=decision.attempts.map(a=>Object.freeze({
  scale:a.scale,depthClearance:a.depthClearance,depthEasingExponent:a.depthEasingExponent,accepted:a.accepted===true,reason:a.reason||'candidate-preflight-unavailable',
  newBodyContacts:Number.isSafeInteger(a.newlyIntersecting)?a.newlyIntersecting:null,
  newSelfContacts:Number.isSafeInteger(a.newlyIntersectingIntrapanel)?a.newlyIntersectingIntrapanel:null,
  selfContactTypes:a.selfContactTypes?Object.freeze({
   newSelfContactCount:a.selfContactTypes.newSelfContactCount,
   byContactGeometry:Object.freeze({...a.selfContactTypes.byContactGeometry}),
   byOriginalCoincidentCorners:Object.freeze([...a.selfContactTypes.byOriginalCoincidentCorners]),
   byStagedCoincidentCorners:Object.freeze([...a.selfContactTypes.byStagedCoincidentCorners]),
   byGarmentMesh:Object.freeze([...a.selfContactTypes.byGarmentMesh]),
   cornerOrder:a.selfContactTypes.cornerOrder,
   topologyGapIsNotASafetyExemption:true,
   noContactWaived:true,
   noPhotoOrOwnerFields:true,
   releaseAuthorized:false
  }):null,
  selfRegions:a.selfContactRegions?Object.freeze({
   newSelfContactCount:a.selfContactRegions.newSelfContactCount,
   byGarmentMesh:Object.freeze([...a.selfContactRegions.byGarmentMesh]),
   byHeightBandPair:Object.freeze([...a.selfContactRegions.byHeightBandPair]),
   byHeightSeparation:Object.freeze([...a.selfContactRegions.byHeightSeparation]),
   heightPairOrder:a.selfContactRegions.heightPairOrder,
   originalSourceFaceIdentity:a.selfContactRegions.originalSourceFaceIdentity===true,
   noPhotoOrOwnerFields:true,releaseAuthorized:false
  }):null,
  bodyRegions:a.bodyContactRegions?Object.freeze({
   newContactCount:a.bodyContactRegions.newContactCount,
   byGarmentMesh:Object.freeze([...a.bodyContactRegions.byGarmentMesh]),
   byHeightQuartile:Object.freeze([...a.bodyContactRegions.byHeightQuartile]),
   byGarmentAndHeight:Object.freeze(a.bodyContactRegions.byGarmentAndHeight.map(b=>Object.freeze([...b]))),
   originalFaceIdentity:a.bodyContactRegions.originalFaceIdentity===true,
   noPhotoOrOwnerFields:true,releaseAuthorized:false
  }):null
 }));
 return Object.freeze({accepted:decision.accepted===true,selectedScale:decision.selectedScale,
  selectedDepthClearance:decision.selectedDepthClearance,
  selectedDepthEasingExponent:decision.selectedDepthEasingExponent,
  experimentalDepthTrial:decision.experimentalDepthTrial===true,
  refusalReason:decision.refusalReason,
  attempts:Object.freeze(attempts),sourcePoseOnly:true,
  noPhotoOrOwnerFields:true,releaseAuthorized:false});
}
export function applyNoNewContactSourceLength(shirt,root,profile,{projectSourceRGB=false,onResearchDiagnostic=null,experimentalDepthTrial=false}={}){
 if(onResearchDiagnostic!==null&&typeof onResearchDiagnostic!=='function')
  fail('bounded research diagnostic callback required');
 const decision=planNoNewContactSourceLength(shirt,root,profile,{experimentalDepthTrial});
 if(onResearchDiagnostic)onResearchDiagnostic(safeAdaptiveBodyContactDiagnostic(decision));
 if(!decision.accepted)
  fail('adaptive-geometry-refused['+decision.refusalReason+']: original-photo/2D fallback required; no garment geometry committed (body, garment part or intrapanel)');
 const result=fitSourceLength(shirt,root,profile,{
  projectSourceRGB,traceTriangleContacts:true,strictTriangleContacts:true,
  traceGarmentPartContacts:true,strictGarmentPartContacts:true,
  traceSelfContacts:true,strictSelfContacts:true,
  extensionScale:decision.selectedScale,depthClearance:decision.selectedDepthClearance,
  depthEasingExponent:decision.selectedDepthEasingExponent});
 return {...result,stats:{...result.stats,
  sourceLengthAdaptiveCandidateCount:decision.attempts.length,
  sourceLengthExperimentalDepthTrial:decision.experimentalDepthTrial,
  sourceLengthOriginalXYPhotographedSilhouetteRetained:true,
  sourceLengthDepthTaperNotPhotoMeasured:true,
  sourceLengthAdaptiveOnePoseNonregression:true,
  sourceLengthAdaptiveGarmentPartNonregression:true,
  sourceLengthAdaptiveIntrapanelNonregression:true,
  sourceLengthExistingContactsNotCertified:true,
  releaseAuthorized:false}};
}
