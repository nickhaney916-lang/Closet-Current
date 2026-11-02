import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deriveOriginalPhotoLegWidth17,sourcePhotoCalibratedCalfEase17} from '../research/denim-fit-06/original-photo-leg-width-17.mjs';
import {createPhotoDenimStaticFitter06} from '../research/denim-fit-06/static-source-denim-fit.mjs';
const sha='a'.repeat(64);
const reviewed='commons-public-domain-jeans-2005';
function sample(wider=false){
 const width=128,height=160,data=new Uint8ClampedArray(width*height*4);
 for(let y=8;y<154;y++)for(let x=15;x<112;x++){
  const upper=y<48;const left=x>=15&&x<64,right=x>=64&&x<112;
  const half=y>117?(wider?20:12):16;
  const fabric=upper||(left&&Math.abs(x-41)<half)||(right&&Math.abs(x-86)<half);
  if(fabric)data[(y*width+x)*4+3]=255;
 }
 return {width,height,data,sourceId:reviewed,sourceSHA256:sha,cutoutSHA256:sha};
}
test('W17 original sampled alpha yields distinct real knee and hem widths, no generated pixels',()=>{
 const narrow=deriveOriginalPhotoLegWidth17(sample());
 const wide=deriveOriginalPhotoLegWidth17(sample(true));
 assert.equal(narrow.originalPhotographedCutoutMeasured17,true);
 assert.equal(narrow.syntheticReverseImage,false);
 assert.equal(narrow.sourceSHA256,sha);
 assert.equal(narrow.releaseAuthorized,false);
 assert.ok(wide.originalPhotoWidthRatios17[0]>narrow.originalPhotoWidthRatios17[0]);
 assert.ok(wide.originalPhotoWidthRatios17[1]>narrow.originalPhotoWidthRatios17[1]);
 assert.ok(narrow.kneePixelWidths17.every(x=>x>5));
});
test('W17 rejects untrusted mask, non-source sample, impossible proportions',()=>{
 assert.throws(()=>deriveOriginalPhotoLegWidth17({...sample(),sourceId:'random'}),/SHA-bound/);
 assert.throws(()=>deriveOriginalPhotoLegWidth17({...sample(),sourceSHA256:'x'}),/SHA-bound/);
 assert.throws(()=>deriveOriginalPhotoLegWidth17({...sample(),data:new Uint8ClampedArray(3)}),/SHA-bound/);
 assert.throws(()=>deriveOriginalPhotoLegWidth17({...sample(),data:new Uint8ClampedArray(128*160*4)}),/insufficient/);
});
test('W17 photo-measured gradual cuff width responds to original data, never at hip or knee',()=>{
 for(const ratio of [.26,.6,1.15,2.5]){
  assert.equal(sourcePhotoCalibratedCalfEase17(0,ratio),0);
  assert.equal(sourcePhotoCalibratedCalfEase17(1,ratio),0);
  assert.ok(sourcePhotoCalibratedCalfEase17(.30,ratio)>=.0069);
  assert.ok(sourcePhotoCalibratedCalfEase17(.30,ratio)<=.0180001);
 }
 assert.ok(sourcePhotoCalibratedCalfEase17(.3,1.3)>sourcePhotoCalibratedCalfEase17(.3,.5));
 assert.throws(()=>sourcePhotoCalibratedCalfEase17(.2,NaN),/actual original/);
});
test('W17 is default OFF; requires full P16 original source ancestry and approved mask identity',()=>{
 assert.throws(()=>createPhotoDenimStaticFitter06({}, {},{sourcePhotoWidth17:true}),/W17 photo-measured/);
 assert.throws(()=>createPhotoDenimStaticFitter06({}, {},{
  sourcePosteriorContour16:true,sourcePhotoWidth17:true
 }),/source-SHA approved|W17 photo-measured/);
 const source=readFileSync('research/denim-fit-06/static-source-denim-fit.mjs','utf8');
 for(const field of ['frontJPEGUVRestSkinUnchanged17:true','unseenRearPhotoSynthesized17:false',
 'originalPhotoWidth17?.cutoutSHA256!==pants.stats.cutoutSHA256',
 'originalPhotoWidth17?.sourceSHA256!==pants.stats.sourceSHA256',
 'sourcePhotoWidth17=false','sourcePhotoCalibratedCalfEase17',
 'sourceCutoutLegWidthRatios17','pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'])
  assert.ok(source.includes(field),field);
});
