/**
 * M242: exact pinned ONNX Runtime Web ESM ABI call-site instrumenter.
 * Research-only: alters a disposable, locally served ESM copy, never the
 * installed consumer P94 Worker, model, weights, owner photo or live runtime.
 * Captures boolean CALL arguments to the actual WASM export and its opaque
 * success handle; not the inaccessible internal allocator state.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

export const PINNED_ORT='1.22.0-dev.20250409-89f8206ba4';
export const PINNED_SHA256='98fe788f08034b3417c1fa94493a9dd0089485e53fa7010b13f7a137977549fa';
export const ORIGINAL_WORKER_GIT_BLOB='d66651b616de54c51eb7ef986324b30f1580888f';
export const SOURCE_FILE='node_modules/onnxruntime-web/dist/ort.wasm.mjs';
export const TARGET='._OrtCreateSessionOptions(';
const sha256=b=>createHash('sha256').update(b).digest('hex');
const blob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');

export function locateActualAbiCall(source){
 const matches=[...source.matchAll(/\b([A-Za-z_$][\w$]*)\._OrtCreateSessionOptions\(/g)];
 assert.equal(matches.length,1,'Expected exactly one genuine pinned WASM session-options ABI call');
 const m=matches[0];
 const instance=m[1];
 let pos=m.index+m[0].length,depth=1,quote=null,escaped=false;
 for(;pos<source.length;pos++){
  const c=source[pos];
  if(quote){
   if(escaped){escaped=false;continue;}
   if(c==='\\'){escaped=true;continue;}
   if(c===quote){quote=null;}continue;
  }
  if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
  if(c==='(')depth++;
  else if(c===')'&&--depth===0)break;
 }
 assert.equal(depth,0,'Unbalanced native ABI call in pinned artifact');
 const args=source.slice(m.index+m[0].length,pos);
 // The unmodified API path must actually pass sessionOptions.enableMemPattern
 // or reject this experiment as unsupported. A JS token elsewhere is not enough.
 assert.match(args,/enableMemPattern/,'ABI call arguments do not mention the memory pattern option');
 const location={start:m.index,end:pos+1,instance,sha256:sha256(Buffer.from(source)),boolOptionMarker:true};
 return location;
}
export function instrumentExactPinnedModule(source,expectedHash=PINNED_SHA256){
 assert.equal(sha256(Buffer.from(source)),expectedHash,'Original pinned ESM bytes changed');
 const call=locateActualAbiCall(source);
 const original=source.slice(call.start,call.end);
 const prefix=call.instance+'._OrtCreateSessionOptions(';
 assert.ok(original.startsWith(prefix));
 const args=original.slice(prefix.length,-1);
 const revised='m242RecordNativeCall('+call.instance+'._OrtCreateSessionOptions,'+call.instance+','+args+')';
 const spy=`
/* M242 disposable pass-through ABI spy: arguments only, never WASM bytes. */
function m242RecordNativeCall(fn,receiver,...args){
 const record={arenaFlag:typeof args[1]==='boolean'?args[1]:null,
  memPatternFlag:typeof args[2]==='boolean'?args[2]:null,
  argCount:args.length,actualCall:true,handleReturned:false};
 (globalThis.__m242OrtAbiCalls??=[]).push(record);
 // Preserve call semantics and exact thrown errors.
 const result=Reflect.apply(fn,receiver,args);
 record.handleReturned=Number.isInteger(result)&&result!==0;
 return result;
}
`;
 return {content:spy+source.slice(0,call.start)+revised+source.slice(call.end),
  audit:{sourceSha256:call.sha256,instance:call.instance,
   instrumentationOnly:true,sourceOptionForwarding:true,
   directCAllocatorStateObserved:false,releaseAuthorized:false}};
}
export async function verifyPinnedSources(root=process.cwd()){
 const [bytes,worker,pkg]=await Promise.all([
  readFile(join(root,SOURCE_FILE)),
  readFile(join(root,'public/outfit-worker-p94.mjs')),
  readFile(join(root,'node_modules/onnxruntime-web/package.json'),'utf8')
 ]);
 assert.equal(blob(worker),ORIGINAL_WORKER_GIT_BLOB,'Original consumer Worker changed');
 assert.equal(JSON.parse(pkg).version,PINNED_ORT,'Pinned ORT version changed');
 assert.equal(sha256(bytes),PINNED_SHA256,'Pinned ESM binary changed');
 return {bytes,sha256:sha256(bytes),source:bytes.toString('utf8')};
}
if(process.argv[1]&&process.argv[1].endsWith('main242-ort-session-abi-trace.mjs')){
 const {source}=await verifyPinnedSources();
 const {audit}=instrumentExactPinnedModule(source);
 console.log('M242_PINNED_NATIVE_ABI_SOURCE',JSON.stringify(audit));
}
