import test from 'node:test';
import assert from 'node:assert/strict';
import {
 M46_SOURCE,verifyRealPhotoMaskRenderPair46,
 makeResearchOnlyRendererMaskManifest46
} from '../research/main1054-3d46/original-source-p93-m45-render-lease.mjs';
const W=1920,H=2880,N=W*H*4;
function fixture(){
 const sourceRGBA=new Uint8Array(N),originalWork47RGBA=new Uint8Array(N);
 for(let i=0;i<N;i+=4){
  sourceRGBA.set([24,20,28,255],i);
  originalWork47RGBA.set([24,20,28,255],i);
 }
 const p93RGBA=new Uint8Array(originalWork47RGBA);
 const m45RGBA=new Uint8Array(originalWork47RGBA);
 for(let p=0;p<12961;p++){
  const x=780+(p%460),y=451+Math.floor(p/460);
  const off=(y*W+x)*4+3;
  p93RGBA[off]=0;m45RGBA[off]=0;
 }
 for(let p=0;p<4890;p++){
  const x=790+(p%440),y=510+Math.floor(p/440);
  const off=(y*W+x)*4+3;
  // These source sample coordinates must be distinct from earlier P93
  // removed rows y451..479: fixture only, not authentic photograph.
  assert.equal(p93RGBA[off],255);
  m45RGBA[off]=0;
 }
 const receipt={
  schema:'MAIN1054_M45_GENUINE_PHOTO_LOCAL_TONE_VNECK_PROPOSAL/v1',
  originalJpegSHA256:M46_SOURCE.originalJpegSHA256,
  originalWork47PngSHA256:M46_SOURCE.work47PNG_SHA256,
  originalP93PngSHA256:M46_SOURCE.p93PNG_SHA256,
  additionallyTransparentOriginalOpaquePixels:4890,
  originalSourceRGBPixelsChanged:0,
  protectedOriginalBrightPipingOrLogoPixelsRemoved:0,
  sourceOrP93AlphaIncreasedPixels:0,
  offVNeckOriginalSourcePixelsChanged:0,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 };
 return {width:W,height:H,sourceRGBA,originalWork47RGBA,p93RGBA,m45RGBA,
  sourceMeasure:receipt,originalJpegSHA256:M46_SOURCE.originalJpegSHA256,
  work47PngSHA256:M46_SOURCE.work47PNG_SHA256,
  p93PngSHA256:M46_SOURCE.p93PNG_SHA256,
  m45PngSHA256:'f'.repeat(64)
 };
}
test('M46 establishes 2 distinct source-hash-bound real-photo alpha candidate conditions, never consumer admission',()=>{
 const f=fixture(),beforeP93=new Uint8Array(f.p93RGBA),
  beforeM45=new Uint8Array(f.m45RGBA);
 const result=verifyRealPhotoMaskRenderPair46(f);
 assert.equal(result.originalP93AlphaChanged,12961);
 assert.equal(result.additionalM45AlphaRemoved,4890);
 assert.equal(result.sourceRGBAAllRGBBytesIdentical,true);
 assert.equal(result.sourceWhitePipingPixelRemoval,0);
 assert.equal(result.changedOutsideOriginalVNeckROI,0);
 assert.equal(result.verifiedRendererAnatomyRequiredBoneCount,163);
 assert.equal(result.consumer3DAdmitted,false);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.familyAlpha,'HOLD');
 assert.deepEqual(f.p93RGBA,beforeP93);
 assert.deepEqual(f.m45RGBA,beforeM45);
});
test('M46 refuses forged source/alpha identities, fake signed approval, altered source RGB or alpha growth',()=>{
 const f=fixture();
 for(const k of ['originalJpegSHA256','work47PngSHA256','p93PngSHA256','m45PngSHA256']){
  assert.throws(()=>verifyRealPhotoMaskRenderPair46({...f,[k]:'not-sha'}),/BLOCKED/);
 }
 assert.throws(()=>verifyRealPhotoMaskRenderPair46({...f,sourceMeasure:{
  ...f.sourceMeasure,consumer3DAdmitted:true
 }}),/BLOCKED/);
 const bad=new Uint8Array(f.m45RGBA);bad[3]=0;
 assert.throws(()=>verifyRealPhotoMaskRenderPair46({...f,m45RGBA:bad}),/BLOCKED/);
 const badRgb=new Uint8Array(f.m45RGBA);badRgb[10]=211;
 assert.throws(()=>verifyRealPhotoMaskRenderPair46({...f,m45RGBA:badRgb}),/BLOCKED/);
});
test('M46 permits only in-memory research manifest SHA swaps for the 2 real original cutouts',()=>{
 const f=fixture(),proof=verifyRealPhotoMaskRenderPair46(f);
 const manifest={schema:'work47',rows:[
  {id:'other',sourceSHA256:'0'.repeat(64),cutoutSHA256:'0'.repeat(64)},
  {id:'commons-0053',sourceSHA256:M46_SOURCE.originalJpegSHA256,
   cutoutSHA256:M46_SOURCE.work47PNG_SHA256,hasCutout:true,
   ownerApproved:false,attribution:{license:'CC BY 4.0'}}]};
 const original=JSON.stringify(manifest);
 const p93=makeResearchOnlyRendererMaskManifest46(manifest,{
  pngSHA256:M46_SOURCE.p93PNG_SHA256,variant:'P93',sourcePair:proof});
 const m45=makeResearchOnlyRendererMaskManifest46(manifest,{
  pngSHA256:f.m45PngSHA256,variant:'M45',sourcePair:proof});
 assert.equal(p93.rows[1].cutoutSHA256,M46_SOURCE.p93PNG_SHA256);
 assert.equal(m45.rows[1].cutoutSHA256,f.m45PngSHA256);
 assert.equal(JSON.stringify(manifest),original,'original donor manifest stays unchanged');
 assert.throws(()=>makeResearchOnlyRendererMaskManifest46(manifest,{
  pngSHA256:f.m45PngSHA256,variant:'P93',sourcePair:proof
 }),/BLOCKED/);
 assert.throws(()=>makeResearchOnlyRendererMaskManifest46(manifest,{
  pngSHA256:f.m45PngSHA256,variant:'M45',sourcePair:{...proof,releaseAuthorized:true}
 }),/BLOCKED/);
});
test('M46 never accepts a changed licensed 163-bone rig or claims original invisible back / wearable fit',()=>{
 const f=fixture(),out=verifyRealPhotoMaskRenderPair46(f);
 assert.equal(out.actualOriginalSourceIsFrontOnly,true);
 assert.equal(out.sourceBacksideObserved,false);
 assert.equal(out.noIndependentHumanTextureApproval,true);
 assert.equal(out.photoUVFitNotAutomaticallyMeasured,true);
 assert.equal(out.source2DFallbackRequired,true);
 assert.equal(out.noConsumer3DAdmission,true);
 assert.equal(out.researchOnly,true);
});
