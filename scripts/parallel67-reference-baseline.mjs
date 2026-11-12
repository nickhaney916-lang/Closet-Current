// Actual unchanged native SegFormer output and grouping, no oracle prompts.
import {AutoModelForSemanticSegmentation,AutoProcessor,RawImage} from '@huggingface/transformers';
import {clothingLabelMap,clothingMaskGroups} from '../public/outfit-segmentation.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {performance} from 'node:perf_hooks';
const modelId='Xenova/segformer_b0_clothes',revision='a2489ea8e7ec1ee912190546bad31a4906ccca76';
const bytes=await readFile('research/parallel67-reference/fashionpedia/manifest.json'),manifest=JSON.parse(bytes);
const report={format:'closet-current-parallel67-human-mask-baseline/v1',model:modelId,revision,dtype:'fp32',runtime:'Transformers.js 3.8.1 CPU',manifestSha256:createHash('sha256').update(bytes).digest('hex'),notBlindAcceptance:true,rows:[]};
const processor=await AutoProcessor.from_pretrained(modelId,{revision});
const model=await AutoModelForSemanticSegmentation.from_pretrained(modelId,{revision,dtype:'fp32',device:'cpu',session_options:{intraOpNumThreads:2,interOpNumThreads:1}});
await mkdir('benchmark/parallel67-reference-masks',{recursive:true});
for(const row of manifest.rows){
 const path='benchmark/parallel67-reference-photos/'+row.image,bytes=await readFile(path),sha256=createHash('sha256').update(bytes).digest('hex');if(sha256!==row.sha256)throw Error('Original dataset JPEG changed');
 const image=await RawImage.read(path),start=performance.now();
 const output=await model(await processor(image)),map=clothingLabelMap(output.logits.data,output.logits.dims);
 const groups=map.personDetected?clothingMaskGroups(map):[];
 const regions=[];
 for(let i=0;i<groups.length;i++){
  const group=groups[i],mask=new Uint8Array(image.width*image.height);
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)mask[y*image.width+x]=group.selected[Math.min(map.height-1,Math.floor(y*map.height/image.height))*map.width+Math.min(map.width-1,Math.floor(x*map.width/image.width))];
  const maskFile='benchmark/parallel67-reference-masks/baseline-'+row.id+'-'+i+'.bin.gz';await writeFile(maskFile,gzipSync(mask));
  regions.push({label:group.label,categories:group.categories,confidence:group.confidence,maskFile,maskSha256:createHash('sha256').update(mask).digest('hex')});
 }
 report.rows.push({id:row.id,sha256,width:image.width,height:image.height,personDetected:map.personDetected,regions,elapsedMs:performance.now()-start});
 console.log(row.id,regions.map(x=>x.label).join(' | '));
}
report.processPeakResidentBytes=process.resourceUsage().maxRSS*1024;
await writeFile('research/parallel67-reference/results/segformer-fashionpedia.json',JSON.stringify(report,null,2)+'\n');await model.dispose();
