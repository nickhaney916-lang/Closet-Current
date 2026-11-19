/**
 * M243: original pinned Xenova SegFormer ONNX GRAPH session-creation witness.
 * Disposable research-only ESM derived from M242 original SHA-attested bytes.
 * NOT full original owner/photo-to-private-2D/v4 acceptance (see M240).
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {instrumentExactPinnedModule,verifyPinnedSources}
 from './main242-ort-session-abi-trace.mjs';

export const MODEL_ID='Xenova/segformer_b0_clothes';
export const MODEL_REVISION='a2489ea8e7ec1ee912190546bad31a4906ccca76';
export const MODEL_PATH='onnx/model.onnx';
export const MODEL_URL='https://huggingface.co/'+MODEL_ID+'/resolve/'+MODEL_REVISION+'/'+MODEL_PATH;
export const MODEL_METADATA_URL='https://huggingface.co/api/models/'+MODEL_ID+'/tree/'+MODEL_REVISION+'/onnx';
export const MAX_BYTES=32000000;
export const MIN_BYTES=1000000;
const sha256=b=>createHash('sha256').update(b).digest('hex');

export function locateNativeModelSessionCall(source){
 const hits=[...source.matchAll(/\b([A-Za-z_$][\w$]*)\._OrtCreateSession\(/g)];
 assert.equal(hits.length,1,'Expected one and only one original ORT native model-session export call');
 const m=hits[0],receiver=m[1];
 let pos=m.index+m[0].length,depth=1,quote=null,escaped=false;
 for(;pos<source.length;pos++){
  const c=source[pos];
  if(quote){
   if(escaped){escaped=false;continue;}
   if(c==='\\'){escaped=true;continue;}
   if(c===quote)quote=null;
   continue;
  }
  if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
  if(c==='(')depth++;
  if(c===')'&&--depth===0)break;
 }
 assert.equal(depth,0,'Native session export-call arguments not balanced');
 return {start:m.index,end:pos+1,receiver};
}
export function instrumentOriginalGraphSession(source,expectedOriginalSha){
 const m242=instrumentExactPinnedModule(source,expectedOriginalSha);
 const original=m242.content;
 const call=locateNativeModelSessionCall(original);
 const substring=original.slice(call.start,call.end);
 const leading=call.receiver+'._OrtCreateSession(';
 assert.ok(substring.startsWith(leading),'Original native model creation call changed');
 const args=substring.slice(leading.length,-1);
 const revised='m243ObserveNativeSession('+call.receiver+'._OrtCreateSession,'+call.receiver+','+args+')';
 const traceHeader=[
  '/* M243 read-only numeric native session-call boundary. No heap/model bytes. */',
  'function m243MemorySnapshot(){',
  ' const r=globalThis.__m243MemoryTargets||[];',
  ' let first=0,now=0;',
  ' for(const x of r){',
  '  first=Math.max(first,Number.isInteger(x.first)?x.first:0);',
  '  try{now=Math.max(now,Math.floor(x.memory.buffer.byteLength/65536));}catch{}',
  ' }',
  ' return {targetCount:Math.min(16,r.length),firstPages:first,nowPages:now,',
  '  jsGrowCalls:Math.min(100000,globalThis.__m243GrowCalls||0)};',
  '}',
  'function m243ObserveNativeSession(fn,receiver,...args){',
  ' const record={before:m243MemorySnapshot(),after:null,argumentCount:args.length,',
  '  actualNativeExportCalled:true,returnedHandle:false,threw:false,errorName:null};',
  ' (globalThis.__m243SessionCalls??=[]).push(record);',
  ' try{',
  '  const result=Reflect.apply(fn,receiver,args);',
  '  record.after=m243MemorySnapshot();',
  '  record.returnedHandle=Number.isInteger(result)&&result!==0;',
  '  return result;',
  ' }catch(error){',
  '  record.after=m243MemorySnapshot();record.threw=true;',
  "  record.errorName=['RuntimeError','Error','RangeError','TypeError','CompileError','LinkError'].includes(error?.name)?error.name:'other';",
  '  throw error;',
  ' }',
  '}'
 ].join('\n')+'\n';
 return {content:traceHeader+original.slice(0,call.start)+revised+original.slice(call.end),
  audit:{pinnedSourceSha256:sha256(Buffer.from(source)),
   nativeModelExportCallFound:true,actualWasmNativeCallPending:true,
   CAllocatorStateObserved:false,originalP94WorkerUnmodified:true,noRelease:true}};
}
export function parsePinnedHfMetadata(metadata){
 assert.ok(Array.isArray(metadata),'HF revision model tree must be an array');
 const matches=metadata.filter(x=>x.path===MODEL_PATH);
 assert.equal(matches.length,1,'Original ONNX graph path missing or ambiguous');
 const entry=matches[0];
 const hash=entry.lfs?.sha256||entry.lfs?.oid||null;
 assert.match(hash||'',/^[0-9a-f]{64}$/,'Original graph LFS SHA256 unavailable; refuse unverified model');
 assert.ok(Number.isInteger(entry.size)&&entry.size>=MIN_BYTES&&entry.size<=MAX_BYTES,
  'Unexpected pinned original SegFormer graph size');
 return {sha256:hash,size:entry.size,path:MODEL_PATH};
}
export async function downloadAttestedModel(fetcher=fetch){
 const metadata=await fetcher(MODEL_METADATA_URL,{signal:AbortSignal.timeout(90000)});
 assert.ok(metadata.ok,'Original pinned HF model metadata not reachable');
 const pinned=parsePinnedHfMetadata(await metadata.json());
 const response=await fetcher(MODEL_URL,{redirect:'follow',signal:AbortSignal.timeout(180000)});
 assert.ok(response.ok,'Original pinned HF ONNX model asset unavailable');
 const bytes=new Uint8Array(await response.arrayBuffer());
 assert.equal(bytes.byteLength,pinned.size,'Original pinned model byte size mismatch');
 assert.equal(sha256(bytes),pinned.sha256,'Pinned original SegFormer ONNX SHA256 mismatch');
 return {bytes,source:{sha256:pinned.sha256,bytes:bytes.length,
  revision:MODEL_REVISION,originalGraph:true}};
}
export async function auditCurrentOriginal(){
 const r=await verifyPinnedSources();
 const derived=instrumentOriginalGraphSession(r.source,r.sha256);
 return {source:r,derived};
}
