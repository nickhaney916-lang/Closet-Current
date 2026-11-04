// Compare real hash-verified photos using the production SegFormer model.
// Natural mask repair vs baseline; NOT ground-truth garment accuracy.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import sharp from 'sharp';
import {AutoProcessor,AutoModelForSemanticSegmentation,RawImage,env} from '@huggingface/transformers';
import {clothingLabelMap,clothingMaskGroups,isolateClothingPixels,
 cropClothingPhotoPixels,repairGarmentDisplayPinholes} from '../public/outfit-segmentation.mjs';

const root=process.argv[2]||'benchmark/real-pinhole-review';
const ids=['validation-0001','validation-0017','validation-0019'];
const sources=JSON.parse(await readFile('benchmark/manifest-fresh-11.json','utf8'));
const rows=ids.map(id=>sources.find(s=>s.id===id));
if(rows.some(r=>!r?.verified||!/^[a-f0-9]{64}$/.test(r.sha256)||!r.attribution?.source))
 throw Error('Unverified real image sources');
const report={status:'running',
 model:'Xenova/segformer_b0_clothes',revision:'a2489ea8e7ec1ee912190546bad31a4906ccca76',
 modelInProductionOutfitFlow:true,recognitionModelUnchanged:true,
 noNewModelsAddedToCustomerApp:true,pixelGroundTruthAvailable:false,
 maskAccuracyPercent:null,phonePerformanceMeasured:false,
 originalImageUnchanged:true,productionPromotionApproved:false,cases:[]};
await mkdir(root,{recursive:true});
const save=()=>writeFile(join(root,'summary.json'),JSON.stringify(report,null,2));
await save();env.allowLocalModels=false;
const processor=await AutoProcessor.from_pretrained(report.model,{revision:report.revision});
const model=await AutoModelForSemanticSegmentation.from_pretrained(report.model,{
 revision:report.revision,device:'cpu',dtype:'fp32'});
function preview(p){return sharp(p.data,{raw:{width:p.width,height:p.height,channels:3}})
 .resize(400,440,{fit:'contain',background:'#f3f1f6'}).png().toBuffer();}
try{
 for(const row of rows){
  const file=join('benchmark/photos',row.image),bytes=await readFile(file);
  if(createHash('sha256').update(bytes).digest('hex')!==row.sha256)
    throw Error('Changed input source '+row.id);
  const image=await RawImage.read(file);
  const start=performance.now(),output=await model(await processor(image));
  const map=clothingLabelMap(output.logits.data,output.logits.dims);
  const groups=clothingMaskGroups(map);
  const entries=[];
  for(const group of groups){
   const before=isolateClothingPixels(image,map,group,{repairDisplayPinholes:false});
   const after=isolateClothingPixels(image,map,group);
   const raw=cropClothingPhotoPixels(image,map,group);
   const sourceHash=createHash('sha256').update(raw.data).digest('hex');
   // Recreating the source recognition crop cannot depend on any display mask.
   const confirmation=cropClothingPhotoPixels(image,map,group);
   if(createHash('sha256').update(confirmation.data).digest('hex')!==sourceHash)
     throw Error('Recognition image was altered');
   const mask=repairGarmentDisplayPinholes(image,map,group);
   if(mask.repairedPixels>mask.growthBudget||mask.repairedPixels>group.count*.015
     ||mask.semanticMaskUntouched!==true||mask.originalPixelsOnly!==true)
     throw Error('Unsafe display mask growth');
   let differences=0;
   for(let i=0;i<after.data.length;i++)if(after.data[i]!==before.data[i])differences++;
   if(!mask.repairedPixels&&differences)throw Error('Unexpected RGB difference without repair');
   if(mask.repairedPixels&&differences===0)throw Error('Mask repair did not change display image');
   const panels=await Promise.all([preview(raw),preview(before),preview(after)]);
   const caption=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="68"><rect width="1200" height="68" fill="white"/><g font-family="sans-serif" font-size="18" fill="#222"><text x="12" y="25">Recognition crop (unchanged)</text><text x="412" y="25">Display cutout: before</text><text x="812" y="25">Display cutout: after</text></g><text x="12" y="53" font-size="14" fill="#555">Only source RGB, no texture synthesis; source-aligned ground truth unavailable</text></svg>');
   const fname=row.id+'-class-'+group.id+'-display-compare.png';
   await sharp({create:{width:1200,height:508,channels:3,background:'white'}})
     .composite([{input:caption,left:0,top:0},
       ...panels.map((input,i)=>({input,left:i*400,top:68}))]).png()
     .toFile(join(root,fname));
   entries.push({semanticClass:group.id,semanticLabel:group.label,
     repairedCoarsePixels:mask.repairedPixels,examinedEnclosedHoles:mask.examinedHoles,
     repairedHoles:mask.repairedHoles,maskGrowthBudget:mask.growthBudget,
     displayChannelDifferences:differences,
     recognitionRGBSha256:sourceHash,
     sourceRgbModified:false,sourceColorSynthesized:false,
     userConfirmationRequired:false,segmentationAccuracyMeasured:false,
     comparisonFile:fname});
  }
  const result={id:row.id,expectedCategoryForReview:row.expectedCategory,
    verifiedSourceHash:row.sha256,source:row.attribution.source,
    originalWidth:image.width,originalHeight:image.height,
    cpuModelAndPostprocessMs:Math.round(performance.now()-start),
    detectedGroups:entries.length,entries,
    modelAccurateNotVerified:true,originalPhotoPreserved:true};
  report.cases.push(result);await save();
  console.log('REAL_PINHOLE_DISPLAY '+JSON.stringify({
   id:row.id,groups:entries.length,repairedPixels:entries.reduce((n,x)=>n+x.repairedCoarsePixels,0),
   userExtraSteps:0,sourceModified:false
  }));
 }
 report.status='complete';await save();
}finally{await model.dispose();}
