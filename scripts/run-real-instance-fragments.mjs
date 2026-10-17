// Real model evidence for connected semantic components, NOT individual items.
// A jacket and shirt may share class 4 even if they are physically separate.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {AutoModelForSemanticSegmentation,AutoProcessor,RawImage,env} from '@huggingface/transformers';
import sharp from 'sharp';
import {clothingLabelMap} from '../public/outfit-segmentation.mjs';
import {semanticFragmentEvidence,validateInstanceMaskProposals} from '../benchmark/garment-instance-evidence.mjs';
const output=process.argv[2]||'benchmark/instance-fragments-review';
const [manifest,locked,fresh]=await Promise.all([
 readFile('benchmark/expanded-outfit-review-manifest.json','utf8').then(JSON.parse),
 readFile('benchmark/locked-photo-sources.json','utf8').then(JSON.parse),
 readFile('benchmark/manifest-fresh-11.json','utf8').then(JSON.parse)
]);
const sourceMap=new Map([...locked,...fresh].map(x=>[x.id,x]));
if(manifest.length!==8||new Set(manifest.map(x=>x.id)).size!==8)throw Error('Invalid test manifest');
const modelId='Xenova/segformer_b0_clothes',revision='a2489ea8e7ec1ee912190546bad31a4906ccca76';
const report={status:'running',modelId,revision,environment:'GitHub Actions CPU fp32',
 independentInstanceMasksAvailable:false,manualReferenceMasksAvailable:false,
 physicalInstancesMeasured:false,productionAuthorized:false,
 originalSourcePreserved:true,realDeviceBenchmark:false,cases:[]};
await mkdir(output,{recursive:true});
const save=()=>writeFile(join(output,'summary.json'),JSON.stringify(report,null,2));
await save();
env.allowLocalModels=false;
const loadStart=performance.now();
const processor=await AutoProcessor.from_pretrained(modelId,{revision});
const model=await AutoModelForSemanticSegmentation.from_pretrained(modelId,{
 revision,device:'cpu',dtype:'fp32'
});
report.modelLoadMs=Math.round(performance.now()-loadStart);
try{
 for(const item of manifest){
   const source=sourceMap.get(item.id);
   if(!source?.verified||!/^[a-f0-9]{64}$/.test(source.sha256))throw Error('Invalid locked photo source');
   const path=join('benchmark/photos',source.image),bytes=await readFile(path);
   if(createHash('sha256').update(bytes).digest('hex')!==source.sha256)
     throw Error('Source bytes changed '+item.id);
   const t=performance.now(),photo=await RawImage.read(path);
   const result=await model(await processor(photo));
   const map=clothingLabelMap(result.logits.data,result.logits.dims);
   const fragments=semanticFragmentEvidence(map,{minimumPixels:12});
   const admission=validateInstanceMaskProposals({sourceSha256:source.sha256,
     semanticMap:map,proposals:[]});
   const inferMs=Math.round(performance.now()-t),pw=450,
     ph=Math.max(1,Math.round(photo.height*pw/photo.width));
   const canvas=await sharp(bytes).resize(pw,ph).png().toBuffer();
   const boxes=fragments.fragments.filter(x=>x.pixels>=24).slice(0,18).map(f=>{
     const b=f.bbox,scaleX=pw/map.width,scaleY=ph/map.height;
     const x=Math.round(b.left*scaleX),y=Math.round(b.top*scaleY),
           w=Math.max(1,Math.round((b.right-b.left)*scaleX)),
           h=Math.max(1,Math.round((b.bottom-b.top)*scaleY));
     return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+
       '" fill="none" stroke="'+(f.semanticClass===4?'#e63775':f.semanticClass===5?'#0569ad':'#a05b0c')+
       '" stroke-width="2"/><text x="'+x+'" y="'+Math.max(16,y-3)+
       '" font-family="sans-serif" font-size="16" fill="#111">'+f.semanticClass+'</text>';
   }).join('');
   const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="'+pw+'" height="'+ph+'">'+boxes+'</svg>');
   const overlay=await sharp(canvas).composite([{input:svg,left:0,top:0}]).png().toBuffer();
   const header=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="72"><rect width="900" height="72" fill="white"/><g fill="#222" font-family="sans-serif" font-size="19"><text x="10" y="26">Original source</text><text x="460" y="26">Semantic regions (not clothing instances)</text></g><text x="10" y="53" font-size="14" fill="#666">Class 4 = shirt OR jacket · 6 = pants OR shorts · boxes are diagnostic only</text></svg>');
   await sharp({create:{width:pw*2,height:ph+72,channels:3,background:'white'}})
     .composite([{input:header,left:0,top:0},{input:canvas,left:0,top:72},
       {input:overlay,left:pw,top:72}])
     .png().toFile(join(output,item.id+'-fragment-diagnostic.png'));
   const classes=fragments.counts.map(c=>({classId:c.semanticClass,
     regions:c.retainedFragments,noise:c.rejectedSmallFragments}));
   const record={id:item.id,expectedScenario:item.scenario,
     sourceSha256:source.sha256,sourceUrl:source.attribution.source,
     license:source.attribution.license,semanticWidth:map.width,semanticHeight:map.height,
     inferenceAndPreprocessingMs:inferMs,personDetected:map.personDetected,
     semanticComponents:classes,
     upperComponents:classes.find(x=>x.classId===4)?.regions??0,
     fragmentCount:fragments.fragments.length,
     instanceMaskProposals:admission.inputProposalCount,
     physicalInstancesVerified:false,autoCreatedItems:admission.autoCreatedItems,
     originalPreserved:true,independentMaskReferenceMissing:true};
   report.cases.push(record);await save();
   console.log('INSTANCE_FRAGMENT_CASE '+JSON.stringify(record));
 }
 report.status='complete';await save();
}finally{await model.dispose();}
