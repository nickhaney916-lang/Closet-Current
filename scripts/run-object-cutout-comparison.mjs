import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {AutoModel,AutoProcessor,RawImage,env} from '@huggingface/transformers';
import sharp from 'sharp';
import {alphaPrediction,compareCutoutMasks,sharpSourceCutout} from '../benchmark/object-cutout-mask.mjs';

const modelId='onnx-community/BiRefNet_lite-ONNX';
const revision='de15b22ba131738a16dff04aab8bdf8dc32e3ac1';
const output=process.argv[2]||'benchmark/object-cutout-comparison';
await mkdir(output,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const cases=[];
await writeFile(join(output,'summary.json'),JSON.stringify({status:'running',modelId,revision,cases,productionAuthorized:false}));
env.allowLocalModels=false;
const started=performance.now();
const processor=await AutoProcessor.from_pretrained(modelId,{revision});
const model=await AutoModel.from_pretrained(modelId,{revision,dtype:'fp32',device:'cpu'});
const loadMs=Math.round(performance.now()-started);
try{
 for(const entry of manifest.cases){
  const bytes=await readFile(join('benchmark/photos',entry.image));
  if(createHash('sha256').update(bytes).digest('hex')!==entry.sourceSha256)throw Error('Unverified photo '+entry.id);
  const baseline=JSON.parse(await readFile('benchmark/modnet-predictions/'+entry.id+'.modnet-prediction.json','utf8'));
  const photo=await RawImage.read('data:image/jpeg;base64,'+bytes.toString('base64'));
  const inferenceStart=performance.now();
  const inputs=await processor(photo);
  const outputs=await model({input_image:inputs.pixel_values});
  if(!outputs.output_image)throw Error('Expected object alpha logits');
  const alpha=await RawImage.fromTensor(outputs.output_image[0].sigmoid().mul(255).to('uint8')).resize(photo.width,photo.height);
  if(alpha.channels!==1)throw Error('Expected one-channel alpha');
  const inferenceMs=Math.round(performance.now()-inferenceStart);
  const candidate=alphaPrediction(alpha.data,{width:photo.width,height:photo.height,image:entry.image,sourceSha256:entry.sourceSha256});
  const difference=compareCutoutMasks(baseline,candidate);
  const decoded=await sharp(bytes).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
  if(decoded.info.width!==candidate.width||decoded.info.height!==candidate.height||decoded.info.channels!==3)throw Error('RGB source dimensions mismatch');
  const w=candidate.width,h=candidate.height,pw=500,ph=Math.round(h*pw/w),header=76;
  const panels=[await sharp(bytes).resize(pw,ph).png().toBuffer()];
  for(const prediction of [baseline,candidate]){
   const rgba=sharpSourceCutout(decoded.data,prediction);
   panels.push(await sharp(rgba,{raw:{width:w,height:h,channels:4}}).flatten({background:'#eee9f3'}).resize(pw,ph).png().toBuffer());
  }
  const heading=Buffer.from(`<svg width="1500" height="76"><rect width="1500" height="76" fill="white"/><g font-family="sans-serif" fill="#222"><text x="12" y="28" font-size="20">Original</text><text x="512" y="28" font-size="20">Sharp MODNet 128</text><text x="1012" y="28" font-size="20">Sharp BiRefNet Lite 128</text><text x="12" y="56" font-size="15">Experimental model comparison · original RGB · no measured accuracy or production approval</text></g></svg>`);
  await sharp({create:{width:pw*3,height:ph+header,channels:3,background:'white'}}).composite([{input:heading,left:0,top:0},...panels.map((input,i)=>({input,left:i*pw,top:header}))]).png().toFile(join(output,entry.id+'-object-comparison.png'));
  await writeFile(join(output,entry.id+'.candidate.json'),JSON.stringify({...candidate,modelId,revision,experimental:true}));
  await sharp(alpha.data,{raw:{width:w,height:h,channels:1}}).png().toFile(join(output,entry.id+'-alpha.png'));
  cases.push({id:entry.id,width:w,height:h,inferenceMs,foregroundPixels:candidate.foregroundPixels,...difference});
  const summary={status:cases.length===manifest.cases.length?'complete':'running',modelId,revision,loadMs,runtime:'node-cpu-fp32',mobilePerformanceMeasured:false,foregroundThreshold:128,sourceRgbPreserved:true,reviewOnly:true,productionAuthorized:false,cases};
  await writeFile(join(output,'summary.json'),JSON.stringify(summary,null,2));console.log('OBJECT_CUTOUT_CASE '+JSON.stringify(cases.at(-1)));
 }
}finally{await model.dispose();}
