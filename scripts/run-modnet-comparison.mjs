import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {scoreApprovedPredictionAtReferenceResolution} from '../benchmark/garment-mask-metrics.mjs';
import {thresholdBoundaryReport} from '../benchmark/modnet-boundary-report.mjs';
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const directory=process.argv[2]||'benchmark/modnet-predictions';
await mkdir(directory,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try {
 const page=await browser.newPage();
 await page.goto('https://huggingface.co/');
 for(const item of manifest.cases){
  const source=sources.find(x=>x.id===item.id);
  if(!source||source.sha256!==item.sourceSha256)throw Error('Unverified source: '+item.id);
  const bytes=await readFile(join('benchmark/photos',item.image));
  if(createHash('sha256').update(bytes).digest('hex')!==source.sha256)throw Error('Photo digest mismatch: '+item.id);
  const result=await page.evaluate(async ({base64,image,sha})=>{
   if(!window.__modnet){window.__modnet=(async()=>{
    const lib=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
    lib.env.allowLocalModels=false;lib.env.useBrowserCache=true;lib.env.backends.onnx.wasm.numThreads=1;
    const segmenter=await lib.pipeline('background-removal','Xenova/modnet',{device:'wasm',dtype:'fp32'});
    return {segmenter,RawImage:lib.RawImage};
   })();}
   const {segmenter,RawImage}=await window.__modnet;
   const photo=await RawImage.read('data:image/jpeg;base64,'+base64);
   const out=await segmenter(photo);
   if(!out.length)throw Error('MODNet returned no masks');
   const mask=await out[0].resize(photo.width,photo.height);
   // Background-removal outputs may be RGBA: RGB pixels are colors, NOT a binary mask.
   // Use the alpha channel for RGBA, or the sole channel for grayscale masks.
   if(![1,4].includes(mask.channels))throw Error('Unsupported MODNet output channels: '+mask.channels);
   const maskChannel=mask.channels===4?3:0;
   const canvas=document.createElement('canvas');canvas.width=photo.width;canvas.height=photo.height;
   const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(photo.width,photo.height);
   const runs=[];let previous=0,count=0,foregroundPixels=0,strictPixels=0,borderlinePixels=0;
   const strictCanvas=document.createElement('canvas');strictCanvas.width=photo.width;strictCanvas.height=photo.height;
   const strictCtx=strictCanvas.getContext('2d'),strictData=strictCtx.createImageData(photo.width,photo.height);
   for(let i=0;i<photo.width*photo.height;i++){
    const score=mask.data[i*mask.channels+maskChannel];
    const alpha=score>=128?1:0,strict=score>=192?1:0;
    strictPixels+=strict;borderlinePixels+=score>=128&&score<192?1:0;
    strictData.data[i*4]=225;strictData.data[i*4+1]=25;strictData.data[i*4+2]=130;strictData.data[i*4+3]=strict?140:0;
    foregroundPixels+=alpha;
    if(alpha!==previous){runs.push(count);previous=alpha;count=0;}count++;
    pixels.data[i*4]=225;pixels.data[i*4+1]=25;pixels.data[i*4+2]=130;pixels.data[i*4+3]=alpha?140:0;
   }runs.push(count);ctx.putImageData(pixels,0,0);strictCtx.putImageData(strictData,0,0);
   const boundary=(()=>{let adjacent=0,isolated=0;const val=(i)=>mask.data[i*mask.channels+maskChannel];for(let y=0;y<photo.height;y++)for(let x=0;x<photo.width;x++){const i=y*photo.width+x,v=val(i);if(v<128||v>=192)continue;const neighbors=[x>0?i-1:-1,x+1<photo.width?i+1:-1,y>0?i-photo.width:-1,y+1<photo.height?i+photo.width:-1];if(neighbors.some(n=>n>=0&&val(n)>=192))adjacent++;else isolated++;}return {adjacent,isolated};})();
   return {boundary,strictOverlayPng:strictCanvas.toDataURL('image/png').split(',')[1],strictPixels,borderlinePixels,image,sourceSha256:sha,width:photo.width,height:photo.height,runs,foregroundPixels,overlayPng:canvas.toDataURL('image/png').split(',')[1],model:'Xenova/modnet',maskChannels:mask.channels,maskChannel,status:'experimental-unscored'};
  },{base64:bytes.toString('base64'),image:item.image,sha:source.sha256});
  const {overlayPng,strictOverlayPng,...prediction}=result;
  if(prediction.boundary.adjacent+prediction.boundary.isolated!==prediction.borderlinePixels)throw Error('Threshold boundary count mismatch');
  await writeFile(join(directory,item.id+'.modnet-strict-overlay.png'),Buffer.from(strictOverlayPng,'base64'));
  await writeFile(join(directory,item.id+'.modnet-overlay.png'),Buffer.from(overlayPng,'base64'));
  await writeFile(join(directory,item.id+'.modnet-prediction.json'),JSON.stringify(prediction));
  let metrics=null,status='unscored-no-approved-reference';
  if(item.referenceMask&&item.reviewStatus==='approved'){
   const annotation=JSON.parse(await readFile(item.referenceMask,'utf8'));
   metrics=scoreApprovedPredictionAtReferenceResolution(annotation,item,prediction);
   status='scored';
  }
  results.push({id:item.id,metrics,foregroundPixels:prediction.foregroundPixels,strictPixels:prediction.strictPixels,borderlinePixels:prediction.borderlinePixels,boundary:prediction.boundary,status});
  console.log('MODNET_CASE '+JSON.stringify(results.at(-1)));
 }
}finally{await browser.close();}
await writeFile(join(directory,'summary.json'),JSON.stringify({model:'Xenova/modnet',license:'Apache-2.0 (model card)',notProduction:true,accuracy:results.every(r=>r.status==='scored')?'approved-references-scored':'unavailable-without-approved-reference',results},null,2));
