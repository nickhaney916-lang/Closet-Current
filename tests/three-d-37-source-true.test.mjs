import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {PANTS_RESEARCH_SOURCE,PANTS_RESEARCH_SOURCE_SECOND,requireReviewedPhotoPants} from '../research/three-d-30/reviewed-photo-pants.mjs';
const digest=b=>createHash('sha256').update(b).digest('hex');
const base='benchmark/three-d-37/';
let metrics;
const load=async()=>metrics??=JSON.parse(await readFile(base+'metrics.json','utf8'));
test('Genuinely second independent original jeans photograph: bytes, author, license, source orientation',async()=>{
 const m=await load(),original=await readFile(base+'original-denimjeans2.jpg'),alpha=await readFile(base+'cutout-proposal.png');
 assert.equal(digest(original),m.originalSHA256);
 assert.equal(digest(alpha),m.cutoutSHA256);
 assert.equal(m.originalSHA256,PANTS_RESEARCH_SOURCE_SECOND.originalSHA256);
 assert.equal(m.cutoutSHA256,PANTS_RESEARCH_SOURCE_SECOND.cutoutSHA256);
 assert.notEqual(m.originalSHA256,PANTS_RESEARCH_SOURCE.originalSHA256,'Must not be same original jeans image');
 assert.notEqual(m.cutoutSHA256,PANTS_RESEARCH_SOURCE.cutoutSHA256,'Must not be repackaged source photo');
 assert.equal(m.sourcePage,'https://commons.wikimedia.org/wiki/File:Denimjeans2.JPG');
 assert.equal(m.license,'CC BY-SA 4.0');
 assert.match(m.author,/Manda\.L\.Isch/);
 assert.match(m.author,/Petru Dimitriu/);
 assert.equal(m.sourceRGBPreserved,true);
 assert.equal(m.originalBytesUnmodified,true);
 assert.equal(m.imageOrientation,'laid-flat-front');
 assert.equal(m.maskStatus,'REVIEW');
 assert.equal(m.ownerApproved,false);assert.equal(m.releaseAuthorized,false);assert.equal(m.humanVisualApproval,false);
 assert.equal(m.width,1754);assert.equal(m.height,2838);
 assert.ok(m.visibleRatio>.35&&m.visibleRatio<.70);
 assert.ok(m.bbox[0]>0&&m.bbox[2]<m.width-1,'No background contamination reaching photograph outer image borders');
 assert.ok(m.waistPixels>20000&&m.leftLowerPixels>15000&&m.rightLowerPixels>15000&&m.lowerGapPixels>15000);
});
test('ALL visible RGB preserved from original JPEG; only cutout alpha modified',async()=>{
 const [jpg,png]=await Promise.all([readFile(base+'original-denimjeans2.jpg'),readFile(base+'cutout-proposal.png')]);
 const [orig,deriv]=await Promise.all([sharp(jpg).ensureAlpha().raw().toBuffer({resolveWithObject:true}),sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true})]);
 assert.equal(orig.info.width,deriv.info.width);assert.equal(orig.info.height,deriv.info.height);
 let visible=0,transparent=0,fail=0;
 for(let i=0;i<deriv.data.length;i+=4){
  const a=deriv.data[i+3];
  if(a){visible++;for(let k=0;k<3;k++)if(deriv.data[i+k]!==orig.data[i+k])fail++;}
  else transparent++;
 }
 assert.equal(fail,0,'No visible invented/changed material pixels');
 assert.ok(visible>1000000&&transparent>900000);
});
test('Second source rejected unless its SHA pinned and explicit provisional human review supplied',async()=>{
 const m=await load();
 const valid={id:PANTS_RESEARCH_SOURCE_SECOND.id,type:'pants',
  sourceSHA256:m.originalSHA256,cutoutSHA256:m.cutoutSHA256,
  originalVerified:true,cutoutVerified:true,sourceAssetsVerified:true,
  visibleSourceRGBPreserved:true,frontOrientationReviewed:true,
  cutout:{width:m.width,height:m.height},cropRect:[.05,.05,.90,.90],
  neutralColorRGB:m.sourceDerivedNeutralColor,ownerApproved:false,
  humanVisualApproval:false,releaseAuthorized:false,provisional:true};
 assert.throws(()=>requireReviewedPhotoPants(valid,{reviewed:false}),/reviewed|cutout/);
 assert.throws(()=>requireReviewedPhotoPants({...valid,sourceSHA256:PANTS_RESEARCH_SOURCE.originalSHA256},{reviewed:true}),/reviewed|cutout/);
 assert.throws(()=>requireReviewedPhotoPants({...valid,cutoutVerified:false},{reviewed:true}),/reviewed|cutout/);
 assert.throws(()=>requireReviewedPhotoPants({...valid,ownerApproved:true},{reviewed:true}),/reviewed|cutout/);
 assert.equal(requireReviewedPhotoPants(valid,{reviewed:true}).id,PANTS_RESEARCH_SOURCE_SECOND.id);
});
