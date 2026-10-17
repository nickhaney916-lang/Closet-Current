// Separate object-box evidence for garment layers, NEVER pixel masks.
// Download a pinned zero-shot detector for research on GitHub Actions CPU only.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import sharp from 'sharp';
import {pipeline,RawImage,env} from '@huggingface/transformers';
import {validateGarmentDetectionBoxes} from '../benchmark/garment-box-detection-gate.mjs';
const modelId='onnx-community/grounding-dino-tiny-ONNX';
const revision='c1aa0d705bceb7790bb269c3d3c575dfb540205c';
const ids=['commons-0059','commons-0062','commons-0003']; // layered dress; jacket; shirt control
const destination=process.argv[2]||'benchmark/grounded-layer-review';
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const byId=new Map(sources.map(x=>[x.id,x]));
const summary={status:'running',modelId,revision,sourcePhotographsVerified:true,
 imageRegionBoxesOnly:true,physicalGarmentInstancesVerified:false,
 independentPixelMasksAvailable:false,originalsProtected:true,
 phonePerformanceMeasured:false,productionAuthorized:false,cases:[]};
await mkdir(destination,{recursive:true});
const save=()=>writeFile(join(destination,'summary.json'),JSON.stringify(summary,null,2));
await save();
env.allowLocalModels=false;
const time=performance.now();
const detector=await pipeline('zero-shot-object-detection',modelId,{
 revision,device:'cpu',dtype:'q8'
});
summary.modelLoadMs=Math.round(performance.now()-time);
await save();
// Grounding DINO ONNX expects input_ids batch 1. Each category gets its
// own independent inference pass; concatenated prompts can create fake
// text spans such as 'a jacket shirt'. Never label a box using a prompt
// unless the actual decoded model label supports it.
const prompts=['a jacket.','a shirt.','a dress.'];
try{
 for(const id of ids){
  const source=byId.get(id);
  if(!source?.verified||!/^[a-f0-9]{64}$/.test(source.sha256)
      ||!source.attribution?.license||!source.attribution?.source)
   throw Error('Unverified source or missing license '+id);
  const bytes=await readFile(join('benchmark/photos',source.image));
  if(createHash('sha256').update(bytes).digest('hex')!==source.sha256)
   throw Error('Source checksum mismatch '+id);
  const photo=await RawImage.read(join('benchmark/photos',source.image));
  const t=performance.now();
  const predictions=[];
  for(const prompt of prompts){
    const one=await detector(photo,[prompt],{threshold:.12});
    if(!Array.isArray(one))throw Error('Unexpected independent zero-shot result');
    for(const detected of one)predictions.push({...detected,requestedPrompt:prompt});
  }
  const inferenceMs=Math.round(performance.now()-t);
  const report=validateGarmentDetectionBoxes({
   sourceSha256:source.sha256,width:photo.width,height:photo.height,
   detections:predictions,threshold:.12
  });
  const previewWidth=720,previewHeight=Math.round(photo.height*previewWidth/photo.width);
  const left=await sharp(bytes).rotate().resize(previewWidth,previewHeight).png().toBuffer();
  const palette={Tops:'#166E93',Outerwear:'#B34744',Dresses:'#347D4B'};
  const shapes=report.candidates.slice(0,16).map((c,i)=>{
   const b=c.box,sx=previewWidth/photo.width,sy=previewHeight/photo.height;
   const x=Math.max(0,Math.round(b.xmin*sx)),y=Math.max(0,Math.round(b.ymin*sy));
   const w=Math.max(1,Math.round((b.xmax-b.xmin)*sx)),h=Math.max(1,Math.round((b.ymax-b.ymin)*sy));
   const color=palette[c.category];
   return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="none" stroke="'+color+'" stroke-width="3"/>'+
    '<text x="'+x+'" y="'+Math.max(18,y+19)+'" fill="'+color+'" font-family="sans-serif" font-weight="bold" font-size="20">'+
    c.category+' '+c.score.toFixed(2)+'</text>';
  }).join('');
  const overlaySvg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="'+previewWidth+'" height="'+previewHeight+'">'+shapes+'</svg>');
  const overlay=await sharp(left).composite([{input:overlaySvg,left:0,top:0}]).png().toBuffer();
  const header=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="70"><rect width="1440" height="70" fill="white"/><g fill="#222" font-family="sans-serif" font-size="22"><text x="10" y="28">Verified original</text><text x="730" y="28">Experimental object-box proposals</text></g><text x="10" y="54" font-size="17" fill="#666">Boxes are not distinct garment masks; cannot automatically separate, crop, or catalog clothing.</text></svg>');
  await sharp({create:{width:1440,height:previewHeight+70,channels:3,background:'white'}})
   .composite([{input:header,left:0,top:0},{input:left,left:0,top:70},{input:overlay,left:720,top:70}])
   .png().toFile(join(destination,id+'-object-box-review.png'));
  const result={id,sourceSha256:source.sha256,license:source.attribution.license,
   source:source.attribution.source,width:photo.width,height:photo.height,
   inferenceMs,rawDetections:predictions,review:report,unverifiedGarmentCount:0,
   autoCreatedItems:0,sourcePhotoPreserved:true};
  summary.cases.push(result);await save();
  console.log('LAYER_BOX_CASE '+JSON.stringify({
   id,inferenceMs,candidates:report.candidates.map(x=>({label:x.label,score:x.score,category:x.category,
     box:x.box})),rejected:report.rejected,conflicts:report.conflicts,
   potentialDressJacketPair:report.layerPairProposed,autoCreatedItems:0
  }));
 }
 summary.status='complete';await save();
}finally{
 if(typeof detector.dispose==='function')await detector.dispose();
}
