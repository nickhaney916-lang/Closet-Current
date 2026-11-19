/**
 * M242: prove exact pinned ONNX Runtime WASM JavaScript-to-C-export argument
 * POSITION, NOT the underlying C allocator behavior. Read-only research;
 * no production Worker, model, original JPEG or owner code is modified.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';

export const EXPECTED={
 wasm:'98fe788f08034b3417c1fa94493a9dd0089485e53fa7010b13f7a137977549fa',
 wasmBundleMin:'ce886d4ba4d4612eb288715bc23794dd3fadbc9c83e27d2d984df4d1ba149524',
 ort:'1.22.0-dev.20250409-89f8206ba4',
 transformers:'3.8.1'
};
const hash=b=>createHash('sha256').update(b).digest('hex');

/** Split balanced function-call arguments, respecting nested parens, strings,
 * and source comments. This inspects public code; it never executes the
 * exported ONNX C/WASM function or samples customer/model data.
 */
export function splitCallArguments(code,open){
 assert.equal(code[open],'(');
 let depth=['('],quote=null,escaped=false,inLine=false,inBlock=false;
 const parts=[];let start=open+1;
 for(let i=open+1;i<code.length;i++){
  const ch=code[i],next=code[i+1];
  if(inLine){if(ch==='\n')inLine=false;continue;}
  if(inBlock){if(ch==='*'&&next==='/'){inBlock=false;i++;}continue;}
  if(quote){
   if(escaped){escaped=false;continue;}
   if(ch==='\\'){escaped=true;continue;}
   if(ch===quote)quote=null;
   continue;
  }
  if(ch==='/'&&next==='/'){inLine=true;i++;continue;}
  if(ch==='/'&&next==='*'){inBlock=true;i++;continue;}
  if(ch==='"'||ch==="'"||ch===String.fromCharCode(96)){quote=ch;continue;}
  if(ch==='('||ch==='['||ch==='{'){depth.push(ch);continue;}
  if(ch===')'||ch===']'||ch==='}'){
   const opening=depth.pop();
   assert.equal(opening,ch===')'?'(':ch===']'?'[':'{','unbalanced expression');
   if(depth.length===0){
    const part=code.slice(start,i).trim();
    if(part.length)parts.push(part);
    return {args:parts,ending:i};
   }
   continue;
  }
  if(ch===','&&depth.length===1){parts.push(code.slice(start,i).trim());start=i+1;}
 }
 throw Error('truncated native session-options call');
}
/** Find exact method calls rather than just finding API words. */
export function extractNativeSessionCalls(source){
 const token=/\.\s*_OrtCreateSessionOptions\s*\(/g;
 const calls=[];let match;
 while((match=token.exec(source))){
  const open=source.indexOf('(',match.index);
  const parsed=splitCallArguments(source,open);
  calls.push({args:parsed.args,at:match.index});
  token.lastIndex=parsed.ending+1;
 }
 return calls;
}
export function classifyPosition(args){
 const locations=args.flatMap((value,i)=>/\benableMemPattern\b/.test(value)?[i]:[]);
 if(locations.length===1&&locations[0]===2&&
    /^!!\s*[A-Za-z_$][A-Za-z0-9_$]*\.enableMemPattern$/.test(args[2])&&
    /\benableCpuMemArena\b/.test(args[1]))
  return 'static-wasm-export-argument-2-source-verified-native-value-unobserved';
 if(locations.length)return 'static-wasm-export-argument-other-or-ambiguous';
 return 'static-wasm-export-forwarding-not-identifiable';
}
export async function auditExactPinnedABI(root=process.cwd()){
 root=resolve(root);
 const pkg=JSON.parse(await readFile(join(root,'node_modules/onnxruntime-web/package.json'),'utf8'));
 const transformers=JSON.parse(await readFile(join(root,'node_modules/@huggingface/transformers/package.json'),'utf8'));
 assert.equal(pkg.version,EXPECTED.ort);
 assert.equal(transformers.version,EXPECTED.transformers);
 assert.equal(transformers.dependencies['onnxruntime-web'],EXPECTED.ort);
 const reports=[];
 for(const [name,expected] of [['ort.wasm.mjs',EXPECTED.wasm],['ort.wasm.bundle.min.mjs',EXPECTED.wasmBundleMin]]){
  const bytes=await readFile(join(root,'node_modules/onnxruntime-web/dist',name));
  const digest=hash(bytes);
  assert.equal(digest,expected,'Pinned ORT ESM WASM artifact changed: '+name);
  const source=bytes.toString('utf8');
  const calls=extractNativeSessionCalls(source);
  reports.push({artifact:name,sha256:digest,bytes:bytes.length,
   nativeExportCalls:calls.length,argumentCounts:calls.map(c=>c.args.length),
   memoryOptionPositions:calls.map(c=>c.args.flatMap((v,i)=>/\benableMemPattern\b/.test(v)?[i]:[])),
   forwardingClass:calls.map(c=>classifyPosition(c.args)),
   argumentSamples:calls.slice(0,3).map(c=>c.args.map(a=>a.slice(0,100))),
   sourceOnly:true,nativeCallObserved:false,nativeStateObserved:false});
 }
 return {schema:'M242_PINNED_ORT_SESSION_ABI/v1',version:EXPECTED.ort,
  reports,productWorkerUnchanged:true,originalModelUntouched:true,
  nativeCallObserved:false,nativeAllocatorPolicyProven:false,
  genuineWebKitRedGreenProven:false,releaseAuthorized:false,hold:true};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const data=await auditExactPinnedABI(process.cwd());
 console.log('M242_PINNED_ABI_ARGUMENT_SOURCE_EVIDENCE',JSON.stringify(data));
 for(const report of data.reports){
  assert.equal(report.nativeExportCalls,1,'Pinned ORT native session-options call count drifted');
  assert.deepEqual(report.argumentCounts,[10],'Pinned native session-options call arity drifted');
  assert.deepEqual(report.memoryOptionPositions,[[2]],'Pinned enableMemPattern argument position drifted');
  assert.deepEqual(report.forwardingClass,
   ['static-wasm-export-argument-2-source-verified-native-value-unobserved'],
   'Pinned source did not prove 3rd native export parameter mapping');
 }
 assert.equal(data.nativeAllocatorPolicyProven,false,
  'JS-to-WASM source argument position is not native allocator proof');
}
