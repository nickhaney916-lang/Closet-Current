/** M251 source-pinned original product-Worker JSEP native option ABI observer.
 * Test-only WASM exports getter Proxy captures only numeric options flag,
 * count and success of actual native exports, rethrows all native errors.
 * Never capture arguments other than the boolean flag, heap, pointers, photos.
 */
import assert from 'node:assert/strict';
import {disposableM247WorkerReplacement} from './main250-original-jsep-mempattern-study.mjs';
export const M251_WORKER_NATIVE_ABI_PROBE="\n/* M251: test-only, pass-through actual WebAssembly.Instance.exports native ABI witness.\n   No linear-memory view, model weights, photo bytes, owner data, pointers or raw errors. */\nconst m251Stat={hook:false,options:0,sessions:0,optionsArgs:null,flag:null,flagType:'unobserved',\n optionsHandle:false,sessionHandle:false,error:'none',seenOriginalExports:false,\n cache:new WeakMap()};\n{\n const proto=WebAssembly.Instance?.prototype;\n const descriptor=proto&&Object.getOwnPropertyDescriptor(proto,'exports');\n if(descriptor&&typeof descriptor.get==='function'&&descriptor.configurable===true){\n  try{\n   Object.defineProperty(proto,'exports',{\n    configurable:true,enumerable:descriptor.enumerable,\n    get:function(){\n     const originalExports=Reflect.apply(descriptor.get,this,[]);\n     if(!originalExports||typeof originalExports!=='object')return originalExports;\n     let proxy=m251Stat.cache.get(originalExports);\n     if(proxy)return proxy;\n     const wrappedFunctions=new Map();\n     proxy=new Proxy(originalExports,{\n      get(target,name){\n       const original=Reflect.get(target,name,target);\n       if(name!=='_OrtCreateSessionOptions'&&name!=='_OrtCreateSession')return original;\n       if(typeof original!=='function')return original;\n       m251Stat.seenOriginalExports=true;\n       if(wrappedFunctions.has(name))return wrappedFunctions.get(name);\n       const wrapped=function(...args){\n        const options=name==='_OrtCreateSessionOptions';\n        if(options){\n         m251Stat.options=Math.min(100,m251Stat.options+1);\n         m251Stat.optionsArgs=Math.min(50,args.length);\n         const flag=args[2];\n         m251Stat.flagType=typeof flag==='number'?'number':\n                            typeof flag==='boolean'?'boolean':'other';\n         m251Stat.flag=(flag===0||flag===false)?0:(flag===1||flag===true)?1:null;\n        }else m251Stat.sessions=Math.min(100,m251Stat.sessions+1);\n        try{\n         const out=Reflect.apply(original,this,args);\n         if(Number.isInteger(out)&&out!==0){\n          if(options)m251Stat.optionsHandle=true;\n          else m251Stat.sessionHandle=true;\n         }\n         return out;\n        }catch(error){\n         const n=error?.name;\n         m251Stat.error=['RuntimeError','TypeError','RangeError','Error','CompileError','LinkError']\n          .includes(n)?n:'other';\n         throw error;\n        }\n       };\n       wrappedFunctions.set(name,wrapped);\n       return wrapped;\n      }\n     });\n     m251Stat.cache.set(originalExports,proxy);\n     return proxy;\n    }\n   });\n   m251Stat.hook=true;\n  }catch{}\n }\n}\nfunction m251Emit(id,outcome){\n self.postMessage({type:'diagnostic',id,phase:'m251_native_session_abi',outcome,\n  nativeExportsGetterHookInstalled:m251Stat.hook,\n  actualOrtExportsObserved:m251Stat.seenOriginalExports,\n  nativeOptionsCallCount:m251Stat.options,\n  nativeSessionCallCount:m251Stat.sessions,\n  nativeOptionsArgumentCount:m251Stat.optionsArgs,\n  nativeMemoryPatternOptionFlag:m251Stat.flag,\n  nativeFlagValueType:m251Stat.flagType,\n  nativeOptionsHandleReturned:m251Stat.optionsHandle,\n  nativeSessionHandleReturned:m251Stat.sessionHandle,\n  nativeErrorClass:m251Stat.error});\n}\n";
export const M251_ORIGINAL_BROWSER_REPORT_EXTENSION="\n/* M251 source-derived true original P94 JSEP browser metadata listener.\n   Installed before page loads. Any real original failure remains nonzero. */\nconst m251State=\"const m249Errors=[],m249Heap=[];\";\nassert.equal(source.split(m251State).length,2,'M251 original error collector moved');\nsource=source.replace(m251State,m251State+\"\\nconst m251Abi=[];\");\nconst m251Page=\" const page=await context.newPage();\";\nassert.equal(source.split(m251Page).length,2,'M251 real browser page anchor changed');\nconst m251Listener=[\n\" await context.addInitScript(() => {\",\n\"  const PriorWorker=window.Worker;\",\n\"  window.Worker=class extends PriorWorker{\",\n\"   constructor(url,options){super(url,options);\",\n\"    let path='';try{path=new URL(String(url),location.href).pathname;}catch{}\",\n\"    if(path!=='/public/outfit-worker-p94.mjs')return;\",\n\"    this.addEventListener('message',e=>{\",\n\"     const d=e.data;\",\n\"     if(d?.type!=='diagnostic'||d?.phase!=='m251_native_session_abi')return;\",\n\"     const cap=(v,max)=>Number.isInteger(v)&&v>=0&&v<=max?v:null;\",\n\"     const types=['number','boolean','other','unobserved'];\",\n\"     const errors=['none','RuntimeError','TypeError','RangeError','Error','CompileError','LinkError','other'];\",\n\"     const safe={\",\n\"      phase:'m251_native_session_abi',outcome:['ready','error'].includes(d.outcome)?d.outcome:'other',\",\n\"      hook:d.nativeExportsGetterHookInstalled===true,\",\n\"      nativeExportsObserved:d.actualOrtExportsObserved===true,\",\n\"      optionsCalls:cap(d.nativeOptionsCallCount,100),\",\n\"      sessionCalls:cap(d.nativeSessionCallCount,100),\",\n\"      optionArgumentCount:cap(d.nativeOptionsArgumentCount,50),\",\n\"      memPatternFlag:d.nativeMemoryPatternOptionFlag===0?0:d.nativeMemoryPatternOptionFlag===1?1:null,\",\n\"      flagType:types.includes(d.nativeFlagValueType)?d.nativeFlagValueType:'other',\",\n\"      optionsHandle:d.nativeOptionsHandleReturned===true,\",\n\"      sessionHandle:d.nativeSessionHandleReturned===true,\",\n\"      nativeErrorClass:errors.includes(d.nativeErrorClass)?d.nativeErrorClass:'other'\",\n\"     };\",\n\"     console.log('M251_SOURCE_BOUND_NATIVE_ABI_MESSAGE '+JSON.stringify(safe));\",\n\"    });\",\n\"   }\",\n\"  };\",\n\" });\",\nm251Page,\n\" page.on('console',msg=>{\",\n\"  const text=msg.text();const prefix='M251_SOURCE_BOUND_NATIVE_ABI_MESSAGE ';\",\n\"  if(!text.startsWith(prefix))return;\",\n\"  try{\",\n\"   const data=JSON.parse(text.slice(prefix.length));\",\n\"   if(data?.phase==='m251_native_session_abi'&&m251Abi.length<8)m251Abi.push(data);\",\n\"  }catch{}\",\n\" });\"\n].join(\"\\n\");\nsource=source.replace(m251Page,m251Listener);\nconst m251Receipt=\" const m251Receipt={schema:'M251_REAL_ORIGINAL_JSEP_NATIVE_OPTIONS_ABI/v1',engine,\";\nconst m251ReceiptBody=\"  eventCount:m251Abi.length,...(m251Abi.length===1?m251Abi[0]:{}),\"+\n \" actualProductP94WorkerUnchanged:true,exactOriginalNativeTransportInvestigated:true,\"+\n \" nativeCppAllocatorStateObserved:false,permanentFixProven:false,releaseAuthorized:false,familyAlphaHold:true};\";\nconst m251Positive=\" console.log('M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY',JSON.stringify({...m247Receipt,\";\nassert.equal(source.split(m251Positive).length,2,'M251 original successful JSEP model anchor changed');\nsource=source.replace(m251Positive,m251Receipt+\"\\n\"+m251ReceiptBody+\"\\n\"+\n \" console.log('M251_REAL_ORIGINAL_JSEP_NATIVE_ABI',JSON.stringify(m251Receipt));\\n\"+m251Positive);\nconst m251Negative=\" console.log('M249_ORIGINAL_FAILED_ATTEMPT_JSEP_EVIDENCE',JSON.stringify(evidence249));\";\nassert.equal(source.split(m251Negative).length,2,'M251 original failed model report moved');\nsource=source.replace(m251Negative,m251Receipt+\"\\n\"+m251ReceiptBody+\"\\n\"+\n \" console.log('M251_REAL_ORIGINAL_JSEP_NATIVE_ABI',JSON.stringify(m251Receipt));\\n\"+m251Negative);\n";
export const JSEP_HASH='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
export function makeM251WorkerSource(){
 const original=disposableM247WorkerReplacement();
 const extended=[
  original,
  'const m251Probe='+JSON.stringify(M251_WORKER_NATIVE_ABI_PROBE)+';',
  "const m251Ready=\"  m247Emit(requestId,'ready');\";",
  "const m251Failed=\"m247Emit(requestId,'error');\";",
  "assert.equal(observedWorker.split(m251Ready).length,2,'M251 original model-ready native option export moved');",
  "assert.equal(observedWorker.split(m251Failed).length,2,'M251 original model-error native option export moved');",
  "observedWorker=observedWorker.replace(m251Ready,\"  m251Emit(requestId,'ready');\\n\"+m251Ready);",
  "observedWorker=observedWorker.replace(m251Failed,\"m251Emit(requestId,'error');\"+m251Failed);",
  "observedWorker=m251Probe+'\\n'+observedWorker;"
 ];
 return extended.join('\n');
}
export function instrumentM251OriginalM250Runner(derived){
 assert.equal(typeof derived,'string');
 const before="replaceOne(worker,"+JSON.stringify(disposableM247WorkerReplacement())+");";
 assert.equal(derived.split(before).length,2,'M250 source-derived original Worker slot changed');
 const after="replaceOne(worker,"+JSON.stringify(makeM251WorkerSource())+");";
 let code=derived.replace(before,after);
 const original="source=source.replace(injectAt,build+'\\n'+injectAt);";
 assert.equal(code.split(original).length,2,'M249 real WebKit browser construction point changed');
 code=code.replace(original,"source=source.replace(injectAt,build+'\\n'+m251Build+'\\n'+injectAt);");
 const inject="const injectAt='assert.ok(source.includes(\"M58_REAL_P88_WORKER_FAIL\"));';";
 assert.equal(code.split(inject).length,2,'Original failure guard source moved');
 code=code.replace(inject,
  "const m251Build="+JSON.stringify(M251_ORIGINAL_BROWSER_REPORT_EXTENSION)+";\n"+inject);
 const prefix="   'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS '];";
 assert.equal(code.split(prefix).length,2,'M249 real original owner/backup receipt whitelist changed');
 code=code.replace(prefix,
  "   'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS ',\n   'M251_REAL_ORIGINAL_JSEP_NATIVE_ABI '];");
 return code;
}
function exactOne(stdout,marker){
 assert.equal(typeof stdout,'string');
 assert.ok(stdout.length<=16*1024*1024,'Unbounded native browser logs disallowed');
 const list=stdout.split(/\r?\n/).filter(x=>x.startsWith(marker+' '));
 assert.ok(list.length<=1,'Duplicate original native options receipt');
 if(!list.length)return null;
 const json=list[0].slice(marker.length+1);
 assert.ok(json.length<=2500,'Native options receipt oversized');
 const v=JSON.parse(json);
 assert.ok(v&&typeof v==='object'&&!Array.isArray(v),'Native options receipt invalid');
 return v;
}
export function classifyM251OriginalNative({engine,width,arm,attempt,status,stdout,originalM250}){
 assert.ok(['webkit','chromium'].includes(engine));
 assert.ok([320,390].includes(width));
 assert.ok(['baseline','pattern_off'].includes(arm));
 assert.ok(Number.isInteger(attempt)&&attempt===1);
 assert.ok(status===null||Number.isInteger(status));
 const data=exactOne(stdout,'M251_REAL_ORIGINAL_JSEP_NATIVE_ABI');
 const original=originalM250&&typeof originalM250==='object'?originalM250:null;
 const valid=data?.schema==='M251_REAL_ORIGINAL_JSEP_NATIVE_OPTIONS_ABI/v1'&&
  data.engine===engine&&data.eventCount===1&&data.phase==='m251_native_session_abi'&&
  data.hook===true&&data.nativeExportsObserved===true&&
  data.outcome==='ready'&&data.optionsCalls===1&&data.sessionCalls===1&&
  Number.isInteger(data.optionArgumentCount)&&data.optionArgumentCount>=3&&
  (data.memPatternFlag===0||data.memPatternFlag===1)&&
  ['number','boolean'].includes(data.flagType)&&
  data.optionsHandle===true&&data.sessionHandle===true&&
  data.nativeCppAllocatorStateObserved===false&&data.permanentFixProven===false&&
  data.releaseAuthorized===false&&data.familyAlphaHold===true;
 const positive=!!(original?.positive===true&&status===0&&valid);
 const flag=valid?data.memPatternFlag:null;
 return {
  schema:'M251_TRUE_ORIGINAL_JSEP_NATIVE_SESSION_ABI_GATE/v1',engine,width,arm,attempt,
  originalModelOwnerPrivacyPositive:original?.positive===true,
  sourcePinnedOriginalJsepReady:original?.originalJsepModelReady===true,
  originalDirectJsepWebkitResponseSha256Verified:engine==='webkit'&&original?.actualOriginalBrowserResponseShaVerified===true,
  originalNativeReceiptPresent:!!data,
  actualBoundedWorkerEventCount:Number.isInteger(data?.eventCount)&&data.eventCount>=0&&data.eventCount<=8?data.eventCount:null,
  exportsGetterHookInstalled:data?.hook===true,
  wasmOrtExportsObserved:data?.nativeExportsObserved===true,
  observedNativeOptionsCalls:Number.isInteger(data?.optionsCalls)&&data.optionsCalls>=0&&data.optionsCalls<=100?data.optionsCalls:null,
  observedNativeSessionCalls:Number.isInteger(data?.sessionCalls)&&data.sessionCalls>=0&&data.sessionCalls<=100?data.sessionCalls:null,
  observedNativeArgCount:Number.isInteger(data?.optionArgumentCount)&&data.optionArgumentCount>=0&&data.optionArgumentCount<=50?data.optionArgumentCount:null,
  observedNativeOptionsHandle:data?.optionsHandle===true,
  observedNativeSessionHandle:data?.sessionHandle===true,
  observedNativeFlagType:['number','boolean','other','unobserved'].includes(data?.flagType)?data.flagType:null,
  actualNativeWebAssemblyOptionsExportCalled:valid,
  actualNativeWebAssemblySessionExportCalled:valid,
  nativeAbiMemoryPatternFlag:flag,
  requestedFlag:arm==='baseline'?1:0,
  nativeAbiOptionMatchesRequest:valid&&flag===(arm==='baseline'?1:0),
  originalNativeOptionTransportProven:valid,
  nativeCallFailurePreserved:!positive,
  modelAndOwnerAndAbiPass:positive,
  nativeCppAllocatorInternalStateObserved:false,
  naturalOriginalWebkitMemoryRedReproduced:false,
  permanentMemoryRepairProven:false,
  physicalSafariOrHostedRlsVerified:false,
  releaseAuthorized:false,familyAlphaHold:true
 };
}
