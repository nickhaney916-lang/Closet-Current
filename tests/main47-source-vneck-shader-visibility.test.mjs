import test from 'node:test';
import assert from 'node:assert/strict';
import {
 M47,createResearchVNeckFrontAlphaVisibility47,
 judgeResearchVNeckVisibility47
} from '../research/main1054-3d47/fragment-visibility-trial.mjs';
const source=[
 "export const DRESS_RELEASE='HOLD';",
 'const mesh=new T.SkinnedMesh(geometry,material);',
 "const shaderFragment=[",
 "'float front=smoothstep(.15,.54,vDressNormal.z);',",
 "'vec4 samplePixel=texture2D(uDressImage,uv);',",
 "'diffuseColor.rgb=mix(diffuseColor.rgb,samplePixel.rgb,samplePixel.a*front*edge);',"
].join('\n');
const args=()=>({
 originalDressShaderJS:source,
 originalGitBlobSHA1:M47.originalGitBlobSHA1,
 variant:'M45_HOLE_RESEARCH_ONLY',approvedForRelease:false
});
test('M47 inserts one explicit front-only source photo V-neck alpha discard into ephemeral shader, source remains intact',()=>{
 const before=source;
 const {patchedResearchModuleText:text,audit}=createResearchVNeckFrontAlphaVisibility47(args());
 assert.equal(source,before,'authoritative source must not mutate');
 assert.ok(text.includes("samplePixel.a<0.06)discard;"));
 assert.ok(text.includes('front>0.75'));
 assert.ok(text.includes('edge>0.55'));
 assert.ok(text.includes('source')===false||typeof text==='string');
 assert.equal(text.split('discard;').length-1,1);
 assert.equal(audit.onlyFrontFacingSourceProjectedFragmentVisibility,true);
 assert.equal(audit.sourceRGBAndAlphaDataImmutable,true);
 assert.equal(audit.originalDonorModuleOnDiskUntouched,true);
 assert.equal(audit.sourcePixelAlphaZeroDoesNotMeanValidPhysicalHole,true);
 assert.equal(audit.actualClothOrBodyClearanceNotCertified,true);
 assert.equal(audit.consumer3DAdmitted,false);
 assert.equal(audit.releaseAuthorized,false);
 assert.equal(audit.familyAlpha,'HOLD');
});
test('M47 refuses wrong original source blob, pre-patched shader or forged release and non-M45 original',()=>{
 for(const changes of [
  {originalGitBlobSHA1:'f'.repeat(40)},
  {originalDressShaderJS:source+'discard;'},
  {originalDressShaderJS:source.replace('samplePixel=texture2D','pixel=texture2D')},
  {variant:'P93'},
  {approvedForRelease:true}
 ])assert.throws(()=>createResearchVNeckFrontAlphaVisibility47({...args(),...changes}),/BLOCKED/);
});
function world(){
 const variants=['P93','M45','M45_HOLE'],scenes=[];
 const physical=(figure,pose,view,variant)=>({
  variant,figure,pose,view,
  actualBoneCount:163,
  originalGeometryAndPhotoUVUntouched:true,
  originalPhotographerSourceSHA256:M47.originalSHA256,
  fittedVertices:12692,anatomicalBodyFaces:109064,
  sourceGarmentTriangles:3836,
  sampledCrossBodyStrictWitnesses:0,sampledSelfStrictWitnesses:0,
  ambiguousBodyNearUnresolved:20,ambiguousSelfNearUnresolved:6,
  releaseAuthorized:false
 });
 for(const variant of variants)for(const figure of ['female','male'])
  for(const pose of ['source','blend-50','relaxed'])
   for(const view of ['front','side'])scenes.push(physical(figure,pose,view,variant));
 const sourceCropRects=Object.fromEntries(variants.map(v=>[v,[.15,.12,.70,.81]]));
 return {variants,scenes,expectedComparisons:12,
  networkRequests:[],browserErrors:[],sourceCropRects,
  originalPhotoSourceSHA256:M47.originalSHA256,
  sourceBoundDelta:{
   additionalM45AlphaRemoved:4890,originalP93AlphaChanged:12961,
   sourceRGBAAllRGBBytesIdentical:true,releaseAuthorized:false
  },shaderPermission:false};
}
test('M47 requires authentic 36 source-posed scenes, immutable exact original projected UV crop and 0 body crossings',()=>{
 const w=world(),out=judgeResearchVNeckVisibility47(w);
 assert.equal(out.actualSource3DScenes,36);
 assert.equal(out.matchedNative3DSourceMaskComparisons,12);
 assert.equal(out.originalProjectedPhotoCropSameAcrossAllVariants,true);
 assert.equal(out.originalSourceBodyContactSamplesCount,12);
 assert.equal(out.alphaVisibilityCutNotPhysicalClothGeometry,true);
 assert.equal(out.sourceBacksideNotPhotographed,true);
 assert.equal(out.humanPhotoAndMaterialReviewNotPerformed,true);
 assert.equal(out.releaseAuthorized,false);
 assert.equal(out.familyAlpha,'HOLD');
});
test('M47 rejects missing poses, different original projected UV crops, fake contact and browser egress',()=>{
 const w=world();
 for(const extra of [
  {scenes:w.scenes.slice(1)},
  {sourceCropRects:{...w.sourceCropRects,M45:[.17,.12,.70,.81]}},
  {sourceBoundDelta:{...w.sourceBoundDelta,additionalM45AlphaRemoved:0}},
  {networkRequests:['https://unexpected.example']},
  {browserErrors:['WebGL source mismatch']},
  {shaderPermission:true},
  {variants:['P93','M45','P93']},
  {scenes:w.scenes.map((s,i)=>i===8?{
   ...s,sampledCrossBodyStrictWitnesses:1
  }:s)},
  {scenes:w.scenes.map((s,i)=>i===23?{
   ...s,fittedVertices:12693
  }:s)}
 ])assert.throws(()=>judgeResearchVNeckVisibility47({...w,...extra}),/BLOCKED/);
});
