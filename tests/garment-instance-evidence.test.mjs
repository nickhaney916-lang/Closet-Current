import test from 'node:test';
import assert from 'node:assert/strict';
import {semanticFragmentEvidence,validateInstanceMaskProposals} from '../benchmark/garment-instance-evidence.mjs';
const hash='e'.repeat(64);
function map(w=12,h=8,labels=new Uint8Array(w*h)){
 return {width:w,height:h,labels,confidence:Float32Array.from(labels,c=>c?.96:0)};
}
const mask=(n,spots)=>{const x=new Uint8Array(n);for(const i of spots)x[i]=255;return x;};
const proposal=(id,mask,category='Outerwear',semanticClass=4)=>({
 id,sourceSha256:hash,modelId:'experimental-independent-mask-engine',
 mask,category,semanticClass,confidence:.9
});
test('connected shirt sleeve fragments are evidence, not new wardrobe garments',()=>{
 const lbl=new Uint8Array(96);
 for(const i of [13,14,15,25,26,27,49,50,51,61,62,63])lbl[i]=4;
 const r=semanticFragmentEvidence(map(12,8,lbl),{minimumPixels:4});
 assert.equal(r.counts.find(x=>x.semanticClass===4).retainedFragments,2);
 assert.equal(r.distinctPhysicalGarmentsMeasured,false);
 assert.equal(r.automaticCatalogApproved,false);
 assert.equal(r.fragments.every(x=>!x.independentlyConfirmedGarment),true);
});
test('connected shirt and jacket cannot be separated by the semantic class alone',()=>{
 const lbl=new Uint8Array(96);for(let y=2;y<6;y++)for(let x=2;x<10;x++)lbl[y*12+x]=4;
 const r=semanticFragmentEvidence(map(12,8,lbl),{minimumPixels:4});
 assert.equal(r.counts.find(x=>x.semanticClass===4).retainedFragments,1);
 assert.equal(r.distinctPhysicalGarmentsMeasured,false);
});
test('two nonoverlapping proposed upper-garment masks remain review-only',()=>{
 const labels=new Uint8Array(96);
 const left=[...Array(16)].map((_,i)=>(Math.floor(i/4)+1)*12+(i%4)+1);
 const right=[...Array(16)].map((_,i)=>(Math.floor(i/4)+1)*12+(i%4)+7);
 for(const i of [...left,...right])labels[i]=4;
 const result=validateInstanceMaskProposals({sourceSha256:hash,semanticMap:map(12,8,labels),
   proposals:[proposal('jacket',mask(96,left),'Outerwear'),proposal('shirt',mask(96,right),'Tops')],
   minPixels:8});
 assert.equal(result.candidates.length,2);
 assert.equal(result.rejected.length,0);
 assert.equal(result.verifiedDistinctItemCount,0);
 assert.equal(result.autoCreatedItems,0);
});
test('duplicate instances over same pixels are rejected even if category differs',()=>{
 const labels=new Uint8Array(96);for(let i=16;i<40;i++)labels[i]=4;
 const m=mask(96,[...Array(24)].map((_,i)=>16+i));
 const result=validateInstanceMaskProposals({sourceSha256:hash,semanticMap:map(12,8,labels),
   proposals:[proposal('shirt',m,'Tops'),proposal('jacket',m,'Outerwear')],minPixels:8});
 assert.equal(result.candidates.length,0);
 assert.equal(result.rejected.length,2);
 assert.ok(result.rejected.every(x=>x.reasons.includes('overlapping-instance-proposals')));
});
test('disagreeing semantic class, skin and tiny artifacts are rejected',()=>{
 const labels=new Uint8Array(96);for(let i=10;i<30;i++)labels[i]=4;
 const p=mask(96,[...Array(20)].map((_,i)=>10+i));
 const contaminated=mask(96,[...Array(20)].map((_,i)=>20+i));
 const tiny=mask(96,[10,11,12,13]);
 const r=validateInstanceMaskProposals({sourceSha256:hash,semanticMap:map(12,8,labels),
  proposals:[proposal('top',p,'Tops'),proposal('spill',contaminated,'Outerwear'),
   proposal('fragment',tiny,'Tops')],minPixels:8});
 assert.ok(r.rejected.some(x=>x.id==='spill'&&x.reasons.includes('semantic-label-conflict')));
 assert.ok(r.rejected.some(x=>x.id==='fragment'&&x.reasons.includes('candidate-mask-too-small')));
});
test('model cannot link an instance mask to a different source photo',()=>{
 const labels=new Uint8Array(96);for(let i=10;i<30;i++)labels[i]=4;
 const other={...proposal('bad',mask(96,[...Array(20)].map((_,i)=>10+i)) ),
   sourceSha256:'f'.repeat(64)};
 const r=validateInstanceMaskProposals({sourceSha256:hash,semanticMap:map(12,8,labels),
   proposals:[other],minPixels:8});
 assert.equal(r.candidates.length,0);
 assert.equal(r.rejected[0].reason,'source-photo-hash-mismatch');
});
test('invalid inputs, confidence and duplicate proposal names fail closed',()=>{
 const labels=new Uint8Array(96);for(let i=10;i<30;i++)labels[i]=4;
 const p=proposal('item',mask(96,[...Array(20)].map((_,i)=>10+i)));
 assert.throws(()=>validateInstanceMaskProposals({sourceSha256:hash,semanticMap:map(12,8,labels),proposals:[p,p]}),/Invalid/);
 assert.throws(()=>validateInstanceMaskProposals({sourceSha256:hash,semanticMap:map(12,8,labels),proposals:[{...p,mask:Uint8Array.from(p.mask,x=>x?72:0)}]}),/binary/);
 assert.throws(()=>validateInstanceMaskProposals({sourceSha256:hash,semanticMap:map(12,8,labels),proposals:[{...p,category:'Shoes'}]}));
 assert.throws(()=>semanticFragmentEvidence(map(12,8,labels),{minimumPixels:0}));
});
