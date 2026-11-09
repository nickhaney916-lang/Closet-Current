import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyDecodedSourceContour191,verifyOwnerSourceTopology191}
 from '../research/owner-source-mask-topology-191/source-contour-integrity.mjs';
const SRC='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const SHA='1'.repeat(64);
const W=96,H=128;
function draw({shrink=0,translate=0,checker=false,islands=false}={}){
 const out=new Uint8ClampedArray(W*H*4);
 for(let y=8;y<H-8;y++){
  const half=22+12*Math.sin(Math.PI*(y-8)/(H-16));
  const left=Math.ceil(W/2-half)+shrink+translate;
  const right=Math.floor(W/2+half)-shrink+translate;
  for(let x=Math.max(0,left);x<=Math.min(W-1,right);x++){
   if(checker&&(x+y*3)%11===0)continue;
   if(islands&&x>W/2-12&&x<W/2+12&&y>H*.45&&y<H*.55)continue;
   const pos=(y*W+x)*4;
   out[pos]=215;out[pos+1]=224;out[pos+2]=213;out[pos+3]=255;
  }
 }
 if(islands){
  // A few disconnected 'garment' islands that are inside the real source.
  for(let y=12;y<17;y++)for(let x=3;x<8;x++){
   const p=(y*W+x)*4;out[p+3]=255;
  }
 }
 return out;
}
const attest=(s,o,overrides={})=>verifyDecodedSourceContour191({
 sourceData:s,ownerData:o,width:W,height:H,
 sourceSHA256:SRC,ownerMaskSHA256:SHA,...overrides});
test('P191 true RGBA near-owner contour matches original source and preserves measured overlap, connectivity and provenance honesty',()=>{
 const p=attest(draw(),draw({shrink:2}));
 assert.equal(p.actualDecodedAlphaConnected191,true);
 assert.equal(p.sourceSHA256,SRC);
 assert.equal(p.ownerMaskSHA256,SHA);
 assert.ok(p.ownerSourceOverlapIoU191>.80);
 assert.ok(p.ownerInsideSourceFraction191>=.965);
 assert.ok(p.ownerLargestComponentRatio191>.98);
 assert.ok(p.registrationRows191>H*.28);
 assert.equal(p.independentHumanReviewVerified,false);
 assert.equal(p.maskSegmentationAccuracyCertified,false);
 assert.equal(p.generalOwnerPhotoGarmentFitting,false);
 assert.equal(p.releaseAuthorized,false);
 assert.equal(p.familyAlpha,'HOLD');
});
test('P191 rejects forged owner-mask/source SHA, original JPEG drift, empty and overfilled alpha',()=>{
 for(const change of [
  {sourceSHA256:'f'.repeat(64)}, {ownerMaskSHA256:'not-a-sha'},
  {ownerMaskSHA256:SRC}, {width:300}, {height:300},
  {sourceData:new Uint8ClampedArray(W*H*4)},
  {ownerData:new Uint8ClampedArray(W*H*4)}
 ]){
  assert.throws(()=>attest(draw(),draw({shrink:2}),change),/P191/);
 }
});
test('P191 rejects identical, discontinuous and implausibly translated source alpha',()=>{
 const src=draw();
 for(const candidate of [
  draw(),draw({shrink:18}),draw({shrink:2,translate:16}),
  draw({shrink:2,checker:true}),draw({shrink:2,islands:true})
 ])assert.throws(()=>attest(src,candidate),/P191/);
});
test('P191 actual source contour readback adapter cannot accept unregistered or cross-origin mask',()=>{
 const orig=globalThis.document;
 const source={naturalWidth:W,naturalHeight:H,pixels:draw()};
 const owner={naturalWidth:W,naturalHeight:H,pixels:draw({shrink:2})};
 globalThis.document={createElement:()=>({
  width:W,height:H,getContext:()=>({
   drawImage(img){this.current=img;},
   getImageData(){return {data:this.current.pixels};}
  })
 })};
 try{
  const p=verifyOwnerSourceTopology191({
   source,owner,sourceSHA256:SRC,ownerMaskSHA256:SHA});
  assert.equal(p.actualDecodedAlphaConnected191,true);
  assert.throws(()=>verifyOwnerSourceTopology191({
   source,owner:{...owner,naturalWidth:W+1},
   sourceSHA256:SRC,ownerMaskSHA256:SHA}),/P191/);
 }finally{
  if(orig===undefined)delete globalThis.document;
  else globalThis.document=orig;
 }
});
test('P191 only passes SHA-grounded connected owner contour to real 163-bone P190, never a claim of independent human review',()=>{
 const alpha=readFileSync('research/owner-reviewed-cutout-texture-188/private-cutout-texture.mjs','utf8');
 const consumer=readFileSync('research/native-consumer-board-04/consumer-board-controller.mjs','utf8');
 const rig=readFileSync('research/owner-mask-geometry-190/owner-alpha-contour.mjs','utf8');
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 const install=readFileSync('scripts/install-owner-source-topology-191.mjs','utf8');
 const browser=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 for(const term of ['verifyOwnerSourceTopology191','ownerMaskTopologyVerified191',
  'topologyProof191.sourceSHA256!==baseProfile190.sourceSHA256'])
  assert.ok(alpha.includes(term),term);
 for(const term of ['photoOwnerTopology191','ownerMaskTopologyRequested191:true',
  'withReviewedCutoutForRenderer188=async(receipt,renderer)=>',
  'withReviewedCutoutForRenderer191=async(receipt,renderer)=>',
  'P191_PRIVATE_ALPHA_TOPOLOGY_REQUEST_NOT_AUTHORIZED_BY_CURRENT_OWNER',
  'P191_EXPLICIT_PRIVATE_ALPHA_TOPOLOGY_REQUIRES_SOURCE_GEOMETRY_AND_OWNER_LEASE'])
  assert.ok(consumer.includes(term),term);
 for(const term of ['ownerMaskTopologyValidated191:','ownerMaskSourceOverlapIoU191:',
  'ownerMaskIndependentHumanReviewed191:false'])
  assert.ok(rig.includes(term),term);
 for(const term of ['photoOwnerTopology191',
  'consumer.withReviewedCutoutForRenderer191(preflightLease187,asset=>',
  'consumer.withReviewedCutoutForRenderer188(preflightLease187,asset=>',
  'sourceMaskTopologyValid191:active',
  'ownerSourceTopologyCallback191:proof=>',
  'verifiedSourceTopology191?.actualDecodedOwnerSourceAlphaTopology191===true',
  'physical?.ownerAlphaMaskBasedPhysicalGeometry190===true',
  'physical.ownerAlphaMaskSHA256_190===verifiedSourceTopology191?.maskSHA256',
  'independentHumanReviewCertified191:false'])
  assert.ok(bridge.includes(term),term);
 for(const term of ['ownerMaskTopologyValidated191:actualOutfit171[k]',
  'ownerSourceTopologyCallback191','sources?.blouse?.ownerSourceMaskTopologyValidated191===true',
  'onlyDetachedResearchDonor:true'])
  assert.ok(install.includes(term),term);
 for(const term of ['PHOTO_OWNER_TOPOLOGY191','sourceMaskTopologyValid191,true',
  'realOriginalSourceAndOwnerAlphaTopology191:true'])
  assert.ok(browser.includes(term),term);
});
