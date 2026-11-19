// Research-only P94 original-browser network-context binary response witness.
// Does NOT attest original ONNX/JSEP compiled native bytes or repair WebKit.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const runner='scripts/test-parallel94-native-p88-browser.mjs';
const child='scripts/.m259-original-context-observation.mjs';
const jsep='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const anchorA='const external=[],rejected=[],issues=[],modelResponses=[];';
const anchorB=" stage='sign-in';";
const anchorC='}finally{\n await browser?.close();await new Promise(resolve=>server.close(resolve));\n}';
const listen=[
" context.on('response',res=>{",
"  let r=res.request(),model=false;",
"  for(let i=0;r&&i<8;i++,r=r.redirectedFrom()){",
"   try{const p=new URL(r.url()).pathname;",
"    if(p.includes('/Xenova/segformer_b0_clothes/')&&/\\.onnx$/i.test(p))model=true;",
"   }catch{}",
"  }",
"  let wasm=false;",
"  try{wasm=/\\/ort-wasm-simd-threaded\\.jsep\\.wasm$/i.test(new URL(res.url()).pathname);}catch{}",
"  if(!model&&!wasm)return;",
"  const kind=wasm?'jsep-wasm':'model-onnx';",
"  m259Pending.push((async()=>{",
"   if(res.status()<200||res.status()>=300){m259Rows.push({kind,status:'non-200'});return;}",
"   try{const bytes=await res.body();",
"    const sha256=createHash('sha256').update(bytes).digest('hex');",
"    const valid=kind!=='jsep-wasm'||(bytes.length>=8&&bytes[0]===0&&bytes[1]===97&&bytes[2]===115&&bytes[3]===109);",
"    m259Rows.push({kind,status:valid?'body-observed':'invalid-wasm-magic',sha256,size:bytes.length});",
"   }catch{m259Rows.push({kind,status:'body-unavailable'});}",
"  })());",
" });"
].join('\n');
const close=[
"}finally{",
" await Promise.allSettled(m259Pending);",
" const rows=m259Rows.slice().sort((a,b)=>a.kind.localeCompare(b.kind)||String(a.sha256||'').localeCompare(String(b.sha256||'')));",
" const wasm=rows.some(r=>r.kind==='jsep-wasm'&&r.status==='body-observed'&&r.sha256==='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39');",
" const onnx=rows.some(r=>r.kind==='model-onnx'&&r.status==='body-observed'&&r.size>0);",
" console.log('M259_CONTEXT_NETWORK_WITNESS',JSON.stringify({schema:'M259_CONTEXT_NETWORK_V1',engine,width,rows,wasmNetworkMatch:wasm,modelNetworkObserved:onnx,compiledWasmAttested:false,loadedModelAttested:false,sameNativeProcessProven:false,sourceEvidenceGate:'BLOCKED',familyAlpha:'HOLD'}));",
" await browser?.close();await new Promise(resolve=>server.close(resolve));",
"}"
].join('\n');
function once(source,needle,replace){
 if(source.indexOf(needle)<0||source.indexOf(needle)!==source.lastIndexOf(needle))
  throw new Error('Frozen original P94 source anchor changed');
 return source.replace(needle,replace);
}
export function deriveM259(source){
 if(typeof source!=='string'||source.length<40000||
  !source.includes("const browserType=engine==='webkit'?webkit:chromium"))
  throw new Error('Original P94 runner source not recognized');
 let result=once(source,anchorA,anchorA+'\nconst m259Rows=[],m259Pending=[];');
 result=once(result,anchorB,listen+'\n'+anchorB);
 result=once(result,anchorC,close);
 return result;
}
export function classifyM259(log,engine,width){
 if(typeof log!=='string'||log.length>8*1024*1024||
  !['chromium','webkit'].includes(engine)||![320,390,430].includes(width))
  throw new Error('Invalid original-browser context transcript');
 const tag='M259_CONTEXT_NETWORK_WITNESS ';
 const hits=log.split(/\r?\n/).filter(line=>line.startsWith(tag));
 if(hits.length!==1)throw new Error('Missing or duplicated context witness');
 let data;try{data=JSON.parse(hits[0].slice(tag.length));}
 catch{throw new Error('Malformed original context witness');}
 if(data?.schema!=='M259_CONTEXT_NETWORK_V1'||data.engine!==engine||
  data.width!==width||data.sourceEvidenceGate!=='BLOCKED'||
  data.compiledWasmAttested!==false||data.loadedModelAttested!==false||
  data.sameNativeProcessProven!==false||data.familyAlpha!=='HOLD'||
  !Array.isArray(data.rows)||data.rows.length>32)
  throw new Error('Untrusted or overstated original context evidence');
 for(const row of data.rows){
  if(!['jsep-wasm','model-onnx'].includes(row?.kind)||
   !['body-observed','body-unavailable','non-200','invalid-wasm-magic'].includes(row.status)||
   (row.status==='body-observed'&&(!/^[a-f0-9]{64}$/.test(row.sha256)||
    !Number.isInteger(row.size)||row.size<1||row.size>150000000)))
    throw new Error('Malformed original network response');
 }
 const wasm=data.rows.some(row=>row.kind==='jsep-wasm'&&row.status==='body-observed'&&row.sha256===jsep);
 const model=data.rows.some(row=>row.kind==='model-onnx'&&row.status==='body-observed'&&row.size>0);
 if(data.wasmNetworkMatch!==wasm||data.modelNetworkObserved!==model)
  throw new Error('Forged network binary evidence');
 if(data.rows.some(row=>row.kind==='jsep-wasm'&&
    (row.status==='invalid-wasm-magic'||row.status==='body-observed'&&row.sha256!==jsep)))
  throw new Error('Actual JSEP response mismatch; preserve native RED');
 return {schema:'M259_NETWORK_ONLY_RESULT_V1',engine,width,wasm,model,
  status:wasm&&model?'OBSERVED_NETWORK_BODIES':'PARTIAL_OR_UNAVAILABLE',
  nativeRuntimeIdentity:'NOT_ATTESTED',sourceEvidenceGate:'BLOCKED',familyAlpha:'HOLD'};
}
async function main(){
 if(process.argv[2]==='prepare'){
  const source=await readFile(runner,'utf8');
  await writeFile(child,deriveM259(source));
  console.log('M259_ORIGINAL_SOURCE_COPY',JSON.stringify({sourceSha256:createHash('sha256').update(source).digest('hex'),originalUnchanged:true,sourceEvidenceGate:'BLOCKED'}));
 }else if(process.argv[2]==='verify'){
  const log=await readFile(process.argv[3],'utf8');
  console.log('M259_CLASSIFIED_RESULT',JSON.stringify(classifyM259(log,process.env.M58_ENGINE,Number(process.env.P94_WIDTH))));
 }else throw new Error('Expected prepare or verify');
}
if(process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1])
 main().catch(e=>{console.error('M259_ERROR',e.message);process.exitCode=1;});
