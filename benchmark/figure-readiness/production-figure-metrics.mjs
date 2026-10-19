// Offline readiness checks; no image synthesis, deployment or review authority.
import {createHash} from 'node:crypto';
export const sha=b=>createHash('sha256').update(b).digest('hex');
const hash=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const text=s=>typeof s==='string'&&!!s.trim();
export function sampling(width,height,scenario,canonical){
 if(![width,height,canonical?.width,canonical?.height].every(x=>Number.isSafeInteger(x)&&x>0)||
   ![scenario?.cssWidth,scenario?.dpr,scenario?.cssZoom].every(x=>Number.isFinite(x)&&x>0))throw Error('Invalid sampling dimensions');
 const neededWidth=Math.ceil(scenario.cssWidth*scenario.dpr*scenario.cssZoom),neededHeight=Math.ceil(scenario.cssWidth*canonical.height/canonical.width*scenario.dpr*scenario.cssZoom);
 return {...scenario,neededWidth,neededHeight,linearUpscale:Math.max(neededWidth/width,neededHeight/height),nativeSamplingSufficient:width>=neededWidth&&height>=neededHeight};
}
function reviewBound(review,assetSha,evidence){
 return !!review&&review.assetSha256===assetSha&&text(review.reviewedBy)&&
  Number.isFinite(Date.parse(review.reviewedAt))&&text(review.evidencePath)&&hash(review.evidenceSha256)&&
  Object.hasOwn(evidence,review.evidencePath)&&sha(evidence[review.evidencePath])===review.evidenceSha256;
}
export function compareAnchors(a,b,required,maxDelta){
 if(!Array.isArray(required)||!required.length||!Number.isFinite(maxDelta)||maxDelta<0||maxDelta>1)throw Error('Invalid alignment policy');
 const deltas={};
 for(const name of required){
  for(const row of [a,b])if(!row?.[name]||!['x','y'].every(k=>Number.isFinite(row[name][k])&&row[name][k]>=0&&row[name][k]<=1))throw Error('Missing or invalid normalized anchor');
  deltas[name]={x:Math.abs(a[name].x-b[name].x),y:Math.abs(a[name].y-b[name].y)};
 }
 return {deltas,withinProposedTolerance:Object.values(deltas).every(d=>d.x<=maxDelta&&d.y<=maxDelta),tolerance:maxDelta,
  meaning:'Reviewed stage-normalized central anchors only; does not compare body shape or change runtime positioning'};
}
export function evaluateProductionFigures(policy,evidence,measurements,proofFiles={}){
 if(policy?.schemaVersion!==1||evidence?.schemaVersion!==1||!Array.isArray(evidence.figures)||evidence.figures.length!==2||
   evidence.figures.map(x=>x.id).sort().join(',')!=='female,male'||measurements?.length!==2||measurements.map(x=>x.id).sort().join(',')!=='female,male')throw Error('Exactly the same two figures required');
 const figures=evidence.figures.map(asset=>{
  const m=measurements.find(x=>x.id===asset.id),blockers=[];
  if(!hash(m.preview?.sha256)||!Number.isSafeInteger(m.preview.width)||!Number.isSafeInteger(m.preview.height)||m.preview.width<1||m.preview.height<1)throw Error('Invalid decoded preview');
  if(m.preview.sha256!==asset.previewSha256)throw Error('Preview identity changed');
  const master=m.master;
  if(master&&(!hash(master.sha256)||![master.width,master.height].every(x=>Number.isSafeInteger(x)&&x>0)))throw Error('Invalid decoded master');
  if(!master)blockers.push('full-resolution-master-missing');
  else if(!hash(asset.masterSha256)||master.sha256!==asset.masterSha256)blockers.push('master-identity-unverified');
  if(!master||master.width<policy.minimumMaster.width||master.height<policy.minimumMaster.height)blockers.push('minimum-native-dimensions-unmet');
  if(!master||master.width*master.height>policy.maxDecodedPixels||master.frames!==1||master.orientation!==1||!master.srgbNormalized||!master.lossless)blockers.push('master-integrity-color-or-format-unverified');
  if(!reviewBound(asset.nativeResolutionEvidence,asset.masterSha256,proofFiles))blockers.push('native-detail-provenance-unverified');
  if(!reviewBound(asset.rightsReview,asset.masterSha256,proofFiles))blockers.push('exact-asset-rights-evidence-missing');
  for(const key of policy.requiredRights)if(asset.rights?.[key]!==true)blockers.push('rights-'+key+'-unverified');
  if(!reviewBound(asset.visualReview,asset.masterSha256,proofFiles))blockers.push('exact-asset-visual-review-missing');
  for(const key of policy.requiredVisualChecks)if(asset.technical?.[key]!==true)blockers.push('visual-'+key+'-unverified');
  if(!reviewBound(asset.alignmentReview,asset.masterSha256,proofFiles))blockers.push('reviewed-anchors-missing');
  const measured=master??m.preview,aspectRelativeError=Math.abs((measured.width/measured.height)/(policy.canonicalStage.width/policy.canonicalStage.height)-1);
  if(aspectRelativeError>policy.maxAspectRelativeError)blockers.push('canvas-aspect-incompatible');
  return {id:asset.id,...m,canvasAspectRelativeError:aspectRelativeError,previewSampling:policy.samplingCases.map(s=>sampling(m.preview.width,m.preview.height,s,policy.canonicalStage)),
   masterSampling:master?policy.samplingCases.map(s=>sampling(master.width,master.height,s,policy.canonicalStage)):null,
   blockers,ready:false};
 });
 let alignment=null;
 if(evidence.figures.every(a=>a.anchors&&reviewBound(a.alignmentReview,a.masterSha256,proofFiles))){
  alignment=compareAnchors(evidence.figures[0].anchors,evidence.figures[1].anchors,policy.requiredPairAnchors,policy.maxPairAnchorDelta);
  if(!alignment.withinProposedTolerance)for(const f of figures)f.blockers.push('pair-anchor-inconsistent');
 }
 const reasons=[];
 if(!alignment)reasons.push('pair-alignment-unmeasured');
 if(policy.status!=='approved')reasons.push('production-policy-unapproved');
 // Never translate technical acceptance metadata into production authorization.
 for(const f of figures)f.ready=f.blockers.length===0&&reasons.length===0;
 return {schemaVersion:1,status:figures.every(f=>f.ready)?'evidence-complete-not-authorized':'blocked',assetCount:2,
  figures,pairAlignment:alignment,pairBlockers:reasons,productionAuthorized:false,licensingApprovedByAutomation:false,
  visualQualityScored:false,physicalPhoneEvidence:false,reviewerIdentityAuthenticated:false};
}
