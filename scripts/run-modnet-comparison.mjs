import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {chromium} from 'playwright';
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
   const canvas=document.createElement('canvas');canvas.width=photo.width;canvas.height=photo.height;
   const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(photo.width,photo.height);
   const runs=[];let previous=0,count=0,foregroundPixels=0;
   for(let i=0;i<photo.width*photo.height;i++){
    const alpha=mask.data[i*mask.channels]>=128?1:0;
    foregroundPixels+=alpha;
    if(alpha!==previous){runs.push(count);previous=alpha;count=0;}count++;
    pixels.data[i*4]=225;pixels.data[i*4+1]=25;pixels.data[i*4+2]=130;pixels.data[i*4+3]=alpha?140:0;
   }runs.push(count);ctx.putImageData(pixels,0,0);
   return {image,sourceSha256:sha,width:photo.width,height:photo.height,runs,foregroundPixels,overlayPng:canvas.toDataURL('image/png').split(',')[1],model:'Xenova/modnet',status:'experimental-unscored'};
  },{base64:bytes.toString('base64'),image:item.image,sha:source.sha256});
  const {overlayPng,...prediction}=result;
  await writeFile(join(directory,item.id+'.modnet-overlay.png'),Buffer.from(overlayPng,'base64'));
  await writeFile(join(directory,item.id+'.modnet-prediction.json'),JSON.stringify(prediction));
  results.push({id:item.id,foregroundPixels:prediction.foregroundPixels,status:'unscored-no-approved-reference'});
  console.log('MODNET_CASE '+JSON.stringify(results.at(-1)));
 }
}finally{await browser.close();}
await writeFile(join(directory,'summary.json'),JSON.stringify({model:'Xenova/modnet',license:'Apache-2.0 (model card)',notProduction:true,accuracy:'unavailable-without-approved-reference',results},null,2));
