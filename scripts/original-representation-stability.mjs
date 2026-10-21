// Research diagnostic: same original frames, different encodings. No accuracy labels.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {packetFromLock,LOCK,LOCK_SHA,hash} from './source-holdout-human-review.mjs';
export const BASE='71053247402d2e428044ef38b359057011335823';
export const variants=['original','png-full','jpeg-2048-q94'];
export const modelFiles=['public/local-worker.mjs','public/local-catalog.mjs','public/recognition-engine.mjs','public/recognition-photo.mjs','public/recognition-vectors.bin','public/recognition-vectors.json','public/benchmark-runner.mjs'];
export const modelPins=()=>Object.fromEntries(modelFiles.map(p=>[p,hash(fs.readFileSync(p))]));
export function validateLineage(lineage){
 const packet=packetFromLock(fs.readFileSync(LOCK));
 assert.equal(lineage.lockedManifestSha256,LOCK_SHA,'Source lock mismatch');
 assert.deepEqual(lineage.modelPins,modelPins(),'Recognition/runner source changed');
 assert.ok(Array.isArray(lineage.rows)&&lineage.rows.length===packet.photos.length*variants.length,'Incomplete representation coverage');
 const originals=new Map(packet.photos.map(p=>[p.id,p]));const seen=new Set();
 for(const r of lineage.rows){
  const p=originals.get(r.sourceId);assert.ok(p&&variants.includes(r.variant),'Unknown source or representation');
  assert.equal(r.id,'repr-'+r.sourceId+'-'+r.variant);assert.ok(!seen.has(r.id),'Duplicate representation');seen.add(r.id);
  assert.equal(r.sourceSha256,p.sha256);assert.match(r.sha256,/^[a-f0-9]{64}$/);
  assert.equal(r.image,r.id+(r.variant==='png-full'?'.png':'.jpg'));
  assert.ok(Number.isSafeInteger(r.width)&&r.width>0&&Number.isSafeInteger(r.height)&&r.height>0);
  assert.ok(Number.isSafeInteger(r.byteLength)&&r.byteLength>0);assert.match(r.decodedPixelSha256,/^[a-f0-9]{64}$/);
  if(r.variant==='original')assert.equal(r.sha256,p.sha256,'Original bytes replaced');
  if(r.variant==='jpeg-2048-q94')assert.ok(Math.max(r.width,r.height)<=2048,'Resize limit exceeded');
 }
 for(const p of packet.photos){
  const rows=lineage.rows.filter(r=>r.sourceId===p.id);assert.equal(rows.length,variants.length);
  const original=rows.find(r=>r.variant==='original'),png=rows.find(r=>r.variant==='png-full');
  assert.equal(png.width,original.width);assert.equal(png.height,original.height);
  assert.equal(png.decodedPixelSha256,original.decodedPixelSha256,'PNG changed oriented sRGB pixels');
  const jpeg=rows.find(r=>r.variant==='jpeg-2048-q94'),scale=Math.min(1,2048/Math.max(original.width,original.height));
  assert.equal(jpeg.width,Math.max(1,Math.round(original.width*scale)));assert.equal(jpeg.height,Math.max(1,Math.round(original.height*scale)));
 }
 return lineage;
}
export function decision(p){
 assert.ok(p&&!p.error&&p.prediction,'Inference error or missing decision');
 const {category,type}=p.prediction;
 assert.ok((category===null||typeof category==='string')&&(type===null||typeof type==='string'));
 assert.equal(typeof p.strong,'boolean');assert.equal(typeof p.categoryConfirmed,'boolean');
 assert.ok(!p.strong||!p.categoryConfirmed&&category&&category!=='Uncategorized'&&type&&type!=='Unknown','Malformed strong decision');
 assert.ok(!p.categoryConfirmed||!p.strong&&category&&category!=='Uncategorized'&&type==='Unknown','Malformed category review');
 return {category,type,strong:p.strong,categoryConfirmed:p.categoryConfirmed};
}
export function score(lineage,predictions){
 validateLineage(lineage);assert.ok(Array.isArray(predictions)&&predictions.length===lineage.rows.length,'Incomplete inference');
 const map=new Map();for(const p of predictions){assert.ok(!map.has(p.id),'Duplicate inference');decision(p);map.set(p.id,p);}
 const historic=JSON.parse(fs.readFileSync('benchmark/independent-source-holdout/measurement-39538590277.json')).report.perPhoto;
 const cases=[];
 for(const sourceId of new Set(lineage.rows.map(r=>r.sourceId))){
  const rows=lineage.rows.filter(r=>r.sourceId===sourceId);
  const read=r=>{assert.ok(map.has(r.id),'Missing inference ID');return decision(map.get(r.id));};
  const baseline=read(rows.find(r=>r.variant==='original'));
  const previous=historic.find(r=>r.id===sourceId);assert.equal(previous.sourceSha256,rows[0].sourceSha256);
  cases.push({sourceId,sourceSha256:rows[0].sourceSha256,original:baseline,
   originalMatchesHistoricalDecision:JSON.stringify(baseline)===JSON.stringify(decision(previous)),
   comparisons:variants.slice(1).map(variant=>{
    const current=read(rows.find(r=>r.variant===variant));
    const sameType=current.category===baseline.category&&current.type===baseline.type;
    return {variant,decision:current,sameDecision:JSON.stringify(current)===JSON.stringify(baseline),
     typeOrCategoryChanged:!sameType,strongToDifferentStrong:baseline.strong&&current.strong&&!sameType,
     strongDeferred:baseline.strong&&!current.strong,newStrong:!baseline.strong&&current.strong};
   })});
 }
 const summary=Object.fromEntries(variants.slice(1).map(v=>{const a=cases.map(c=>c.comparisons.find(r=>r.variant===v));return [v,{
  pairedSources:a.length,sameDecision:a.filter(x=>x.sameDecision).length,typeOrCategoryChanged:a.filter(x=>x.typeOrCategoryChanged).length,
  strongToDifferentStrong:a.filter(x=>x.strongToDifferentStrong).length,strongDeferred:a.filter(x=>x.strongDeferred).length,newStrong:a.filter(x=>x.newStrong).length
 }];}));
 return {schemaVersion:1,sourceBase:BASE,lockedManifestSha256:LOCK_SHA,lineageSha256:hash(JSON.stringify(lineage)),
  rawResultsSha256:hash(JSON.stringify(predictions)),sourceCount:cases.length,inferenceCount:predictions.length,
  historicalOriginalDecisionsMatched:cases.filter(c=>c.originalMatchesHistoricalDecision).length,summary,cases,
  modelPins:lineage.modelPins,independentHumanGoldLabels:false,measuredAccuracy:null,productionPromotion:'BLOCKED',customerModelChanged:false,
  limitation:'Representation sensitivity only: a changed or stable decision does not prove correctness. Same 13 exposed discovery originals, not 39 independent sources. No physical phone or customer save tested. No tuning or policy promotion.'};
}
export async function prepare(originals,out){
 const sharp=(await import('sharp')).default,packet=packetFromLock(fs.readFileSync(LOCK));
 assert.ok(!fs.existsSync(out),'Preserve prior output; use a new directory');
 const sourceBytes=new Map(packet.photos.map(p=>{const b=fs.readFileSync(path.join(originals,p.image));assert.equal(hash(b),p.sha256,'Original source changed');return [p.id,b];}));
 fs.mkdirSync(out,{recursive:true});fs.mkdirSync('benchmark/photos',{recursive:true});const rows=[];
 const pixels=async b=>{const {data,info}=await sharp(b).rotate().toColourspace('srgb').removeAlpha().raw().toBuffer({resolveWithObject:true});return {width:info.width,height:info.height,decodedPixelSha256:hash(data)};};
 // Original files enter inference first; no clipping, masking or label-based transformations.
 for(const variant of variants)for(const p of packet.photos){
  const original=sourceBytes.get(p.id);let bytes=original;
  if(variant==='png-full')bytes=await sharp(original).rotate().toColourspace('srgb').removeAlpha().png().toBuffer();
  if(variant==='jpeg-2048-q94'){
   const dimensions=await pixels(original),scale=Math.min(1,2048/Math.max(dimensions.width,dimensions.height));
   bytes=await sharp(original).rotate().toColourspace('srgb').removeAlpha().resize(Math.max(1,Math.round(dimensions.width*scale)),Math.max(1,Math.round(dimensions.height*scale)),{fit:'fill'}).jpeg({quality:94,chromaSubsampling:'4:2:0'}).toBuffer();
  }
  const id='repr-'+p.id+'-'+variant,image=id+(variant==='png-full'?'.png':'.jpg');
  const destination=path.join('benchmark/photos',image);assert.ok(!fs.existsSync(destination),'Refuse overwrite');fs.writeFileSync(destination,bytes);
  rows.push({id,image,sourceId:p.id,variant,sourceSha256:p.sha256,sha256:hash(bytes),byteLength:bytes.length,...await pixels(bytes)});
 }
 const lineage={schemaVersion:1,lockedManifestSha256:LOCK_SHA,modelPins:modelPins(),rows};validateLineage(lineage);
 fs.writeFileSync(path.join(out,'lineage.json'),JSON.stringify(lineage,null,2)+'\n');
 fs.writeFileSync(path.join(out,'blind-manifest.json'),JSON.stringify(rows.map(({id,image})=>({id,image,mode:'single'})),null,2)+'\n');
 console.log('Prepared 39 full-frame inputs from 13 originals; all PNGs match oriented decoded sRGB pixels. No garment labels supplied.');
}
export function verifyScope(){
 const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();git('merge-base','--is-ancestor',BASE,'HEAD');
 const allowed=new Set(['scripts/original-representation-stability.mjs','tests/original-representation-stability.test.mjs','.github/workflows/original-representation-stability.yml','docs/ORIGINAL-REPRESENTATION-STABILITY.md','benchmark/representation-stability/measurement.json']);
 for(const p of git('diff','--name-only',BASE,'--').split('\n').filter(Boolean)){
  if(p==='docs/PROGRESS-CHECKPOINT.md')assert.ok(fs.readFileSync(p,'utf8').endsWith(execFileSync('git',['show',BASE+':'+p],{encoding:'utf8'})),'Historical checkpoint changed');
  else{assert.ok(allowed.has(p),'Unexpected source change: '+p);assert.equal(git('ls-tree',BASE,'--',p),'','Existing source changed');}
 }
 packetFromLock(fs.readFileSync(LOCK));console.log('Representation diagnostic only; original labels, customer source, models and thresholds unchanged.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [mode,...args]=process.argv.slice(2);
 if(mode==='prepare'&&args.length===2)await prepare(...args);
 else if(mode==='score'&&args.length===2){const lineage=JSON.parse(fs.readFileSync(path.join(args[0],'lineage.json'))),predictions=JSON.parse(fs.readFileSync(args[1]));
  // Recheck actual prepared bytes immediately after inference, not just metadata.
  for(const r of lineage.rows)assert.equal(hash(fs.readFileSync(path.join('benchmark/photos',r.image))),r.sha256,'Inference input bytes changed');
  const report=score(lineage,predictions);fs.writeFileSync(path.join(args[0],'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({sourceCount:report.sourceCount,inferenceCount:report.inferenceCount,historicalOriginalDecisionsMatched:report.historicalOriginalDecisionsMatched,summary:report.summary,productionPromotion:report.productionPromotion}));
 }else if(mode==='verify'&&!args.length)verifyScope();
 else throw Error('Usage: original-representation-stability.mjs prepare ORIGINALS NEW_OUTPUT | score OUTPUT RESULTS.json | verify');
}
