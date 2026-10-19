// Offline research evidence only. Never imported by the application.
import {createHash} from 'node:crypto';
import {approvedReferenceMask,erodeMaskInterior} from './garment-mask-metrics.mjs';
export const FEATURES=Object.freeze(['collars','sleeves','seams','logos','colors',
 'transparency','fabricDetail','layering']);
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const sha=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const name=value=>typeof value==='string'&&value.trim().length>0;
export function verifyFixture(entry,source,bytes){
 if(!entry||!source||entry.id!==source.id||entry.image!==source.image||
  !sha(entry.sourceSha256)||source.sha256!==entry.sourceSha256||
  digest(bytes)!==entry.sourceSha256)throw Error('Fixture source/hash mismatch');
 if(!source.attribution||!name(source.attribution.license)||!name(source.attribution.source))
  throw Error('Missing fixture license provenance');
 if(!Array.isArray(entry.visibleFeatures)||!entry.visibleFeatures.length||
  new Set(entry.visibleFeatures).size!==entry.visibleFeatures.length||
  !entry.visibleFeatures.every(x=>FEATURES.includes(x)))throw Error('Invalid feature inventory');
 return true;
}
export function evaluateFidelity(review,expected){
 const held=reason=>({decision:'hold',reason,fidelityPercent:null,productionAuthorized:false,
  verifiesPhysicalPhone:false,reviewIdentityAuthenticated:false});
 if(!expected||![expected.sourceSha256,expected.candidateSha256,expected.pipelineSha256,
  expected.compositeSha256].every(sha)||!Array.isArray(expected.visibleFeatures)||
  !expected.visibleFeatures.includes('layering')||
  !expected.visibleFeatures.every(x=>FEATURES.includes(x)))return held('incomplete-bound-composite-evidence');
 if(!review||review.mode!=='independent-original-cutout-composite-comparison')return held('independent-review-missing');
 for(const key of ['sourceSha256','candidateSha256','pipelineSha256','compositeSha256'])
  if(review[key]!==expected[key])return held('stale-or-unbound-'+key);
 if(!name(review.reviewer)||!name(review.approvedBy)||
  review.reviewer.trim().toLowerCase()===review.approvedBy.trim().toLowerCase()||
  !name(review.reviewedAt)||!Number.isFinite(Date.parse(review.reviewedAt)))return held('two-documented-independent-reviewers-required');
 if(review.comparedOriginal!==true||review.comparedCutout!==true||review.comparedComposite!==true)
  return held('original-cutout-and-composite-required');
 const checks=review.checks;
 if(!checks||typeof checks!=='object')return held('feature-checks-missing');
 const failed=[],missing=[];
 for(const key of FEATURES){
  const value=checks[key],visible=expected.visibleFeatures.includes(key);
  if(value==='fail')failed.push(key);
  else if(visible?value!=='pass':!['pass','not-visible-in-source'].includes(value))missing.push(key);
 }
 if(failed.length)return {...held('visible-garment-detail-changed'),failed};
 if(missing.length)return {...held('unverified-features'),missing};
 if(review.bodyOrBackgroundContamination!==false||review.inventedDetails!==false)
  return held('contamination-or-invention-unresolved');
 return {...held('documented-comparative-review-complete'),decision:'reviewed-pass',
  evidenceOnly:true,automaticPromotionAllowed:false};
}
export function evaluateFigures(evidence,measurements){
 if(evidence?.schemaVersion!==1||evidence.policy!=='exactly-two-fixed-assets'||
  !Array.isArray(evidence.figures)||evidence.figures.length!==2||
  [...evidence.figures.map(x=>x.id)].sort().join(',')!=='female,male')
  throw Error('Exactly one female and one male figure required');
 const target=evidence.target;
 if(!Number.isInteger(target?.width)||!Number.isInteger(target?.height)||target.width<1||target.height<1)
  throw Error('Invalid asset resolution target');
 const figures=evidence.figures.map(asset=>{
  const actual=measurements.find(x=>x.id===asset.id);
  if(!actual||!sha(actual.previewSha256)||!Number.isInteger(actual.previewWidth)||
   !Number.isInteger(actual.previewHeight)||actual.previewWidth<1||actual.previewHeight<1)
   throw Error('Missing decoded preview measurements');
  const blockers=[];
  if(!actual.masterPresent)blockers.push('full-resolution-master-missing');
  else if(!sha(asset.masterSha256)||actual.masterSha256!==asset.masterSha256)blockers.push('master-hash-unverified');
  if(!actual.masterPresent||!Number.isInteger(actual.masterWidth)||!Number.isInteger(actual.masterHeight)||
   actual.masterWidth<target.width||actual.masterHeight<target.height)
   blockers.push('native-resolution-target-unmet');
  if(asset.nativeResolutionVerified!==true)blockers.push('native-resolution-provenance-unverified');
  if(!['commissioned','photographed','licensed','generated'].includes(asset.sourceKind))blockers.push('source-provenance-unverified');
  for(const key of ['commercialUse','modificationAndClothingOverlays','appDistributionAndCaching',
   'userCompositeExport','optionalFaceReplacement','recognizablePersonReleaseOrFictionalEvidence'])
   if(asset.rights?.[key]!==true)blockers.push('rights-'+key+'-unverified');
  if(!name(asset.rights?.evidenceReference)||!name(asset.rights?.reviewedBy)||
   !name(asset.rights?.reviewedAt)||!Number.isFinite(Date.parse(asset.rights.reviewedAt)))blockers.push('rights-documentation-missing');
  for(const key of ['neutralBaseClothing','frontPoseWithSeparateArms','completeHandsFeetAndHead',
   'consistentLightAndScale','landmarksReviewed','occlusionLayersReviewed'])
   if(asset.technical?.[key]!==true)blockers.push('technical-'+key+'-unverified');
  if(!name(asset.technical?.visualApprovedBy))blockers.push('visual-approval-missing');
  return {id:asset.id,...actual,blockers,ready:blockers.length===0,
   previewUpscaleAtCanonicalWidth:647/actual.previewWidth};
 });
 // Even individually accepted masters need compatible scales/aspect ratios.
 if(figures.every(x=>x.masterPresent)){
  const [a,b]=figures,ratioA=a.masterWidth/a.masterHeight,ratioB=b.masterWidth/b.masterHeight;
  if(Math.abs(ratioA/ratioB-1)>.01)for(const x of figures){x.blockers.push('pair-aspect-mismatch');x.ready=false;}
 }
 return {figures,pairReady:figures.every(x=>x.ready),productionAuthorized:false,
  legalAdviceOrLicenseGrant:false,assetCount:2};
}

// Numerically compare ONLY independently approved, same-source-grid garment
// interiors. Never compare a warped image at unrelated coordinates or infer
// an outline from the tested candidate. RGB error is not perceptual Delta E.
export function scoreApprovedSourceGridDetail(annotation,entry,source,candidate,alignment){
 const mask=approvedReferenceMask(annotation,entry),{width,height}=annotation;
 const n=width*height;
 if(source?.length!==n*4||candidate?.length!==n*4||
  alignment?.method!=='verified-same-source-grid'||
  alignment.sourceSha256!==entry.sourceSha256||
  alignment.sourceRgbaSha256!==digest(source)||alignment.candidateRgbaSha256!==digest(candidate)||
  !name(alignment.verifiedBy)||!name(alignment.approvedBy)||
  alignment.verifiedBy.trim().toLowerCase()===alignment.approvedBy.trim().toLowerCase())
  throw Error('Independent source-grid alignment and exact pixel digests required');
 const interior=erodeMaskInterior(mask,width,height);
 let selected=0,visible=0,error=0,alphaLoss=0,sourceEdge=0,candidateEdge=0,edgeSamples=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;if(!interior[i])continue;selected++;
  const at=i*4;
  if(source[at+3]>=230&&candidate[at+3]>=230){
   visible++;
   for(let c=0;c<3;c++)error+=Math.abs(source[at+c]-candidate[at+c]);
   if(x+1<width&&interior[i+1]&&source[at+7]>=230&&candidate[at+7]>=230){
    for(let c=0;c<3;c++){
     sourceEdge+=Math.abs(source[at+c]-source[at+4+c]);
     candidateEdge+=Math.abs(candidate[at+c]-candidate[at+4+c]);
    }
    edgeSamples++;
   }
  }
  alphaLoss+=Math.max(0,source[at+3]-candidate[at+3])/255;
 }
 return {selectedInteriorPixels:selected,comparableOpaquePixels:visible,
  meanAbsoluteRgbError:visible?error/(visible*3):null,
  meanAlphaLoss:selected?alphaLoss/selected:null,
  horizontalContrastRatio:edgeSamples&&sourceEdge?candidateEdge/sourceEdge:null,
  maskSource:'two-reviewer-approved-reference',alignment:'verified-same-source-grid',
  featureIdentityOrRealisticFitVerified:false,productionAuthorized:false};
}
