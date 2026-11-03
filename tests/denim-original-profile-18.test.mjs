import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deriveOriginalPhotoLegWidth17,sourceMeasuredLegRelief18} from '../research/denim-fit-06/original-photo-leg-width-17.mjs';
import {createPhotoDenimStaticFitter06} from '../research/denim-fit-06/static-source-denim-fit.mjs';

test('P18 original source five measured alpha stations preserve both leg identities and SHA',()=>{
 const width=128,height=160,arr=new Uint8ClampedArray(width*height*4);
 for(let y=5;y<155;y++){
  const half=y>130?17:y>108?14:y>87?19:y>62?15:26;
  for(let x=0;x<width;x++){
   if((y<54&&x>17&&x<108)||(y>=54&&(Math.abs(x-41)<half||Math.abs(x-88)<half)))
    arr[(y*width+x)*4+3]=255;
  }
 }
 const p=deriveOriginalPhotoLegWidth17({data:arr,width,height,
  sourceId:'commons-public-domain-jeans-2005',sourceSHA256:'a'.repeat(64),cutoutSHA256:'b'.repeat(64)});
 assert.equal(p.sourceMeasuredLegProfiles18,true);
 assert.equal(p.originalPhotoCalfProfileStations18.length,2);
 assert.equal(p.originalPhotoCalfProfileStations18[0].length,5);
 assert.equal(p.originalPhotoCalfProfileStations18[1].length,5);
 assert.equal(p.originalPhotoCalfFractions18.length,5);
 assert.equal(p.originalPhotoCalfProfileStations18[0][0],1);
 assert.ok(p.originalPhotoCalfProfileStations18.every(a=>a.every(n=>n>=.26&&n<=2.5)));
 assert.equal(p.syntheticReverseImage,false);
 assert.equal(p.releaseAuthorized,false);
});
test('P18 source-derived drape has truthful bounded broad profile with unchanged hip/knee edges',()=>{
 const narrow=[1,.92,.89,.93,.95],flared=[1,1.05,1.15,1.35,1.5];
 for(const profile of [narrow,flared]){
  assert.equal(sourceMeasuredLegRelief18(0,profile),0);
  assert.equal(sourceMeasuredLegRelief18(1,profile),0);
  assert.ok(sourceMeasuredLegRelief18(.44,profile)>.004);
  assert.ok(sourceMeasuredLegRelief18(.44,profile)<=.018);
 }
 assert.ok(sourceMeasuredLegRelief18(.44,flared)>sourceMeasuredLegRelief18(.44,narrow));
 for(const p of [-.01,1.1,NaN])assert.throws(()=>sourceMeasuredLegRelief18(p,narrow),/five finite/);
 for(const profile of [[1,.8],[0,.8,.8,.8,.8],[1,NaN,.8,.8,.8],[1,1,1,1,3]])
  assert.throws(()=>sourceMeasuredLegRelief18(.4,profile),/five finite/);
});
test('P18 default off and requires exact verified W17; original JPEG, UV/rest/skin and identity fail-closed',()=>{
 assert.throws(()=>createPhotoDenimStaticFitter06({}, {},{sourcePhotoProfile18:true}),/P18 requires/);
 const code=readFileSync('research/denim-fit-06/static-source-denim-fit.mjs','utf8');
 for(const value of ['sourcePhotoProfile18=false','originalPhotoWidth17.sourceMeasuredLegProfiles18',
  'sourceMeasuredLegRelief18','photographedCalfProfileMovedVertices18',
  'originalFrontSHAUVRestAndSkinProtected18:true','noUnphotographedRearTexture18:true',
  'pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight',
  'originalPhotoWidth17?.sourceSHA256!==pants.stats.sourceSHA256',
  'originalPhotoWidth17?.cutoutSHA256!==pants.stats.cutoutSHA256'])
  assert.ok(code.includes(value),'missing '+value);
 const app=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8');
 assert.ok(app.includes("get('denimProfile18')==='after'"));
 assert.ok(app.includes('proof.photographedCalfProfileMaxShiftMeters18>.0180001'));
});
