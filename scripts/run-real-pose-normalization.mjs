// Benchmark ONLY: never writes modified clothing items to user accounts.
// Source hash verified; a proposed normalization is not ground-truth accuracy.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import sharp from 'sharp';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{axisPlan}=require('../public/garment-pose-normalizer.js');
const samples=[
 {id:'commons-0035',category:'Bottoms',manifest:'locked'},
 {id:'commons-0065',category:'Outerwear',manifest:'locked'},
 {id:'validation-0017',category:'Bottoms',manifest:'fresh'},
 {id:'validation-0019',category:'Shoes',manifest:'fresh'}
];
const base=process.argv[2]||'benchmark/real-pose-review';
const [locked,fresh]=await Promise.all([
 readFile('benchmark/locked-photo-sources.json','utf8').then(JSON.parse),
 readFile('benchmark/manifest-fresh-11.json','utf8').then(JSON.parse)
]);
const bySource={locked:new Map(locked.map(x=>[x.id,x])),
 fresh:new Map(fresh.map(x=>[x.id,x]))};
await mkdir(base,{recursive:true});
const report={status:'running',sourcePhotosHashVerified:false,photosAreReal:true,
 sourceGarmentPixelGroundTruth:false,normalizationAccuracy:null,
 actualPhoneSpeedMeasured:false,productionQualityApproved:false,
 generatedMissingFabric:false,alteredSavedClothes:0,cases:[]};
const save=()=>writeFile(join(base,'summary.json'),JSON.stringify(report,null,2));
await save();
for(const row of samples){
 const lockedRow=bySource[row.manifest].get(row.id);
 if(!lockedRow?.verified||!/^[a-f0-9]{64}$/.test(lockedRow.sha256)
  ||!lockedRow.attribution?.license||!lockedRow.attribution?.source)
  throw Error('Unverified benchmark photo '+row.id);
 const source=await readFile(join('benchmark/photos',lockedRow.image));
 const sha=createHash('sha256').update(source).digest('hex');
 if(sha!==lockedRow.sha256)throw Error('Checksum mismatch '+row.id);
 const image=sharp(source).rotate(),dimensions=await image.metadata();
 const size=Math.min(1,320/Math.max(dimensions.width,dimensions.height));
 const w=Math.max(30,Math.round(dimensions.width*size));
 const h=Math.max(30,Math.round(dimensions.height*size));
 const {data,info}=await sharp(source).rotate().resize(w,h,{fit:'fill'}).ensureAlpha()
  .raw().toBuffer({resolveWithObject:true});
 const plan=axisPlan(data,info.width,info.height,row.category);
 // Display transformation for visual REVIEW, not proof of better geometry.
 const targetWidth=440,targetHeight=420;
 const orig=await sharp(source).rotate().resize(targetWidth,targetHeight,
   {fit:'contain',background:'#fff'}).png().toBuffer();
 const adjusted=await sharp(source).rotate().rotate(
   plan.action==='rotate-derived-tile'?-plan.rotationDeg:0,{background:'#fff'})
   .resize(targetWidth,targetHeight,{fit:'contain',background:'#fff'}).png().toBuffer();
 const header=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="880" height="58"><rect width="880" height="58" fill="white"/><g font-size="18" fill="#222" font-family="sans-serif"><text x="12" y="23">Source display (unaltered)</text><text x="452" y="23">Proposed straightening (research)</text></g><text x="12" y="47" font-family="sans-serif" font-size="13" fill="#555">Photo identity checked; actual garment accuracy not measured</text></svg>');
 const filename=row.id+'-source-vs-normalized.png';
 await sharp({create:{width:880,height:targetHeight+58,channels:3,background:'#fff'}})
  .composite([{input:header,left:0,top:0},{input:orig,left:0,top:58},
   {input:adjusted,left:440,top:58}]).png().toFile(join(base,filename));
 const result={id:row.id,category:row.category,source:lockedRow.attribution.source,
  sourceSha256:sha,originalSize:[dimensions.width,dimensions.height],
  proposedAction:plan.action,reason:plan.reason,
  proposedDegrees:plan.rotationDeg,sourcePreserved:true,outputNotAutoSaved:true,
  actualIdentityVerifiedByHuman:false,improvedVisualQualityMeasured:false,
  comparisonFile:filename};
 report.cases.push(result);await save();
 console.log('REAL_POSE_CASE '+JSON.stringify({
  id:result.id,category:result.category,action:result.proposedAction,
  reason:result.reason,degrees:result.proposedDegrees
 }));
}
report.sourcePhotosHashVerified=true;report.status='complete';await save();
