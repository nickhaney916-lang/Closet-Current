import test from 'node:test';
import assert from 'node:assert/strict';
import {applyUnverifiedSourceAnnotations43,M43_SOURCE} from
 '../research/main1054-mask43/source-annotation-contract.mjs';

const W=M43_SOURCE.width,H=M43_SOURCE.height;
const sourceRGBA=new Uint8Array(W*H*4),baselineRGBA=new Uint8Array(W*H*4);
for(let p=0;p<W*H;p++){
 const i=p*4,x=p%W,y=Math.floor(p/W);
 sourceRGBA.set([24,20,28,255],i);
 baselineRGBA.set([24,20,28,
  x>=750&&x<=1250&&y>=500&&y<=1750?255:0],i);
}
function add(x,y,r,g,b){
 const i=(y*W+x)*4;
 sourceRGBA.set([r,g,b,255],i);baselineRGBA.set([r,g,b,255],i);
}
for(let y=530;y<540;y++)for(let x=900;x<910;x++)add(x,y,170,148,129);
for(let y=531;y<535;y++)add(898,y,170,147,128);
for(let y=530;y<540;y++)add(910,y,245,245,245);
for(let y=530;y<540;y++)add(911,y,170,147,128);
const p93RGBA=new Uint8Array(baselineRGBA);
for(let y=530;y<540;y++)for(let x=900;x<910;x++)
 p93RGBA[(y*W+x)*4+3]=0;
const patch=(changes)=>({
 schema:M43_SOURCE.patchSchema,sourceId:M43_SOURCE.sourceId,
 sourceJpegSHA256:M43_SOURCE.originalJpegSHA256,
 baselinePngSHA256:M43_SOURCE.baselinePngSHA256,
 p93ProposalSHA256:M43_SOURCE.p93ProposalSHA256,
 dimensions:[W,H],changes,notes:'Synthetic source annotation for test only.',
 reviewerIdentityIndependentlyVerified:false,
 independentHumanReviewAccepted:false,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD',
 recordKind:'LOCAL_UNVERIFIED_SOURCE_PIXEL_ANNOTATIONS'
});
const fixture=(changes)=>({
 patch:patch(changes),sourceRGBA,baselineRGBA,p93RGBA,width:W,height:H
});
test('M43 manual source-specific restore and remove create only unapproved original RGB-preserving proposal',()=>{
 const a=fixture([{x:902,y:533,operation:'restore'},
  {x:898,y:532,operation:'remove'}]);
 const beforeSource=sourceRGBA[(533*W+902)*4+1],
  beforeP93=p93RGBA[(533*W+902)*4+3];
 const {candidateRGBA,receipt}=applyUnverifiedSourceAnnotations43(a);
 assert.equal(candidateRGBA[(533*W+902)*4+3],255);
 assert.equal(candidateRGBA[(532*W+898)*4+3],0);
 assert.equal(p93RGBA[(533*W+902)*4+3],beforeP93);
 assert.equal(sourceRGBA[(533*W+902)*4+1],beforeSource);
 assert.equal(receipt.manuallyRemovedPixels,1);
 assert.equal(receipt.p93PixelsRestoredFromOriginalBaseline,1);
 assert.equal(receipt.originalRGBChangedPixels,0);
 assert.equal(receipt.alphaAboveOriginalBaseline,0);
 assert.equal(receipt.independentHumanReviewAccepted,false);
 assert.equal(receipt.consumer3DAdmitted,false);
 assert.equal(receipt.releaseAuthorized,false);
 assert.equal(receipt.familyAlpha,'HOLD');
});
test('M43 refuses forged source SHA, fake reviewer approval and 3D authorization',()=>{
 const base=fixture([{x:902,y:533,operation:'restore'}]);
 for(const key of ['sourceJpegSHA256','baselinePngSHA256','p93ProposalSHA256'])
  assert.throws(()=>applyUnverifiedSourceAnnotations43({
   ...base,patch:{...base.patch,[key]:'a'.repeat(64)}
  }),/M43 HUMAN ANNOTATION SOURCE BLOCKED/);
 for(const key of ['independentHumanReviewAccepted',
  'reviewerIdentityIndependentlyVerified','releaseAuthorized','consumer3DAdmitted'])
  assert.throws(()=>applyUnverifiedSourceAnnotations43({
   ...base,patch:{...base.patch,[key]:true}
  }),/BLOCKED/);
});
test('M43 refuses protected original white piping or adjacent bright-fabric erasure',()=>{
 assert.throws(()=>applyUnverifiedSourceAnnotations43(fixture([
  {x:911,y:533,operation:'remove'}
 ])),/near-white/);
});
test('M43 refuses unrelated source alpha erasure, off-garment or non-P93 restoration',()=>{
 for(const p of [
  {x:770,y:550,operation:'remove'},
  {x:800,y:1600,operation:'remove'},
  {x:898,y:532,operation:'restore'}
 ]){
  assert.throws(()=>applyUnverifiedSourceAnnotations43(fixture([p])),/BLOCKED/);
 }
});
test('M43 rejects ambiguous duplicate, improper coordinates and unbounded patches',()=>{
 assert.throws(()=>applyUnverifiedSourceAnnotations43(fixture([
  {x:902,y:533,operation:'restore'},
  {x:902,y:533,operation:'remove'}
 ])),/duplicate/);
 for(const c of [
  {x:-1,y:535,operation:'restore'},
  {x:900.5,y:533,operation:'restore'},
  {x:901,y:531,operation:'grant3D'}
 ])assert.throws(()=>applyUnverifiedSourceAnnotations43(fixture([c])),/BLOCKED/);
 const many=Array.from({length:2501},(_,i)=>({
  x:i%W,y:530,operation:'restore'
 }));
 assert.throws(()=>applyUnverifiedSourceAnnotations43(fixture(many)),/bounded annotated pixel/);
});
test('M43 rejects RGB-mismatched baseline and original source data, preserves M41 source checks',()=>{
 const b=new Uint8Array(baselineRGBA);
 b[(533*W+902)*4+1]=200;
 assert.throws(()=>applyUnverifiedSourceAnnotations43({
  ...fixture([{x:902,y:533,operation:'restore'}]),baselineRGBA:b
 }),/BLOCKED/);
});
test('M43 cannot manufacture an approved source/3D result from a manual or synthetic mark',()=>{
 const r=applyUnverifiedSourceAnnotations43(fixture([
  {x:902,y:533,operation:'restore'}
 ])).receipt;
 assert.equal(r.status,'UNVERIFIED_PERSON_ANNOTATED_ALPHA_ONLY_NOT_FOR_3D');
 assert.equal(r.syntheticClickTestsAreNotRealHumanAcceptance,true);
 assert.equal(r.acceptedOriginalPhotoSegmentation,false);
 assert.equal(r.acceptedPhotoDerived3D,false);
});
