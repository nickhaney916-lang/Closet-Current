// M23: purely numeric, same-source direct ONNX runtime comparison.
// Never substitutes for native owner review, physical phones or accuracy labels.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const positive=x=>Number.isSafeInteger(x)&&x>0;
const finite=x=>Number.isFinite(x);
export function compareNumericArrays(a,b){
 if(!Array.isArray(a)||!Array.isArray(b)||!a.length||a.length!==b.length||
    a.some(v=>!finite(v))||b.some(v=>!finite(v)))return null;
 let dot=0,na=0,nb=0,mse=0,maxAbs=0;
 for(let i=0;i<a.length;i++){
  const x=a[i],y=b[i],e=Math.abs(x-y);
  dot+=x*y;na+=x*x;nb+=y*y;mse+=e*e;maxAbs=Math.max(maxAbs,e);
 }
 if(na<=0||nb<=0)return null;
 return {count:a.length,cosine:dot/Math.sqrt(na*nb),maxAbs,rmse:Math.sqrt(mse/a.length)};
}
export function verifyWasmAB(x,sourceHashes){
 const issues=[],check=(ok,label)=>{if(!ok)issues.push(label);};
 check(x?.schema==='main1054-ort-direct-wasm-ab-m23-v1','schema');
 check(/^[a-f0-9]{40}$/.test(x?.codeCommit||''),'commit');
 check(x?.familyAlpha==='HOLD'&&x?.releaseAuthorized===false&&x?.physicalIPhone===false&&x?.hostedCloudWrites===0&&x?.ownerAutoSaves===0,'safety scope');
 check(x?.onnxRuntimeVersion==='1.22.0-dev.20250409-89f8206ba4'&&x?.transformersVersion==='3.8.1','runtime versions');
 check(x?.browser==='webkit-desktop-linux'&&x?.sampledMemoryOnly===true,'browser scope');
 const flavors=['jsep','wasm'],modes=x?.variants||{};
 const models=['fashionclip','fashionSiglip'],ids=x?.publicSources||[];
 check(Array.isArray(ids)&&ids.length>=1&&ids.length<=2&&new Set(ids).size===ids.length&&ids.every(id=>sha(sourceHashes?.[id])),'licensed original manifest');
 for(const flavor of flavors){
  const q=modes[flavor];
  check(q?.status==='COMPLETE_OBSERVED'&&q?.actualRuntime===flavor&&q?.browserErrors?.length===0,'variant not verified: '+flavor);
  check(q?.modelRuns?.length===ids.length*models.length,'missing genuine inference: '+flavor);
  check(q?.wasmArtifact?.endsWith(flavor==='jsep'?'.jsep.wasm':'ort-wasm-simd-threaded.wasm'),'wrong WASM artifact: '+flavor);
  check(sha(q?.wasmSha256)&&sha(q?.jsSha256),'unverified runtime bytes: '+flavor);
  check(positive(q?.samples)&&q?.rssComplete===true&&positive(q?.maxSampledTreeRSSBytes),'missing sampled RSS: '+flavor);
  check(q?.pssComplete===true&&positive(q?.maxSampledTreePSSBytes),'missing valid PSS: '+flavor);
  for(const id of ids)for(const model of models){
   const row=q?.modelRuns?.find(r=>r.sourceId===id&&r.modelKey===model);
   check(row?.sourceSHA256===sourceHashes[id]&&sha(row?.inputSHA256)&&sha(row?.modelSHA256),'unverified same photo/model: '+flavor+'/'+id+'/'+model);
   check(row?.modelKey===model&&positive(row?.outputLength)&&positive(row?.inferenceMs)&&Array.isArray(row?.values)&&row.values.length===row.outputLength,'missing output: '+flavor+'/'+id+'/'+model);
   check(row?.values?.every(finite),'nonfinite output: '+flavor+'/'+id+'/'+model);
  }
 }
 const comparisons=[];
 for(const id of ids)for(const model of models){
  const a=modes.jsep?.modelRuns?.find(r=>r.sourceId===id&&r.modelKey===model);
  const b=modes.wasm?.modelRuns?.find(r=>r.sourceId===id&&r.modelKey===model);
  const common=a&&b&&a.inputSHA256===b.inputSHA256&&a.modelSHA256===b.modelSHA256&&
    a.outputName===b.outputName&&JSON.stringify(a.outputShape)===JSON.stringify(b.outputShape);
  check(common,'different tensor/model source: '+id+'/'+model);
  const d=compareNumericArrays(a?.values,b?.values);
  check(d!==null,'output unavailable: '+id+'/'+model);
  if(d){
    const compatible=d.cosine>=0.99999&&d.maxAbs<=0.005&&d.rmse<=0.001;
    check(compatible,'numerical mismatch: '+id+'/'+model);
    comparisons.push({sourceId:id,modelKey:model,count:d.count,
      cosine:d.cosine,maxAbs:d.maxAbs,rmse:d.rmse,withinTolerance:compatible});
  }
 }
 return {status:issues.length?'BLOCKED':'SOURCE_MATCHED_ONNX_INFERENCE_PARITY_NOT_RELEASE',
   errors:[...new Set(issues)],comparisons,webKitDesktopOnly:true,
   memoryLeakProven:false,mobileSafe:false,accuracy10of10:false,
   releaseAuthorized:false,familyAlpha:'HOLD'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [path]=process.argv.slice(2),receipt=JSON.parse(await readFile(path,'utf8'));
 const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 const sources=Object.fromEntries(manifest.filter(m=>m.verified).map(m=>[m.id,m.sha256]));
 const result=verifyWasmAB(receipt,sources);
 console.log('MAIN1054_M23_WASM_AB_GATE',JSON.stringify(result));
 if(result.status==='BLOCKED')process.exitCode=2;
}
