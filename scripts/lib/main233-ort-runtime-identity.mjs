/**
 * M233 audit gate — test/research ONLY.
 * A successful original-model run does not prove the CPU-only ONNX/WASM
 * runtime was selected. Asset filenames do not attest to a matched build.
 * Never admit 3D/release, mutate product, or read original owner bytes.
 */
const NAMES=/^ort-wasm-[a-z0-9.-]+\.(?:mjs|wasm)$/i;
const OK_MODES=new Set(['baseline','fixed-simd','cpu-only-candidate']);
const empty=(reason,extra={})=>Object.freeze({
  status:'reject',reason,cpuOnlyProven:false,permanentWebKitRepairProven:false,
  ...extra
});
export function examineNativeOrtRuntime233({
 mode,assets,realPositive,sourceLocked
}={}){
 if(!OK_MODES.has(mode))return empty('unknown-runtime-mode');
 if(realPositive!==true||sourceLocked!==true)
  return empty('original-model-positive-or-source-unverified');
 if(!Array.isArray(assets)||assets.length<2||assets.length>16)
  return empty('missing-or-unbounded-runtime-asset-list');
 if(assets.some(x=>typeof x!=='string'||x.length>128||
  x.includes('/')||x.includes('\\')||!x.startsWith('ort-wasm-')&&!x.startsWith('transformers.')||
  /[?#]/.test(x)))return empty('unsafe-or-raw-runtime-asset');
 const ort=[...new Set(assets.filter(x=>x.startsWith('ort-wasm-')))];
 if(ort.some(x=>!NAMES.test(x)))return empty('unrecognized-ort-asset-filename');
 const mjs=ort.filter(x=>x.endsWith('.mjs'));
 const wasm=ort.filter(x=>x.endsWith('.wasm'));
 if(mjs.length!==1||wasm.length!==1)
  return empty('one-matched-ort-loader-and-wasm-binary-required',{mjsCount:mjs.length,wasmCount:wasm.length});
 const stemMjs=mjs[0].slice(0,-4),stemWasm=wasm[0].slice(0,-5);
 if(stemMjs!==stemWasm)return empty('ort-loader-wasm-filename-mismatch');
 const jsep=stemMjs.endsWith('.jsep');
 const family=jsep?'jsep':'cpu-wasm-non-jsep';
 if(mode==='cpu-only-candidate'){
  if(jsep)return empty('candidate-still-loaded-jsep-bundle',{family});
  return Object.freeze({status:'unverified',reason:'same-build-checksums-and-causal-red-green-absent',
   family,loader:mjs[0],wasm:wasm[0],cpuOnlyProven:false,
   permanentWebKitRepairProven:false});
 }
 return Object.freeze({
  status:'observed-not-a-fix',reason:jsep?
   'original-jsep-artifacts-still-selected':'changed-runtime-needs-causal-verification',
  family,loader:mjs[0],wasm:wasm[0],
  cpuOnlyProven:false,permanentWebKitRepairProven:false
 });
}
