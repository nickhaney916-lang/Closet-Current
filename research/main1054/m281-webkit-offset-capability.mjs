/**
 * M281: Actual native Playwright WebKit stack-offset capability experiment.
 * The intentionally OOB tiny WASM is NEGATIVE-ONLY. It is never ORT evidence.
 * Original model/JSEP and the historic genuine M279 RED are unchanged.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const parent='8ba2039f5ef45f07f6f248912c4f703c997f5beb';
export const branch='refs/heads/research/main1054-m281-webkit-trap-offset-capability-HOLD';
export const added=[
  '.github/workflows/main1054-m281-webkit-offset-capability-no-deploy.yml',
  'research/main1054/m281-webkit-offset-capability.mjs',
  'tests/main1054-m281-webkit-offset-capability.test.mjs'
];
export const binary=Uint8Array.from([
  0,97,115,109,1,0,0,0, // wasm 1
  1,5,1,96,0,1,127,       // () -> i32
  3,2,1,0,                // function 0, type 0
  5,3,1,0,1,              // memory min 1 page
  7,9,1,5,112,114,111,98,101,0,0, // export probe
  10,11,1,9,0,65,128,128,4,40,2,0,11 // const 65536; load; end
]);
export const knownProbeLoadFileOffset=44; // Exact 0x28 i32.load opcode
const requireTrue=(ok,reason)=>{if(!ok)throw Error('M281 BLOCKED: '+reason);};
export function sourceGate(git,event){
  requireTrue(event?.name==='push'&&event.ref===branch&&event.attempt==='1','wrong branch/event/attempt');
  requireTrue(/^[a-f0-9]{40}$/.test(event.sha||'')&&git('rev-parse','HEAD')===event.sha,'wrong checked-out SHA');
  requireTrue(git('merge-base','--is-ancestor',parent,event.sha)==='','missing original M280 provenance');
  requireTrue(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,event.sha)===
    added.map(path=>'A\0'+path+'\0').join(''),'protected source modified or unknown file');
  for(const p of added) requireTrue(git('ls-tree',event.sha,'--',p).startsWith('100644 blob '),'unsafe file mode');
  for(const p of [
    'research/main1054/m280-original-jsep-function-map.mjs',
    'research/main1054/m279-original-model-pointer-bounds.mjs',
    'public/outfit-worker-p94.mjs'
  ])requireTrue(git('rev-parse',parent+':'+p)===git('rev-parse',event.sha+':'+p),
    'original ORT/Worker evidence drift: '+p);
  return {originalSourcePreserved:true,onlyAdditiveExperiment:true,familyAlpha:'HOLD'};
}
export function parseWasmFrames(stack){
  if(typeof stack!=='string')return [];
  const matches=[...stack.slice(0,4000).matchAll(/wasm-function\[(\d{1,7})\](?::(0x[0-9a-f]{1,10}))?/gi)];
  return matches.slice(0,6).map(m=>({
    functionIndex:Number(m[1]),
    absoluteModuleOffset:m[2]?Number.parseInt(m[2],16):null
  }));
}
export function classifyProbe(engine,result){
  requireTrue(['webkit','chromium'].includes(engine),'unsupported engine');
  requireTrue(result&&result.name==='RuntimeError','real WASM RuntimeError absent');
  requireTrue(/out of bounds|memory access/i.test(result.message||''),'wrong trap');
  const frames=parseWasmFrames(result.stack);
  requireTrue(frames.some(x=>x.functionIndex===0),'missing true native function 0');
  const reported=frames.find(x=>x.functionIndex===0)?.absoluteModuleOffset??null;
  // Cross-engine semantics: V8 commonly gives absolute MODULE offset 44.
  // If WebKit produces a non-44 offset, do not infer bytecode semantics.
  const exactFileOffset=reported===knownProbeLoadFileOffset;
  return {
    schema:'MAIN1054_M281_NATIVE_WASM_OFFSET_CAPABILITY_V1',
    engine,negativeProbeOnly:true,deliberateOutOfBounds:true,
    wasmBytes:binary.length,wasmSHA256:createHash('sha256').update(binary).digest('hex'),
    confirmedOpcodeFileOffset:knownProbeLoadFileOffset,reportedOffset:reported,
    stackHasOffset:reported!==null,exactFileOffsetConfirmed:exactFileOffset,
    engineOffsetSemanticsVerified:exactFileOffset,
    originalSegFormerProcess:false,originalWebKitTrapOffset:null,
    originalCxxFaultLine:null,actualCausalFixTested:false,permanentRepairProven:false,
    originalFamilyDataAccessed:false,familyAlpha:'HOLD'
  };
}
export async function runBrowser(engine){
  requireTrue(WebAssembly.validate(binary),'invalid pinned negative-only WASM');
  const pw=await import('playwright'),browserType=pw[engine];
  requireTrue(browserType,'installed native engine unavailable');
  const browser=await browserType.launch(engine==='chromium'?
    {headless:true,args:['--no-sandbox']}:{headless:true});
  try{
    const context=await browser.newContext({serviceWorkers:'block'});
    await context.route('**/*',route=>route.abort()); // No network, model or account traffic
    const page=await context.newPage();
    const native=await page.evaluate(async raw=>{
      const compiled=await WebAssembly.instantiate(Uint8Array.from(raw));
      try{compiled.instance.exports.probe();return {name:'no-trap',message:'',stack:''};}
      catch(e){return {name:e.name,message:String(e.message||'').slice(0,200),stack:String(e.stack||'').slice(0,4000)};}
    },Array.from(binary));
    return classifyProbe(engine,native);
  }finally{await browser.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],
       {encoding:'utf8'}).replace(/\n$/,'');
    sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
      sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
    requireTrue(['webkit','chromium'].includes(process.argv[2]),'expected engine');
    const result=await runBrowser(process.argv[2]);
    mkdirSync('m281-sanitized',{recursive:true});
    writeFileSync('m281-sanitized/'+process.argv[2]+'-offset-capability.json',
      JSON.stringify(result,null,2)+'\n');
    console.log('M281_REAL_NATIVE_ENGINE_OFFSET_CAPABILITY '+JSON.stringify(result));
    // A successful capability check is not a successful original model run.
  }catch(e){console.error('M281_FAIL_CLOSED '+String(e.message||e).slice(0,240));process.exitCode=1;}
}
