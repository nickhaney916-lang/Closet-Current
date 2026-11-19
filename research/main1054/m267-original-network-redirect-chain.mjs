/**
 * M267: original browser HTTP redirect-to-resource lineage, bounded by the
 * same Playwright Request redirectedFrom() root for each JSEP/ONNX response.
 * HTTP 307 and a correct final model body are not the same loading attempt
 * unless they share a real original-browser redirect chain.
 *
 * Research-only; original P94 source, worker, binaries and owner data unchanged.
 * A browser-context chain is NOT native process/compiled WASM identity.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {deriveM265,assessM265,verifyM265} from './m265-original-jsep-http-truth.mjs';
import {assessM264} from './m264-model-http-redirect-truth.mjs';
const original='scripts/test-parallel94-native-p88-browser.mjs';
const disposable='scripts/.m267-original-network-chain.mjs';
const runnerSHA='4803707515debafdc8041069c6081bd20530e455c03c0842d1a0bc30161ed2f5';
const redirectStatus=new Set([301,302,303,307,308]);
function once(s,needle,replacement){
 if(s.indexOf(needle)<0||s.indexOf(needle)!==s.lastIndexOf(needle))
  throw Error('Original native-browser source anchor missing or ambiguous');
 return s.replace(needle,replacement);
}
export function deriveM267(source){
 if(typeof source!=='string'||
   createHash('sha256').update(source).digest('hex')!==runnerSHA)
  throw Error('M267 original P94 source hash changed');
 let s=deriveM265(source);
 const instrumentation=[
  'const m259Rows=[],m259Pending=[];',
  '// Browser Request objects only. No URL or redirect Location is persisted.',
  'const m267RootIds=new WeakMap();let m267NextId=0;',
  'function m267ChainId(req){',
  ' let root=req;',
  ' for(let i=0;i<16;i++){const previous=root.redirectedFrom();',
  '  if(!previous)break;root=previous;}',
  ' let id=m267RootIds.get(root);',
  ' if(!id){id=++m267NextId;m267RootIds.set(root,id);}',
  ' return id;',
  '}'
 ].join('\n');
 s=once(s,'const m259Rows=[],m259Pending=[];',instrumentation);
 s=once(s,"m259Rows.push({kind,status:'non-200',httpStatus,hasLocation});",
  "m259Rows.push({kind,status:'non-200',httpStatus,hasLocation,chainId:m267ChainId(res.request())});");
 s=once(s,"m259Rows.push({kind,status:valid?'body-observed':'invalid-wasm-magic',sha256,size:bytes.length});",
  "m259Rows.push({kind,status:valid?'body-observed':'invalid-wasm-magic',sha256,size:bytes.length,chainId:m267ChainId(res.request())});");
 s=once(s,"m259Rows.push({kind,status:'body-unavailable'});",
  "m259Rows.push({kind,status:'body-unavailable',chainId:m267ChainId(res.request())});");
 return s;
}
function parse(log,label){
 if(typeof log!=='string'||log.length>8*1024*1024)
  throw TypeError('Untrusted original P94 browser evidence');
 const rows=log.split(/\r?\n/).filter(x=>x.startsWith(label+' '));
 if(rows.length!==1)throw Error('Missing/duplicate original network-chain receipt');
 try{return JSON.parse(rows[0].slice(label.length+1));}
 catch{throw Error('Invalid original network-chain JSON receipt');}
}
export function assessM267(log,identity){
 const base=assessM265(log,identity);
 // Preserve independent model HTTP evidence; M265 reports only JSEP details.
 const modelHttp=assessM264(log,identity);
 const witness=parse(log,'M259_CONTEXT_NETWORK_WITNESS');
 if(!Array.isArray(witness?.rows)||witness.rows.length>32||
   witness.familyAlpha!=='HOLD'||witness.sourceEvidenceGate!=='BLOCKED'||
   witness.compiledWasmAttested!==false||witness.loadedModelAttested!==false||
   witness.sameNativeProcessProven!==false)
  throw Error('Untrusted original model/JSEP chain source witness');
 const map=new Map();
 for(const row of witness.rows){
  if(!['jsep-wasm','model-onnx'].includes(row?.kind)||
    !Number.isInteger(row.chainId)||row.chainId<1||row.chainId>64)
   throw Error('Missing, invalid, or unbounded actual browser redirect-chain identity');
  const key=row.kind+':'+row.chainId;
  if(!map.has(key))map.set(key,{kind:row.kind,redirects:0,terminals:0,bad:0});
  const chain=map.get(key);
  if(row.status==='non-200'){
   if(!redirectStatus.has(row.httpStatus)||row.hasLocation!==true)chain.bad++;
   else chain.redirects++;
  }else if(['body-observed','body-unavailable','invalid-wasm-magic'].includes(row.status))
   chain.terminals++;
  else throw Error('Untrusted original browser redirect status');
 }
 let orphanRedirectChains=0,multipleTerminals=0,badResponseChains=0;
 let modelChains=0,jsepChains=0,redirectedModelChains=0,redirectedJsepChains=0;
 for(const c of map.values()){
  if(c.kind==='model-onnx'){modelChains++;if(c.redirects)redirectedModelChains++;}
  if(c.kind==='jsep-wasm'){jsepChains++;if(c.redirects)redirectedJsepChains++;}
  if(c.redirects&&c.terminals===0)orphanRedirectChains++;
  if(c.terminals>1)multipleTerminals++;
  if(c.bad)badResponseChains++;
 }
 const missingFinal=orphanRedirectChains||multipleTerminals||badResponseChains||
    [...map.values()].some(c=>c.terminals!==1);
 const chainGate=missingFinal?'FAIL':'LINKED';
 const oldError=base.sourceEvidenceGate==='FAIL';
 return {
  schema:'MAIN1054_M267_NATIVE_ORIGINAL_NETWORK_CHAIN_V1',
  checkout:identity.checkout,engine:identity.engine,width:identity.width,
  runId:String(identity.runId),runAttempt:identity.runAttempt,
  originalJourneyGate:base.originalJourneyGate,
  originalModelNetworkGate:oldError||missingFinal?'FAIL':base.originalModelNetworkGate,
  originalJsepNetworkGate:oldError||missingFinal?'FAIL':base.originalJsepNetworkGate,
  originalModelHttpErrors:modelHttp.originalModelHttpErrors,
  originalJsepHttpErrors:base.jsepHardHttpErrors,
  originalModelCanonicalBodies:modelHttp.originalModelBytesCorrectlyHashed,
  originalJsepCanonicalBodies:base.canonicalJsepResponses,
  modelRedirectChains:redirectedModelChains,
  jsepRedirectChains:redirectedJsepChains,
  modelChains,jsepChains,
  orphanRedirectChains,multipleTerminals,badResponseChains,
  redirectChainGate:chainGate,
  nativeLoadedOnnxSHA256:null,nativeCompiledJsepSHA256:null,
  nativeRuntimeIdentityAttested:false,
  sourceEvidenceGate:oldError||missingFinal?'FAIL':'BLOCKED',
  naturalIntermittentWebKitFaultRepaired:false,releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
export function verifyM267(log,identity){
 if(identity.runAttempt!==1)throw Error('Only original first-attempt evidence admissible');
 const result=assessM267(log,identity);
 // Preserve every original owner/private/security and ONNX/JSEP HTTP safety
 // check from the proven M265 lineage. Native positive acceptance is separate.
 verifyM265(log,identity);
 if(identity.exitCode!==0||result.originalJourneyGate!=='PASS'||
    result.redirectChainGate!=='LINKED'||result.sourceEvidenceGate!=='BLOCKED'||
    result.modelChains<1||result.jsepChains<1)
   throw Error('Original JSEP/ONNX actual redirect-chain provenance incomplete');
 return result;
}
function lockedJpegSha(){
 const bytes=readFileSync('benchmark/fixtures/commons-0003.jpg');
 const sha=createHash('sha256').update(bytes).digest('hex');
 const entry=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
  .find(x=>x.id==='commons-0003');
 if(!entry?.verified||entry.sha256!==sha)throw Error('Original public photo changed');
 return sha;
}
function main(){
 if(process.argv[2]==='prepare'){
  const source=readFileSync(original,'utf8');
  writeFileSync(disposable,deriveM267(source));
  console.log('M267_ORIGINAL_SOURCE_FROZEN',JSON.stringify({
   originalSHA256:runnerSHA,originalUnmodified:true,familyAlpha:'HOLD'
  }));
 }else if(process.argv[2]==='verify'){
  const identity={
   checkout:process.env.EXPECTED_HEAD,engine:process.env.M58_ENGINE,
   width:Number(process.env.P94_WIDTH),runId:process.env.GITHUB_RUN_ID,
   job:process.env.GITHUB_JOB,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT),
   exitCode:Number(process.env.MODEL_EXIT),lockedJpegSha:lockedJpegSha()
  };
  console.log('M267_ORIGINAL_REDIRECT_CHAIN_RESULT',JSON.stringify(
   verifyM267(readFileSync(process.argv[3],'utf8'),identity)
  ));
 }else throw Error('Expected prepare or verify');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{main();}catch(e){console.error('M267 BLOCKED: '+String(e.message).slice(0,150));process.exitCode=1;}
}
