/** Numeric DEVELOPMENT comparisons only; no blind score or generated human labels. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const path=process.argv[2]||'benchmark/p82-chromium/results.json',raw=JSON.parse(await readFile(path,'utf8')),rows=raw.rows;
const quantile=(xs,p)=>[...xs].sort((a,b)=>a-b)[Math.max(0,Math.ceil(p*xs.length)-1)];
const first=(r,key)=>r.output.observations.find(x=>x.modelKey===key).ranking[0];
const exact=(r,c)=>c?.itemType===r.historicalExpectation.itemType;
const gains=rows.filter(r=>!exact(r,first(r,'fashionclip'))&&exact(r,r.decision.hypotheses[0])).map(r=>r.id),losses=rows.filter(r=>exact(r,first(r,'fashionclip'))&&!exact(r,r.decision.hypotheses[0])).map(r=>r.id);
const bootIds=new Set(['commons-0088','commons-0089','commons-0092','commons-0093','commons-0094']);
const report={...raw.summary,denominator:rows.length,independentAccuracy:null,countsMeaning:'Exact historical strings; generic Boots/Dress are not fine-subtype truth. Exposed development data only.',gains,losses,
 latency:{perPhotoTotalP50Ms:quantile(rows.map(r=>r.output.totalMs),.5),perPhotoTotalP95Ms:quantile(rows.map(r=>r.output.totalMs),.95),perModel:Object.fromEntries(['fashionclip','fashionSiglip'].map(key=>[key,{loadP50Ms:quantile(rows.map(r=>r.output.timings.find(t=>t.key===key).loadMs),.5),inferenceP50Ms:quantile(rows.map(r=>r.output.timings.find(t=>t.key===key).inferenceMs),.5)}]))},
 peakMemoryBytes:null,memoryNote:'Weight asset bytes are not peak resident/JS/WASM memory; no physical-device measurement.',
 knownBoots:rows.filter(r=>bootIds.has(r.id)).map(r=>({id:r.id,baselineType:r.output.baseline.choices?.[0]?.itemType||'Unknown',baselineReason:r.output.baseline.reason,hint:r.decision.hypotheses[0]?.itemType,machineType:r.decision.itemType})),
 negatives:rows.filter(r=>r.historicalExpectation.category==='Uncategorized').map(r=>({id:r.id,clip:first(r,'fashionclip').category,siglip:first(r,'fashionSiglip').category,status:r.decision.status})),
 byHistoricalCategory:Object.fromEntries([...new Set(rows.map(r=>r.historicalExpectation.category))].map(category=>{const group=rows.filter(r=>r.historicalExpectation.category===category);return [category,{n:group.length,clipCategory:group.filter(r=>first(r,'fashionclip').category===category).length,siglipCategory:group.filter(r=>first(r,'fashionSiglip').category===category).length,clipExact:group.filter(r=>exact(r,first(r,'fashionclip'))).length,fusedExact:group.filter(r=>exact(r,r.decision.hypotheses[0])).length,abstentions:group.filter(r=>r.decision.status==='abstain').length}];}))};
if(process.argv[3]){await mkdir(process.argv[3],{recursive:true});await writeFile(process.argv[3]+'/summary.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
