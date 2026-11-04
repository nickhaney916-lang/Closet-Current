import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {clothingLabelMap} from '../public/outfit-segmentation.mjs';
import {visibleGarmentGroups24 as previous}
 from '../research/real-mask-evidence-31/legacy-visible-groups.mjs';
import {visibleGarmentGroups24 as current}
 from '../research/multi-garment-capture-01/visible-groups.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
function makeMap(w=200,h=200){
 const labels=new Uint8Array(w*h),confidence=new Float32Array(w*h);
 return {labels,confidence,width:w,height:h,personDetected:true,
  paint(id,left,top,width,height,v=.95){
   for(let y=top;y<top+height;y++)for(let x=left;x<left+width;x++){
    const i=y*w+x;labels[i]=id;confidence[i]=v;
   }
  }};
}
const maskUnion=(parts,id,n)=>{
 const mask=new Uint8Array(n);
 for(const p of parts)if(p.id===id)for(let i=0;i<n;i++)if(p.selected[i])mask[i]=1;
 return mask;
};
test('real connected-component source code joins a same-row shoe pair without changing one model mask pixel',()=>{
 const m=makeMap();
 m.paint(4,52,23,68,42);
 m.paint(6,57,70,54,85);
 m.paint(9,47,180,27,16);
 m.paint(9,107,172,40,19);
 const before=previous(m),after=current(m);
 assert.equal(before.filter(p=>p.id===9).length,2);
 assert.equal(after.filter(p=>p.id===9).length,1);
 assert.equal(after.length,before.length-1);
 assert.equal(after.find(p=>p.id===9).needsReview,true);
 for(const type of [4,5,6,7,9]){
  assert.equal(sha(maskUnion(before,type,m.labels.length)),
   sha(maskUnion(after,type,m.labels.length)),
   'source mask pixels cannot be altered by this grouping rule');
 }
 assert.equal(after.find(p=>p.id===9).count,27*16+40*19);
});
test('actual SegFormer logits decode and same-family connected components separate two disconnected shirts',()=>{
 const w=64,h=64,area=w*h,data=new Float32Array(18*area).fill(-8);
 for(let i=0;i<area;i++)data[i]=8;
 const paint=(id,x,y,width,height)=>{
  for(let row=y;row<y+height;row++)for(let col=x;col<x+width;col++){
   const i=row*w+col;
   for(let k=0;k<18;k++)data[k*area+i]=k===id?8:-8;
  }
 };
 paint(4,5,5,18,18);paint(4,41,5,15,18);
 const map=clothingLabelMap(data,[1,18,h,w]);
 const old=previous(map),now=current(map);
 assert.equal(old.length,2);assert.equal(now.length,2);
 assert.ok(now.every(x=>x.needsReview&&x.id===4));
 assert.equal(sha(maskUnion(old,4,area)),sha(maskUnion(now,4,area)));
});
test('two touching upper garments labeled one semantic class remain ONE uncertain region, not fake instance separation',()=>{
 const m=makeMap(80,80);m.paint(4,8,10,63,55);
 const grouped=current(m);
 assert.equal(grouped.length,1);
 assert.equal(grouped[0].id,4);
 assert.equal(grouped[0].needsReview,true);
 assert.equal(grouped[0].types.length,0);
});
test('far apart unequal shoe components must not become an invented pair, exact source mask preserved',()=>{
 const m=makeMap();m.paint(9,15,15,25,22);m.paint(9,160,144,23,35);
 const a=previous(m),b=current(m);
 assert.equal(a.length,2);assert.equal(b.length,2);
 assert.equal(sha(maskUnion(a,9,m.labels.length)),sha(maskUnion(b,9,m.labels.length)));
});
test('partial-frame and missing shoe mask never creates a fake footwear record',()=>{
 const m=makeMap();m.paint(4,0,0,42,38);
 const result=current(m);
 assert.equal(result.filter(x=>x.id===9).length,0);
 assert.equal(result[0].clipped,true);
});
test('same-source original manifest contains exactly the three previously inspected, independently SHA-locked photos',()=>{
 const dataset=JSON.parse(readFileSync('research/multi-review-triage-28/frozen-photo-annotations-16.json','utf8'));
 const target=['commons-0021','two-shirts','flatlay-outfit'].map(x=>dataset.find(y=>y.id===x));
 assert.equal(target.length,3);
 assert.ok(target.every(x=>x&&x.sha256.length===64&&x.attribution.license));
 assert.equal(new Set(target.map(x=>x.sha256)).size,3);
 assert.deepEqual(target.map(x=>x.regions.length),[3,2,3]);
});
test('research worker runs genuine pinned ONNX and fingerprints raw model pixel maps without any cloud writes',()=>{
 const file=readFileSync('research/real-mask-evidence-31/worker.mjs','utf8');
 assert.match(file,/AutoModelForSemanticSegmentation/);
 assert.match(file,/a2489ea8e7ec1ee912190546bad31a4906ccca76/);
 assert.match(file,/clothingLabelMap\(logits\.logits\.data,logits\.logits\.dims\)/);
 assert.match(file,/sourceMapLabelsSHA256:await sha\(map\.labels\)/);
 assert.match(file,/maskPixelMembershipConserved:true/);
 assert.match(file,/visibleGarmentGroups24\(map/);
 assert.match(file,/oldGroups\(map/);
 assert.doesNotMatch(file,/localStorage|indexedDB|supabase|\\.insert\\(|\\.upsert\\(|\\.delete\\(/);
});
test('independent source research harness cannot certify new unseen-photo accuracy or raw human mask IoU',()=>{
 const file=readFileSync('scripts/verify-real-segformer-masks-31.mjs','utf8');
 assert.match(file,/realPhotoModelAccuracyCertified:false/);
 assert.match(file,/sourceTruePixelMaskIoUAgainstIndependentHumanTruth:false/);
 assert.match(file,/independentBlindAnnotators:0/);
 assert.match(file,/externalWrites/);
 assert.match(file,/sourceOriginalDimensions/);
 assert.match(file,/originalSourceSHA256Verified:true/);
});
