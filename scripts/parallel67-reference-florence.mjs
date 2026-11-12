// Reproduce the Florence grounding stage of the published Grounded-SAM-2
// example with a pinned CPU-compatible base-ft export. Never save a wardrobe.
import {AutoProcessor,Florence2ForConditionalGeneration,RawImage} from '@huggingface/transformers';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
const modelId='onnx-community/Florence-2-base-ft';
const revision='e88a44eaf3791a35eae0c5a47b3dbcd36e67eb6f';
const cohort=process.argv[2]||'diagnostic';
const tasks=Object.freeze([
 {task:'<OD>',input:''},
 {task:'<DENSE_REGION_CAPTION>',input:''},
 {task:'<MORE_DETAILED_CAPTION>',input:''},
 {task:'<OPEN_VOCABULARY_DETECTION>',input:'shirt. blouse. sweatshirt. tunic. dress. skirt. trousers. shoes. sneakers. boots.'}
]);
const old=JSON.parse(await readFile('benchmark/locked-photo-sources.json'));
const oldTruth=JSON.parse(await readFile('benchmark/manifest-holdout-16.json'));
const newTruth=JSON.parse(await readFile('research/parallel67/new-photos/reviewed-development.json'));
let rows;
if(cohort==='diagnostic'){
 const ids=['commons-0003','commons-0014','commons-0049','commons-0059','commons-0078'];
 rows=ids.map(id=>({...old.find(x=>x.id===id),...oldTruth.find(x=>x.id===id),path:'benchmark/fixtures/'+old.find(x=>x.id===id).image}));
 rows.push(...newTruth.rows.filter(x=>['p67-new-0006','p67-new-0023','p67-new-0030'].includes(x.id)).map(x=>({...x,path:'benchmark/parallel67-photos/'+x.image})));
}else if(cohort==='new')rows=newTruth.rows.map(x=>({...x,path:'benchmark/parallel67-photos/'+x.image}));
else throw Error('Unknown frozen cohort');
await mkdir('research/parallel67-reference/results',{recursive:true});
const output='research/parallel67-reference/results/florence-'+cohort+'.json';
let previous;
try{previous=JSON.parse(await readFile(output));}catch{}
if(previous&&(previous.model!==modelId||previous.revision!==revision||JSON.stringify(previous.tasks)!==JSON.stringify(tasks)))throw Error('Existing evidence has different model or tasks');
const report=previous||{format:'closet-current-parallel67-reference-florence/v1',model:modelId,revision,dtype:'q8',runtime:'Transformers.js 3.8.1 CPU',referenceCommit:'b7a9c29f196edff0eb54dbe14588d7ae5e3dde28',notBlindAcceptance:true,automaticSave:false,tasks,rows:[]};
console.log('Loading pinned Florence-2; no private photos or remote inference');
const start=performance.now();
const model=await Florence2ForConditionalGeneration.from_pretrained(modelId,{revision,dtype:'q8',device:'cpu'});
const processor=await AutoProcessor.from_pretrained(modelId,{revision});
report.loadMs=performance.now()-start;
for(const row of rows){
 const bytes=await readFile(row.path),sha256=createHash('sha256').update(bytes).digest('hex');
 if(sha256!==row.sha256)throw Error('Original source changed');
 let result=report.rows.find(x=>x.id===row.id);
 if(!result){result={id:row.id,sha256,expectedCategory:row.expectedCategory,expectedType:row.expectedType,source:row.source,width:row.width,height:row.height,tasks:[]};report.rows.push(result);}
 const image=await RawImage.read(row.path);result.width=image.width;result.height=image.height;
 for(const spec of tasks){
  if(result.tasks.some(x=>x.task===spec.task))continue;
  const began=performance.now(),inputs=await processor(image,processor.construct_prompts(spec.task+spec.input));
  const generated=await model.generate({...inputs,max_new_tokens:160,do_sample:false,num_beams:1});
  const raw=processor.batch_decode(generated,{skip_special_tokens:false})[0];
  let parsed,parser='native',parseError=null;
  try{parsed=processor.post_process_generation(raw,spec.task,image.size);}catch(error){
   if(spec.task==='<OPEN_VOCABULARY_DETECTION>'&&!/<poly>|<sep>/i.test(raw)){
    parsed={[spec.task]:processor.post_process_generation(raw,'<OD>',image.size)['<OD>']};parser='native-OD-bbox-parser-for-unsupported-open-vocabulary-task';
   }else{parseError='UNSUPPORTED_GENERATED_FORMAT';parsed=null;}
  }
  result.tasks.push({task:spec.task,input:spec.input,raw,parsed,parser,parseError,elapsedMs:performance.now()-began});
  await writeFile(output,JSON.stringify(report,null,2)+'\n');
  console.log(row.id,spec.task,JSON.stringify(parsed),Math.round(performance.now()-began)+'ms');
 }
}
await model.dispose();
