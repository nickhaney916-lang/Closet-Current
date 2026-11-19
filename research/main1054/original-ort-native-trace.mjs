import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { deriveM269 } from './m269-webkit-graph-optimization-runtime-ab.mjs';

const assets = {
  'transformers.min.js': ['aa5002b70e789798da263f5f99c62bd3e8fcd0c119258a493c40c180648365fa', 'dr'],
  'ort-wasm-simd-threaded.jsep.mjs': ['08fb86ec433c78bfb032c5d84a68b8e8e5a8d81268fa39e24314179a5767a5b9', 'K'],
};
const operations = {
  Fa: ['OrtInit', 'status'],
  Ha: ['OrtCreateSessionOptions', 'handle'],
  Ma: ['OrtCreateSession', 'handle'],
  Oa: ['OrtGetInputOutputCount', 'status'],
  Pa: ['OrtGetInputOutputMetadata', 'handle'],
  Ra: ['OrtCreateTensor', 'handle'],
  bb: ['OrtRun', 'status'],
  ab: ['OrtRunWithBinding', 'status'],
  hb: ['malloc', 'handle'],
  Ga: ['OrtGetLastError', 'void'],
};

function replaceOnce(source, anchor, replacement) {
  if (!source.includes(anchor) || source.indexOf(anchor) !== source.lastIndexOf(anchor))
    throw new Error('Native trace source anchor missing or ambiguous');
  return source.replace(anchor, replacement);
}

export function instrument(name, bytes, endpoint) {
  const [sha, module] = assets[name];
  if (createHash('sha256').update(bytes).digest('hex') !== sha)
    throw new Error('Native trace glue SHA mismatch');
  let source = bytes.toString('utf8');
  for (const [alias, [operation, kind]] of Object.entries(operations)) {
    const anchor = '=' + module + '.' + alias + ')';
    source = replaceOnce(source, anchor,
      '=__ccNativeWrap(' + module + '.' + alias + ',' +
      JSON.stringify(operation) + ',' + JSON.stringify(kind) + '))');
  }
  if (name === 'transformers.min.js') {
    const anchor = 'o=a?t.UTF8ToString(a):"";throw new Error(`${e} ERROR_CODE:';
    source = replaceOnce(source, anchor,
      'o=a?t.UTF8ToString(a):"";__ccNativeEmit(++__ccNativeSeq,"OrtGetLastError","status",s);throw new Error(`${e} ERROR_CODE:');
  }
  return `
let __ccNativeSeq=0;
function __ccNativeEmit(id,operation,phase,value){
 try{
  const row=JSON.stringify({asset:${JSON.stringify(name)},id,operation,phase,value});
  fetch(${JSON.stringify(endpoint)}+encodeURIComponent(row),{keepalive:true}).catch(()=>{});
 }catch{}
}
function __ccNativeWrap(native,operation,kind){
 return function(...args){
  const id=++__ccNativeSeq;
  const emit=(phase,value)=>{
   __ccNativeEmit(id,operation,phase,value);
  };
  emit('enter',null);
  try{
   const result=Reflect.apply(native,this,args);
   const status=kind==='status'&&Number.isInteger(result)&&Math.abs(result)<=100?result:null;
   emit('return',kind==='handle'?Number(Boolean(result)):status);
   return result;
  }catch(error){
   const frames=(String(error?.stack??'').match(/wasm-function\\[\\d+\\](?::0x[0-9a-f]+)?/gi)??[]).slice(0,12);
   emit('throw',frames);
   throw error;
  }
 };
}
` + source;
}

export function deriveNativeTrace(browser, worker, arm, moduleUrl) {
  let source = deriveM269(browser, worker, arm);
  source = 'import { instrument } from ' + JSON.stringify(moduleUrl) + ';\n' + source;
  source = replaceOnce(source, 'const server=createServer(async(req,res)=>{',
    `const server=createServer(async(req,res)=>{
 const traceURL=new URL(req.url,'http://localhost');
 if(req.method==='GET'&&traceURL.pathname==='/__cc_ort_trace'){
  const row=traceURL.searchParams.get('row')||'';
  if(row.length<=900){
   try{
    const {asset,id,operation,phase,value}=JSON.parse(row);
    const validAsset=['transformers.min.js','ort-wasm-simd-threaded.jsep.mjs'].includes(asset);
    const validCall=${JSON.stringify(Object.values(operations).map(([name]) => name))}.includes(operation);
    const validPhase=phase==='enter'?value===null:phase==='status'?
     operation==='OrtGetLastError'&&Number.isInteger(value)&&Math.abs(value)<=100:
     phase==='return'?
     value===null||Number.isInteger(value)&&Math.abs(value)<=100:
     phase==='throw'&&Array.isArray(value)&&value.length<=12&&
      value.every(frame=>typeof frame==='string'&&/^wasm-function\\[\\d+\\](?::0x[0-9a-f]+)?$/i.test(frame));
    if(validAsset&&validCall&&validPhase&&Number.isSafeInteger(id)&&id>0&&id<=20000)
     process.stdout.write('CC_NATIVE_ORT_TRACE '+JSON.stringify({asset,id,operation,phase,value})+'\\n');
   }catch{}
  }
  res.writeHead(204);res.end();return;
 }`);
  source = replaceOnce(source, " await context.route('**/*',route=>{",
    " await context.route('**/*',async route=>{");
  return replaceOnce(source, "  if(req.method()==='GET'&&(lib||hub||weights)){", `
  const traceAsset=url.pathname.split('/').at(-1);
  if(req.method()==='GET'&&lib&&${JSON.stringify(Object.keys(assets))}.includes(traceAsset)){
   try{
    const response=await route.fetch({maxRedirects:0});
    if(response.status()!==200)throw new Error('Unexpected glue response status');
    const body=instrument(traceAsset,await response.body(),origin+'/__cc_ort_trace?row=');
    return route.fulfill({status:200,contentType:'text/javascript',headers:{
     'access-control-allow-origin':'*','cache-control':'no-store'
    },body});
   }catch{
    process.stdout.write('CC_NATIVE_ORT_SETUP_FAILURE '+traceAsset+'\\n');
    return route.abort();
   }
  }
  if(req.method()==='GET'&&(lib||hub||weights)){`);
}

if (process.argv.includes('--prepare')) {
  const browser = readFileSync('scripts/test-parallel94-native-p88-browser.mjs', 'utf8');
  const worker = readFileSync('public/outfit-worker-p94.mjs', 'utf8');
  writeFileSync('scripts/.cc-native-ort-trace.mjs', deriveNativeTrace(
    browser, worker, process.env.M269_ARM ?? 'baseline', import.meta.url));
}
