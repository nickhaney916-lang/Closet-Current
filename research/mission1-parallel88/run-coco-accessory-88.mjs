// Mission 1 #88 research only: COCO object-detection accessory hypothesis.
// This model is COCO-trained, NOT fashion fine-label trained. It can only
// propose bag / tie / umbrella rectangles. Explicit human owner review would
// still be mandatory. No photo uploads, no private owners, no product import.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {pipeline,RawImage} from '@huggingface/transformers';
import {evaluateCocoAccessoryBoxes88,cocoAccessoryLabel88} from './exposed-threshold-probes-88.mjs';

const DATA=new URL('./frozen-public-validation-68.json',import.meta.url);
const root=new URL('../../',import.meta.url);
const outDir=new URL('../../benchmark/p88-real-validation-masks/',import.meta.url);
const jpegDir=new URL('../../benchmark/p88-public-validation-jpegs/',import.meta.url);
const MODEL='Xenova/yolos-tiny';
const MODEL_REVISION='e2f9c7673f0fa61849efe2b56a0d7774779ebb9d';
const MANIFEST_SHA256='b76e9890bda49c58c6adbbafb6f7dd738f4dcf604357fc56aa0b6e770ebe35bd';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const source=await readFile(DATA);
if(sha(source)!==MANIFEST_SHA256)throw Error('P88_COCO_SOURCE_MANIFEST_CHANGED');
const manifest=JSON.parse(source);
if(manifest.rows.length!==16||
 manifest.rows.reduce((sum,r)=>sum+r.annotations.length,0)!==53)
 throw Error('P88_COCO_HUMAN_SOURCE_COUNT_CHANGED');

const startLoad=performance.now();
const detect=await pipeline('object-detection',MODEL,{
 revision:MODEL_REVISION,dtype:'q4',device:'cpu'
});
const modelLoadMs=performance.now()-startLoad;
const rows=[];
try{
 for(const row of manifest.rows){
  const file=new URL(row.image,jpegDir);
  const jpeg=await readFile(file);
  if(jpeg.length!==row.bytes||sha(jpeg)!==row.sha256||
     jpeg[0]!==255||jpeg[1]!==216)
   throw Error('P88_COCO_ORIGINAL_JPEG_HASH_MISMATCH '+row.id);
  const image=await RawImage.read(file.pathname);
  if(image.width!==row.width||image.height!==row.height)
   throw Error('P88_COCO_ORIGINAL_GEOMETRY_MISMATCH');
  const human=row.annotations.filter(a=>a.category_id>=13&&a.category_id<=26&&
   a.category_id!==21&&a.category_id!==23).map(a=>{
    const b=a.bbox;
    if(!Array.isArray(b)||b.length!==4||b.some(x=>!Number.isFinite(x))||
       b[0]<0||b[1]<0||b[2]<=0||b[3]<=0||
       b[0]+b[2]>row.width+1||b[1]+b[3]>row.height+1)
      throw Error('P88_COCO_INVALID_PUBLIC_HUMAN_BBOX');
    return {category_id:a.category_id,
     box:{xmin:b[0],ymin:b[1],xmax:b[0]+b[2],ymax:b[1]+b[3]}};
   });
  const t0=performance.now();
  const raw=await detect(image,{threshold:0.10,percentage:false});
  const elapsedMs=performance.now()-t0;
  if(!Array.isArray(raw)||raw.length>100)throw Error('P88_COCO_UNEXPECTED_DETECTIONS');
  const proposals=raw.filter(p=>cocoAccessoryLabel88(p.label)).map(p=>{
   const b=p.box||{};
   const coords=[b.xmin,b.ymin,b.xmax,b.ymax];
   if(coords.some(v=>typeof v!=='number'||!Number.isFinite(v)))
    throw Error('P88_COCO_DETECTION_COORDINATES_INVALID');
   const box={
    xmin:Math.max(0,Math.min(row.width,b.xmin)),
    ymin:Math.max(0,Math.min(row.height,b.ymin)),
    xmax:Math.max(0,Math.min(row.width,b.xmax)),
    ymax:Math.max(0,Math.min(row.height,b.ymax))
   };
   if(box.xmin>=box.xmax||box.ymin>=box.ymax)
    throw Error('P88_COCO_DEGENERATE_BOX');
   return {label:p.label,score:p.score,box};
  });
  const score=evaluateCocoAccessoryBoxes88(human,proposals,{iouThreshold:.5});
  rows.push({id:row.id,originalJpegSha256:row.sha256,score,elapsedMs,
   // Coordinates refer only to public licensed images, never owner wardrobe
   proposals:proposals.map(p=>({category:cocoAccessoryLabel88(p.label),
    rawCocoLabel:p.label,confidence:p.score,box:p.box}))});
  console.log('P88_REAL_COCO_ACCESSORY_PHOTO',JSON.stringify({
   photoId:row.id,sourceVerified:true,human:human.length,
   supported:score.supportedHuman,unsupported:score.unsupportedHuman,
   matched:score.matched,proposals:score.proposals,
   latencyMs:Math.round(elapsedMs)
  }));
 }
}finally{
 await detect.dispose?.();
}
const total=k=>rows.reduce((n,r)=>n+r.score[k],0);
const supported=total('supportedHuman'),unsupported=total('unsupportedHuman'),
 matched=total('matched'),proposals=total('proposals');
if(supported!==2||unsupported!==11||supported+unsupported!==13)
 throw Error('P88_COCO_ACCESSORY_COVERAGE_RECEIPT_MISMATCH');
const output={
 schema:'closet-current-p88-exposed-public-coco-accessory-object-proposals/v1',
 model:MODEL,revision:MODEL_REVISION,dtype:'q4',device:'cpu',
 upstreamModel:'hustvl/yolos-tiny',upstreamLicense:'Apache-2.0',
 modelWeightsSha256Verified:false,
 humanDataset:'Fashionpedia official public val2020, 16 P68 already-exposed source JPEGs',
 photoManifestSha256:MANIFEST_SHA256,originalJpegSha256Verified:true,
 annotationLicense:'CC BY 4.0',
 photoPrimaryLicense:'Flickr CC BY/BY-SA 2.0, per frozen manifest',
 samePhotoSourceAsP88PriorDevelopment:true,
 newBlindHoldout:false,independentSecondHumanReview:false,
 fineSubtypeOrColorTruth:false,physicalPhoneAcceptance:false,
 intendedScope:'COCO-compatible bag/tie/umbrella rectangles only',
 unsupportedAccessoryLabelsNotInvented:true,
 metric:'maximum-cardinality one-to-one COCO box IoU>=0.50 per photo and category; NOT segmentation mask IoU',
 aggregate:{photographs:16,humanAccessoryInstances:13,
  supportedHumanAccessoryInstances:supported,
  unsupportedHumanAccessoryInstances:unsupported,
  supportedAccessoryMatches:matched,
  supportedAccessoryMisses:supported-matched,
  proposedSupportedClassBoxes:proposals,
  unmatchedProposals:proposals-matched,
  supportedBboxRecall:matched/supported,
  supportedBboxPrecision:proposals?matched/proposals:0},
 runtime:{loadMs:modelLoadMs,medianPhotoMs:rows.map(x=>x.elapsedMs).sort((a,b)=>a-b)[8]},
 rows,
 noProductModelPromotion:true,noAutomaticSaveAuthority:true,
 familyAlphaHold:'OPEN',privateDataTouched:false
};
await mkdir(outDir,{recursive:true});
await writeFile(new URL('real-public-coco-accessory-88.json',outDir),JSON.stringify(output,null,2)+'\n');
console.log('P88_REAL_COCO_ACCESSORY_OUTCOME',JSON.stringify({
 model:MODEL,revision:MODEL_REVISION,
 ...output.aggregate,
 newBlindHoldout:false,notMaskIoU:true,
 noProductModelPromotion:true
}));
