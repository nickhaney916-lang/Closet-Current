// Experimental garment-class masks on seven already-licensed, hash-verified photos.
// No user photographs, deployed runtime, or visual results are treated as ground truth.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {AutoModelForSemanticSegmentation,AutoProcessor,RawImage,env} from '@huggingface/transformers';
import sharp from 'sharp';
import {clothingLabelMap} from '../public/outfit-segmentation.mjs';
import {selectHoldoutPhotos} from '../benchmark/object-cutout-holdout.mjs';
import {selectedCategoryMask,nativeCategoryAlpha,assessGarmentOnlyComparison} from '../benchmark/clothing-only-comparison.mjs';

const MODELS=[
  {name:'existing-b0',id:'Xenova/segformer_b0_clothes',revision:'a2489ea8e7ec1ee912190546bad31a4906ccca76',dtype:'fp32'},
  {name:'candidate-b2',id:'Xenova/segformer_b2_clothes',revision:'cb6ac44e641faa309f29561c1afe08d87ef52631',dtype:'q8'}
];
const output=process.argv[2]||'benchmark/clothing-only-comparison-review';
const sourceRows=JSON.parse(await readFile('benchmark/manifest-fresh-11.json','utf8'));
const originals=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const cases=selectHoldoutPhotos(sourceRows,undefined,originals.cases.map(x=>x.id));
await mkdir(output,{recursive:true});
env.allowLocalModels=false;
const results=new Map(),timings=[];
for(const entry of cases){
  const bytes=await readFile(join('benchmark/photos',entry.image));
  if(createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('Source hash mismatch: '+entry.id);
  results.set(entry.id,{entry,bytes,models:[]});
}
async function writeSummary(status){
  const all=[...results].map(([id,{entry,models}])=>({id,category:entry.expectedCategory,sourceSha256:entry.sha256,
    source:entry.attribution.source,license:entry.attribution.license,models}));
  await writeFile(join(output,'summary.json'),JSON.stringify({
    status,models:MODELS,modelTimings:timings,cases:all,
    assessment:assessGarmentOnlyComparison(all.flatMap(x=>x.models.map(m=>({id:x.id+'/'+m.name,maskDetected:m.maskDetected})))),
    noProductionChange:true,semanticClassMaskNotGroundTruth:true,comparisonOnly:true,
    garmentOnlyVerification:'requires independent pixel masks',
    rawRgbPreserved:true,realPhoneTested:false
  },null,2));
}
await writeSummary('running');
for(const config of MODELS){
  const startLoad=performance.now();
  const processor=await AutoProcessor.from_pretrained(config.id,{revision:config.revision});
  const model=await AutoModelForSemanticSegmentation.from_pretrained(config.id,{
    revision:config.revision,device:'cpu',dtype:config.dtype
  });
  const loadMs=Math.round(performance.now()-startLoad);
  try{
    for(const [id,result] of results){
      const t=performance.now();
      const photo=await RawImage.read(join('benchmark/photos',result.entry.image));
      const inputs=await processor(photo);
      const outputTensor=await model(inputs);
      const map=clothingLabelMap(outputTensor.logits.data,outputTensor.logits.dims);
      const selected=selectedCategoryMask(map,result.entry.expectedCategory);
      const alpha=nativeCategoryAlpha(selected,photo.width,photo.height);
      const inferenceMs=Math.round(performance.now()-t);
      const rgb=await sharp(result.bytes).rotate().removeAlpha().toColourspace('srgb')
        .raw().toBuffer({resolveWithObject:true});
      if(rgb.info.width!==photo.width||rgb.info.height!==photo.height||rgb.info.channels!==3)
        throw Error('RGB mismatch '+id);
      const rgba=new Uint8Array(alpha.length*4);
      for(let i=0;i<alpha.length;i++){
        rgba[i*4]=rgb.data[i*3];rgba[i*4+1]=rgb.data[i*3+1];rgba[i*4+2]=rgb.data[i*3+2];rgba[i*4+3]=alpha[i];
      }
      const panelWidth=420,panelHeight=Math.max(1,Math.round(photo.height*panelWidth/photo.width));
      const composite=await sharp(rgba,{raw:{width:photo.width,height:photo.height,channels:4}})
        .flatten({background:'#eee9f3'}).resize(panelWidth,panelHeight,{kernel:'lanczos3'}).png().toBuffer();
      await writeFile(join(output,id+'-'+config.name+'-cutout.png'),composite);
      await sharp(alpha,{raw:{width:photo.width,height:photo.height,channels:1}})
        .png().toFile(join(output,id+'-'+config.name+'-alpha.png'));
      const datum={name:config.name,id:config.id,revision:config.revision,dtype:config.dtype,
        maskDetected:selected.detected,categoryPixels:selected.foregroundPixels,
        categoryConfidence:selected.meanConfidence,otherGarmentPixels:selected.otherGarmentPixels,
        personDetected:map.personDetected,inferenceMs,maskResolution:[map.width,map.height],
        sourceResolution:[photo.width,photo.height],independentlyApproved:false,
        personOrMannequinExclusionVerified:false,accuracyPercent:null};
      result.models.push(datum);
      console.log('CLOTHING_PART_CASE '+JSON.stringify({photo:id,...datum}));
      await writeSummary('running');
    }
  }finally{
    await model.dispose();
  }
  timings.push({model:config.name,loadMs});
}
for(const [id,result] of results){
  const img=await sharp(result.bytes).rotate().resize(420).png().toBuffer();
  const native=await sharp(result.bytes).rotate().metadata();
  const panelHeight=Math.max(1,Math.round(native.height*420/native.width));
  const caption=Buffer.from('<svg width="1260" height="75" xmlns="http://www.w3.org/2000/svg"><rect width="1260" height="75" fill="white"/><g font-family="sans-serif" font-size="19" fill="#222"><text x="8" y="26">Original</text><text x="428" y="26">Existing B0: clothes only</text><text x="848" y="26">Candidate B2: clothes only</text></g><text x="8" y="55" font-size="14" fill="#555">Experimental category masks; not measured accuracy, human approval or a production change</text></svg>');
  const b=await sharp(img).resize(420,panelHeight).png().toBuffer();
  const second=await readFile(join(output,id+'-existing-b0-cutout.png'));
  const third=await readFile(join(output,id+'-candidate-b2-cutout.png'));
  await sharp({create:{width:1260,height:panelHeight+75,channels:3,background:'white'}})
    .composite([{input:caption,left:0,top:0},{input:b,left:0,top:75},
      {input:second,left:420,top:75},{input:third,left:840,top:75}])
    .png().toFile(join(output,id+'-three-way.png'));
}
await writeSummary('complete');
