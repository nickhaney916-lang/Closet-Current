/**
 * M280: exact original JSEP WASM byte-identity and function-index mapping.
 * Research-only, reads ONLY public package bytes and existing authentic RED log.
 * A function body file offset is NOT a failing instruction or source statement.
 */
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const parent='4e2bd9f4a3585eed387042afd1ef8ed7e310cfa8';
export const branch='refs/heads/research/main1054-m280-original-jsep-function-map-HOLD';
export const added=[
 '.github/workflows/main1054-m280-original-jsep-function-map-no-deploy.yml',
 'research/main1054/m280-original-jsep-function-map.mjs',
 'tests/main1054-m280-original-jsep-function-map.test.mjs'
];
export const pinned=Object.freeze({
 'research/main1054/m279-original-model-pointer-bounds.mjs':'f2fd27553cc6854997480ee586cb8e191e9aca11',
 '.github/workflows/main1054-m279-original-pointer-bounds-no-deploy.yml':'d27cf17be0ff4620d85f9cf4ac0eb30bb90ab981',
 'tests/main1054-m279-original-model-pointer-bounds.test.mjs':'29d9816102ecf72a48838a519698c5158c7829d9',
 'research/main1054/m278-native-session-memory-class.mjs':'8c8ac5a2eae233778a805063eba57dce22e1c386',
 'research/main1054/original-ort-native-trace.mjs':'08c9ea893ee12606073fc7c1d07dee37344d538c',
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'scripts/test-parallel94-native-p88-browser.mjs':'4f75a40cf153fa4b4d139d782b202dbe7bc55e41'
});
export const originalBinary=Object.freeze({
 sha256:'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39',
 bytes:21596019,
 url:'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/ort-wasm-simd-threaded.jsep.wasm'
});
export const originalFailure=Object.freeze({
 runId:44640727828,jobId:135971719127,
 source:'4e2bd9f4a3585eed387042afd1ef8ed7e310cfa8',
 indices:[4846,1384,11276,7427],ordinal:3,engine:'webkit',width:430,shard:2
});
const insist=(value,reason)=>{if(!value)throw Error('M280 FAIL-CLOSED: '+reason);};
export function sourceGate(git,e){
 insist(e?.name==='push'&&e.ref===branch&&e.attempt==='1','unapproved event/branch/rerun');
 insist(/^[a-f0-9]{40}$/.test(e.sha||'')&&git('rev-parse','HEAD')===e.sha,'wrong checkout');
 insist(git('merge-base','--is-ancestor',parent,e.sha)==='','wrong exact original ancestor');
 insist(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,e.sha)===
  added.map(path=>'A\0'+path+'\0').join(''),'modified original/extra research path');
 for(const path of added)insist(git('ls-tree',e.sha,'--',path).startsWith('100644 blob '),'unsafe file mode');
 for(const [path,sha] of Object.entries(pinned)){
  insist(git('rev-parse',e.sha+':'+path)===sha,'protected original source drift '+path);
 }
 return {source:'PASS', originalRuntimeModified:false, exactOriginalFailPreserved:true,
  nativeTrapInstructionKnown:false,permanentRepairProven:false,familyAlpha:'HOLD'};
}
class Reader{
 constructor(bytes,start=0,end=bytes.length){
  this.b=bytes;this.p=start;this.end=end;
  insist(start>=0&&end<=bytes.length&&start<=end,'bad binary slice');
 }
 byte(){insist(this.p<this.end,'truncated binary');return this.b[this.p++];}
 u32(){
  let value=0;
  for(let i=0;i<5;i++){
   const b=this.byte();value+=(b&127)*2**(7*i);
   if(!(b&128)){insist(value<=0xffffffff,'non-u32 leb');return value;}
  }
  throw Error('M280 FAIL-CLOSED: overlong unsigned LEB128');
 }
 skip(n){insist(Number.isSafeInteger(n)&&n>=0&&this.p+n<=this.end,'truncated payload');this.p+=n;}
 name(){
  const n=this.u32();insist(n<=5000&&this.p+n<=this.end,'oversize name');
  const result=Buffer.from(this.b.subarray(this.p,this.p+n)).toString('utf8');this.p+=n;return result;
 }
 endAt(expected){insist(this.p===expected,'malformed section length');}
}
function limits(r){const flags=r.u32();insist(flags<=3,'unsupported non-MVP limits flags');r.u32();if(flags&1)r.u32();}
function skipImport(r,kind){
 switch(kind){
 case 0:r.u32();break;
 case 1:r.byte();limits(r);break;
 case 2:limits(r);break;
 case 3:r.byte();r.byte();break;
 case 4:r.u32();r.u32();break;
 default:throw Error('M280 FAIL-CLOSED: unsupported import kind');
 }
}
export function mapModule(original,indices,{sha256=null,expectedSize=null}={}){
 const bytes=Buffer.from(original);
 if(expectedSize!==null)insist(bytes.length===expectedSize,'original WASM byte length mismatch');
 const sha=createHash('sha256').update(bytes).digest('hex');
 if(sha256!==null)insist(sha===sha256,'wrong WASM SHA256');
 insist(bytes.length>=8&&bytes.subarray(0,8).equals(Buffer.from([0,97,115,109,1,0,0,0])),'invalid WASM header/version');
 insist(Array.isArray(indices)&&indices.length>0&&indices.length<=16&&
  indices.every(x=>Number.isSafeInteger(x)&&x>=0)&&new Set(indices).size===indices.length,'bad function indices');
 let importedFunctions=0,declaredFunctions=null,bodies=null,funcNames=new Map(),funcExports=new Map(),nameSectionFound=false;
 const seen=new Set(),r=new Reader(bytes,8);
 while(r.p<r.end){
  const id=r.byte(),size=r.u32(),end=r.p+size;
  insist(id<=13&&end<=r.end,'bad wasm section');
  if(id!==0){insist(!seen.has(id),'duplicate WASM section');seen.add(id);}
  const s=new Reader(bytes,r.p,end);
  if(id===2){
   const count=s.u32();insist(count<=200000,'too many imports');
   for(let i=0;i<count;i++){
    s.name();s.name();const kind=s.byte();skipImport(s,kind);
    if(kind===0)importedFunctions++;
   }
  }else if(id===3){
   declaredFunctions=s.u32();insist(declaredFunctions<=100000,'too many functions');
   for(let i=0;i<declaredFunctions;i++)s.u32();
  }else if(id===7){
   const count=s.u32();insist(count<=200000,'too many exports');
   for(let i=0;i<count;i++){
    const name=s.name(),kind=s.byte(),index=s.u32();
    if(kind===0){if(!funcExports.has(index))funcExports.set(index,[]);funcExports.get(index).push(name);}
   }
  }else if(id===10){
   const count=s.u32();insist(count<=100000,'too many bodies');
   bodies=[];
   for(let i=0;i<count;i++){
    const bodySize=s.u32(),start=s.p;
    s.skip(bodySize);
    bodies.push({fileStart:start,fileEndExclusive:s.p,size:bodySize});
   }
  }else if(id===0){
   const name=s.name();
   if(name==='name'){
    nameSectionFound=true;
    while(s.p<end){
     const subId=s.byte(),subLen=s.u32(),subEnd=s.p+subLen;
     insist(subEnd<=end,'bad WASM name subsection');
     if(subId===1){
      const sub=new Reader(bytes,s.p,subEnd),count=sub.u32();
      insist(count<=200000,'too many function names');
      for(let j=0;j<count;j++){const i=sub.u32(),fn=sub.name();funcNames.set(i,fn);}
      sub.endAt(subEnd);
     }
     s.p=subEnd;
    }
   }
  }
  // Other standard/custom sections are skipped according to their declared byte length.
  if(id===0&&s.p<end)s.p=end; // unnamed custom payloads are opaque, not malformed.
  if([0,2,3,7,10].includes(id))s.endAt(end);
  r.p=end;
 }
 insist(declaredFunctions!==null&&bodies!==null&&bodies.length===declaredFunctions,
  'function/code count mismatch');
 const rows=indices.map(index=>{
  insist(index<importedFunctions+declaredFunctions,'function index outside exact JSEP');
  const imported=index<importedFunctions;
  const body=imported?null:bodies[index-importedFunctions];
  return {index,kind:imported?'imported':'defined',
   name:funcNames.get(index)??null,exportNames:funcExports.get(index)??[],
   bodyFileStart:body?.fileStart??null,bodyFileEndExclusive:body?.fileEndExclusive??null,
   bodySizeBytes:body?.size??null,
   bodySHA256:body?createHash('sha256').update(bytes.subarray(body.fileStart,body.fileEndExclusive)).digest('hex'):null,
   exactTrapInstructionOffset:null,
   sourceLine:null};
 });
 return {schema:'M280_EXACT_ORIGINAL_JSEP_FUNCTION_SPAN_V1',binarySHA256:sha,
  binaryBytes:bytes.length,importedFunctionCount:importedFunctions,definedFunctionCount:declaredFunctions,
  namedSectionPresent:nameSectionFound,namedFunctionCount:funcNames.size,
  sourceBuildDebugSymbolsProven:false,originalFailingProcessBinarySHAProven:false,
  originalTrueRedPreserved:true,allOffsetsAreOnlyModuleFilePositions:true,
  nativeTrapInstructionFound:false,causalFixProven:false,releaseAuthorized:false,
  familyAlpha:'HOLD',frames:rows};
}
export function authenticateOriginalRed(run,job,jobLog){
 insist(run?.id===originalFailure.runId&&run.head_sha===originalFailure.source&&
  run.run_attempt===1&&run.status==='completed'&&run.conclusion==='failure'&&
  run.event==='push','source/run tampered');
 insist(job?.id===originalFailure.jobId&&job?.run_id===originalFailure.runId&&
  job?.status==='completed'&&job.conclusion==='failure'&&
  /webkit.*430.*2.*8/i.test(job.name||''),'native failed job tampered');
 insist(typeof jobLog==='string'&&jobLog.length>0&&jobLog.length<4000000,'invalid original job log');
 const marker='M279_NATIVE_MODEL_POINTER_BOUND_RECEIPT ';
 const rows=jobLog.split(/\r?\n/).filter(s=>s.includes(marker)).map(s=>{
  const at=s.indexOf(marker);return JSON.parse(s.slice(at+marker.length));
 });
 insist(rows.length===8&&rows.every((r,i)=>r.ordinal===i+1&&r.engine==='webkit'&&
  r.width===430&&r.shard===2),'missing/duplicate authentic ordinals');
 const red=rows.filter(x=>x.originalRealRed);
 insist(red.length===1&&red[0].ordinal===originalFailure.ordinal,'missing original real RED');
 const r=red[0];
 insist(r.originalExit!==0&&r.originalJourneyPositive===false&&r.originalOrtCreateSessionThrew===true&&
  r.nativeErrorClass==='wasm-bounds'&&r.modelPointer===8933688&&r.modelLength===15199746&&
  r.modelEnd===24133434&&r.heapBytesAtEntry===24182784&&r.heapBytesAtTerminal===50266112&&
  r.entryRangeWithinHeap===true&&r.exitRangeWithinHeap===true&&
  r.nativeFunctionOffsets?.length===4&&
  r.nativeFunctionOffsets.every((x,i)=>x.functionIndex===originalFailure.indices[i]&&x.offset===null)&&
  rows.filter(x=>x.ordinal!==3).every(x=>x.originalJourneyPositive===true&&!x.originalRealRed),
  'authentic same-run native bounds witness changed');
 return {originalSource:originalFailure.source,runId:originalFailure.runId,jobId:originalFailure.jobId,
  firstAttempt:true,realOriginalWebKitRed:true,originalNativeFunctionIndices:originalFailure.indices,
  originalOffsetsAllUnknown:true,originalInputPointerWithinBounds:true};
}
async function githubJSON(url,token){
 const r=await fetch(url,{headers:{'Accept':'application/vnd.github+json',
   'Authorization':'Bearer '+token,'User-Agent':'closet-current-m280-read-only'}});
 insist(r.ok,'authenticated historical GitHub evidence unavailable');
 return r.json();
}
async function verifyGitHubRed(token){
 insist(typeof token==='string'&&token.length>8,'missing read-only actions token');
 const root='https://api.github.com/repos/nickhaney916-lang/Closet-Current/actions';
 const run=await githubJSON(root+'/runs/'+originalFailure.runId,token);
 const job=await githubJSON(root+'/jobs/'+originalFailure.jobId,token);
 const resp=await fetch(root+'/jobs/'+originalFailure.jobId+'/logs',{headers:{
  'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,
  'User-Agent':'closet-current-m280-read-only'}});
 insist(resp.ok,'original failure job logs unavailable');
 const raw=await resp.text();insist(raw.length<4000000,'oversize original logs');
 return authenticateOriginalRed(run,job,raw);
}
async function downloadOriginal(){
 const res=await fetch(originalBinary.url,{signal:AbortSignal.timeout(140000)});
 insist(res.ok,'pinned public JSEP fetch failed');
 // HTTP Content-Length may describe compressed transfer bytes. Only decoded
 // exact raw WASM length and canonical SHA256 can attest source identity.
 const bytes=Buffer.from(await res.arrayBuffer());
 insist(bytes.length===originalBinary.bytes&&
  createHash('sha256').update(bytes).digest('hex')===originalBinary.sha256,
  'pinned original WASM bytes do not match');
 return bytes;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],
  {encoding:'utf8'}).replace(/\n$/,'');
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  insist(process.argv[2]==='map','no unapproved command');
  const authenticated=await verifyGitHubRed(process.env.GITHUB_TOKEN);
  const binary=await downloadOriginal();
  const parsed=mapModule(binary,authenticated.originalNativeFunctionIndices,
   {sha256:originalBinary.sha256,expectedSize:originalBinary.bytes});
  mkdirSync('m280-sanitized',{recursive:true});
  writeFileSync('m280-sanitized/exact-function-map.json',
   JSON.stringify({authenticatedOriginalRed:authenticated,...parsed},null,2)+'\n');
  console.log('M280_ORIGINAL_NATIVE_RED_EXACT_BINARY_FUNCTION_MAP '+JSON.stringify({
   originalAuthenticRed:true,canonicalWasmHashVerified:true,frameCount:parsed.frames.length,
   names:parsed.frames.map(x=>x.name),importCount:parsed.importedFunctionCount,
   nativeTrapInstructionFound:false,permanentFixProven:false,familyAlpha:'HOLD'}));
 }catch(e){
  console.error('M280_EVIDENCE_BLOCKED '+String(e.message||e).slice(0,180));
  process.exitCode=1;
 }
}
