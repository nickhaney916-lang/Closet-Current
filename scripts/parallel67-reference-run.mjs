// Standalone actual reference pipeline; all output proposals require review.
import {RawImage} from '@huggingface/transformers';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {gzipSync} from 'node:zlib';
import {loadFlorenceGrounder67,FLORENCE67} from '../research/parallel67-reference/florence-grounder.mjs';
import {loadSam2Reference67,SAM2_REFERENCE_67} from '../research/parallel67-reference/sam2-mask.mjs';
import {pixelColor67} from '../research/parallel67/color.mjs';
const cohort=process.argv[2]||'diagnostic';
let rows;
if(cohort==='diagnostic'){
 const data=JSON.parse(await readFile('benchmark/locked-photo-sources.json'));
 rows=['commons-0003','commons-0014','commons-0049','commons-0059','commons-0078'].map(id=>({...data.find(x=>x.id===id),path:'benchmark/fixtures/'+data.find(x=>x.id===id).image}));
}else if(cohort==='fashionpedia'){
 const data=JSON.parse(await readFile('research/parallel67-reference/fashionpedia/manifest.json'));
 rows=data.rows||data.images;
 if(!Array.isArray(rows)||rows.length!==8)throw Error('Frozen human-reference cohort unavailable');
 rows=rows.map(x=>({...x,id:String(x.id??x.image_id),path:x.localPath||('benchmark/parallel67-reference-photos/'+(x.image||x.file_name))}));
}else throw Error('Unknown reference cohort');
const root='research/parallel67-reference/results';await mkdir(root,{recursive:true});
await mkdir('benchmark/parallel67-reference-masks',{recursive:true});
const output=root+'/reference-'+cohort+'.json';let report;
try{report=JSON.parse(await readFile(output));}catch{}
const protocolBytes=await readFile('research/parallel67-reference/protocol.json'),protocolSha256=createHash('sha256').update(protocolBytes).digest('hex');
if(report&&report.protocolSha256!==protocolSha256)throw Error('Frozen evaluation protocol changed');
report??={format:'closet-current-parallel67-grounded-reference/v1',cohort,protocolSha256,florence:FLORENCE67,sam2:SAM2_REFERENCE_67,automaticSave:false,notBlindAcceptance:true,rows:[]};
console.log('Loading actual caption/grounding and mask models');
const grounder=await loadFlorenceGrounder67(),segmenter=await loadSam2Reference67();
try{
 for(const row of rows){
  if(report.rows.some(x=>x.id===row.id))continue;
  const bytes=await readFile(row.path),sha256=createHash('sha256').update(bytes).digest('hex');
  if(sha256!==row.sha256)throw Error('Source JPEG SHA mismatch');
  const image=await RawImage.read(row.path),start=performance.now();
  const cacheFile=root+'/grounding-'+cohort+'-'+row.id+'.json';let cached;
  try{cached=JSON.parse(await readFile(cacheFile));}catch{}
  if(cached&&(cached.sha256!==sha256||cached.protocolSha256!==protocolSha256))throw Error('Grounding receipt changed');
  const detection=cached?.detection||await grounder.detect(image);
  const detectionMs=cached?.elapsedMs??(performance.now()-start);
  if(!cached)await writeFile(cacheFile,JSON.stringify({sha256,protocolSha256,elapsedMs:detectionMs,detection},null,2)+'\n');
  const regions=detection.regions;
  let segmentationMs=0;
  if(regions.length){
   const began=performance.now(),segmented=await segmenter.segment(image,regions.map(x=>x.box));segmentationMs=performance.now()-began;
   for(let i=0;i<regions.length;i++){
    const mask=segmented.masks[i],maskFile='benchmark/parallel67-reference-masks/'+cohort+'-'+row.id+'-'+i+'.bin.gz';
    await writeFile(maskFile,gzipSync(mask));
    const histogram={};let foregroundPixels=0;
    // Pixel color is a measured proposal, not verified color correctness.
    for(let j=0;j<mask.length;j++)if(mask[j]){foregroundPixels++;const p=j*image.channels;const color=pixelColor67(image.data[p],image.data[p+1],image.data[p+2]);histogram[color]=(histogram[color]||0)+1;}
    const palette=Object.entries(histogram).sort((a,b)=>b[1]-a[1]).map(([color,count])=>({color,fraction:count/foregroundPixels}));
    Object.assign(regions[i],{maskFile,maskSha256:createHash('sha256').update(mask).digest('hex'),foregroundPixels,predictedMaskIoU:segmented.predictedIoUs[i],objectScoreLogit:segmented.objectScores[i],maskQualityVerified:false,colorProposal:{color:palette[0]?.fraction>=.72?palette[0].color:'Multicolor',palette,verified:false,requiresReview:true}});
   }
  }
  report.rows.push({id:row.id,sha256,width:image.width,height:image.height,source:row.source||row.primaryPage||null,elapsedMs:detectionMs+segmentationMs,detectionMs,segmentationMs,usedCachedGrounding:Boolean(cached),...detection});
  await writeFile(output,JSON.stringify(report,null,2)+'\n');
  console.log(row.id,regions.map(x=>x.label+' ['+x.category+']').join(' | ')||'NO GARMENT REGIONS',Math.round(performance.now()-start)+'ms');
  globalThis.gc?.();
 }
 report.processPeakResidentBytes=process.resourceUsage().maxRSS*1024;await writeFile(output,JSON.stringify(report,null,2)+'\n');
}finally{await grounder.dispose();await segmenter.dispose();}
