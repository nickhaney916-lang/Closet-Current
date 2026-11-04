import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceResolutionEdgeTrial} from '../benchmark/source-resolution-edge-trial.mjs';
import {intersectIndependentEdgeSupport,assessSyntheticEdgeSafety,scoreSyntheticConsensus}
 from '../benchmark/source-edge-consensus.mjs';

// The clean and ambiguous cases have identical original photographic RGB and
// identical coarse predictions. Only the independent reference changes:
// a correctly exposed blue sleeve and a blue cast shadow are indiscernible
// to a single RGB-continuity algorithm.
function scene({shadow=false,pale=false}={}){
 const width=96,height=96,n=width*height,
  data=new Uint8ClampedArray(n*3),truth=new Uint8Array(n),
  independentAlpha=new Uint8Array(n),selected=new Uint8Array(24*24);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,inside=x>=26&&x<74&&y>=26&&y<78,
   ambiguous=shadow&&x>=26&&x<28&&y>=35&&y<68;
  const fg=pale?[233,234,231]:[32,72,150];
  data.set(inside?fg:[235,235,233],i*3);
  if(inside&&!ambiguous){truth[i]=1;independentAlpha[i]=255;}
 }
 for(let y=7;y<19;y++)for(let x=7;x<18;x++)selected[y*24+x]=1;
 const map={width:24,height:24},group={id:4,selected};
 return {width,height,image:{width,height,channels:3,data},map,group,truth,independentAlpha};
}
function run(sceneArgs,{wrongSecondModel=false}={}){
 const s=scene(sceneArgs),before=s.image.data.slice(),seed=s.group.selected.slice();
 const first=sourceResolutionEdgeTrial(s.image,s.map,s.group);
 const alpha=new Uint8Array(s.independentAlpha);
 if(wrongSecondModel&&sceneArgs?.shadow){
  for(let y=35;y<68;y++)for(let x=26;x<28;x++)alpha[y*s.width+x]=255;
 }
 const consensus=intersectIndependentEdgeSupport(first,alpha,{sourceWidth:s.width,sourceHeight:s.height});
 const score=scoreSyntheticConsensus(sceneArgs?.pale?'pale':sceneArgs?.shadow?'shadow':'clean',
  s.truth,consensus,s.width,s.height);
 assert.deepEqual(s.image.data,before,'source photograph never changes');
 assert.deepEqual(s.group.selected,seed,'recognition and coarse mask never change');
 assert.equal(consensus.productionAuthorized,false);
 return {s,first,consensus,score};
}
test('independent alpha support preserves real sleeve edge and vetoes blue shadow',()=>{
 const clean=run({}),shadow=run({shadow:true}),pale=run({pale:true});
 assert.ok(clean.consensus.addedPixels>0);
 assert.ok(clean.score.score.candidate.recall>clean.score.score.baseline.recall);
 assert.equal(clean.score.score.candidate.falsePositive,0);
 assert.ok(shadow.consensus.rejectedBySecondModel>=66);
 assert.equal(shadow.score.score.candidate.falsePositive,0);
 assert.ok(shadow.score.score.candidate.recall>shadow.score.score.baseline.recall);
 assert.equal(pale.consensus.addedPixels,0);
 const gate=assessSyntheticEdgeSafety([clean.score,shadow.score,pale.score]);
 assert.equal(gate.status,'synthetic-tests-only');
 assert.equal(gate.syntheticQualityGatePassed,true);
 assert.equal(gate.candidateEligibleForCustomerUse,false);
 console.log('EXPERIMENTAL_SOURCE_EDGE_CONSENSUS '+JSON.stringify({
  clean:clean.score.score,shadow:shadow.score.score,pale:pale.score.score,
  gate:gate.status,realReferenceMasks:0,productionAuthorized:false
 }));
});
test('source pixels cannot reveal whether identically colored areas are garment or cast shadow',()=>{
 const clean=scene({}),shadow=scene({shadow:true});
 assert.deepEqual(clean.image.data,shadow.image.data);
 assert.deepEqual(clean.group.selected,shadow.group.selected);
 assert.notDeepEqual(clean.truth,shadow.truth,
  'the same source RGB can have two distinct reference interpretations');
});
test('if independent object model ALSO admits shadow, agreement fails the hard negative',()=>{
 const clean=run({}),shadow=run({shadow:true},{wrongSecondModel:true}),pale=run({pale:true});
 assert.ok(shadow.score.score.candidate.falsePositive>0);
 const gate=assessSyntheticEdgeSafety([clean.score,shadow.score,pale.score]);
 assert.equal(gate.syntheticQualityGatePassed,false);
 assert.equal(gate.status,'rejected-synthetic-contamination-or-regression');
 assert.deepEqual(gate.failedScenarios,['shadow']);
 assert.equal(gate.productionAuthorized,false);
});
test('second model may not erase any originally accepted garment pixels',()=>{
 const {s,first}=run({});
 const empty=new Uint8Array(s.width*s.height);
 const out=intersectIndependentEdgeSupport(first,empty,{sourceWidth:s.width,sourceHeight:s.height});
 assert.deepEqual(out.candidate,out.baseline);
 assert.equal(out.addedPixels,0);
 assert.equal(out.rejectedBySecondModel,first.addedPixels);
});
test('missing object mask, invalid alpha, dimensions, threshold and missing negatives fail closed',()=>{
 const {s,first}=run({});
 const params={sourceWidth:s.width,sourceHeight:s.height};
 assert.throws(()=>intersectIndependentEdgeSupport(first,null,params),/Invalid/);
 assert.throws(()=>intersectIndependentEdgeSupport(first,new Uint8Array(2),params),/Invalid/);
 assert.throws(()=>intersectIndependentEdgeSupport(first,s.independentAlpha,{...params,threshold:50}),/Invalid/);
 const bad=new Float32Array(s.independentAlpha);bad[0]=NaN;
 assert.throws(()=>intersectIndependentEdgeSupport(first,bad,params),/Invalid/);
 const clean=run({}).score;
 assert.throws(()=>assessSyntheticEdgeSafety([clean,clean,clean]),/Invalid/);
 assert.throws(()=>assessSyntheticEdgeSafety([clean,run({pale:true}).score]),/Expected/);
});
