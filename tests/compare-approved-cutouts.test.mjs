import test from 'node:test';import assert from 'node:assert/strict';
import {assessApprovedCutoutComparison} from '../benchmark/compare-approved-cutouts.mjs';
function bits(w,h,box){
 const a=new Uint8Array(w*h);
 const [left,top,right,bottom]=box;
 for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)a[y*w+x]=1;
 return a;
}
function encode(mask,w,h){
 const runs=[];let last=0,n=0;
 for(const v of mask){if(v!==last){runs.push(n);n=0;last=v;}n++;}
 runs.push(n);return {width:w,height:h,runs};
}
const sha='b'.repeat(64);
function fixture({pending=[],badIndex=-1,badKind=null,allPerfect=false}={}){
 const cases=[],baselines=new Map(),candidates=new Map(),annotations=new Map();
 for(let i=0;i<6;i++){
  const id='commons-'+String(i).padStart(4,'0'),image=id+'.jpg';
  const w=16,h=16,truth=bits(w,h,[3,3,13,13]),
   old=bits(w,h,allPerfect?[3,3,13,13]:[4,4,12,12]),
   next=bits(w,h,[3,3,13,13]);
  if(i===badIndex){
   if(badKind==='lost-hem')for(let y=8;y<13;y++)for(let x=3;x<13;x++)next[y*w+x]=0;
   if(badKind==='background')for(let y=0;y<3;y++)for(let x=0;x<16;x++)next[y*w+x]=1;
  }
  const approved=!pending.includes(i);
  const entry={id,image,sourceSha256:sha,reviewStatus:approved?'approved':'pending',
   referenceMask:approved?'benchmark/approved-reference-masks/'+id+'.mask.approved.json':null};
  cases.push(entry);
  baselines.set(id,{image,sourceSha256:sha,...encode(old,w,h)});
  candidates.set(id,{image,sourceSha256:sha,...encode(next,w,h)});
  if(approved)annotations.set(id,{...encode(truth,w,h),image,sourceSha256:sha,
   schemaVersion:1,reviewStatus:'approved',reviewer:'First reviewer',approvedBy:'Independent second reviewer'});
 }
 return {manifest:{schemaVersion:1,cases},baselines,candidates,annotations};
}
test('six separately approved improvements pass comparative quality gate but never deploy',()=>{
 const f=fixture(),r=assessApprovedCutoutComparison(f.manifest,f.baselines,f.candidates,f.annotations);
 assert.equal(r.status,'candidate-eligible-for-manual-review');
 assert.equal(r.candidateQualityGatePassed,true);assert.equal(r.productionAuthorized,false);
 assert.equal(r.approvedCases,6);assert.equal(r.pendingCases.length,0);
 assert.equal(r.photos[0].accuracy.candidate.missedFabricPixels,0);
 assert.equal(r.meanIoU.candidateIoU,1);assert.ok(r.meanIoU.improvement>.1);
});
test('one missing independent reference blocks all aggregate accuracy and promotion',()=>{
 const f=fixture({pending:[2]});
 const r=assessApprovedCutoutComparison(f.manifest,f.baselines,f.candidates,f.annotations);
 assert.equal(r.status,'awaiting-independent-references');
 assert.equal(r.accuracyMeasured,false);
 assert.equal(r.meanIoU,null);assert.equal(r.candidateQualityGatePassed,false);
 assert.deepEqual(r.pendingCases,['commons-0002']);
 assert.equal(r.photos[2].accuracy,null);
});
test('missing dress hem vetoes an average improvement even when other garments improve',()=>{
 const f=fixture({badIndex:2,badKind:'lost-hem'});
 const r=assessApprovedCutoutComparison(f.manifest,f.baselines,f.candidates,f.annotations);
 assert.equal(r.status,'candidate-rejected-by-evidence');
 assert.equal(r.photos[2].nonRegression,false);
 assert.ok(r.photos[2].accuracy.change.missedFabricPixels>0);
 assert.equal(r.candidateQualityGatePassed,false);
});
test('a cutout admitting background cannot pass on other photos accuracy',()=>{
 const f=fixture({badIndex:5,badKind:'background'});
 const r=assessApprovedCutoutComparison(f.manifest,f.baselines,f.candidates,f.annotations);
 assert.equal(r.status,'candidate-rejected-by-evidence');
 assert.ok(r.photos[5].accuracy.candidate.backgroundPixels>0);
 assert.equal(r.photos[5].nonRegression,false);
});
test('no measured gain is not enough to promote a candidate',()=>{
 const f=fixture({allPerfect:true});
 const r=assessApprovedCutoutComparison(f.manifest,f.baselines,f.candidates,f.annotations);
 assert.equal(r.status,'candidate-rejected-by-evidence');
 assert.equal(r.meanIoU.improvement,0);
});
test('fake approval, reused reviewer and wrong source hashes fail closed',()=>{
 const f=fixture();
 f.annotations.get('commons-0000').approvedBy='First reviewer';
 assert.throws(()=>assessApprovedCutoutComparison(f.manifest,f.baselines,f.candidates,f.annotations),/second reviewer/);
 f.annotations.get('commons-0000').approvedBy='Another reviewer';
 f.candidates.get('commons-0003').sourceSha256='c'.repeat(64);
 assert.throws(()=>assessApprovedCutoutComparison(f.manifest,f.baselines,f.candidates,f.annotations),/unrelated model prediction/);
});
test('duplicate entries, surprise model images and missing approved files cannot be scored',()=>{
 const f=fixture();
 f.manifest.cases[1]={...f.manifest.cases[0]};
 assert.throws(()=>assessApprovedCutoutComparison(f.manifest,f.baselines,f.candidates,f.annotations),/repeated/);
 const g=fixture();g.candidates.set('other',g.candidates.get('commons-0000'));
 assert.throws(()=>assessApprovedCutoutComparison(g.manifest,g.baselines,g.candidates,g.annotations),/Unexpected/);
 const h=fixture();h.annotations.delete('commons-0004');
 assert.throws(()=>assessApprovedCutoutComparison(h.manifest,h.baselines,h.candidates,h.annotations),/file missing/);
});
