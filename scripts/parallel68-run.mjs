import {RawImage} from '@huggingface/transformers';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {performance} from 'node:perf_hooks';
import {loadDetector68,DETECTOR68,QUERIES68,deduplicateMasks68} from '../research/parallel68/detector.mjs';
import {loadSam2Reference67,SAM2_REFERENCE_67} from '../research/parallel67-reference/sam2-mask.mjs';
const split=process.argv[2]||'development',dtype=process.argv[5]||'q8',strategy=process.argv[6]||'full';
const manifestPath=process.argv[3]||'research/parallel67-reference/fashionpedia/manifest.json';
const directory=process.argv[4]||'benchmark/parallel67-reference-photos';
const manifestBytes=await readFile(manifestPath),manifest=JSON.parse(manifestBytes),rows=manifest.rows;
if(!Array.isArray(rows)||!rows.length)throw Error('Missing frozen photo manifest');
if(split==='acceptance'&&process.env.P68_FROZEN_PROTOCOL!=='1')throw Error('Acceptance requires precommitted frozen protocol');
const root='research/parallel68/results';await mkdir(root,{recursive:true});await mkdir('benchmark/parallel68-masks',{recursive:true});
const report={schema:'closet-current-parallel68-real-instance-inference/v1',split,manifestSha256:createHash('sha256').update(manifestBytes).digest('hex'),detector:{...DETECTOR68,dtype,modelBytes:dtype==='fp32'?718761381:DETECTOR68.modelBytes,modelSha256:dtype==='fp32'?'267c8b00d269dc2dda0d8592812d3027abd5fb59f1cabf8e3d56f8fdf07f68ec':DETECTOR68.modelSha256},sam2:SAM2_REFERENCE_67,queries:QUERIES68,strategy,boxThreshold:.3,textThreshold:.3,maskDedupIoU:.85,automaticSave:false,rows:[]};
const start=performance.now(),detector=await loadDetector68({dtype,strategy}),sam=await loadSam2Reference67();report.loadMs=performance.now()-start;
try{
 for(const row of rows){
  const bytes=await readFile(directory+'/'+row.image),sha256=createHash('sha256').update(bytes).digest('hex');if(sha256!==row.sha256)throw Error('Original JPEG SHA mismatch');
  const image=await RawImage.read(directory+'/'+row.image),began=performance.now();
  const detected=await detector.detect(image);let regions=[];
  if(detected.regions.length){
   if(detected.regions.length>32)throw Error('Too many detected regions; explicit review needed');
   const segmented=await sam.segment(image,detected.regions.map(x=>x.box));
   const selected=deduplicateMasks68(detected.regions,segmented.masks);
   for(let i=0;i<selected.length;i++){
    const item=selected[i],maskFile='benchmark/parallel68-masks/'+strategy+'-'+dtype+'-'+split+'-'+row.id+'-'+i+'.bin.gz';await writeFile(maskFile,gzipSync(item.mask));
    regions.push({...item.region,predictedMaskIoU:segmented.predictedIoUs[item.index],maskFile,maskSha256:createHash('sha256').update(item.mask).digest('hex'),maskQualityVerified:false,colorVerified:false,requiresReview:true});
   }
  }
  report.rows.push({id:row.id,sha256,width:image.width,height:image.height,rawDetections:detected.raw,queryResults:detected.queries,regions,requiresReview:true,automaticSave:false,reviewReason:regions.length?'owner_confirmation_required':'no_garment_instances_found',elapsedMs:performance.now()-began});
  await writeFile(root+'/dino-'+strategy+'-'+dtype+'-'+split+'.json',JSON.stringify(report,null,2)+'\n');console.log(row.id,regions.map(x=>x.label).join(' | '),Math.round(performance.now()-began));globalThis.gc?.();
 }
 report.processPeakResidentBytes=process.resourceUsage().maxRSS*1024;await writeFile(root+'/dino-'+strategy+'-'+dtype+'-'+split+'.json',JSON.stringify(report,null,2)+'\n');
}finally{await detector.dispose();await sam.dispose();}
