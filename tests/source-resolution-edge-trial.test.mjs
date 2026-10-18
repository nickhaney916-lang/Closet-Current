import test from 'node:test';import assert from 'node:assert/strict';
import {sourceResolutionEdgeTrial,scoreSyntheticEdgeTrial} from '../benchmark/source-resolution-edge-trial.mjs';
function example({pale=false,shadow=false,semanticVeto=false}={}){
 const width=96,height=96,truth=new Uint8Array(width*height),
  source=new Uint8ClampedArray(width*height*3),coarse=new Uint8Array(24*24),
  labels=new Uint8Array(24*24),semanticLabels=new Uint8Array(24*24);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,inside=x>=26&&x<74&&y>=25&&y<79;
  truth[i]=inside?1:0;
  const fg=pale?[233,234,231]:[32,72,150],bg=[235,235,233];
  const rgb=inside||shadow&&x>=24&&x<28&&y>=35&&y<68?fg:bg;
  source.set(rgb,i*3);
 }
 for(let y=7;y<19;y++)for(let x=7;x<18;x++)coarse[y*24+x]=1;
 if(semanticVeto){for(let y=7;y<19;y++)labels[y*24+6]=11;}
 return {image:{data:source,width,height,channels:3},map:{width:24,height:24,labels,semanticLabels},
  group:{id:4,selected:coarse},truth};
}
function run(params){
 const f=example(params),photo=f.image.data.slice(),seed=f.group.selected.slice(),
  r=sourceResolutionEdgeTrial(f.image,f.map,f.group),
  score=scoreSyntheticEdgeTrial(f.truth,r,f.image.width,f.image.height);
 assert.deepEqual(f.image.data,photo,'original photographic RGB stays unchanged');
 assert.deepEqual(f.group.selected,seed,'category/segmentation seed remains unchanged');
 assert.equal(r.productionAuthorized,false);
 assert.equal(score.productionAuthorized,false);
 return {r,score};
}
test('source-pixel boundary candidate recovers demonstrable clean garment edges',()=>{
 const {r,score}=run({});
 assert.ok(r.addedPixels>0,'clean distinct fabric permits subcell expansion');
 assert.ok(score.candidate.recall>score.baseline.recall,'synthetic garment recall improves');
 assert.equal(score.passesSyntheticNoNewBackground,true,'clean RGB edge must not introduce background');
 assert.ok(r.addedPixels<=r.budget);
 console.log('SOURCE_EDGE_SYNTHETIC_CLEAN '+JSON.stringify(score));
});
test('pale garment similar to background cannot be confidently grown',()=>{
 const {r,score}=run({pale:true});
 assert.equal(r.addedPixels,0,'no guaranteed fabric/background contrast');
 assert.deepEqual(score.candidate,score.baseline);
});
test('a similarly colored exterior shadow exposes why synthetic-only gain cannot authorize production',()=>{
 const {score}=run({shadow:true});
 assert.ok(score.candidate.falsePositive>=score.baseline.falsePositive);
 assert.equal(score.productionAuthorized,false,'even idealized synthetic results never approve live model');
 console.log('SOURCE_EDGE_SYNTHETIC_SHADOW '+JSON.stringify(score));
});
test('trusted non-garment labels block edge proposals without losing seed',()=>{
 const {r}=run({semanticVeto:true});
 assert.ok(r.rejectedSemantic>0);
 for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(x>=24&&x<28){
  const i=y*96+x;assert.equal(r.candidate[i],r.baseline[i],
   'semantic veto strip cannot grow into confirmed body region');
 }
});
test('no resizing, image mutation, runaway growth, or invalid masks',()=>{
 const f=example();
 for(const options of [{haloPixels:8},{maxColorDistance:200},{minOutsideContrast:1},{maxGrowthFraction:2}]){
  assert.throws(()=>sourceResolutionEdgeTrial(f.image,f.map,f.group,options),/Invalid/);
 }
 const old=f.group.selected.slice(),a=sourceResolutionEdgeTrial(f.image,f.map,f.group,{maxGrowthFraction:0});
 assert.equal(a.addedPixels,0);assert.deepEqual(f.group.selected,old);
 assert.throws(()=>sourceResolutionEdgeTrial({...f.image,data:new Uint8ClampedArray(9)},f.map,f.group),/Invalid/);
 assert.throws(()=>sourceResolutionEdgeTrial(f.image,f.map,{...f.group,selected:new Uint8Array(2)}),/Invalid/);
});
