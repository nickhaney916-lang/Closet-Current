import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';

const file=process.argv[2]||'scripts/test-native-3d-05-p150-162.mjs';
let source=await readFile(file,'utf8');
const goto='  await page.goto(origin+';
assert.equal(source.split(goto).length,2,'P164 pinned real app browser entry changed');
const hook=String.raw`  await page.addInitScript(()=>{
   const state=window.__photoFabricPerf164={drawCalls:0,drawSubmissionMs:0,rafFrames:0,rafCallbackMs:0};
   const types=[globalThis.WebGLRenderingContext,globalThis.WebGL2RenderingContext].filter(Boolean);
   for(const type of types)for(const name of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced','drawRangeElements']){
    const original=type.prototype[name];if(typeof original!=='function'||original.__p164Wrapped)continue;
    const wrapped=function(...args){const start=performance.now();try{return original.apply(this,args)}finally{state.drawCalls++;state.drawSubmissionMs+=performance.now()-start}};
    wrapped.__p164Wrapped=true;type.prototype[name]=wrapped;
   }
   const request=window.requestAnimationFrame.bind(window);
   window.requestAnimationFrame=callback=>request(time=>{const start=performance.now();try{callback(time)}finally{state.rafFrames++;state.rafCallbackMs+=performance.now()-start}});
   state.snapshot=()=>({drawCalls:state.drawCalls,drawSubmissionMs:state.drawSubmissionMs,
    rafFrames:state.rafFrames,rafCallbackMs:state.rafCallbackMs,
    medianRafCallbackMs:state.rafCallbackMs/Math.max(1,state.rafFrames)});
  });
`;
source=source.replace(goto,hook+goto);
const takeStart=source.indexOf(' const takeP160=async(figure,view,expected)=>{');
const takeEnd=source.indexOf(' const dragFrom=async',takeStart);
assert.ok(takeStart>=0&&takeEnd>takeStart,'P164 P716 screenshot helper changed');
const take=source.slice(takeStart,takeEnd);
const png="  const png=await page.screenshot({fullPage:false,animations:'disabled'});";
assert.equal(take.split(png).length,2,'P164 six-angle screenshot capture anchor changed');
source=source.slice(0,takeStart)+take.replace(png,png+"\n  const webgl164=await page.evaluate(()=>window.__photoFabricPerf164?.snapshot?.()||null);")+source.slice(takeEnd);
const row='p160Rows.push({figure,view,nominalDegrees:';
assert.equal(source.split(row).length,2,'P164 six-angle visual receipt anchor changed');
source=source.replace(row,'p160Rows.push({figure,view,webgl164,nominalDegrees:');
const outputDir="const outDir='benchmark/outfit-view-360-160';";
assert.equal(source.split(outputDir).length,2,'P164 cross-browser output path anchor changed');
source=source.replace(outputDir,"const outDir=process.env.P160_OUT_DIR||'benchmark/outfit-view-360-160';");
await writeFile(file,source);
console.log(JSON.stringify({priority:164,file,measures:['WebGL draw-call submission CPU time','render-loop callback CPU time'],gpuCompletionTimeMeasured:false}));
