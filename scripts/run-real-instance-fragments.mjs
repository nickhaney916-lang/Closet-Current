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
import {dressClassCompetition} from '../benchmark/dress-class-competition.mjs';
const output=process.argv[2]||'benchmark/instance-fragments-review';
const [manifest,locked,fresh,legwear]=await Promise.all([
 readFile('benchmark/expanded-outfit-review-manifest.json','utf8').then(JSON.parse),
 readFile('benchmark/locked-photo-sources.json','utf8').then(JSON.parse),
 readFile('benchmark/manifest-fresh-11.json','utf8').then(JSON.parse),
 readFile('benchmark/manifest-visible-legwear-2.json','utf8').then(JSON.parse)
]);
const reviewPhotos=[...manifest,{id:'validation-0031',scenario:'blazer-shirt-skirt-tights-shoes'}];
const sourceMap=new Map([...locked,...fresh,...legwear].map(x=>[x.id,x]));
if(reviewPhotos.length!==9||new Set(reviewPhotos.map(x=>x.id)).size!==9)throw Error('Invalid test manifest');
const modelId='Xenova/segformer_b0_clothes',revision='a2489ea8e7ec1ee912190546bad31a4906ccca76';
const report={status:'running',modelId,revision,environment:'GitHub Actions CPU fp32',
 independentInstanceMasksAvailable:false,manualReferenceMasksAvailable:false,
 physicalInstancesMeasured:false,productionAuthorized:false,
 originalSourcePreserved:true,realDeviceBenchmark:false,
 garmentClassCompetitionOnly:true,cases:[]};
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
 for(const item of reviewPhotos){
   const source=sourceMap.get(item.id);
   if(!source?.verified||!/^[a-f0-9]{64}$/.test(source.sha256))throw Error('Invalid locked photo source');
   const path=join('benchmark/photos',source.image),bytes=await readFile(path);
   if(createHash('sha256').update(bytes).digest('hex')!==source.sha256)
     throw Error('Source bytes changed '+item.id);
   const t=performance.now(),photo=await RawImage.read(path);
   const result=await model(await processor(photo));
   const map=clothingLabelMap(result.logits.data,result.logits.dims);
   const fragments=semanticFragmentEvidence(map,{minimumPixels:12});
   const competition=dressClassCompetition(result.logits.data,result.logits.dims,map);
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
   const rgba=new Uint8Array(map.width*map.height*4),palette={
    4:[224,40,120],5:[21,93,213],6:[242,159,33]};
   for(let i=0;i<competition.diagnosticLabels.length;i++){
    const color=palette[competition.diagnosticLabels[i]];
    if(!color)continue;
    rgba[i*4]=color[0];rgba[i*4+1]=color[1];rgba[i*4+2]=color[2];rgba[i*4+3]=155;
   }
   const tint=await sharp(rgba,{raw:{width:map.width,height:map.height,channels:4}})
    .resize(pw,ph,{kernel:'nearest'}).png().toBuffer();
   const scored=await sharp(canvas).composite([{input:tint,left:0,top:0}]).png().toBuffer();
   const note=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="72"><rect width="900" height="72" fill="white"/><g font-family="sans-serif" fill="#222"><text x="12" y="27" font-size="18">Original verified photo</text><text x="461" y="27" font-size="18">Dress alternative model logits only</text><text x="12" y="53" font-size="13">Pink = upper garment, blue = skirt, amber = bottoms; not separate or verified items</text></g></svg>');
   await sharp({create:{width:pw*2,height:ph+72,channels:3,background:'white'}})
    .composite([{input:note,left:0,top:0},{input:canvas,left:0,top:72},
      {input:scored,left:pw,top:72}]).png()
    .toFile(join(output,item.id+'-dress-class-competition.png'));
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
     dressCompetition:{analysis:competition.analysis,
      selectedDressPixels:competition.selectedDressPixels,
      lowMarginPixels:competition.lowMarginPixels,
      lowMarginShareOfDress:competition.lowMarginShareOfDress,
      upperSkirtBottomsRunnerUp:competition.upperSkirtBottomsRunnerUp,
      ambiguousRegionBands:competition.ambiguousRegionBands,
      independentGarmentCountMeasured:false,
      automaticItemSplittingAuthorized:false,
      physicalGarmentCountVerified:0},
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
