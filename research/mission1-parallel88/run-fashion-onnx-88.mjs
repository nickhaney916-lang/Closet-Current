// P88 licensed Fashionpedia ONNX *research-only* real public source study.
// File bytes pinned with SHA-256; executable bytes are NOT GitHub project code.
// Neither this model nor its boxes are used by the consumer app or owner save.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import {decodeFashionYolo88,scoreFashionAccessory88,
 FASHION_ACCESSORY_IDS88} from './fashion-onnx-probes-88.mjs';

const MODEL_URL='https://huggingface.co/louisJLN/yolo8-fashionpedia/resolve/3d5c557/results/yolov8n-fashionpedia-1.onnx';
const MODEL_SHA='6b581af3abe2b4ae97a84cbe9aef5ae37207a68ee966d22b0b8d7969d79e6920';
const MANIFEST_SHA='b76e9890bda49c58c6adbbafb6f7dd738f4dcf604357fc56aa0b6e770ebe35bd';
const MODEL_ID='louisJLN/yolo8-fashionpedia';
const sourceDir=new URL('../../benchmark/p88-public-validation-jpegs/',import.meta.url);
const dest=new URL('../../benchmark/p88-real-validation-masks/',import.meta.url);
const manifestFile=new URL('./frozen-public-validation-68.json',import.meta.url);
const sha=x=>createHash('sha256').update(x).digest('hex');
const manifestBytes=await readFile(manifestFile);
if(sha(manifestBytes)!==MANIFEST_SHA)throw Error('P88_FASHION_SOURCE_MANIFEST_CHANGED');
const manifest=JSON.parse(manifestBytes);
if(manifest.rows.length!==16||
 manifest.rows.reduce((sum,r)=>sum+r.annotations.length,0)!==53)
 throw Error('P88_FASHION_HUMAN_COUNT_CHANGED');
const response=await fetch(MODEL_URL,{signal:AbortSignal.timeout(120000)});
if(!response.ok)throw Error('P88_FASHION_MODEL_DOWNLOAD_FAILED '+response.status);
const modelBytes=Buffer.from(await response.arrayBuffer());
if(modelBytes.length<1000000||modelBytes.length>25000000||
 sha(modelBytes)!==MODEL_SHA)throw Error('P88_FASHION_UNVERIFIED_ONNX_WEIGHTS');
const session=await ort.InferenceSession.create(modelBytes,{
 executionProviders:['cpu'],intraOpNumThreads:2,interOpNumThreads:1
});
const input=session.inputNames[0],output=session.outputNames[0];
if(session.inputNames.length!==1||session.outputNames.length!==1)
 throw Error('P88_FASHION_UNEXPECTED_ONNX_IO');
const info=session.inputMetadata?.[input];
const dims=info?.dimensions||[];
if(dims.length!==4||dims[1]!==3||dims[2]!==640||dims[3]!==640)
 throw Error('P88_FASHION_UNEXPECTED_ONNX_INPUT '+JSON.stringify(dims));
const SIZE=640;
function sourceTruth(row){
 const ids=new Set(FASHION_ACCESSORY_IDS88);
 return row.annotations.filter(x=>ids.has(x.category_id)).map(x=>{
  const [x0,y0,w,h]=x.bbox||[];
  if([x0,y0,w,h].some(z=>!Number.isFinite(z))||
     x0<0||y0<0||w<=0||h<=0||
     x0+w>row.width+1||y0+h>row.height+1)
   throw Error('P88_FASHION_INVALID_PUBLIC_HUMAN_BBOX');
  return {category_id:x.category_id,box:{
   xmin:x0,ymin:y0,xmax:x0+w,ymax:y0+h}};
 });
}
async function imageTensor(jpeg,row){
 const gain=Math.min(SIZE/row.width,SIZE/row.height);
 const width=Math.round(row.width*gain),height=Math.round(row.height*gain),
 padX=Math.floor((SIZE-width)/2),padY=Math.floor((SIZE-height)/2);
 const {data,info}=await sharp(jpeg).resize(width,height,{fit:'fill'})
  .toColourspace('srgb').removeAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width!==width||info.height!==height||info.channels!==3)
  throw Error('P88_FASHION_IMAGE_DECODE_MISMATCH');
 const area=SIZE*SIZE,buf=new Float32Array(3*area);
 buf.fill(114/255);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const pos=(y*width+x)*3,t=(y+padY)*SIZE+x+padX;
  buf[t]=data[pos]/255;
  buf[area+t]=data[pos+1]/255;
  buf[area*2+t]=data[pos+2]/255;
 }
 return {tensor:new ort.Tensor('float32',buf,[1,3,SIZE,SIZE]),
  geometry:{inputSize:SIZE,width,height,padX,padY}};
}
const rows=[];
for(const row of manifest.rows){
 const jpeg=await readFile(new URL(row.image,sourceDir));
 if(jpeg.length!==row.bytes||sha(jpeg)!==row.sha256||jpeg[0]!==255||jpeg[1]!==216)
  throw Error('P88_FASHION_PUBLIC_JPEG_SHA_MISMATCH '+row.id);
 const {tensor,geometry}=await imageTensor(jpeg,row);
 const start=performance.now();
 const outputs=await session.run({[input]:tensor});
 const elapsedMs=performance.now()-start;
 const networkOutput=outputs[output];
 if(networkOutput?.type!=='float32'||networkOutput?.dims?.length!==3)
  throw Error('P88_FASHION_UNEXPECTED_ONNX_OUTPUT');
 const proposals=decodeFashionYolo88(networkOutput.data,networkOutput.dims,
  row.width,row.height,geometry,{cutoff:0.10});
 const human=sourceTruth(row);
 const score=scoreFashionAccessory88(human,proposals);
 rows.push({
  photoId:row.id,sourceSha256:row.sha256,
  humanCount:human.length,originalDimensions:[row.width,row.height],
  runtimeMs:elapsedMs,score,
  detections:proposals.map(p=>({category_id:p.category_id,score:p.score,box:p.box}))
 });
 console.log('P88_GENUINE_46CLASS_FASHION_IMAGE',JSON.stringify({
  photoId:row.id,human:human.length,correct:score.matched,
  proposals:proposals.length,sourceVerified:true,
  latencyMs:Math.round(elapsedMs)
 }));
}
const sum=k=>rows.reduce((a,r)=>a+r.score[k],0);
const perCategory=Object.fromEntries(FASHION_ACCESSORY_IDS88.map(c=>[
 c,rows.reduce((acc,r)=>{
  const z=Object.values(r.score.perCategory).find(v=>v.categoryId===c);
  for(const key of ['human','matched','proposed'])acc[key]+=z[key];
  return acc;
 },{human:0,matched:0,proposed:0})
]));
const aggregate={
 photos:rows.length,humanAccessoryInstances:sum('human'),
 matchedAccessoryBoxes:sum('matched'),proposedAccessoryBoxes:sum('proposals'),
 unmatchedProposals:sum('unmatchedProposals'),
 missedAccessories:sum('missedHuman'),
 perCategory
};
if(aggregate.photos!==16||aggregate.humanAccessoryInstances!==13)
 throw Error('P88_FASHION_PUBLIC_COHORT_MISMATCH');
const document={
 schema:'closet-current-p88-actual-fashionpedia-yolov8-46class-bbox-research/v1',
 model:MODEL_ID,architecture:'YOLOv8n',format:'onnx',
 modelLicenseMetadata:'MIT',source:MODEL_URL,
 verifiedModelSha256:MODEL_SHA,sourceManifestSha256:MANIFEST_SHA,
 actualRealOriginalPublicJpegsVerified:true,
 humanAnnotations:'original Fashionpedia val2020 bbox',
 expectedMainClasses:27,totalModelClasses:46,
 cutoff:0.10,nmsIoU:0.50,matchedBoxIoU:0.50,
 sameExposedP68Photos:true,modelTrainingOverlapNotIndependentlyCleared:true,
 secondHumanBlindAnnotations:false,noFineSubtypeOrColorTruth:true,
 metric:'original source image bbox one-to-one EXACT Fashionpedia category; not segmentation mask IoU',
 nativeSegFormerProductUnaffected:true,consumerAutomaticSaveNotAuthorized:true,
 privateUserDataTouched:false,physicalDevicesTested:0,
 aggregate,rows
};
await mkdir(dest,{recursive:true});
await writeFile(new URL('real-fashion-onnx-88.json',dest),
 JSON.stringify(document,null,2)+'\n');
console.log('P88_GENUINE_FASHION_ONNX_ACCESSORY_OUTCOME',JSON.stringify({
 model:MODEL_ID,modelSha256:MODEL_SHA,...aggregate,
 trainedOnFashionpedia:true,independentBlind:false,noProductPromotion:true
}));
await session.release();
