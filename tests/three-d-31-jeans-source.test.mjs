import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='benchmark/three-d-31/';
const sha=b=>createHash('sha256').update(b).digest('hex');
test('Original public-domain jeans photograph stays exact and the derived RGBA mask only changes opacity',async()=>{
 const json=JSON.parse(await readFile(base+'metrics.json','utf8'));
 const jpg=await readFile(base+'original-jeans.jpg');
 const png=await readFile(base+'cutout-proposal.png');
 assert.equal(json.originalSHA256,sha(jpg));
 assert.equal(json.cutoutSHA256,sha(png));
 assert.equal(json.originalPreserved,true);
 assert.equal(json.sourceRGBPreserved,true);
 assert.equal(json.ownerApproved,false);
 assert.equal(json.humanVisualApproval,false);
 assert.equal(json.releaseAuthorized,false);
 assert.equal(json.sourceURL,'https://upload.wikimedia.org/wikipedia/commons/5/5a/Jeans.jpg');
 assert.equal(json.sourcePage,'https://commons.wikimedia.org/wiki/File:Jeans.jpg');
 const [o,p]=await Promise.all([sharp(jpg).ensureAlpha().raw().toBuffer({resolveWithObject:true}),sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true})]);
 assert.equal(o.info.width,p.info.width);assert.equal(o.info.height,p.info.height);
 let changed=0,visible=0;
 for(let i=0;i<p.data.length;i+=4){
  const a=p.data[i+3];
  if(a){visible++;for(let k=0;k<3;k++)assert.equal(p.data[i+k],o.data[i+k],'No fake or recolored denim pixels');}
  if(a===0)changed++;
 }
 assert.ok(visible>o.info.width*o.info.height*.18);
 assert.ok(changed>o.info.width*o.info.height*.15);
 assert.ok(json.waistPixels>300&&json.lowerLeftPixels>300&&json.lowerRightPixels>300&&json.separatedLowerCenter>300);
});
test('Original source is not implicitly usable in the existing reviewed pants adapter',async()=>{
 const {PANTS_SOURCE,requireReviewedPhotoPants}=await import('../research/three-d-30/reviewed-photo-pants.mjs');
 const j=JSON.parse(await readFile(base+'metrics.json','utf8'));
 assert.equal(PANTS_SOURCE.id,'commons-0021');
 assert.equal(PANTS_SOURCE.originalBenchmarkMaskAvailable,false);
 assert.throws(()=>requireReviewedPhotoPants({
  id:j.id,type:'pants',sourceSHA256:j.originalSHA256,cutoutSHA256:j.cutoutSHA256,
  originalVerified:true,cutoutVerified:true,visibleSourceRGBPreserved:true,frontOrientationReviewed:true,
  cutout:{width:j.width,height:j.height},cropRect:[0,0,1,1],ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,
  provisional:true
 },{reviewed:true}),/reviewed|cutout/i);
});
