import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {independentScorer67,loadIndependentVectors67,reviewOnly67,MODELS67} from '../research/parallel67/independent-scorer.mjs';
import {localCandidates} from '../public/local-catalog.mjs';
test('independent learned bundles retain complete exact production vocabulary and SHA',async()=>{
 const original=JSON.parse(await readFile('public/recognition-vectors.json'));
 for(const key of ['marqo','marqoclip']){
  const metadata=JSON.parse(await readFile('research/parallel67/assets/'+key+'.json'));
  const bytes=await readFile('research/parallel67/assets/'+key+'.bin');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),metadata.sha256);
  assert.deepEqual(metadata.labels,original.labels);assert.equal(metadata.revision,MODELS67[key].revision);
  const vectors=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4);
  for(let start=0;start<vectors.length;start+=metadata.dimensions)assert.ok(Math.abs(Math.hypot(...vectors.subarray(start,start+metadata.dimensions))-1)<1e-5);
  let calls=0;const score=independentScorer67(async()=>{calls++;return vectors.subarray(0,metadata.dimensions);},metadata,vectors),image={};
  const labels=localCandidates.map(x=>x.label),ranked=await score(image,labels);
  assert.equal(ranked.length,labels.length);assert.ok(Math.abs(ranked.reduce((sum,x)=>sum+x.score,0)-1)<1e-8);
  await score(image,labels);assert.equal(calls,1);
  await assert.rejects(score(image,['unknown-label']));
  assert.throws(()=>independentScorer67(()=>{}, {...metadata,revision:'0'.repeat(40)},vectors));
 }
});
test('asset loader rejects changed bytes instead of accepting a pinned filename',async()=>{
 const metadata=JSON.parse(await readFile('research/parallel67/assets/marqo.json'));
 await assert.rejects(loadIndependentVectors67('meta','bin',{fetcher:async url=>url==='meta'?{ok:true,json:async()=>metadata}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(4)}}),/SHA mismatch/);
});
test('candidate proposals cannot masquerade as automatic save-ready baseline results',()=>{
 const proposal={strong:true,categoryConfirmed:true,choices:[{category:'Shoes',itemType:'Ankle boots'}],details:{color:'Black'}};
 for(const key of ['marqo','marqoclip']){
  const result=reviewOnly67(proposal,key);assert.equal(result.strong,false);assert.equal(result.categoryConfirmed,false);assert.equal(result.requiresReview,true);assert.deepEqual(result.details,{});assert.equal(result.independent67.proposalStrong,true);
  assert.equal(proposal.strong,true);result.choices[0].itemType='Sneakers';assert.equal(proposal.choices[0].itemType,'Ankle boots');
 }
 assert.throws(()=>reviewOnly67(proposal,'baseline'));
});
test('new evidence is frozen exploratory AI review and never relabeled as human acceptance',async()=>{
 const bytes=await readFile('research/parallel67/new-photos/reviewed-development.json');
 const expected=(await readFile('research/parallel67/new-photos/reviewed-development.sha256','utf8')).split(/\s/)[0];
 assert.equal(createHash('sha256').update(bytes).digest('hex'),expected);
 const data=JSON.parse(bytes);assert.equal(data.notHumanGroundTruth,true);assert.equal(data.notBlindAcceptance,true);
 assert.equal(data.rows.length,19);assert.equal(new Set(data.rows.map(x=>x.sha256)).size,19);
 for(const row of data.rows){assert.equal(row.humanVerified,false);assert.equal(row.blindAcceptance,false);assert.equal(row.verified,false);assert.match(row.sha256,/^[a-f0-9]{64}$/);}
});
