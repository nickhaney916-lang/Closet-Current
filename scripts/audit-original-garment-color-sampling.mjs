// Compare source-RGB color observations, not garment segmentation accuracy.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import Color from '../public/photo-color.js';
import {clothingColorSample} from '../public/outfit-segmentation.mjs';
const directory=process.argv[2]||'benchmark/lip-garment-instance-review';
const summary=JSON.parse(await readFile(join(directory,'summary.json'),'utf8'));
const sources=(await Promise.all(['manifest-visible-legwear-2.json','locked-photo-sources.json','manifest-fresh-11.json'].map(async name=>JSON.parse(await readFile(join('benchmark',name),'utf8'))))).flat();
const rows=[];
for(const item of summary.cases){
 const source=sources.find(x=>x.id===item.id);
 assert.ok(source?.verified&&source.sha256===item.sourceSha256);
 const bytes=await readFile(join('benchmark/photos',source.image));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);
 const {data,info}=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const image={data,width:info.width,height:info.height,channels:info.channels};
 for(const region of item.classCandidates){
  assert.match(region.role,/^[a-z_]+$/);
  const {data:mask,info:mi}=await sharp(join(directory,item.id+'-'+region.role+'-unverified-mask.png')).greyscale().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual([mi.width,mi.height],item.maskDimensions);
  assert.equal(mask.filter(x=>x!==0).length,region.pixels);
  const sample=clothingColorSample(image,{width:mi.width,height:mi.height},{selected:Uint8Array.from(mask,x=>x?1:0),bounds:region.bounds});
  assert.equal(sample.sampledPixels,sample.distinctSourcePixels);
  // Reproduce the former 256-observation stride for the SAME source evidence.
  const legacy=new Uint8ClampedArray(1024),count=Math.min(256,sample.sampledPixels);
  for(let n=0;n<count;n++){
   const i=Math.floor((n+.5)*sample.sampledPixels/count);
   legacy.set(sample.data.subarray(i*4,i*4+4),n*4);
  }
  const baseline=Color.maskedPalette(legacy,16,16);
  const candidate=Color.maskedPalette(sample.data,sample.width,sample.height);
  rows.push({id:item.id,role:region.role,sourceSha256:source.sha256,
   distinctSourceObservations:sample.distinctSourcePixels,baselineObservations:count,
   candidateObservations:sample.sampledPixels,baselinePalette:baseline,candidatePalette:candidate,
   primaryChanged:baseline?.primary!==candidate?.primary,
   confirmationChanged:baseline?.needsConfirmation!==candidate?.needsConfirmation});
 }
}
const report={status:'complete',sourcePhotos:summary.cases.length,regions:rows.length,
 sourceHashesVerified:true,originalsModified:false,modelMasksModified:false,
 observationScope:'Distinct original RGB pixels at model-cell centers, not every full-resolution pixel',
 humanApprovedMasks:false,garmentColorAccuracy:null,segmentationAccuracy:null,
 primaryChanges:rows.filter(x=>x.primaryChanged).length,
 confirmationChanges:rows.filter(x=>x.confirmationChanged).length,cases:rows};
await writeFile(join(directory,'original-color-sampling-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({regions:report.regions,primaryChanges:report.primaryChanges,confirmationChanges:report.confirmationChanges,garmentColorAccuracy:null}));
