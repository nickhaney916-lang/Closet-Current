// Reproduce the actual P834 engine, without substituting raw top-one for accepted accuracy.
import {AutoProcessor,CLIPVisionModelWithProjection,SiglipVisionModel,RawImage} from '@huggingface/transformers';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {makeVectorScorer} from '../public/vector-scorer.mjs';
import {prepareRecognitionPhoto,fitWholePhoto} from '../public/recognition-photo.mjs';
import {recognizeWithRecovery} from '../public/recognition-engine.mjs';
import {localCandidates} from '../public/local-catalog.mjs';
import {independentScorer67} from '../research/parallel67/independent-scorer.mjs';
const key=process.env.CANDIDATE67;
const asset=key?'research/parallel67/assets/'+key:'public/recognition-vectors';
const metadata=JSON.parse(await readFile(asset+'.json'));
const bytes=await readFile(asset+'.bin');
if(createHash('sha256').update(bytes).digest('hex')!==metadata.sha256)throw Error('Vector SHA');
const vectors=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4);
const processor=await AutoProcessor.from_pretrained(metadata.model,{revision:metadata.revision});
const vision=await (key==='marqo'?SiglipVisionModel:CLIPVisionModelWithProjection).from_pretrained(metadata.model,{revision:metadata.revision,dtype:'q8',device:'cpu'});
const scorer=prepare=>(key?independentScorer67:makeVectorScorer)(async image=>(await vision(await processor(await prepare(image)))).image_embeds.data,metadata,vectors);
const whole=scorer(image=>prepareRecognitionPhoto(image,RawImage));
const center=scorer(image=>prepareRecognitionPhoto(image,RawImage,{confirmation:true}));
const options={confirmationModel:center,skirtPaddingModel:scorer(image=>prepareRecognitionPhoto(image,RawImage,{contentSizeOverride:288})),coatNearFullModel:scorer(image=>prepareRecognitionPhoto(image,RawImage,{contentSizeOverride:334})),recoveryModel:scorer(image=>fitWholePhoto(image,RawImage)),recoveryConfirmationModel:scorer(async image=>image)};
const document=JSON.parse(await readFile(process.argv[2]||'benchmark/manifest-holdout-16.json'));
const manifest=document.rows||document;
const directory=process.argv[3]||'benchmark/fixtures',output=process.argv[4]||'research/parallel67/'+(key||'baseline')+'-engine-development-results.json';
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json'));
const rows=[];
for(const row of manifest){
 const bytes=await readFile(directory+'/'+row.image),sha256=createHash('sha256').update(bytes).digest('hex');
 if((row.sha256||sources.find(x=>x.id===row.id)?.sha256)!==sha256)throw Error('Source SHA');
 const start=performance.now(),image=await RawImage.read(directory+'/'+row.image);
 const raw=await whole(image,localCandidates.map(x=>x.label));
 const result=await recognizeWithRecovery(whole,image,options);
 const top=localCandidates.find(x=>x.label===raw[0].label);
 rows.push({id:row.id,sha256,expectedCategory:row.expectedCategory,expectedType:row.expectedType,acceptedTypes:row.acceptedTypes||[row.expectedType],rawCategory:top.category,rawType:top.itemType,result,elapsedMs:performance.now()-start});
 console.log(row.id,top.itemType,result.strong,result.choices?.[0]?.itemType);
}
await writeFile(output,JSON.stringify({model:metadata.model,revision:metadata.revision,runtime:'CPU q8; browser parity must be separately verified',cohort:'development diagnostics only',rows},null,2)+'\n');await vision.dispose();
