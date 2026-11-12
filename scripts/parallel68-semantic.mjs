import {assertAcceptance68} from '../research/parallel68/acceptance-guard.mjs';
import {AutoModelForSemanticSegmentation,AutoProcessor,RawImage} from '@huggingface/transformers';
import {clothingLabelMap,clothingMaskGroups} from '../public/outfit-segmentation.mjs';
import {clothingInstances68} from '../research/parallel68/semantic-instances.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {performance} from 'node:perf_hooks';
const split=process.argv[2]||'development',manifestPath=process.argv[3]||'research/parallel67-reference/fashionpedia/manifest.json',directory=process.argv[4]||'benchmark/parallel67-reference-photos';
const bytes=await readFile(manifestPath),manifest=JSON.parse(bytes),modelId='Xenova/segformer_b0_clothes',revision='a2489ea8e7ec1ee912190546bad31a4906ccca76';
const acceptanceReceipt=split==='acceptance'?await assertAcceptance68('mask',manifestPath):null;
const processor=await AutoProcessor.from_pretrained(modelId,{revision}),model=await AutoModelForSemanticSegmentation.from_pretrained(modelId,{revision,dtype:'fp32',device:'cpu',session_options:{intraOpNumThreads:2,interOpNumThreads:1}});
await mkdir('benchmark/parallel68-masks',{recursive:true});await mkdir('research/parallel68/results',{recursive:true});
const reports=Object.fromEntries(['baseline','components'].map(mode=>[mode,{schema:'closet-current-parallel68-semantic-instances/v1',mode,split,manifestSha256:createHash('sha256').update(bytes).digest('hex'),model:modelId,revision,dtype:'fp32',automaticSave:false,acceptanceReceipt,rows:[]}]));
try{
 for(const row of manifest.rows){
  const path=directory+'/'+row.image,source=await readFile(path),sha256=createHash('sha256').update(source).digest('hex');if(sha256!==row.sha256)throw Error('Original SHA mismatch');
  const image=await RawImage.read(path),start=performance.now(),inputs=await processor(image),output=await model(inputs),map=clothingLabelMap(output.logits.data,output.logits.dims);const inferenceMs=performance.now()-start;
  output.logits.dispose?.();for(const x of Object.values(inputs))x?.dispose?.();
  for(const [mode,grouping]of [['baseline',clothingMaskGroups],['components',clothingInstances68]]){
   const groups=map.personDetected?grouping(map):[],regions=[];
   for(let i=0;i<groups.length;i++){
    const group=groups[i],mask=new Uint8Array(image.width*image.height);
    for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)mask[y*image.width+x]=group.selected[Math.min(map.height-1,Math.floor(y*map.height/image.height))*map.width+Math.min(map.width-1,Math.floor(x*map.width/image.width))];
    const maskFile='benchmark/parallel68-masks/'+mode+'-'+split+'-'+row.id+'-'+i+'.bin.gz';await writeFile(maskFile,gzipSync(mask));
    regions.push({label:group.label,categories:group.categories,confidence:group.confidence,maskFile,maskSha256:createHash('sha256').update(mask).digest('hex'),instanceMethod:group.instanceMethod||'native_semantic_group',requiresReview:true,itemType:'Unknown',colorVerified:false});
   }
   reports[mode].rows.push({id:row.id,sha256,width:image.width,height:image.height,regions,inferenceMs,elapsedMs:inferenceMs,requiresReview:true,automaticSave:false});
  }
  console.log(row.id,reports.baseline.rows.at(-1).regions.length,'->',reports.components.rows.at(-1).regions.length);globalThis.gc?.();
 }
 for(const [mode,report]of Object.entries(reports)){report.processPeakResidentBytes=process.resourceUsage().maxRSS*1024;await writeFile('research/parallel68/results/semantic-'+mode+'-'+split+'.json',JSON.stringify(report,null,2)+'\n');}
}finally{await model.dispose();}
