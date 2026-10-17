// Experimental real-photo expanded clothing/outfit masks. Never runs in production.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import sharp from 'sharp';
import {AutoProcessor,AutoModel,AutoModelForSemanticSegmentation,RawImage,env} from '@huggingface/transformers';
import {clothingLabelMap} from '../public/outfit-segmentation.mjs';
import {protectedBodyFromLogits,hybridGarmentAlpha} from '../benchmark/hybrid-garment-mask.mjs';
import {partitionOutfitClothing} from '../benchmark/multilayer-outfit-evaluation.mjs';
import {evaluateMultiGarmentReview} from '../benchmark/multilayer-review-safety.mjs';

const root=process.argv[2]||'benchmark/expanded-outfit-review';
const manifest=JSON.parse(await readFile('benchmark/expanded-outfit-review-manifest.json','utf8'));
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const fresh=JSON.parse(await readFile('benchmark/manifest-fresh-11.json','utf8'));
const sourceMap=new Map([...sources,...fresh].map(s=>[s.id,s]));
const previouslyTested=new Set(['commons-0035','commons-0049','commons-0053','commons-0065','commons-0079','commons-0094']);
if(manifest.length!==8||new Set(manifest.map(s=>s.id)).size!==8)throw Error('Expected eight distinct real source cases');
const candidates=manifest.map(row=>{
  const s=sourceMap.get(row.id);
  if(!s||previouslyTested.has(row.id)||!s.verified||!/^[a-f0-9]{64}$/.test(s.sha256)
     ||!Array.isArray(row.expected)||!row.expected.length
     ||row.expected.some(e=>!['Tops','Outerwear','Skirt','Dresses','Pants','Shoes'].includes(e))
     ||!s.attribution?.license||!s.attribution?.source)throw Error('Unverified or unsupported expanded case '+row.id);
  return {...row,source:s};
});
const models={
  semantic:{id:'Xenova/segformer_b0_clothes',revision:'a2489ea8e7ec1ee912190546bad31a4906ccca76'},
  object:{id:'onnx-community/BiRefNet_lite-ONNX',revision:'de15b22ba131738a16dff04aab8bdf8dc32e3ac1'}
};
const report={status:'running',experiment:'multi-garment-category-masks-and-hybrid',
  productionAuthorized:false,reviewOnly:true,realMobilePerformanceMeasured:false,
  independentlyApprovedMasks:false,measuredPixelAccuracy:false,
  originalRgbProtected:true,sourcesLicensed:true,models,cases:[]};
await mkdir(root,{recursive:true});
const save=()=>writeFile(join(root,'summary.json'),JSON.stringify(report,null,2));
await save();
env.allowLocalModels=false;
const started=performance.now();
const [semanticProcessor,objectProcessor]=await Promise.all([
  AutoProcessor.from_pretrained(models.semantic.id,{revision:models.semantic.revision}),
  AutoProcessor.from_pretrained(models.object.id,{revision:models.object.revision})
]);
const [semanticModel,objectModel]=await Promise.all([
  AutoModelForSemanticSegmentation.from_pretrained(models.semantic.id,{
    revision:models.semantic.revision,device:'cpu',dtype:'fp32'
  }),
  AutoModel.from_pretrained(models.object.id,{
    revision:models.object.revision,device:'cpu',dtype:'fp32'
  })
]);
report.modelLoadMs=Math.round(performance.now()-started);
await save();
try{
  for(const entry of candidates){
    const path=join('benchmark/photos',entry.source.image),bytes=await readFile(path);
    if(createHash('sha256').update(bytes).digest('hex')!==entry.source.sha256)
      throw Error('Changed source photo: '+entry.id);
    const photo=await RawImage.read(path);
    const semStart=performance.now();
    const out=await semanticModel(await semanticProcessor(photo));
    const semanticMs=Math.round(performance.now()-semStart);
    const map=clothingLabelMap(out.logits.data,out.logits.dims);
    const body=protectedBodyFromLogits(out.logits.data,out.logits.dims);
    const partition=partitionOutfitClothing(map,{minimumPixels:12,expected:entry.expected});
    const objectStart=performance.now();
    const result=await objectModel({input_image:(await objectProcessor(photo)).pixel_values});
    if(!result.output_image)throw Error('Missing object alpha '+entry.id);
    const object=await RawImage.fromTensor(result.output_image[0].sigmoid().mul(255).to('uint8'))
      .resize(photo.width,photo.height);
    if(object.channels!==1)throw Error('Expected grayscale object alpha '+entry.id);
    const objectMs=Math.round(performance.now()-objectStart);
    const {data:rgb,info}=await sharp(bytes).removeAlpha().toColourspace('srgb')
      .raw().toBuffer({resolveWithObject:true});
    const w=photo.width,h=photo.height;
    if(info.width!==w||info.height!==h||info.channels!==3)throw Error('Original RGB alignment failed');
    const panelWidth=420,panelHeight=Math.max(1,Math.round(h*panelWidth/w));
    const original=await sharp(bytes).resize(panelWidth,panelHeight).png().toBuffer();
    const makePanel=async alpha=>{
      const rgba=new Uint8Array(w*h*4);
      for(let i=0;i<w*h;i++){
        rgba[i*4]=rgb[i*3];rgba[i*4+1]=rgb[i*3+1];rgba[i*4+2]=rgb[i*3+2];
        rgba[i*4+3]=alpha[i]>=128?255:0;
      }
      return sharp(rgba,{raw:{width:w,height:h,channels:4}})
        .flatten({background:'#e9e9ef'}).resize(panelWidth,panelHeight).png().toBuffer();
    };
    const objectView=await makePanel(object.data);
    const emitted=[];
    for(const part of partition.parts){
      const hybrid=hybridGarmentAlpha(object.data,w,h,map,part.category,{
        protectedBody:body,haloCells:2,minSemanticPixels:12
      });
      const cutout=await makePanel(hybrid.alpha);
      const safeName=part.slot.replace(/[^a-z0-9-]/g,'');
      const title=Buffer.from('<svg width="1260" height="74" xmlns="http://www.w3.org/2000/svg"><rect width="1260" height="74" fill="white"/><g fill="#222" font-family="sans-serif" font-size="19"><text x="12" y="26">Original</text><text x="432" y="26">Object cutout</text><text x="852" y="26">Guided '+part.category.replace(/&/g,'and')+'</text></g><text x="12" y="54" font-family="sans-serif" font-size="14" fill="#555">Review-only candidate · fine edges not independently approved · original retained</text></svg>');
      await sharp({create:{width:panelWidth*3,height:panelHeight+74,channels:3,background:'white'}})
        .composite([{input:title,left:0,top:0},{input:original,left:0,top:74},
          {input:objectView,left:420,top:74},{input:cutout,left:840,top:74}])
        .png().toFile(join(root,entry.id+'-'+safeName+'-comparison.png'));
      emitted.push({slot:part.slot,category:part.category,semanticPixels:part.pixels,
        subtypeResolved:part.subtypeResolved,possibleSubtypes:part.possibleSubtypes,
        objectPixels:hybrid.objectPixels,retainedPixels:hybrid.keptPixels,
        seedDetected:hybrid.seedDetected,visualReviewRequired:true,approved:false});
    }
    // No detected category: save original preview without inventing any cutout.
    if(!emitted.length)await writeFile(join(root,entry.id+'-original-fallback.png'),original);
    const review=evaluateMultiGarmentReview({expected:entry.expected,
      personDetected:map.personDetected,parts:emitted,
      objectPixels:emitted[0]?.objectPixels ?? object.data.reduce((n,v)=>n+(v>=128?1:0),0)});
    const record={id:entry.id,scenario:entry.scenario,expected:entry.expected,
      sourceSha256:entry.source.sha256,sourceUrl:entry.source.attribution.source,
      license:entry.source.attribution.license,sourceWidth:w,sourceHeight:h,
      semanticMs,objectMs,personDetected:map.personDetected,
      detected:partition.parts.map(p=>p.slot),missing:partition.missing,
      issues:partition.issues,parts:emitted,review,
      originalPreserved:true,automaticCatalogApproved:false,accuracyMeasured:false};
    report.cases.push(record);
    await save();
    console.log('EXPANDED_OUTFIT_CASE '+JSON.stringify(record));
  }
  report.status='complete';
  report.allCasesProcessed=report.cases.length===manifest.length;
  await save();
}finally{
  await semanticModel.dispose();await objectModel.dispose();
}
