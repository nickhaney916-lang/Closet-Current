/**
 * Deterministic SYNTHETIC retrieval stress probe: never real-photo accuracy.
 * Model vectors here are generated labels, NOT FashionCLIP or human truth.
 * node scripts/benchmark-parallel77-cross-capture.mjs
 */
import {createRequire} from 'node:module';
import {performance} from 'node:perf_hooks';
const require=createRequire(import.meta.url),C=require('../public/cross-capture-duplicate-77.js');
function vector(seed){
 let x=(seed+1)*7919;const features=[];
 for(let i=0;i<512;i++){x=(Math.imul(x,1664525)+1013904223)>>>0;features.push((x/4294967295)*2-1);}
 return {modelKey:'synthetic-stable-model',features};
}
const sig=x=>Array(768).fill(x),profiles={};
for(const count of [100,500,1000]){
 const saved=Array.from({length:count},(_,i)=>({
  id:'owned-'+i,category:'Tops',visualSignature:sig(20),visualAspect:.8,recognitionMemory:vector(i)
 }));
 const matching=Array.from({length:10},(_,i)=>({
  id:'incoming-same-'+i,category:'Tops',visualSignature:sig(70),visualAspect:.8,
  recognitionMemory:vector(i)
 }));
 const different=Array.from({length:10},(_,i)=>({
  id:'incoming-different-'+i,category:'Tops',visualSignature:sig(20),visualAspect:.8,
  recognitionMemory:vector(count+50+i)
 }));
 const oldSame=matching.map(q=>saved.some(p=>C.baseline(q,p)));
 const oldDifferent=different.map(q=>saved.some(p=>C.baseline(q,p)));
 const start=performance.now();
 const matches=matching.map(q=>C.candidateRank(q,saved)),rejects=different.map(q=>C.candidateRank(q,saved));
 const elapsedMs=Math.round((performance.now()-start)*100)/100;
 const top1=matches.filter((r,i)=>r.top[0]?.id==='owned-'+i).length;
 const top3=matches.filter((r,i)=>r.top.some(x=>x.id==='owned-'+i)).length;
 const falseAlarms=rejects.filter(r=>!r.abstained).length;
 profiles[count]={queryCount:20,syntheticSamePairs:10,syntheticDifferentPairs:10,
  baseline:{sameRetrieval:oldSame.filter(Boolean).length,lookalikeFalseAlerts:oldDifferent.filter(Boolean).length},
  candidate77:{sameTop1:top1,sameTop3:top3,lookalikeFalseAlerts:falseAlarms,
   differentItemAbstentions:rejects.filter(x=>x.abstained).length,
   maxShortlist:Math.max(...matches.map(x=>x.top.length),...rejects.map(x=>x.top.length))},
  measuredNodeQueryBatchMs:elapsedMs,scannedRecordsPerQuery:count,
  estimatedDescriptorMetadataBytes:count*(768*8+512*8+100),
  jpegDecodedForCandidateRank:0,
  caveat:'SYNTHETIC descriptors and labels; no blind human-rated same-physical-item photos'};
 if(top1!==10||top3!==10||falseAlarms!==0)throw Error('Synthetic ranking regression '+count);
}
console.log(JSON.stringify({kind:'parallel77-reproducible-synthetic-proxy',version:C.VERSION,
 node:process.version,accuracyClaim:'UNKNOWN: 0 independent real same-physical-garment pairs',
 profiles},null,2));
