// Offline evidence evaluation only. Metadata checks are not identity authentication.
import {createHash} from 'node:crypto';
import {decodeReferenceMask,scoreGarmentMask} from './garment-mask-metrics.mjs';
export const FEATURES=Object.freeze(['collars','sleeves','hems','logos','seams','buttons','darkTrim','fabricDetail','transparency','layering']);
export const digest=b=>createHash('sha256').update(b).digest('hex');
export const objectDigest=o=>digest(JSON.stringify(o));
const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const text=s=>typeof s==='string'&&s.trim().length>0;
export function verifyReference({sourceBytes,reference,registry,evidenceFiles={}}){
 if(registry?.schemaVersion!==1||!Array.isArray(registry.references))throw Error('Invalid evidence registry');
 const record=registry.references.find(r=>r.referenceSha256===objectDigest(reference));
 if(!record)throw Error('No independently reviewed reference in evidence registry');
 if(!hex(record.sourceSha256)||digest(sourceBytes)!==record.sourceSha256||reference.sourceSha256!==record.sourceSha256||reference.image!==record.image)throw Error('Source binding mismatch');
 if(record.scope!=='full-visible-garment'||record.method!=='manual-independent-annotation'||record.reviewStatus!=='approved')throw Error('Reference is partial, predicted or unapproved');
 if(!text(record.annotator)||!text(record.reviewer)||record.annotator.trim().toLowerCase()===record.reviewer.trim().toLowerCase())throw Error('Distinct independent reviewers required');
 if(!text(record.reviewEvidence)||!hex(record.reviewEvidenceSha256)||!/^\d{4}-\d{2}-\d{2}$/.test(record.reviewDate||''))throw Error('Missing review evidence');
 for(const key of ['imageRights','annotationRights']){
  const right=record[key];
  if(right?.status!=='verified-for-test-redistribution'||!text(right.license)||!text(right.sourceUrl)||!hex(right.evidenceSha256)||!text(right.evidencePath))throw Error('Unverified image or annotation rights');
 }
 for(const [path,sha]of [[record.reviewEvidence,record.reviewEvidenceSha256],...[record.imageRights,record.annotationRights].map(r=>[r.evidencePath,r.evidenceSha256])]){
  if(!Object.hasOwn(evidenceFiles,path)||digest(evidenceFiles[path])!==sha)throw Error('Missing or changed provenance evidence bytes');
 }
 const mask=decodeReferenceMask(reference),n=mask.reduce((a,b)=>a+b,0);
 if(!n||n===mask.length)throw Error('Full reference must contain garment and background');
 return {mask,record};
}
function boundary(mask,w,h){
 const out=new Uint8Array(mask.length);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x;if(!mask[i])continue;
  if(!x||!y||x===w-1||y===h-1||!mask[i-1]||!mask[i+1]||!mask[i-w]||!mask[i+w])out[i]=1;
 }
 return out;
}
function near(mask,w,h,r){
 const out=new Uint8Array(mask.length);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y*w+x])
  for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h)out[(y+dy)*w+x+dx]=1;
 return out;
}
const ratio=(a,b)=>b?a/b:null;
export function measureQuality(reference,predictedAlpha,sourceRgba,candidateRgba,{alphaThreshold=128,boundaryTolerancePixels=1}={}){
 const {width:w,height:h}=reference,truth=decodeReferenceMask(reference),n=w*h;
 if(!Number.isInteger(alphaThreshold)||alphaThreshold<1||alphaThreshold>255||!Number.isInteger(boundaryTolerancePixels)||boundaryTolerancePixels<0||boundaryTolerancePixels>4)throw Error('Invalid measurement policy');
 if(predictedAlpha?.length!==n||sourceRgba?.length!==n*4||candidateRgba?.length!==n*4)throw Error('Exact source grid required; no resizing of truth');
 if(!Array.from(predictedAlpha).every(v=>Number.isInteger(v)&&v>=0&&v<=255))throw Error('Invalid alpha');
 const pred=Uint8Array.from(predictedAlpha,a=>+(a>=alphaThreshold)),score=scoreGarmentMask(truth,pred,w,h);
 const tb=boundary(truth,w,h),pb=boundary(pred,w,h),pn=near(pb,w,h,boundaryTolerancePixels),tn=near(tb,w,h,boundaryTolerancePixels);
 let tr=0,pr=0,tm=0,pm=0,boundaryRetained=0,alphaLoss=0,alphaBg=0,rgbChanged=0,rgbAbs=0;
 for(let i=0;i<n;i++){
  if(candidateRgba[i*4+3]!==Math.min(sourceRgba[i*4+3],predictedAlpha[i]))throw Error('Candidate alpha does not match measured mask');
  if(sourceRgba[i*4+3]!==255)throw Error('Binary reference cannot validate native transparency');
  if(tb[i]){tr++;tm+=pn[i];boundaryRetained+=pred[i];}if(pb[i]){pr++;pm+=tn[i];}
  if(truth[i])alphaLoss+=1-predictedAlpha[i]/255;else alphaBg+=predictedAlpha[i]/255;
  for(let c=0;c<3;c++){const d=Math.abs(sourceRgba[i*4+c]-candidateRgba[i*4+c]);rgbChanged+=+(d!==0);if(truth[i])rgbAbs+=d;}
 }
 const features={};
 for(const feature of FEATURES){
  const region=reference.features?.[feature];
  if(region?.status==='not-applicable'&&text(region.reason)){features[feature]={status:'not-applicable',reason:region.reason};continue;}
  if(!region){features[feature]={status:'unmeasured',retention:null};continue;}
  const mask=decodeReferenceMask(region);if(region.width!==w||region.height!==h)throw Error('Feature grid mismatch');
  let total=0,kept=0,soft=0,rgbError=0;
  for(let i=0;i<n;i++)if(mask[i]){if(!truth[i])throw Error('Feature outside garment truth');total++;kept+=pred[i];soft+=predictedAlpha[i]/255;for(let c=0;c<3;c++)rgbError+=Math.abs(sourceRgba[i*4+c]-candidateRgba[i*4+c]);}
  if(!total)throw Error('Empty feature');
  features[feature]={status:'measured',pixels:total,retainedPixels:kept,retention:kept/total,alphaRetention:soft/total,rgbMeanAbsoluteError:rgbError/(3*total)};
 }
 return {...score,falseRemovalRate:ratio(score.falseNegative,score.truePositive+score.falseNegative),
  falseInclusionRate:score.backgroundContaminationRate,alphaWeightedGarmentRemoval:ratio(alphaLoss,score.truePositive+score.falseNegative),
  alphaWeightedBackgroundInclusion:ratio(alphaBg,score.falsePositive+score.trueNegative),boundaryRecall:ratio(tm,tr),boundaryPrecision:ratio(pm,pr),
  exactReferenceBoundaryRetention:ratio(boundaryRetained,tr),referenceBoundaryPixels:tr,predictedBoundaryPixels:pr,alphaThreshold,boundaryTolerancePixels,boundaryDistance:'Chebyshev on same source grid, four-connected interior boundary',
  rgbBytesChanged:rgbChanged,garmentRgbMeanAbsoluteError:ratio(rgbAbs,3*(score.truePositive+score.falseNegative)),features,
  transparencyQualityVerified:false,layeringQualityVerified:false};
}
export function thresholdFailures(metrics,policy){
 if(!Number.isFinite(policy.featureRetentionMin)||policy.featureRetentionMin<0||policy.featureRetentionMin>1)throw Error('Invalid feature threshold');
 const failures=[];
 for(const [name,value,min]of [['falseRemovalRate',policy.falseRemovalRateMax,false],['falseInclusionRate',policy.backgroundInclusionRateMax,false],['boundaryRecall',policy.boundaryRecallMin,true]]){
  if(!Number.isFinite(value)||value<0||value>1)throw Error('Invalid threshold');
  if(metrics[name]===null||(min?metrics[name]<value:metrics[name]>value))failures.push(name);
 }
 if(metrics.rgbBytesChanged!==0)failures.push('originalRgbChanged');
 for(const feature of FEATURES){const f=metrics.features[feature];if(!f||f.status==='unmeasured'||(f.status==='measured'&&(f.retention<policy.featureRetentionMin||f.alphaRetention<policy.featureRetentionMin)))failures.push('feature:'+feature);}
 // Binary silhouettes cannot certify translucent fabric or body occlusion.
 if(!metrics.transparencyQualityVerified)failures.push('independent-transparency-evidence');
 if(!metrics.layeringQualityVerified)failures.push('independent-layering-evidence');
 return failures;
}
export function evaluateEvidence(input){
 const base={status:'blocked',passed:false,productionAuthorized:false,reviewerIdentitiesAuthenticated:false,metrics:null};
 if(!input.reference)return {...base,reasons:['missing-independent-full-garment-reference']};
 let verified;
 try{verified=verifyReference(input);}catch(e){return {...base,reasons:[e.message]};}
 const metrics=measureQuality(input.reference,input.predictedAlpha,input.sourceRgba,input.candidateRgba,input.registry.policy);
 const reasons=thresholdFailures(metrics,input.registry.policy);
 if(input.registry.policy.status!=='approved')reasons.unshift('quality-threshold-policy-unapproved');
 return {...base,status:reasons.length?'blocked':'pass',passed:!reasons.length,metrics,reasons,referenceSha256:objectDigest(input.reference),sourceSha256:verified.record.sourceSha256,candidateRgbaSha256:digest(input.candidateRgba),predictedAlphaSha256:digest(input.predictedAlpha)};
}
