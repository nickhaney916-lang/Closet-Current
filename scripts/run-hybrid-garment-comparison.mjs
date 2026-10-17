// Review-only multilayer hybrid experiment using the same verified source bytes.
// Stage 1: segment a specific clothing class; Stage 2: refine with BiRefNet
// object alpha restricted to the target clothing area, veto known body classes.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import sharp from 'sharp';
import {AutoModel,AutoModelForSemanticSegmentation,AutoProcessor,RawImage,env} from '@huggingface/transformers';
import {clothingLabelMap} from '../public/outfit-segmentation.mjs';
import {selectHoldoutPhotos} from '../benchmark/object-cutout-holdout.mjs';
import {hybridGarmentAlpha,protectedBodyFromLogits} from '../benchmark/hybrid-garment-mask.mjs';
import {proposeCutoutRoute,summarizeCutoutRoutes} from '../benchmark/experimental-cutout-router.mjs';

const modelConfigs={
  object:{id:'onnx-community/BiRefNet_lite-ONNX',revision:'de15b22ba131738a16dff04aab8bdf8dc32e3ac1'},
  semantic:{id:'Xenova/segformer_b0_clothes',revision:'a2489ea8e7ec1ee912190546bad31a4906ccca76'}
};
const caseIds=['validation-0001','validation-0003','validation-0010','validation-0017','validation-0019'];
const dest=process.argv[2]||'benchmark/hybrid-garment-review';
const sources=JSON.parse(await readFile('benchmark/manifest-fresh-11.json','utf8'));
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const entries=selectHoldoutPhotos(sources,caseIds,manifest.cases.map(x=>x.id));
await mkdir(dest,{recursive:true});
env.allowLocalModels=false;
const report={status:'running',experiment:'category-aware-B0-plus-BiRefNet-object-alpha',
  models:modelConfigs,sourceRgbPreserved:true,independentMasksApproved:false,
  mobilePerformanceMeasured:false,accuracyMeasured:false,productionAuthorized:false,cases:[]};
const save=()=>writeFile(join(dest,'summary.json'),JSON.stringify(report,null,2));
await save();
const started=performance.now();
const [objectProcessor,semanticProcessor]=await Promise.all([
  AutoProcessor.from_pretrained(modelConfigs.object.id,{revision:modelConfigs.object.revision}),
  AutoProcessor.from_pretrained(modelConfigs.semantic.id,{revision:modelConfigs.semantic.revision})
]);
const [objectModel,semanticModel]=await Promise.all([
  AutoModel.from_pretrained(modelConfigs.object.id,{revision:modelConfigs.object.revision,dtype:'fp32',device:'cpu'}),
  AutoModelForSemanticSegmentation.from_pretrained(modelConfigs.semantic.id,{
    revision:modelConfigs.semantic.revision,dtype:'fp32',device:'cpu'
  })
]);
report.modelLoadMs=Math.round(performance.now()-started);
await save();
try{
 for(const entry of entries){
  const bytes=await readFile(join('benchmark/photos',entry.image));
  if(createHash('sha256').update(bytes).digest('hex')!==entry.sha256)
    throw Error('Source checksum mismatch: '+entry.id);
  const img=await RawImage.read(join('benchmark/photos',entry.image));
  const segStart=performance.now(),semanticInputs=await semanticProcessor(img);
  const semanticOutput=await semanticModel(semanticInputs);
  const semanticMs=Math.round(performance.now()-segStart);
  const map=clothingLabelMap(semanticOutput.logits.data,semanticOutput.logits.dims);
  const protectedBody=protectedBodyFromLogits(semanticOutput.logits.data,semanticOutput.logits.dims);
  const objectStart=performance.now(),objectInputs=await objectProcessor(img);
  const objectOutput=await objectModel({input_image:objectInputs.pixel_values});
  if(!objectOutput.output_image)throw Error('Missing object alpha for '+entry.id);
  const raw=await RawImage.fromTensor(objectOutput.output_image[0].sigmoid().mul(255).to('uint8'))
    .resize(img.width,img.height);
  if(raw.channels!==1)throw Error('Expected single channel alpha');
  const objectMs=Math.round(performance.now()-objectStart);
  const combined=hybridGarmentAlpha(raw.data,img.width,img.height,map,entry.expectedCategory,{
    protectedBody,haloCells:2,minSemanticPixels:8
  });
  const decoded=await sharp(bytes).removeAlpha().toColourspace('srgb').raw()
    .toBuffer({resolveWithObject:true});
  if(decoded.info.width!==img.width||decoded.info.height!==img.height||decoded.info.channels!==3)
    throw Error('Source dimensions mismatch: '+entry.id);
  const w=img.width,h=img.height,pw=420,ph=Math.max(1,Math.round(h*pw/w)),original=await sharp(bytes).resize(pw,ph).png().toBuffer();
  const makePanel=async alpha=>{
    const rgba=new Uint8Array(w*h*4);
    for(let i=0;i<w*h;i++){
      rgba[i*4]=decoded.data[i*3];rgba[i*4+1]=decoded.data[i*3+1];
      rgba[i*4+2]=decoded.data[i*3+2];rgba[i*4+3]=alpha[i]>=128?255:0;
    }
    return sharp(rgba,{raw:{width:w,height:h,channels:4}})
      .flatten({background:'#e8e7ee'}).resize(pw,ph).png().toBuffer();
  };
  const route=proposeCutoutRoute({category:entry.expectedCategory,personDetected:map.personDetected,
    semanticPixels:combined.semanticPixels,objectPixels:combined.objectPixels,
    retainedPixels:combined.keptPixels,retentionRatio:combined.objectPixels?
      combined.keptPixels/combined.objectPixels:0,sourceVerified:true,captureQuality:'unmeasured'});
  const panels=[original,await makePanel(raw.data),await makePanel(combined.alpha)];
  const selectedPanel=route.candidate==='clothing-guided-hybrid'?panels[2]:
    route.candidate==='object-alpha-only'?panels[1]:panels[0];
  await writeFile(join(dest,entry.id+'-layered-candidate.png'),selectedPanel);
  const layeredPanels=[...panels,selectedPanel];
  const layeredTitle=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1680" height="90"><rect width="1680" height="90" fill="white"/><g font-family="sans-serif" font-size="19" fill="#242424"><text x="12" y="28">Verified original</text><text x="432" y="28">Object segmentation</text><text x="852" y="28">Garment-guided hybrid</text><text x="1272" y="28">Layered route candidate</text></g><text x="12" y="55" font-size="15" fill="#333">Selected for further review: '+route.candidate+'</text><text x="12" y="77" font-size="13" fill="#555">No measured accuracy, phone speed, or production deployment approval</text></svg>');
  await sharp({create:{width:4*pw,height:ph+90,channels:3,background:'white'}})
    .composite([{input:layeredTitle,left:0,top:0},...layeredPanels.map((input,i)=>({input,left:i*pw,top:90}))])
    .png().toFile(join(dest,entry.id+'-layered-comparison.png'));
  const top=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1260" height="75"><rect width="1260" height="75" fill="white"/><g font-family="sans-serif" font-size="20" fill="#242424"><text x="12" y="28">Original</text><text x="432" y="28">BiRefNet object cutout</text><text x="852" y="28">B0 clothing + BiRefNet hybrid</text></g><text x="12" y="55" font-size="14" fill="#555">Review only · original RGB · no reference mask accuracy or deployment approval</text></svg>');
  await sharp({create:{width:3*pw,height:ph+75,channels:3,background:'white'}})
    .composite([{input:top,left:0,top:0},...panels.map((input,i)=>({input,left:i*pw,top:75}))])
    .png().toFile(join(dest,entry.id+'-hybrid-review.png'));
  await sharp(combined.alpha,{raw:{width:w,height:h,channels:1}})
    .png().toFile(join(dest,entry.id+'-hybrid-alpha.png'));
  const result={id:entry.id,category:entry.expectedCategory,source:entry.attribution.source,
    license:entry.attribution.license,sourceSha256:entry.sha256,
    sourceWidth:w,sourceHeight:h,semanticMs,objectMs,protectedBodyPixels:protectedBody.reduce((s,v)=>s+v,0),
    personDetected:map.personDetected,
    seedDetected:combined.seedDetected,semanticPixels:combined.semanticPixels,
    objectPixels:combined.objectPixels,retainedPixels:combined.keptPixels,
    removedFromObject:combined.removedPixels,bodyVetoedPixels:combined.bodyVetoedPixels,
    semanticOverlap:combined.seedOverlap,retentionRatio:combined.objectPixels?
      combined.keptPixels/combined.objectPixels:0,
    observationsNotGroundTruth:true,needsHumanReview:true,garmentOnlyVerified:false,
    independentlyApproved:false,experimentalRoute:route.candidate,routeReason:route.reason,
    routeIsReviewOnly:true,originalSourcePreserved:route.originalSourcePreserved};
  report.cases.push(result);
  console.log('HYBRID_CASE '+JSON.stringify(result));
  await save();
 }
 report.routeSummary=summarizeCutoutRoutes(report.cases.map(c=>({id:c.id,category:c.category,
   personDetected:c.personDetected,semanticPixels:c.semanticPixels,
   retainedPixels:c.retainedPixels,objectPixels:c.objectPixels,
   retentionRatio:c.retentionRatio,sourceVerified:true,captureQuality:'unmeasured'})));
 report.status='complete';
 await save();
}finally{
 await semanticModel.dispose();
 await objectModel.dispose();
}
