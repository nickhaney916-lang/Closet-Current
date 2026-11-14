import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {VERIFIED_DONOR89,verifyActualPublicPair89} from '../research/parallel89/verify-p84-public-pair.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
/** Synthetic TEST STRUCTURE only. Actual source-pair proof is separately
 * rehashed from JPEG, cutout and real browser PNG bytes by the CI CLI.
 */
function sample(){
 const source={
  shirt:{originalSHA256:VERIFIED_DONOR89.shirt.originalSHA256,
   cutoutSHA256:hash('synthetic-shirt-mask'),license:'CC BY-SA 3.0',ownerApproved:false},
  denims:Object.fromEntries(['public','second'].map(id=>[id,{
   id:VERIFIED_DONOR89.denims[id].id,
   originalSHA256:VERIFIED_DONOR89.denims[id].originalSHA256,
   cutoutSHA256:VERIFIED_DONOR89.denims[id].cutoutSHA256,
   sourcePage:VERIFIED_DONOR89.denims[id].sourcePage,
   license:VERIFIED_DONOR89.denims[id].license,
   ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false}]))
 };
 const images={},result={
  schema:'parallel84-actual-licensed-photo-two-piece-browser/v1',
  engine:'chromium',browserEngineReal:'chromium',
  widths:[320,390,430],figures:['female','male'],denimSources:['public','second'],
  angles:[0,45,90,180],screenshotCount:48,sourcePairPoseSamples:12,
  originalPhoto2DFallbackImages:3,
  originalLicensedPhotoSHAAndCutoutValidatedByP69:true,
  threeDContactClearanceCertified:false,photographedRearObserved:false,
  independentHumanPhotorealismCertified:false,
  privateAccountDataAccessed:false,realAndroidIphoneTested:false,
  productionModified:false,releaseAuthorized:false,familyAlpha:'HOLD',
  captures:[],samples:[],fallbacks:[]
 };
 for(const width of result.widths){
  const name='original-2d-'+width+'.png';const sha256=hash(name);
  images[name]=sha256;
  result.fallbacks.push({name,width,sha256,actualLicensedOriginalPhoto2D:true});
  for(const figure of result.figures)for(const denim of result.denimSources){
   result.samples.push({width,figure,denim,loadMs:100,
    medianRafIntervalMs:16,p95RafIntervalMs:19,
    geometries:17,textures:4,
    layer:{schema:'parallel84-distinct-source-layer-contact/v1',
     avatar:figure,pose:'relaxed',sourcePair:'top-bottom',
     actualSkinnedPoseSampled:true,sourceBuffersPreserved:true,
     anatomicalBodyMeshes:2,distinctSourcePhotoMeshClaims:2,
     safe3D:false,contactClearanceProved:false,releaseAuthorized:false,
     humanRealismApproved:false,originalGarmentGeometryEdited:false,
     unobservedBacks:2,sampledPoseIsNotWholeGarmentClearance:true,
     status:'INCOMPLETE_BUDGET',fullOriginalSourceFaceCount:30000,
     sampledSourceFaceCount:15000,originalFacesOmittedByBudget:15000,
     sourceFaceSamplingStride:2,budgetComplete:false,
     strictTransverseCrossings:0,anyCrossingVeto:false}
   });
   for(const angle of result.angles){
    const name=['source-pair','chromium',width,figure,denim,angle].join('-')+'.png';
    const sha256=hash(name);images[name]=sha256;
    result.captures.push({name,width,figure,denim,angle,sha256,
     imageWidth:320,imageHeight:320,
     actualLicensedPhotoMeshPair:true,real163BoneWebGL:true,
     photoRearUnobserved:true,changedGeometryByP84:false,
     sourceLayerProof:'INCOMPLETE_BUDGET'});
   }
  }
 }
 return {source,images,result,engine:'chromium'};
}
test('strict screenshot/source/contact structure sample is never consumer accepted',()=>{
 const x=sample(),out=verifyActualPublicPair89(x);
 assert.equal(out.status,'TWO_GENUINE_PHOTOGRAPHED_ITEMS_RENDERED_NOT_3D_ACCEPTED');
 assert.equal(out.actualScreenshotCount,48);assert.equal(out.actual2DFallbacks,3);
 assert.equal(out.originalJPEGsMatched,3);assert.equal(out.sourceCutoutsMatched,3);
 assert.equal(out.certified3D,undefined);assert.equal(out.consumer3DAdmitted,false);
 assert.equal(out.fullMeasuredLayerClearance,undefined);
 assert.equal(out.fullyMeasuredLayerClearance,false);
 assert.equal(out.sampledOriginalSourceFaces,12*15000);
 assert.equal(out.excludedOriginalSourceFaces,12*15000);
});
const cases=[
 ['false visual approval',x=>x.result.independentHumanPhotorealismCertified=true],
 ['false phone pass',x=>x.result.realAndroidIphoneTested=true],
 ['wrong donor source',x=>x.source.denims.public.originalSHA256='0'.repeat(64)],
 ['invalid denim license',x=>x.source.denims.second.license='UNKNOWN'],
 ['wrong shirt',x=>x.source.shirt.originalSHA256='c'.repeat(64)],
 ['missing photo screenshot',x=>x.result.captures.pop()],
 ['missing browser source sample',x=>x.result.samples.pop()],
 ['forged screenshot hash',x=>x.images[x.result.captures[0].name]='d'.repeat(64)],
 ['duplicate screenshot',x=>x.result.captures[0]=x.result.captures[1]],
 ['duplicate sample',x=>x.result.samples[0]=x.result.samples[1]],
 ['budget incomplete but falsely complete',x=>x.result.samples[0].layer.budgetComplete=true],
 ['missing original faces silently',x=>x.result.samples[0].layer.originalFacesOmittedByBudget=0],
 ['false contact clearance',x=>x.result.samples[0].layer.contactClearanceProved=true],
 ['witness mismatch',x=>x.result.samples[0].layer.strictTransverseCrossings=3],
 ['false source visual proof',x=>x.result.photographedRearObserved=true],
 ['forged missing fallback',x=>delete x.images['original-2d-320.png']],
 ['avatar wrong',x=>x.result.samples[0].layer.avatar='alien'],
 ['non-real WebGL',x=>x.result.captures[0].real163BoneWebGL=false],
 ['incomplete source matrix',x=>x.result.widths=[320,390]],
 ['unexpected extra screenshot',x=>x.images['injected-private-photo.png']=hash('private')],
 ['fake source pair claims',x=>x.result.samples[0].layer.distinctSourcePhotoMeshClaims=3],
 ['unsafe original mutation',x=>x.result.samples[0].layer.originalGarmentGeometryEdited=true],
 ['wrong source license',x=>x.source.shirt.license='CC0'],
 ['wrong paired source ownership',x=>x.source.denims.public.ownerApproved=true]
];
for(const [name,mutation] of cases)test('P89 blocks '+name,()=>{
 const x=sample();mutation(x);
 const out=verifyActualPublicPair89(x);
 assert.equal(out.status,'SOURCE_OR_RENDER_EVIDENCE_REJECTED');
 assert.equal(out.sourcePhoto2DFallbackRequired,true);assert.equal(out.releaseAuthorized,false);
});
test('positive measured strict crossings remain research evidence and are never a 3D clearance',()=>{
 const x=sample();const l=x.result.samples[0].layer;
 l.status='STRICT_CROSSING_VETO';l.strictTransverseCrossings=3;l.anyCrossingVeto=true;l.budgetComplete=true;
 const out=verifyActualPublicPair89(x);
 assert.equal(out.status,'TWO_GENUINE_PHOTOGRAPHED_ITEMS_RENDERED_NOT_3D_ACCEPTED');
 assert.equal(out.crossingVetoCases,1);
 assert.equal(out.consumer3DAdmitted,false);
});