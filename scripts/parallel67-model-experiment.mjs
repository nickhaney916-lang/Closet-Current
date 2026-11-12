// Isolated genuine inference; historical public photos are development diagnostics.
import {AutoTokenizer,AutoProcessor,SiglipTextModel,SiglipVisionModel,CLIPTextModelWithProjection,CLIPVisionModelWithProjection,RawImage,env} from '@huggingface/transformers';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import sharp from 'sharp';
import {localCandidates} from '../public/local-catalog.mjs';
env.backends.onnx.wasm.numThreads=1;
const candidate=process.argv[2]||'marqo';
const specs={marqoclip:['Marqo/marqo-fashionCLIP','44f4c655124ed71e90cbf528d82f508d69d8a81b'],marqo:['Marqo/marqo-fashionSigLIP','c56244cc94f92419e8369fa71efdaf403b124ce8'],siglip2:['onnx-community/siglip2-base-patch16-224-ONNX','ba1f3b0843f24bc5417d38e19c37b287d719b2f4']};
if(!specs[candidate])throw Error('Unknown frozen candidate');
const [model,revision]=specs[candidate],options={revision,dtype:'q8',device:'cpu'};
const output='research/parallel67';await mkdir(output,{recursive:true});
const normalize=v=>{const n=Math.hypot(...v);if(!n||!Number.isFinite(n))throw Error('Invalid embedding');return Array.from(v,x=>x/n);};
const labels=localCandidates.map(x=>x.label),prompts=labels.map(x=>'A photo of '+x+'.');
const vectorsPath=output+'/'+candidate+'-vectors.json';let vectors;
try{const saved=JSON.parse(await readFile(vectorsPath));if(saved.revision!==revision||JSON.stringify(saved.labels)!==JSON.stringify(labels))throw Error('Wrong cached vectors');vectors=saved.vectors;}catch{
 console.log('TEXT_MODEL_LOADING',candidate);
 const tokenizer=await AutoTokenizer.from_pretrained(model,{revision});
 const text=await (candidate==='marqoclip'?CLIPTextModelWithProjection:SiglipTextModel).from_pretrained(model,options);vectors=[];
 for(let i=0;i<prompts.length;i+=8){
  const result=await text(tokenizer(prompts.slice(i,i+8),{padding:'max_length',max_length:candidate==='marqoclip'?77:64,truncation:true}));
  const tensor=result.text_embeds||result.pooler_output;if(!tensor)throw Error('Missing text embedding');
  vectors.push(...tensor.tolist().map(normalize));
 }
 await text.dispose();await writeFile(vectorsPath,JSON.stringify({model,revision,labels,prompts,dtype:'q8',vectors})+'\n');
}
console.log('VISION_MODEL_LOADING',candidate);
const started=performance.now();
const processor=await AutoProcessor.from_pretrained(model,{revision});
const vision=await (candidate==='marqoclip'?CLIPVisionModelWithProjection:SiglipVisionModel).from_pretrained(model,options);
const loadMs=performance.now()-started;
const document=JSON.parse(await readFile(process.argv[3]||'benchmark/manifest-holdout-16.json'));
const manifest=document.rows||document;
const photoDirectory=process.argv[4]||'benchmark/fixtures';
const suffix=process.argv[5]||'development';
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json'));
const rows=[];
for(const row of manifest){
 const bytes=await readFile(photoDirectory+'/'+row.image);
 const sha256=createHash('sha256').update(bytes).digest('hex');
 if((row.sha256||sources.find(x=>x.id===row.id)?.sha256)!==sha256)throw Error('Source SHA mismatch');
 const start=performance.now();
 // Whole-frame padding prevents processor center crop from losing hems/soles.
 const data=await sharp(bytes).resize(224,224,{fit:'contain',background:'#ffffff'}).removeAlpha().raw().toBuffer();
 const result=await vision(await processor(new RawImage(new Uint8Array(data),224,224,3)));
 const tensor=result.image_embeds||result.pooler_output;if(!tensor)throw Error('Missing vision embedding');
 const feature=normalize(tensor.data);
 const ranked=vectors.map((v,i)=>({...localCandidates[i],cosine:v.reduce((sum,x,j)=>sum+x*feature[j],0)})).sort((a,b)=>b.cosine-a.cosine);
 const top=ranked[0];const actual={id:row.id,sha256,expectedCategory:row.expectedCategory,expectedType:row.expectedType,acceptedTypes:row.acceptedTypes||[row.expectedType],category:top.category,itemType:top.itemType,cosine:top.cosine,margin:top.cosine-ranked[1].cosine,elapsedMs:performance.now()-start,top:ranked.slice(0,5)};
 rows.push(actual);console.log(row.id,actual.itemType,actual.expectedType,Math.round(actual.elapsedMs));
}
const garments=rows.filter(x=>x.expectedCategory!=='Uncategorized');
const report={candidate,model,revision,runtime:'Transformers.js 3.8.1 CPU q8',cohort:'P834 development-exposed diagnostics; NOT blind acceptance',loadMs,rows,summary:{garments:garments.length,rawCategoryCorrect:garments.filter(x=>x.category===x.expectedCategory).length,rawSubtypeCorrect:garments.filter(x=>x.acceptedTypes.includes(x.itemType)).length,negativeTop1Correct:rows.filter(x=>x.expectedCategory==='Uncategorized'&&x.category==='Uncategorized').length}};
await writeFile(output+'/'+candidate+'-'+suffix+'-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary));await vision.dispose();
