import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 verifyHistoricalSource71,verifyPartitionReceipts71
} from '../scripts/parallel71-evidence.mjs';

const manifest=JSON.parse(await readFile('benchmark/manifest-holdout-16.json','utf8'));
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const clone=x=>structuredClone(x);
const sha='a'.repeat(64),indexSha='b'.repeat(64);

test('P71 publisher-verified historical 16 source manifests retain honest status',()=>{
 const entries=verifyHistoricalSource71(manifest,sources);
 assert.equal(entries.length,16);
 assert.equal(new Set(entries.map(x=>x.sourceSha256)).size,16);
 assert.ok(entries.every(x=>x.labelStatus.includes('development-exposed')));
 assert.ok(entries.every(x=>!x.hasHumanPrimaryColorLabel&&!x.hasHumanOwnedPairLabel));
});
test('P71 no credit for fabricated license, altered original, duplicate or relabeled truth',()=>{
 for(const change of [
  (m,s)=>{s.find(x=>x.id===m[0].id).attribution.license='';},
  (m,s)=>{s.find(x=>x.id===m[0].id).sha256='bad';},
  (m,s)=>{s.find(x=>x.id===m[0].id).sha256=s.find(x=>x.id===m[1].id).sha256;},
  (m,s)=>{s.find(x=>x.id===m[0].id).attribution.source='https://example.com/image.jpg';},
  (m,s)=>{m[0].source='https://example.com/forged-source';},
  (m,s)=>{m[0].image='crop-masquerading-as-original.jpg';},
  (m,s)=>{m[0].verified=false;},
  (m,s)=>{m[0].expectedCategory='Invented';},
  (m,s)=>{m.push(clone(m[0]));},
  (m,s)=>{m.pop();},
 ]){
  const m=clone(manifest),s=clone(sources);change(m,s);
  assert.throws(()=>verifyHistoricalSource71(m,s),/P71_EVIDENCE_BLOCKED/);
 }
});
test('P71 receipts prove full 8-of-16 partitions and exact manifest/index SHA',()=>{
 for(const browser of ['chromium','webkit'])for(const half of ['a','b']){
  const ids=manifest.filter((_,i)=>i%2===(half==='a'?0:1)).map(x=>x.id);
  const receipt={browser,partition:half,manifestSha256:sha,sourceIndexSha256:indexSha,sourceIds:ids};
  assert.equal(verifyPartitionReceipts71(manifest,receipt,sha,indexSha,browser,half),true);
  for(const modify of [
   r=>r.sourceIds.pop(),
   r=>r.sourceIds.reverse(),
   r=>{r.sourceIds[0]=r.sourceIds[1];},
   r=>{r.manifestSha256='f'.repeat(64);},
   r=>{r.sourceIndexSha256='e'.repeat(64);},
   r=>{r.browser='fabricated';},
  ]){
   const bad=clone(receipt);modify(bad);
   assert.throws(()=>verifyPartitionReceipts71(manifest,bad,sha,indexSha,browser,half),
    /P71_EVIDENCE_BLOCKED/);
  }
 }
});
