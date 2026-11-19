/**
 * M246: exact-byte derived ORIGINAL M243 public SegFormer native harness.
 * Keep M243 original real engine/model/options/session/memory assertions,
 * add only hash-checked records for the WASM bytes actually served by its
 * loopback HTTP server while genuine native session succeeds or fails.
 * Research-only generated child; no product Worker/model/source edits.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

const donor='scripts/test-main243-original-segformer-native-session-browser.mjs';
const bytes=await readFile(donor);
const blob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
assert.equal(blob(bytes),'fdfb979ca3783cb362cb5eb909612902af0c3b70',
 'Immutable genuine original graph native browser test changed');
assert.equal(blob(await readFile('public/outfit-worker-p94.mjs')),
 'd66651b616de54c51eb7ef986324b30f1580888f',
 'Original shipped product Worker changed');
let source=bytes.toString('utf8');
const replaceOnce=(before,after,label)=>{
 assert.equal(source.split(before).length,2,'M246 original M243 anchor drift: '+label);
 source=source.replace(before,after);
};
replaceOnce(
 "from './main243-original-segformer-native-abi.mjs';",
 "from './main243-original-segformer-native-abi.mjs';\n"+
 "import {attestLocalWasmServed,acceptRealOriginalNativeGraphAsset} from './main246-original-graph-loaded-wasm-asset.mjs';",
 'Original pinned model import'
);
replaceOnce(
 "const ROOT=process.cwd(),DIST=resolve(ROOT,'node_modules/onnxruntime-web/dist');",
 "const ROOT=process.cwd(),DIST=resolve(ROOT,'node_modules/onnxruntime-web/dist');\n"+
 "const m246ActualNativeWasmServed=[];",
 'Original local runtime distribution'
);
replaceOnce("   res.end(await readFile(path));",
 [
 "   const originalPublicWasmBytes=await readFile(path);",
 "   if(path.endsWith('.wasm')){",
 "    const originalWasmName=path.split(/[\\\\/]/).at(-1);",
 "    // SHA-only response provenance; reject unpinned variants/byte drift.",
 "    m246ActualNativeWasmServed.push(attestLocalWasmServed(originalWasmName,originalPublicWasmBytes));",
 "   }",
 "   res.end(originalPublicWasmBytes);"
 ].join('\n'),
 'Original exact local HTTP response body'
);
const originalReceipt="   console.log('M243_REAL_ORIGINAL_SEGFORMER_NATIVE_SESSION',JSON.stringify(receipt));";
replaceOnce(originalReceipt,originalReceipt+"\n"+
 "   console.log('M246_REAL_LOADED_WASM_VARIANT',JSON.stringify(acceptRealOriginalNativeGraphAsset({"+
 "assets:m246ActualNativeWasmServed,session:receipt,engine,arm})));",
 'Original native SegFormer session outcome'
);
assert.ok(source.includes("assert.equal(data.success,true,'Original pinned SegFormer WASM model session failed, preserve genuine RED')"),
 'Genuine original model RED was muted');
assert.ok(source.includes('assert.equal(data.nativeCalls.length,1,'));
assert.ok(source.includes('await downloadAttestedModel()'));
assert.ok(source.includes('WebAssembly.Memory.prototype.grow'));
const temporary=resolve('scripts/.main246-original-native-wasm-source-observed.mjs');
const engine=process.env.M246_ENGINE||'webkit';
const arm=process.env.M246_ARM||'baseline';
assert.ok(['webkit','chromium'].includes(engine));
assert.ok(['baseline','pattern_off'].includes(arm));
try{
 await writeFile(temporary,source,{flag:'wx'});
 const syntax=spawnSync(process.execPath,['--check',temporary],{encoding:'utf8',timeout:30000});
 if(syntax.error)throw syntax.error;
 assert.equal(syntax.status,0,
  'M246 derived real browser donor JS syntax failed: '+String(syntax.stderr||'').slice(0,300));
 if(process.env.M246_SOURCE_ONLY==='1'){
  console.log('M246_ORIGINAL_SOURCE_LOCK_PASS',JSON.stringify({
   originalM243Browser:blob(bytes),originalConsumerWorkerUnchanged:true,
   realServerServedWasmObservationInserted:true,
   actualNativeModelSessionPending:true,ownerPrivateDataAccess:false,
   originalWasmByteProofPending:true,releaseAuthorized:false,familyAlphaHold:true
  }));
 }else{
  const result=spawnSync(process.execPath,[temporary],{
   env:{...process.env,M243_ENGINE:engine,M243_PATTERN_ARM:arm},
   stdio:'inherit',timeout:12*60*1000
  });
  if(result.error)throw result.error;
  assert.equal(result.status,0,
   'M246 original public SegFormer genuine native session or pinned loaded WASM RED (no retry)');
 }
}finally{await rm(temporary,{force:true});}
