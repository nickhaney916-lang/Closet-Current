import {assertAcceptance68} from '../research/parallel68/acceptance-guard.mjs';
// Actual foreground inference + pixel measurement. Human labels never enter
// either model or estimator; this is predominant-object color, not mask truth.
import {RawImage} from '@huggingface/transformers';
import {loadSam2Reference67,SAM2_REFERENCE_67} from '../research/parallel67-reference/sam2-mask.mjs';
import {measureMaskedColors68} from '../research/parallel68/color.mjs';
import {pixelColor67} from '../research/parallel67/color.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';import {gzipSync} from 'node:zlib';import {performance} from 'node:perf_hooks';
const split=process.argv[2]||'development',manifestPath='research/parallel68/color-data/'+split+'.json';
const bytes=await readFile(manifestPath),manifest=JSON.parse(bytes),algorithmBytes=await readFile('research/parallel68/color.mjs');
const estimatorSha256=createHash('sha256').update(algorithmBytes).digest('hex');if(manifest.estimatorAtFreezeSha256!==estimatorSha256)throw Error('Color estimator changed after source freeze');
const acceptanceReceipt=split==='acceptance'?await assertAcceptance68('color',manifestPath):null;
const sam=await loadSam2Reference67();await mkdir('research/parallel68/results',{recursive:true});await mkdir('benchmark/parallel68-masks',{recursive:true});
const report={schema:'closet-current-parallel68-human-color-comparison/v1',split,manifestSha256:createHash('sha256').update(bytes).digest('hex'),estimatorSha256,sam2:SAM2_REFERENCE_67,acceptanceReceipt,maskTruthAvailable:false,annotationScope:manifest.humanValidationProvenance,automaticColorSaveAllowed:false,rows:[]};
try{
 for(const row of manifest.rows){
  const path=row.localPath||'benchmark/parallel68-color-photos/'+row.image,source=await readFile(path),sha256=createHash('sha256').update(source).digest('hex');if(sha256!==row.sha256)throw Error('Original dataset JPEG changed');
  const image=await RawImage.read(path),start=performance.now();
  const result=await sam.segment(image,[[0,0,image.width,image.height]]),mask=result.masks[0];
  const improved=measureMaskedColors68({data:image.data,width:image.width,height:image.height,channels:image.channels,mask,maskStatus:'model-proposed',sourceSha256:sha256});
  const histogram={};let pixels=0;
  for(let i=0;i<mask.length;i++)if(mask[i]){pixels++;const j=i*image.channels,color=pixelColor67(image.data[j],image.data[j+1],image.data[j+2]);histogram[color]=(histogram[color]||0)+1;}
  const palette=Object.entries(histogram).sort((a,b)=>b[1]-a[1]).map(([color,n])=>({color,fraction:n/pixels}));
  const baseline=palette.length?{color:palette[0].fraction>=.72?palette[0].color:'Multicolor',palette,verified:false}: {color:null,palette,verified:false};
  const maskFile='benchmark/parallel68-masks/color-'+split+'-'+row.id+'.bin.gz';await writeFile(maskFile,gzipSync(mask));
  const truth=row.humanColor.toLowerCase()==='grey'?'Gray':row.humanColor[0].toUpperCase()+row.humanColor.slice(1).toLowerCase();
  report.rows.push({id:row.id,sha256,width:image.width,height:image.height,expectedColor:truth,annotationScope:row.annotationScope,baseline,improved,baselineCorrect:baseline.color===truth,improvedCorrect:improved.color===truth,maskFile,maskSha256:createHash('sha256').update(mask).digest('hex'),maskPredictedIoU:result.predictedIoUs[0],maskHumanVerified:false,elapsedMs:performance.now()-start});
  await writeFile('research/parallel68/results/color-'+split+'.json',JSON.stringify(report,null,2)+'\n');console.log(row.id,truth,baseline.color,'->',improved.color,improved.status);globalThis.gc?.();
 }
 report.summary={photos:report.rows.length,baselineCorrect:report.rows.filter(r=>r.baselineCorrect).length,improvedCorrect:report.rows.filter(r=>r.improvedCorrect).length,improvedProposed:report.rows.filter(r=>r.improved.color!==null).length,improvedUnreported:report.rows.filter(r=>r.improved.color===null).length,wrongImprovedProposals:report.rows.filter(r=>r.improved.color!==null&&!r.improvedCorrect).length,automaticColorSaves:0,primaryGarmentColorAcceptanceEstablished:false};
 await writeFile('research/parallel68/results/color-'+split+'.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary));
}finally{await sam.dispose();}
