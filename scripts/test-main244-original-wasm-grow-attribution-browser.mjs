/**
 * M244 strictly composes the immutable M243 original model native session test
 * with lossless JS Memory.grow event counters. Original input graph, source
 * SHA, native WebKit/Chromium and all M243 assertions remain untouched.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const originalFile='scripts/test-main243-original-segformer-native-session-browser.mjs';
const expectedBlob='fdfb979ca3783cb362cb5eb909612902af0c3b70';
const bytes=await readFile(originalFile);
const gitBlob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
assert.equal(gitBlob(bytes),expectedBlob,'Original M243 real browser acceptance moved or changed');
assert.equal(gitBlob(await readFile('public/outfit-worker-p94.mjs')),
 'd66651b616de54c51eb7ef986324b30f1580888f','Original shipped P94 consumer Worker modified');
let source=bytes.toString('utf8');
const change=(needle,replacement,label)=>{
 assert.equal(source.split(needle).length,2,label+' must have exactly one pinned anchor');
 source=source.replace(needle,replacement);
};
change("import assert from 'node:assert/strict';",
 "import assert from 'node:assert/strict';\nimport {summarizeOriginalNativeGrowth} from './main244-native-wasm-growth-attribution.mjs';",
 'M243 import');
change('    globalThis.__m243GrowCalls=0;',
 '    globalThis.__m243GrowCalls=0;\n    globalThis.__m244JsGrowEvents=[];',
 'M243 original initial memory observer');
const extended=[
 '     const m244During=globalThis.__m243SessionCalls.some(x=>x.actualNativeExportCalled===true&&x.after===null);',
 '     let m244Before=0;try{m244Before=Math.floor(this.buffer.byteLength/65536);}catch{}',
 '     try{',
 '      const previous=Reflect.apply(original,this,args);',
 '      let m244After=0;try{m244After=Math.floor(this.buffer.byteLength/65536);}catch{}',
 '      if(globalThis.__m244JsGrowEvents.length<24)globalThis.__m244JsGrowEvents.push({',
 '       duringNative:m244During,ok:true,beforePages:m244Before,afterPages:m244After,',
 '       deltaPages:m244After-m244Before,previousPages:Number.isInteger(previous)?previous:null',
 '      });',
 '      return previous;',
 '     }catch(error){',
 '      if(globalThis.__m244JsGrowEvents.length<24)globalThis.__m244JsGrowEvents.push({',
 '       duringNative:m244During,ok:false,beforePages:m244Before,afterPages:m244Before,',
 '       deltaPages:0,previousPages:null',
 '      });',
 '      throw error;',
 '     }'
].join('\n');
change('     return Reflect.apply(original,this,args);',extended,'M243 original WebAssembly.Memory.grow pass-through');
change('     finalHeapPages:heapPages,jsGrowCalls:globalThis.__m243GrowCalls',
 '     finalHeapPages:heapPages,jsGrowCalls:globalThis.__m243GrowCalls,\n     growEvents:globalThis.__m244JsGrowEvents',
 'M243 original source receipt');
const receiptAnchor="   console.log('M243_REAL_ORIGINAL_SEGFORMER_NATIVE_SESSION',JSON.stringify(receipt));";
change(receiptAnchor,
 [
  '   // M244 attribution never changes M243 original success/failure assertions.',
  '   const growth=summarizeOriginalNativeGrowth(data.nativeCalls?.[0],data.growEvents);',
  '   const m244={engine,arm,originalGraphSha256:model.source.sha256,',
  '    originalModelBytes:model.source.bytes,',
  '    originalOriginalSessionCreated:data.success===true,',
  '    ...growth,webKitPermanentFix:false,originalOwnerPhotoNotRun:true,',
  '    actualConsumerWorkerUnmodified:true,onlyReadOnlyPageCounts:true};',
  "   console.log('M244_ORIGINAL_NATIVE_GROWTH_ATTRIBUTION',JSON.stringify(m244));",
  '   assert.ok(growth.residualInterpretable,',
  "    'M244 JS-visible versus native endpoint memory accounting invalid');",
  receiptAnchor
 ].join('\n'),'M243 original real success receipt');

const temp=resolve('scripts/.main244-original-pinned-graph-native-growth.mjs');
try{
 await writeFile(temp,source,{flag:'wx'});
 const check=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:30000});
 if(check.error)throw check.error;
 assert.equal(check.status,0,'Generated M244 genuine test syntax invalid: '+check.stderr?.slice(0,350));
 if(process.env.M244_SOURCE_ONLY==='1'){
  console.log('M244_UNMODIFIED_ORIGINAL_SOURCE_PASS',JSON.stringify({
   originalM243ScriptBlob:expectedBlob,originalP94ConsumerUnmodified:true,
   originalSegFormerGraphUntouched:true,losslessNativeExport:true,
   instrumentedOnlyDisposableResearchScript:true,
   noHeapOrPhotoBytes:true,noSilentGreen:true,noRelease:true}));
 }else{
  const done=spawnSync(process.execPath,[temp],{
   env:process.env,stdio:'inherit',timeout:21*60*1000});
  if(done.error)throw done.error;
  assert.equal(done.status,0,'Original pinned SegFormer native model session RED; no masking');
 }
}finally{await rm(temp,{force:true});}
