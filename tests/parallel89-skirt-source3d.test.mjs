import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SKIRT_SOURCE89,attestActualSkirt89,sourceSkirtOutline89,
 buildOriginalPhotoSkirtProposal89,sourceSkirtBandTextureV89,
 sourceSkirtMeasuredPhotoCenterline89} from '../research/parallel89/skirt-source3d89.mjs';

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
test('separate photographed clothing regions cannot be fused into one fake 3D skirt',()=>{
 const width=64,height=96,alpha=new Uint8Array(width*height);
 // Both panels are individually skirt-sized and occupy every sampled band.
 // A bbox/width-only silhouette mislabels them as one large skirt.
 for(let y=10;y<=84;y++)for(const [start,end] of [[8,22],[41,55]])
  for(let x=start;x<=end;x++)alpha[y*width+x]=255;
 assert.throws(()=>sourceSkirtOutline89({alpha,width,height}),
  /multiple disconnected garment-sized regions/);
 const source=sourceAlpha();
 const unchanged=sourceSkirtOutline89(source);
 source.alpha[40*source.width+4]=255; // isolated foreground dust, not another garment
 const clean=sourceSkirtOutline89(source);
 assert.equal(clean.sourceRowWidths.length,7,
  'small disconnected photo-mask speck must not fabricate a new garment');
 assert.deepEqual(clean.crop,unchanged.crop,
  'detached alpha dust must NOT shift actual photographed skirt UV crop');
 assert.deepEqual(clean.sourceRowWidths,unchanged.sourceRowWidths,
  'detached alpha dust must NOT shift the original fabric pattern alignment');
 assert.equal(clean.pixelForegroundCount,unchanged.pixelForegroundCount,
  'only actual dominant garment pixels can claim photographic source evidence');
 assert.equal(clean.releaseAuthorized,false);
 assert.equal(clean.maskHumanApproved,false);
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

test('source front photo drift from the ORIGINAL mask is used as bounded 7-band centerline evidence',()=>{
 const width=96,height=96,alpha=new Uint8Array(width*height);
 for(let y=10;y<=84;y++){
  const t=(y-10)/74,half=Math.round(13+t*14),center=48+Math.round(t*3);
  for(let x=center-half;x<=center+half;x++)alpha[y*width+x]=255;
 }
 const source=sourceSkirtOutline89({alpha,width,height});
 const proof=sourceSkirtMeasuredPhotoCenterline89(source,.23);
 assert.equal(proof.schema,'P89-attested-original-photo-front-centerline-trial/v1');
 assert.equal(proof.sourceBandCount,7);
 assert.equal(proof.sourceRelativeWorldXOffsetsMeters.length,7);
 assert.equal(proof.sourceRelativeWorldXOffsetsMeters[0],0);
 assert.ok(proof.sourceRelativeWorldXOffsetsMeters.at(-1)>.015,
  'actual photo measured skirt-center skew should not disappear into proxy geometry');
 assert.ok(proof.sourceRelativeWorldXOffsetsMeters.at(-1)<.15);
 const pixelsPerMeter=source.sourceRowWidths[0].widthPixels/(2*.23);
 source.sourceRowWidths.forEach((band,i)=>{
  assert.ok(Math.abs(
   proof.sourceRelativeWorldXOffsetsMeters[i]*pixelsPerMeter-
   (band.centerPixels-source.sourceRowWidths[0].centerPixels))<1e-10);
 });
 assert.equal(proof.rearCenterlineInferredNotPhotographed,true);
 assert.equal(proof.cameraAngleAndPhysicalDrapeUnverified,true);
 assert.equal(proof.originalPhoto2DFallbackRequired,true);
 assert.equal(proof.consumer3DAdmitted,false);
 assert.equal(proof.releaseAuthorized,false);
 assert.ok(Object.isFrozen(proof.sourceRelativeWorldXOffsetsMeters));
});
test('unmeasured or oversized photographed centerline is refused before mesh can imply a physical skew',()=>{
 const source=sourceSkirtOutline89(sourceAlpha());
 for(const input of [
  [{...source,pixelDimensions:[NaN,96]},.23],
  [{...source,sourceRowWidths:[...source.sourceRowWidths.slice(0,6)]},.23],
  [source,.9],
  [{...source,sourceRowWidths:source.sourceRowWidths.map((x,i)=>
    i===6?{...x,centerPixels:x.centerPixels+11}:x)},.23],
  [{...source,sourceRowWidths:source.sourceRowWidths.map((x,i)=>
    i===3?{...x,centerPixels:x.widthPixels/2-10}:x)},.23]
 ])assert.throws(()=>sourceSkirtMeasuredPhotoCenterline89(...input));
});
test('symmetric original photographed skirt stays neutral; source front shift never claims measured rear',()=>{
 const s=sourceSkirtOutline89(sourceAlpha());
 const p=sourceSkirtMeasuredPhotoCenterline89(s,.23);
 assert.ok(p.sourceRelativeWorldXOffsetsMeters.every(x=>x===0));
 assert.equal(p.rearCenterlineInferredNotPhotographed,true);
 assert.equal(p.familyAlpha,'HOLD');
});
