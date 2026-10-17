import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreGarmentMask,decodeReferenceMask,approvedReferenceMask,scoreApprovedPrediction,scoreApprovedPredictionAtReferenceResolution,scoreApprovedColorSampling,erodeMaskInterior} from '../benchmark/garment-mask-metrics.mjs';

test('a perfect annotated cutout achieves full recall, precision, and overlap',()=>{
 const reference=Uint8Array.from([0,1,1,0,0,1]);
 const score=scoreGarmentMask(reference,reference,3,2);
 assert.equal(score.garmentRecall,1);
 assert.equal(score.garmentPrecision,1);
 assert.equal(score.intersectionOverUnion,1);
 assert.equal(score.backgroundContaminationRate,0);
});
test('lost garment edges and included background are counted separately',()=>{
 const truth=Uint8Array.from([0,1,1,1,0,0,0,0]);
 const prediction=Uint8Array.from([1,0,1,1,0,0,0,0]);
 const score=scoreGarmentMask(truth,prediction,4,2);
 assert.equal(score.truePositive,2);
 assert.equal(score.falsePositive,1);
 assert.equal(score.falseNegative,1);
 assert.equal(score.garmentRecall,2/3);
 assert.equal(score.garmentPrecision,2/3);
 assert.equal(score.intersectionOverUnion,.5);
 assert.equal(score.backgroundContaminationRate,.2);
});
test('reference run encoding preserves exact human-annotated mask',()=>{
 assert.deepEqual([...decodeReferenceMask({width:4,height:2,runs:[1,3,4]})],[0,1,1,1,0,0,0,0]);
});
test('missing, partial, invalid and untrusted reference annotations fail closed',()=>{
 assert.throws(()=>decodeReferenceMask({width:2,height:2,runs:[1,2]}),/Incomplete/);
 assert.throws(()=>decodeReferenceMask({width:2,height:2,runs:[0,5]}),/Invalid annotation run/);
 assert.throws(()=>scoreGarmentMask([0,2],[0,1],2,1),/binary/);
 assert.throws(()=>scoreGarmentMask([1],[1],2,2),/Invalid segmentation/);
});

test('review manifest uses verified distinct photos and never treats pending labels as ground truth',async()=>{
 const {readFileSync}=await import('node:fs');
 const manifest=JSON.parse(readFileSync('benchmark/segmentation-review-manifest.json','utf8'));
 const sources=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
 assert.equal(manifest.schemaVersion,1);
 assert.equal(manifest.status,'awaiting-human-annotations');
 assert.equal(manifest.cases.length,6);
 const unique=new Set();
 for(const item of manifest.cases){
  assert.ok(!unique.has(item.id));unique.add(item.id);
  const source=sources.find(x=>x.id===item.id);
  assert.ok(source?.verified);
  assert.equal(item.image,source.image);
  assert.equal(item.sourceSha256,source.sha256);
  assert.equal(item.referenceMask,null);
  assert.equal(item.reviewStatus,'pending');
 }
});

test('draft, wrong source, self-approved, and trivial masks cannot become benchmark ground truth',()=>{
 const entry={image:'shoe.jpg',sourceSha256:'abc'};
 const good={schemaVersion:1,image:'shoe.jpg',sourceSha256:'abc',reviewStatus:'approved',reviewer:'first',approvedBy:'second',width:2,height:2,runs:[1,2,1]};
 assert.deepEqual([...approvedReferenceMask(good,entry)],[0,1,1,0]);
 assert.throws(()=>approvedReferenceMask({...good,reviewStatus:'draft'},entry),/not independently approved/);
 assert.throws(()=>approvedReferenceMask({...good,image:'dress.jpg'},entry),/source mismatch/);
 assert.throws(()=>approvedReferenceMask({...good,approvedBy:'first'},entry),/second reviewer/);
 assert.throws(()=>approvedReferenceMask({...good,runs:[0,4]},entry),/garment and background/);
});

test('approved scoring rejects mismatched image identity or mask dimensions',()=>{
 const manifest={image:'boots.jpg',sourceSha256:'verifiedhash'};
 const approved={schemaVersion:1,image:'boots.jpg',sourceSha256:'verifiedhash',reviewStatus:'approved',reviewer:'A',approvedBy:'B',width:2,height:2,runs:[1,2,1]};
 const prediction={image:'boots.jpg',sourceSha256:'verifiedhash',width:2,height:2,runs:[1,1,2]};
 const result=scoreApprovedPrediction(approved,manifest,prediction);
 assert.equal(result.truePositive,1);
 assert.equal(result.falseNegative,1);
 assert.equal(result.intersectionOverUnion,.5);
 assert.throws(()=>scoreApprovedPrediction(approved,manifest,{...prediction,image:'shirt.jpg'}),/mismatch/);
 assert.throws(()=>scoreApprovedPrediction(approved,manifest,{...prediction,width:4,height:1}),/mismatch/);
 assert.throws(()=>scoreApprovedPrediction({...approved,reviewStatus:'draft'},manifest,prediction),/not independently approved/);
});

test('approved prediction aligns 4x4 mask to reviewed 2x2 mask using nearest-neighbor',()=>{
 const entry={image:'dress.jpg',sourceSha256:'checked'};
 const approved={schemaVersion:1,reviewStatus:'approved',image:'dress.jpg',sourceSha256:'checked',reviewer:'A',approvedBy:'B',width:2,height:2,runs:[1,2,1]};
 const prediction={image:'dress.jpg',sourceSha256:'checked',width:4,height:4,runs:[2,2,2,2,2,2,2,2]};
 const score=scoreApprovedPredictionAtReferenceResolution(approved,entry,prediction);
 assert.equal(score.referenceWidth,2);
 assert.equal(score.predictionWidth,4);
 assert.equal(score.alignment,'nearest-neighbor at reference resolution');
 assert.throws(()=>scoreApprovedPredictionAtReferenceResolution(approved,entry,{...prediction,height:3,runs:[2,2,2,2,2,2]}),/aspect ratios/);
 assert.throws(()=>scoreApprovedPredictionAtReferenceResolution({...approved,reviewStatus:'draft'},entry,prediction),/not independently approved/);
});

function encoded(mask,width,height){
 let previous=0,count=0;const runs=[];
 for(const value of mask){if(value!==previous){runs.push(count);count=0;previous=value;}count++;}
 runs.push(count);return {width,height,runs};
}
function rectangleMask(width,height,left,top,right,bottom){
 const a=new Uint8Array(width*height);
 for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)a[y*width+x]=1;
 return a;
}
function reviewedPair(width,height,truth,predicted){
 const entry={image:'garment.jpg',sourceSha256:'hash-from-source'};
 return {
  entry,
  reference:{schemaVersion:1,reviewStatus:'approved',image:entry.image,sourceSha256:entry.sourceSha256,reviewer:'Reviewer 1',approvedBy:'Reviewer 2',...encoded(truth,width,height)},
  prediction:{image:entry.image,sourceSha256:entry.sourceSha256,...encoded(predicted,width,height)}
 };
}
test('human-approved comparison measures background contamination removed by interior sampling',()=>{
 const truth=rectangleMask(8,8,2,2,6,6),pred=rectangleMask(8,8,1,1,7,7),p=reviewedPair(8,8,truth,pred);
 const score=scoreApprovedColorSampling(p.reference,p.entry,p.prediction);
 assert.equal(score.referenceStatus,'independently-approved');
 assert.equal(score.full.foregroundPrecision,16/36);
 assert.equal(score.full.backgroundPixelsSampled,20);
 assert.equal(score.interior.foregroundPrecision,1);
 assert.equal(score.interior.backgroundPixelsSampled,0);
 assert.equal(score.garmentPixelsRemoved,0);
 assert.equal(score.backgroundPixelsRemoved,20);
 assert.equal(score.sampledPixelRetention,16/36);
 assert.equal(score.additionalGarmentMissRate,0);
});
test('eroding a correct thin garment has a measurable garment-recall cost',()=>{
 const trueMask=rectangleMask(8,8,1,1,7,7),p=reviewedPair(8,8,trueMask,trueMask);
 const result=scoreApprovedColorSampling(p.reference,p.entry,p.prediction);
 assert.equal(result.full.garmentRecall,1);
 assert.equal(result.interior.garmentRecall,16/36);
 assert.equal(result.garmentPixelsRemoved,20);
 assert.equal(result.backgroundPixelsRemoved,0);
 assert.equal(result.additionalGarmentMissRate,20/36);
});
test('one-pixel-thin socks and disconnected details are not colored from fabricated interior',()=>{
 const thin=rectangleMask(7,7,3,1,4,6);
 const inner=erodeMaskInterior(thin,7,7);
 assert.equal(inner.reduce((a,b)=>a+b,0),0);
});
test('reference scoring cannot run on drafts, fake reviewers, or unrelated photos',()=>{
 const p=reviewedPair(8,8,rectangleMask(8,8,2,2,6,6),rectangleMask(8,8,2,2,6,6));
 assert.throws(()=>scoreApprovedColorSampling({...p.reference,reviewStatus:'draft'},p.entry,p.prediction),/independently approved/);
 assert.throws(()=>scoreApprovedColorSampling({...p.reference,approvedBy:'Reviewer 1'},p.entry,p.prediction),/second reviewer/);
 assert.throws(()=>scoreApprovedColorSampling(p.reference,p.entry,{...p.prediction,sourceSha256:'different'}),/source mismatch/);
 assert.throws(()=>scoreApprovedColorSampling(p.reference,p.entry,{...p.prediction,width:4,height:16,runs:[0,64]}),/aspect ratios/);
});
test('annotation editor rounding allows same source aspect within one reference pixel, not changed composition',()=>{
 const entry={image:'same.jpg',sourceSha256:'source'};
 const w=65,h=64,pw=260,ph=257;
 const truth=rectangleMask(w,h,10,10,60,50),pred=rectangleMask(pw,ph,40,40,240,201);
 const reference={schemaVersion:1,reviewStatus:'approved',reviewer:'1',approvedBy:'2',image:entry.image,sourceSha256:entry.sourceSha256,...encoded(truth,w,h)};
 const prediction={image:entry.image,sourceSha256:entry.sourceSha256,...encoded(pred,pw,ph)};
 assert.doesNotThrow(()=>scoreApprovedPredictionAtReferenceResolution(reference,entry,prediction));
 assert.doesNotThrow(()=>scoreApprovedColorSampling(reference,entry,prediction));
 assert.throws(()=>scoreApprovedColorSampling(reference,entry,{...prediction,width:300,height:ph,runs:encoded(rectangleMask(300,ph,40,40,240,201),300,ph).runs}),/aspect ratios/);
});
