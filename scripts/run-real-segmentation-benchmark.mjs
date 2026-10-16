import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {approvedReferenceMask,scoreApprovedPrediction} from '../benchmark/garment-mask-metrics.mjs';
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const outDir=process.argv[2]||'benchmark/segmentation-predictions';
await mkdir(outDir,{recursive:true});
const server=createServer(async(req,res)=>{if(req.url!=='/outfit-segmentation.mjs'){res.writeHead(404);res.end();return;}res.setHeader('Content-Type','text/javascript');res.end(await readFile('public/outfit-segmentation.mjs'));});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true});
const report=[];
try{
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:'+server.address().port+'/outfit-segmentation.mjs');
 for(const entry of manifest.cases){
  const source=sources.find(s=>s.id===entry.id);
  if(!source||!source.verified||source.sha256!==entry.sourceSha256)throw Error('Source manifest mismatch '+entry.id);
  const imagePath=join('benchmark/photos',entry.image),bytes=await readFile(imagePath);
  if(createHash('sha256').update(bytes).digest('hex')!==entry.sourceSha256)throw Error('Source photo checksum mismatch '+entry.id);
  const base64=bytes.toString('base64');
  const predicted=await page.evaluate(async({base64,imageName,sourceSha256})=>{
   if(!window.__closetSegModel){window.__closetSegModel=(async()=>{const {AutoModelForSemanticSegmentation,AutoProcessor,RawImage,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
   env.allowLocalModels=false;env.useBrowserCache=true;env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;
   const modelId='Xenova/segformer_b0_clothes',revision='a2489ea8e7ec1ee912190546bad31a4906ccca76';
   const processor=await AutoProcessor.from_pretrained(modelId,{revision});
   const model=await AutoModelForSemanticSegmentation.from_pretrained(modelId,{revision,device:'wasm',dtype:'fp32'});
   return {model,processor,RawImage};})();}
   const {model,processor,RawImage}=await window.__closetSegModel;
   const image=await RawImage.read('data:image/jpeg;base64,'+base64);
   const result=await model(await processor(image));
   const {clothingLabelMap}=await import('./outfit-segmentation.mjs');
   const map=clothingLabelMap(result.logits.data,result.logits.dims);
   const garmentClasses=[4,5,6,7,9],width=image.width,height=image.height,mask=new Uint8Array(width*height);
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=Math.min(map.height-1,Math.floor(y*map.height/height))*map.width+Math.min(map.width-1,Math.floor(x*map.width/width));
    mask[y*width+x]=garmentClasses.includes(map.labels[i])?1:0;
   }
   const runs=[];let current=0,count=0;for(const bit of mask){if(bit!==current){runs.push(count);count=0;current=bit;}count++;}runs.push(count);
   const overlay=document.createElement('canvas');overlay.width=width;overlay.height=height;const context=overlay.getContext('2d'),pixels=context.createImageData(width,height);for(let i=0;i<mask.length;i++){pixels.data[i*4]=225;pixels.data[i*4+1]=25;pixels.data[i*4+2]=130;pixels.data[i*4+3]=mask[i]?140:0;}context.putImageData(pixels,0,0);
   return {overlayPng:overlay.toDataURL('image/png').split(',')[1],image:imageName,sourceSha256,width,height,runs,modelId:'Xenova/segformer_b0_clothes',revision:'a2489ea8e7ec1ee912190546bad31a4906ccca76',personDetected:map.personDetected,foregroundPixels:mask.reduce((a,b)=>a+b,0)};
  },{base64,imageName:entry.image,sourceSha256:entry.sourceSha256});
  const {overlayPng,...maskPrediction}=predicted;
  await writeFile(join(outDir,entry.id+'.overlay.png'),Buffer.from(overlayPng,'base64'));
  await writeFile(join(outDir,entry.id+'.prediction.json'),JSON.stringify(maskPrediction,null,2));
  let status='awaiting-human-reference',metrics=null;
  if(entry.referenceMask&&entry.reviewStatus==='approved'){
   const annotation=JSON.parse(await readFile(entry.referenceMask,'utf8'));
   // Scoring requires equal dimensions; never silently rescale a reference.
   approvedReferenceMask(annotation,entry);
   metrics=scoreApprovedPrediction(annotation,entry,predicted);status='scored';
  }
  report.push({id:entry.id,status,foregroundPixels:predicted.foregroundPixels,personDetected:predicted.personDetected,metrics});
  console.log('SEGMENTATION_CASE '+JSON.stringify(report.at(-1)));
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
await writeFile(join(outDir,'summary.json'),JSON.stringify({status:report.every(x=>x.status==='scored')?'scored':'unscored-incomplete-references',cases:report},null,2));
