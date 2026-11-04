import {readFile} from 'node:fs/promises';
export function assessPromotionGate({manifest,reviewEvidence,qualityEvidence}){
 const cases=manifest?.cases||[];
 const approved=cases.filter(c=>c.reviewStatus==='approved'&&typeof c.referenceMask==='string'&&c.referenceMask.length>0).map(c=>c.id);
 const missing=cases.filter(c=>!approved.includes(c.id)).map(c=>c.id);
 const checks={
  independentlyApprovedOutlines:missing.length===0&&cases.length>=6,
  sideAndBottomShadowCleared:qualityEvidence?.shadowVerified===true,
  backgroundExtensionsCleared:qualityEvidence?.backgroundLeakageVerified===true,
  garmentDetailPreserved:qualityEvidence?.garmentPreservationVerified===true,
  mobileNativeResolution:qualityEvidence?.mobileClarityVerified===true,
  humanCutoutApproval:reviewEvidence?.approved===true
 };
 return {status:Object.values(checks).every(Boolean)?'eligible-for-manual-rollout-review':'blocked',checks,missingApprovedCases:missing,productionChangeAuthorized:false,note:'Quality flags must be sourced from real verified checks; no synthetic success defaults.'};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
 console.log('MODNET_PROMOTION_GATE '+JSON.stringify(assessPromotionGate({manifest}),null,2));
}
