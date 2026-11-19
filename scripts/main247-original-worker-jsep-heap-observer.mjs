/**
 * M247 test-only, source-locked true P94 JSEP session+heap observer.
 * The model, WASM, original photo, processing, error propagation and owner
 * privacy path are unchanged. No WASM linear-memory contents are read.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const ORIGINAL_WORKER_BLOB='d66651b616de54c51eb7ef986324b30f1580888f';
export const ORIGINAL_BROWSER_BLOB='4f75a40cf153fa4b4d139d782b202dbe7bc55e41';
export const ORIGINAL_JSEP_SHA='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const gitBlob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
export const M247_WORKER_PROBE="\n/* M247 disposable real original P94 JSEP JS heap observer: no memory content. */\nconst m247Stats={refs:[],calls:0,errors:0,hook:false};\nfunction m247Pages(memory){\n try{\n  if(!(memory instanceof WebAssembly.Memory))return null;\n  const n=memory.buffer.byteLength;\n  return Number.isSafeInteger(n)&&n>=0?Math.min(65536,Math.floor(n/65536)):null;\n }catch{return null;}\n}\nfunction m247Remember(memory){\n const pages=m247Pages(memory);\n if(pages===null)return;\n let ref=m247Stats.refs.find(x=>x.memory===memory);\n if(!ref&&m247Stats.refs.length<16){\n  ref={memory,first:pages,latest:pages};\n  m247Stats.refs.push(ref);\n }\n if(ref)ref.latest=pages;\n}\nfunction m247Emit(id,outcome){\n let first=0,terminal=0,valid=0;\n for(const ref of m247Stats.refs){\n  const cur=m247Pages(ref.memory);\n  if(cur===null)continue;\n  first=Math.max(first,ref.first);terminal=Math.max(terminal,cur);valid++;\n }\n self.postMessage({type:'diagnostic',id,phase:'m247_jsep_memory',outcome,\n  hookInstalled:m247Stats.hook,growCalls:Math.min(100000,m247Stats.calls),\n  growErrors:Math.min(100000,m247Stats.errors),\n  targetCount:Math.min(16,m247Stats.refs.length),validTargets:Math.min(16,valid),\n  firstPages:Math.min(65536,first),terminalPages:Math.min(65536,terminal)});\n}\n{\n const proto=WebAssembly.Memory?.prototype;\n const nativeGrow=proto?.grow;\n if(typeof nativeGrow==='function'){\n  proto.grow=function(...args){\n   m247Remember(this);m247Stats.calls=Math.min(100000,m247Stats.calls+1);\n   try{\n    const result=Reflect.apply(nativeGrow,this,args);\n    m247Remember(this);return result;\n   }catch(error){\n    m247Stats.errors=Math.min(100000,m247Stats.errors+1);\n    throw error;\n   }\n  };\n  m247Stats.hook=true;\n }\n}\n";

export function deriveOriginalP94JsepObserver(workerSource){
 assert.equal(gitBlob(Buffer.from(workerSource)),ORIGINAL_WORKER_BLOB,
  'Original consumer P94 source byte drift');
 let source=workerSource;
 const success="  return {model,processor,RawImage};";
 const failure=" })().catch(error=>{loader=null;throw error;});";
 assert.equal(source.split(success).length,2,'Pinned original model success anchor changed');
 assert.equal(source.split(failure).length,2,'Pinned original model failure anchor changed');
 source=source.replace(success,"  m247Emit(requestId,'ready');\n"+success);
 source=source.replace(failure," })().catch(error=>{m247Emit(requestId,'error');loader=null;throw error;});");
 assert.ok(source.includes("const model=await AutoModelForSemanticSegmentation.from_pretrained(modelId,"));
 assert.ok(source.includes("device:'wasm',dtype:'fp32'"));
 assert.ok(source.includes("reason:'P94_'+diagnosticStage"));
 assert.ok(source.includes("self.postMessage({type:'piece'"));
 assert.ok(source.includes("self.postMessage({type:'done'"));
 return M247_WORKER_PROBE+'\n'+source;
}
export function sanitizeRealWorkerJsepMessage(d){
 if(d?.type!=='diagnostic'||d?.phase!=='m247_jsep_memory')return null;
 if(!['ready','error'].includes(d.outcome))return null;
 const n=(x,max)=>Number.isInteger(x)&&x>=0&&x<=max?x:null;
 return {phase:'m247_jsep_memory',outcome:d.outcome,hookInstalled:d.hookInstalled===true,
  growCalls:n(d.growCalls,100000),growErrors:n(d.growErrors,100000),
  targetCount:n(d.targetCount,16),validTargets:n(d.validTargets,16),
  firstPages:n(d.firstPages,65536),terminalPages:n(d.terminalPages,65536)};
}
export function verifySameOriginalJsepModelBoundary(events,assetReceipt,engine){
 assert.ok(['webkit','chromium'].includes(engine));
 assert.ok(Array.isArray(events));
 assert.equal(events.length,1,'Missing/ambiguous original Worker model terminal');
 const event=events[0];
 assert.equal(event.outcome,'ready','Original true model-load failed; preserve RED');
 assert.equal(event.hookInstalled,true,'Original JSEP Memory.prototype.grow observer absent');
 assert.ok(Number.isInteger(event.growCalls)&&event.growCalls>0,
  'Original JSEP WASM JS memory grow was not observed');
 assert.equal(event.growErrors,0,'Native memory grow threw');
 assert.ok(event.targetCount>0&&event.validTargets>0);
 assert.ok(event.firstPages>0&&event.terminalPages>=event.firstPages);
 assert.equal(assetReceipt.originalP94Worker,true);
 assert.equal(assetReceipt.originalTransformersVersion,'3.8.1');
 assert.equal(assetReceipt.originalWasmHTTP200Count,1);
 assert.equal(assetReceipt.independentPublicPinnedWasmBodySHA256Count,1);
 const binary=assetReceipt.independentPublicWasm[0];
 assert.equal(binary.name,'ort-wasm-simd-threaded.jsep.wasm');
 assert.equal(binary.sha256,ORIGINAL_JSEP_SHA);
 assert.equal(binary.matchesInstalledLocalWasm,true);
 if(engine==='webkit')
  assert.equal(assetReceipt.actualOriginalWasmResponseBytesVerified,true,
   'Original WebKit JSEP browser bytes still not attested');
 return {
  schema:'M247_TRUE_ORIGINAL_P94_JSEP_SESSION_HEAP/v1',engine,
  actualOriginalP94SegFormerModel:true,realWorkerObserverOnly:true,
  originalModelSessionReady:true,jsMemoryGrowCalls:event.growCalls,
  jsMemoryGrowErrorCount:event.growErrors,retainedWasmMemoryRefs:event.validTargets,
  firstObservedPages:event.firstPages,terminalPages:event.terminalPages,
  originalJsepWasmName:binary.name,originalJsepWasmSha256:binary.sha256,
  actualOriginalBrowserJsepBodyHash:assetReceipt.actualOriginalWasmResponseBytesVerified,
  sameAsNonJsepOriginalGraph:false,exactNativeCppAllocatorPolicyUnverified:true,
  realWebkitNaturalRedSeen:false,realRedToGreenFixProven:false,
  originalOwnerPrivate2DV4MustPass:true,releaseAuthorized:false,familyAlphaHold:true
 };
}
