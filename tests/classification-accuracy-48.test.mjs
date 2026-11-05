import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateVectorBundle} from '../public/vector-scorer.mjs';
import {localCandidates} from '../public/local-catalog.mjs';

const dir='research/garment-classification-accuracy-48/';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const f32=bytes=>new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));

test('CLASSIFICATION48 candidate is a hash-verified pinned FashionCLIP text-vector bundle',async()=>{
 const metadata=JSON.parse(await readFile(dir+'candidate-assets/recognition-vectors.json','utf8'));
 const bytes=await readFile(dir+'candidate-assets/recognition-vectors.bin');
 assert.equal(metadata.model,'ff13/fashion-clip');
 assert.equal(metadata.revision,'0f99955d944c39bfd9d035a02ac273c7a44a406b');
 assert.equal(metadata.sha256,digest(bytes));
 assert.equal(metadata.classificationProfile,'accuracy48-prompt-ensemble-v1');
 const vectors=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4);
 validateVectorBundle(metadata,vectors);
});

test('CLASSIFICATION48 changes only documented subtype prompt rows; taxonomy and standard baseline remain unchanged',async()=>{
 const baseMeta=JSON.parse(await readFile('public/recognition-vectors.json','utf8'));
 const candidateMeta=JSON.parse(await readFile(dir+'candidate-assets/recognition-vectors.json','utf8'));
 const base=f32(await readFile('public/recognition-vectors.bin'));
 const next=f32(await readFile(dir+'candidate-assets/recognition-vectors.bin'));
 const prompts=JSON.parse(await readFile(dir+'prompt-overrides.json','utf8'));
 assert.deepEqual(candidateMeta.labels,baseMeta.labels);
 assert.deepEqual(Object.keys(prompts).sort(),Object.keys(candidateMeta.promptEnsembles).sort());
 assert.ok(Object.keys(prompts).length>=12);
 const changed=[];
 for(let row=0;row<baseMeta.labels.length;row++){
  const label=baseMeta.labels[row],start=row*512,end=start+512;
  const differs=base.subarray(start,end).some((x,i)=>x!==next[start+i]);
  if(differs)changed.push(label);
  if(!Object.hasOwn(prompts,label))assert.deepEqual(Array.from(next.subarray(start,end)),Array.from(base.subarray(start,end)),label+' must stay byte-identical');
 }
 assert.deepEqual(changed.sort(),Object.keys(prompts).sort());
 for(const label of changed)assert.ok(localCandidates.some(x=>x.label===label),label+' must be a supported taxonomy entry');
});

test('CLASSIFICATION48 candidate never changes negative controls or the frozen original subtype-review policy',async()=>{
 const baseMeta=JSON.parse(await readFile('public/recognition-vectors.json','utf8'));
 const candidateMeta=JSON.parse(await readFile(dir+'candidate-assets/recognition-vectors.json','utf8'));
 const guarded=['a room with no clothing item','a blank wall','an empty floor','a blurry image with no identifiable garment','a hand with no garment','a dog or cat','a pile of several different clothes'];
 for(const label of guarded){
  const row=baseMeta.labels.indexOf(label);
  assert.ok(row>=0);assert.ok(!Object.hasOwn(candidateMeta.promptEnsembles,label));
 }
 const review=await readFile('research/multi-garment-capture-01/recognition-review-42.mjs','utf8');
 assert.match(review,/T-shirt':'Sweatshirt/);assert.match(review,/Blouse':'Tunic/);assert.match(review,/Sneakers':'Ankle boots/);
});
