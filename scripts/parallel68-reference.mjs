import {assertAcceptance68} from '../research/parallel68/acceptance-guard.mjs';
import {RawImage} from '@huggingface/transformers';
import {loadFlorenceGrounder67,FLORENCE67} from '../research/parallel67-reference/florence-grounder.mjs';
import {loadSam2Reference67,SAM2_REFERENCE_67} from '../research/parallel67-reference/sam2-mask.mjs';
import {postprocessFootwear68} from '../research/parallel68/footwear.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';import {gzipSync} from 'node:zlib';import {performance} from 'node:perf_hooks';
const split=process.argv[2]||'development',manifestPath=process.argv[3]||'research/parallel67-reference/fashionpedia/manifest.json',directory=process.argv[4]||'benchmark/parallel67-reference-photos';
const bytes=await readFile(manifestPath),manifest=JSON.parse(bytes),manifestSha256=createHash('sha256').update(bytes).digest('hex');
const acceptanceReceipt=split==='acceptance'?await assertAcceptance68('mask',manifestPath):null;
await mkdir('benchmark/parallel68-masks',{recursive:true});await mkdir('research/parallel68/results',{recursive:true});
const reports=Object.fromEntries(['reference','footwear'].map(mode=>[mode,{schema:'closet-current-parallel68-grounded-footwear/v1',mode,split,manifestSha256,florence:FLORENCE67,sam2:SAM2_REFERENCE_67,automaticSave:false,acceptanceReceipt,rows:[]}]));
const grounder=await loadFlorenceGrounder67(),sam=await loadSam2Reference67();
try{
 for(const row of manifest.rows){
  const path=directory+'/'+row.image,source=await readFile(path),sha256=createHash('sha256').update(source).digest('hex');if(sha256!==row.sha256)throw Error('Original source changed');
  const image=await RawImage.read(path),start=performance.now(),detection=await grounder.detect(image);let masks=[];
  if(detection.regions.length)masks=(await sam.segment(image,detection.regions.map(r=>r.box))).masks;
  const inferenceMs=performance.now()-start;
  const prepared={reference:detection.regions.map((r,i)=>({...r,categories:r.categories||[r.category],mask:masks[i],parentIndex:i,parentSplitCount:1})),footwear:postprocessFootwear68(detection.regions,masks,image.width,image.height)};
  for(const mode of ['reference','footwear']){
   const regions=[];
   for(let i=0;i<prepared[mode].length;i++){
    const {mask,...r}=prepared[mode][i],maskFile='benchmark/parallel68-masks/'+mode+'-'+split+'-'+row.id+'-'+i+'.bin.gz';await writeFile(maskFile,gzipSync(mask));
    regions.push({...r,maskFile,maskSha256:createHash('sha256').update(mask).digest('hex'),itemType:'Unknown',colorVerified:false,requiresReview:true});
   }
   reports[mode].rows.push({id:row.id,sha256,width:image.width,height:image.height,elapsedMs:inferenceMs,regions,stages:detection.stages,requiresReview:true,automaticSave:false});
   await writeFile('research/parallel68/results/'+mode+'-'+split+'.json',JSON.stringify(reports[mode],null,2)+'\n');
  }
  console.log(row.id,prepared.reference.length,'->',prepared.footwear.length,Math.round(inferenceMs));globalThis.gc?.();
 }
 for(const [mode,report]of Object.entries(reports)){report.processPeakResidentBytes=process.resourceUsage().maxRSS*1024;await writeFile('research/parallel68/results/'+mode+'-'+split+'.json',JSON.stringify(report,null,2)+'\n');}
}finally{await grounder.dispose();await sam.dispose();}
