import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SKIRT_SOURCE89,attestActualSkirt89,sourceSkirtOutline89,
 buildOriginalPhotoSkirtProposal89,sourceSkirtBandTextureV89} from '../research/parallel89/skirt-source3d89.mjs';

const file=readFileSync(new URL('../benchmark/fixtures/commons-0043.jpg',import.meta.url));
const dress=readFileSync(new URL('../benchmark/fixtures/commons-0053.jpg',import.meta.url));
const manifest=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
const lock=manifest.find(x=>x.id==='commons-0043');
const provisional={id:'commons-0043',sourceSHA256:SKIRT_SOURCE89.originalSHA256,
 cutoutSHA256:'f'.repeat(64),decision:'REVIEW',hasCutout:true,ownerApproved:false};
const png=Buffer.from('89504e470d0a1a0a'+('00'.repeat(1000)),'hex');
async function blocked(input){const v=await attestActualSkirt89({originalBytes:file,cutoutBytes:png,
 lock,work47:provisional,...input});assert.equal(v.status,'ORIGINAL_SKIRT_PHOTO_2D_REQUIRED');
 assert.equal(v.releaseAuthorized,false);return v;}
test('source skirt is independent from licensed Commons dress even if both have lower fabric',async()=>{
 assert.notEqual(SKIRT_SOURCE89.originalSHA256,
  'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019');
 assert.equal(SKIRT_SOURCE89.id,'commons-0043');
 assert.equal(SKIRT_SOURCE89.license,'CC0');
 assert.equal(SKIRT_SOURCE89.independentOriginalPhotographedSkirt,true);
 assert.equal(SKIRT_SOURCE89.reconstructedFromDress,false);
 assert.equal((await blocked({originalBytes:dress})).reason,'authentic-original-skirt-jpeg-sha-required');
});
test('no invented alpha, rights, owner confirmation, or zero-length JPEG can produce a research skirt receipt',async()=>{
 assert.equal((await blocked({})).reason,'exact-source-skirt-review-alpha-sha-required');
 for(const input of [
  {work47:{...provisional,decision:'APPROVED'}},
  {work47:{...provisional,ownerApproved:true}},
  {work47:{...provisional,cutoutSHA256:'not-a-sha'}},
  {lock:{...lock,attribution:{...lock.attribution,license:'proprietary'}}},
  {lock:{...lock,sha256:'0'.repeat(64)}},
  {lock:{...lock,id:'commons-0053'}},
  {originalBytes:undefined},{cutoutBytes:undefined}
 ])await blocked(input);
});
function sourceAlpha(){
 const width=64,height=96,alpha=new Uint8Array(width*height);
 for(let y=10;y<=84;y++){
  const frac=(y-10)/74,half=Math.round(9+frac*16);
  for(let x=32-half;x<=32+half;x++)alpha[y*width+x]=255;
 }
 return {alpha,width,height};
}
test('provisional observed skirt source rows preserve bounded true mask taper and image crop',()=>{
 const c=sourceAlpha(),o=sourceSkirtOutline89(c);
 assert.equal(o.schema,'P89-source-measured-skirt-silhouette/v1');
 assert.equal(o.sourceRowWidths.length,7);
 assert.ok(o.sourceHemToWaistWidthRatio>1.2);
 assert.ok(o.sourceHemToWaistWidthRatio<3.5);
 assert.ok(o.crop.every(x=>x>=0&&x<=1));
 assert.equal(o.photoCameraAngleIndependentlyValidated,false);
 assert.equal(o.maskHumanApproved,false);assert.equal(o.releaseAuthorized,false);
});
test('photographic skirt UV rows follow genuine source mask bands, not uniform proxy rings',()=>{
 const o=sourceSkirtOutline89(sourceAlpha());
 const rows=o.sourceRowWidths.map((band,i)=>sourceSkirtBandTextureV89(o,i));
 for(const [i,row] of rows.entries()){
  const expected=1-o.crop[1]-o.sourceRowWidths[i].p*o.crop[3];
  assert.ok(Math.abs(row-expected)<1e-12);
  assert.ok(row>0&&row<1);
  if(i)assert.ok(rows[i-1]>row,'original image rows should remain ordered');
 }
 assert.notEqual(rows[0],1-o.crop[1],
  'first photographed band is NOT the top of the entire source mask crop');
 assert.notEqual(rows.at(-1),1-o.crop[1]-o.crop[3],
  'last photographed band is NOT the bottom of the entire source mask crop');
 assert.throws(()=>sourceSkirtBandTextureV89(o,-1));
 assert.throws(()=>sourceSkirtBandTextureV89(o,7));
 assert.throws(()=>sourceSkirtBandTextureV89({...o,crop:[0,1,1,1]},0));
});
test('unsegmented background, malformed alpha and tiny image are rejected, not fabricated',()=>{
 const c=sourceAlpha();
 for(const x of [
  {alpha:new Uint8Array(c.width*c.height).fill(255),width:c.width,height:c.height},
  {alpha:new Uint8Array(c.width*c.height),width:c.width,height:c.height},
  {alpha:c.alpha,width:9,height:96},
  {alpha:c.alpha,width:64,height:97},
  {alpha:c.alpha,width:512,height:512}
 ])assert.throws(()=>sourceSkirtOutline89(x));
});
test('forged source receipt and test-only male/female labels can never construct a source-photo 3D wardrobe garment',()=>{
 const o=sourceSkirtOutline89(sourceAlpha());
 const fake=Object.freeze({status:'SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED',
  sourceId:'commons-0043',originalSHA256:SKIRT_SOURCE89.originalSHA256});
 for(const root of [undefined,{isObject3D:true},{}]){
  const candidate=buildOriginalPhotoSkirtProposal89({
   root,receipt:fake,outline:o,cutoutImage:{width:64,height:96}
  });
  assert.equal(candidate.status,'ORIGINAL_SKIRT_PHOTO_2D_REQUIRED');
  assert.equal(candidate.consumer3DAdmitted,false);
  assert.equal(candidate.releaseAuthorized,false);
 }
});
