// Offline experimental benchmark: no app runtime changes, no user photos, no promotion.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {AutoModel,AutoProcessor,RawImage,env} from '@huggingface/transformers';
import sharp from 'sharp';
import {alphaPrediction,sharpSourceCutout} from '../benchmark/object-cutout-mask.mjs';
import {selectHoldoutPhotos,holdoutReport} from '../benchmark/object-cutout-holdout.mjs';

const modelId='onnx-community/BiRefNet_lite-ONNX';
const revision='de15b22ba131738a16dff04aab8bdf8dc32e3ac1';
const output=process.argv[2]||'benchmark/object-cutout-holdout-review';
const rows=JSON.parse(await readFile('benchmark/manifest-fresh-11.json','utf8'));
const originals=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const selected=selectHoldoutPhotos(rows,undefined,originals.cases.map(x=>x.id));
const report=[];
await mkdir(output,{recursive:true});
const writeReport=(status,loadMs)=>writeFile(join(output,'summary.json'),JSON.stringify(
  holdoutReport({cases:report,modelId,revision,loadMs,status}),null,2));
await writeReport('running',null);
env.allowLocalModels=false;
const began=performance.now();
const processor=await AutoProcessor.from_pretrained(modelId,{revision});
const model=await AutoModel.from_pretrained(modelId,{revision,dtype:'fp32',device:'cpu'});
const loadMs=Math.round(performance.now()-began);
try{
  for(const item of selected){
    const path=join('benchmark/photos',item.image);
    const bytes=await readFile(path);
    if(createHash('sha256').update(bytes).digest('hex')!==item.sha256)
      throw Error('Holdout source checksum mismatch: '+item.id);
    const photo=await RawImage.read(path);
    const t=performance.now();
    const inputs=await processor(photo);
    const outputs=await model({input_image:inputs.pixel_values});
    if(!outputs.output_image)throw Error('Missing candidate alpha output: '+item.id);
    const alpha=await RawImage.fromTensor(outputs.output_image[0].sigmoid().mul(255).to('uint8'))
      .resize(photo.width,photo.height);
    if(alpha.channels!==1)throw Error('Invalid candidate alpha channels');
    const inferenceMs=Math.round(performance.now()-t);
    const prediction=alphaPrediction(alpha.data,{
      width:photo.width,height:photo.height,image:item.image,sourceSha256:item.sha256
    });
    const decoded=await sharp(bytes).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
    const {width:w,height:h,channels}=decoded.info;
    if(w!==prediction.width||h!==prediction.height||channels!==3)
      throw Error('Source RGB dimensions do not match alpha for '+item.id);
    const rgba=sharpSourceCutout(decoded.data,prediction);
    const pw=540,ph=Math.round(h*pw/w);
    const panels=[
      await sharp(bytes).resize(pw,ph).png().toBuffer(),
      await sharp(rgba,{raw:{width:w,height:h,channels:4}})
        .flatten({background:'#eee9f3'}).resize(pw,ph).png().toBuffer()
    ];
    const heading=Buffer.from('<svg width="1080" height="70" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="70" fill="white"/><g fill="#222" font-family="sans-serif" font-size="20"><text x="10" y="28">Verified original</text><text x="550" y="28">Experimental BiRefNet Lite cutout</text></g><text x="10" y="55" font-size="15" fill="#444">Not measured accuracy · native source RGB retained · independent human review required</text></svg>');
    await sharp({create:{width:pw*2,height:ph+70,channels:3,background:'white'}})
      .composite([{input:heading,left:0,top:0},...panels.map((input,i)=>({input,left:pw*i,top:70}))])
      .png().toFile(join(output,item.id+'-holdout-review.png'));
    await sharp(alpha.data,{raw:{width:w,height:h,channels:1}})
      .png().toFile(join(output,item.id+'-candidate-alpha.png'));
    await writeFile(join(output,item.id+'.candidate.json'),JSON.stringify({
      ...prediction,modelId,revision,experimental:true,approved:false
    }));
    report.push({id:item.id,expectedCategory:item.expectedCategory,expectedType:item.expectedType,
      sourceSha256:item.sha256,source:item.attribution.source,license:item.attribution.license,
      width:w,height:h,inferenceMs,foregroundPixels:prediction.foregroundPixels,
      measuredAccuracy:false,independentlyApproved:false});
    await writeReport(report.length===selected.length?'complete':'running',loadMs);
    console.log('CUTOUT_HOLDOUT '+JSON.stringify(report.at(-1)));
  }
}finally{
  await model.dispose();
}
