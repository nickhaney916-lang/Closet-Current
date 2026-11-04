// Two real-world, SHA-verified hosiery/shoe layered outfit source photos.
// Measures current classifier vocabulary and semantic predictions, NOT
// instance correctness, sock masks, consumer accuracy or phone performance.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import sharp from 'sharp';
import {AutoProcessor,AutoModelForSemanticSegmentation,RawImage,env} from '@huggingface/transformers';
import {clothingLabelMap} from '../public/outfit-segmentation.mjs';
import {localCandidates} from '../public/local-catalog.mjs';
const sources=JSON.parse(await readFile('benchmark/manifest-visible-legwear-2.json','utf8'));
const root=process.argv[2]||'benchmark/real-visible-legwear-review';
if(sources.length!==2||new Set(sources.map(x=>x.id)).size!==2)throw Error('Missing two real scenario sources');
const modelId='Xenova/segformer_b0_clothes',revision='a2489ea8e7ec1ee912190546bad31a4906ccca76';
const proposedLegwearTypes=['Socks','Knee-high socks','Stockings','Tights'];
const recognizedInCurrentCatalog=localCandidates
 .filter(x=>proposedLegwearTypes.includes(x.itemType)).map(x=>x.itemType);
const report={status:'running',modelId,revision,environment:'GitHub Actions CPU only',
 originalSourcesVerified:false,manualGroundTruthGarmentMasks:false,
 photographsAreReal:true,photosAreRealPhoneAppCaptures:false,
 currentCatalogRecognizesLegwear:recognizedInCurrentCatalog.length>0,
 legwearCatalogCandidates:recognizedInCurrentCatalog,
 semanticClassesAvailable:[4,5,6,7,9],semanticClassForLegwear:false,
 reportedSegmentationAccuracy:null,productionAuthorized:false,createdClosetItems:0,cases:[]};
await mkdir(root,{recursive:true});
const save=()=>writeFile(join(root,'summary.json'),JSON.stringify(report,null,2));
await save();
env.allowLocalModels=false;
const start=performance.now();
const processor=await AutoProcessor.from_pretrained(modelId,{revision});
const model=await AutoModelForSemanticSegmentation.from_pretrained(modelId,{
 revision,device:'cpu',dtype:'fp32'
});
report.modelLoadMs=Math.round(performance.now()-start);
try{
 for(const row of sources){
  const bytes=await readFile(join('benchmark/photos',row.image));
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==row.sha256||!row.verified||!row.attribution?.license)throw Error('Image/license mismatch '+row.id);
  const photo=await RawImage.read(join('benchmark/photos',row.image));
  const t=performance.now();
  const out=await model(await processor(photo));
  const map=clothingLabelMap(out.logits.data,out.logits.dims);
  const pixelsByClass={};
  for(const klass of map.labels)pixelsByClass[klass]=(pixelsByClass[klass]||0)+1;
  const timeMs=Math.round(performance.now()-t);
  await sharp(bytes).rotate().resize({width:560,withoutEnlargement:true})
    .jpeg({quality:88}).toFile(join(root,row.id+'-source-review.jpg'));
  const caseResult={id:row.id,scene:row.scene,sourceSha256:hash,
   source:row.attribution.source,author:row.attribution.author,license:row.attribution.license,
   expectedGarmentsFromSourceDescription:row.expectedVisibleGarments,
   annotationsVerified:false,maskResolution:[map.width,map.height],
   shoeClass9Pixels:pixelsByClass[9]||0,upperGarmentClass4Pixels:pixelsByClass[4]||0,
   classPixelCounts:pixelsByClass,personDetected:map.personDetected,
   modelHasDedicatedSockOrStockingMask:false,
   modelCanSeparateShoesFromStockings:false,
   measurableSocksAndStockingsPrecision:null,
   createdClosetItems:0,noAutomaticSecondGarment:true,
   cpuInferenceMs:timeMs};
  report.cases.push(caseResult);
  await save();
  console.log('REAL_VISIBLE_PAIR_CASE '+JSON.stringify({
   id:row.id,shoeClass9Pixels:caseResult.shoeClass9Pixels,
   upperGarmentClass4Pixels:caseResult.upperGarmentClass4Pixels,
   cpuInferenceMs:timeMs,modelCanSeparateShoesFromStockings:false,createdClosetItems:0
  }));
 }
 report.status='complete';report.originalSourcesVerified=true;
 await save();
}finally{await model.dispose();}
