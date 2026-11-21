/**
 * M286: exact pinned Playwright WebKit upstream source + patched build provenance.
 *
 * Only PUBLIC Playwright/WebKit source metadata and READ-ONLY installed ELF
 * identification. No ptrace/debugger, runtime mutation, original ONNX/model,
 * private owner/photos, native memory inspection, release or repair claims.
 */
import {createHash} from 'node:crypto';
import {createReadStream,existsSync,lstatSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {basename,join} from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const parent='4ea9b327f5694b2cb5f1d79fbb5a0f3eb62f5c14';
export const branch='refs/heads/research/main1054-m286-pinned-webkit-source-binary-provenance-HOLD';
export const additions=[
 '.github/workflows/main1054-m286-pinned-webkit-source-binary-no-deploy.yml',
 'research/main1054/m286-pinned-webkit-source-binary-provenance.mjs',
 'tests/main1054-m286-pinned-webkit-source-binary-provenance.test.mjs'
];
export const pinned=Object.freeze({
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/m284-wpe-native-process-discovery.mjs':'bbdab84c7aa890ecdd7f641342736fe1376a8127',
 'tests/main1054-m284-wpe-native-process-discovery.test.mjs':'27e98896d538cc13f3582d8a93783054b9e90eea',
 'research/main1054/m279-original-model-pointer-bounds.mjs':'f2fd27553cc6854997480ee586cb8e191e9aca11',
 'research/main1054/m280-original-jsep-function-map.mjs':'c52b967bc80ce8ba4c2c69bc2ea09c70e50bb332',
 'research/main1054/m281-webkit-trap-pc-capability.mjs':'52412852f1c4f42a57826b1dcb18f1e793d92f19'
});
export const originalRed=Object.freeze({
 run:44640727828,job:135971719127,engine:'webkit',width:430,shard:2,ordinal:3,
 wasmFailure:'OrtCreateSession wasm-bounds',topFunctionIndex:4846,offset:null,
 wasmFunctionIndexStack:[4846,1384,11276,7427]
});
export const official=Object.freeze({
 playwrightTag:'v1.56.1',
 playwrightCommit:'54c711571a37de525377e6f3d3608c3e029b1829',
 webkitRevision:'2215',
 webkitVersion:'26.0',
 upstreamCommit:'db897909f7c31d9b38793374c66427b6a4cb3dd3',
 patchGitBlob:'f713c6fa093a1f45956c84844d50635376923b75',
 patchLength:980815,
 browserRoot:'/ms-playwright/webkit-2215',
 webProcess:'/ms-playwright/webkit-2215/minibrowser-wpe/bin/WPEWebProcess',
 pinnedWasmSHA256:'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39'
});
const need=(yes,reason)=>{if(!yes)throw Error('M286 FAIL-CLOSED: '+reason);};
const gitBlobSha=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
export function sourceGate(git,e){
 need(e?.name==='push'&&e.ref===branch&&e.attempt==='1','wrong branch/event or rerun');
 need(/^[a-f0-9]{40}$/.test(e.sha||'')&&git('rev-parse','HEAD')===e.sha,'wrong exact HEAD');
 need(git('merge-base','--is-ancestor',parent,e.sha)==='','lost M284 source parent');
 need(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,e.sha)===
  additions.map(p=>'A\0'+p+'\0').join(''),'protected file edited or extra output');
 for(const p of additions)need(git('ls-tree',e.sha,'--',p).startsWith('100644 blob '),'unsafe research mode');
 for(const [p,sha] of Object.entries(pinned))need(git('rev-parse',e.sha+':'+p)===sha,'protected source drift '+p);
 return {immutableOriginalRed:true,originalAppModelWasmUnchanged:true,
  originalNativeTrapPc:null,permanentWebKitFixProven:false,familyAlpha:'HOLD'};
}
export function verifyUpstreamConfig(config){
 need(typeof config==='string'&&config.length<1000,'invalid upstream config');
 const lines=config.trim().split(/\r?\n/);
 need(lines.length===3,'unexpected extra WebKit source config');
 const vars=Object.fromEntries(lines.map(line=>{
  const m=/^(REMOTE_URL|BASE_BRANCH|BASE_REVISION)="([^"\n]+)"$/.exec(line);
  need(m,'unrecognized upstream source declaration');
  return [m[1],m[2]];
 }));
 need(Object.keys(vars).length===3&&vars.REMOTE_URL==='https://github.com/WebKit/WebKit.git'&&
  vars.BASE_BRANCH==='main'&&vars.BASE_REVISION===official.upstreamCommit,
  'upstream WebKit source baseline mismatch');
 return {upstreamWebKitCommit:vars.BASE_REVISION,
  upstreamBaselineOnly:true,patchedBinaryEquivalenceProven:false};
}
export function verifyBrowserManifest(body){
 const obj=typeof body==='string'?JSON.parse(body):body;
 need(obj&&Array.isArray(obj.browsers),'invalid official browsers.json');
 const rows=obj.browsers.filter(x=>x?.name==='webkit');
 need(rows.length===1&&rows[0].revision===official.webkitRevision&&
  rows[0].browserVersion===official.webkitVersion,'pinned Linux WebKit revision mismatch');
 need(rows[0].revisionOverrides?.['ubuntu24.04-x64']===undefined,
  'unexpected platform-specific Ubuntu 24.04 binary revision');
 return {pinnedPlaywrightTag:official.playwrightTag,
  linuxWebKitBrowserRevision:rows[0].revision,browserVersion:rows[0].browserVersion,
  upstreamSourceBuildExact:false,playwrightPatchAppliedBuild:true};
}
export function verifyPatch(bytes){
 const b=Buffer.from(bytes);
 need(b.length===official.patchLength&&gitBlobSha(b)===official.patchGitBlob,
  'Playwright patch blob does not match exact tag');
 need(b.subarray(0,16).toString('utf8').includes('diff --git')||
  b.subarray(0,16).toString('utf8').includes('Index:'),
  'unexpected WebKit patch format');
 return {playwrightWebKitPatchGitBlob:official.patchGitBlob,
  patchBytes:b.length,
  sourceIsPatchedDownstream:true,unmodifiedWebKitSourceIsEquivalentToPatchedBrowser:false};
}
export function verifyPublicProvenance(o){
 need(o?.tag?.ref==='refs/tags/'+official.playwrightTag&&
  o.tag.object?.sha===official.playwrightCommit&&
  o.tag.object?.type==='commit','Playwright source tag not exact');
 need(o?.webkit?.sha===official.upstreamCommit,'WebKit upstream commit not available');
 const manifest=verifyBrowserManifest(o.browsers),
  source=verifyUpstreamConfig(o.config),patch=verifyPatch(o.patch);
 return {schema:'M286_PLAYWRIGHT_EXACT_UPSTREAM_SOURCE_BASE_V1',
  officialPlaywrightTag:official.playwrightTag,
  officialPlaywrightTagCommit:official.playwrightCommit,
  ...manifest,...source,...patch,
  historicalOriginalFailJob:originalRed.job,
  historicalOriginalFailUnchanged:true,
  originalWasmFunction4846InstructionOffset:null,
  sameOriginalFailureProcessLoadedBinarySHAObserved:false,
  sourceMatchedDebugBrowserBuilt:false,
  originalNativeInvalidAccessKnown:false,
  originalRepairProven:false,releaseAuthorized:false,familyAlpha:'HOLD'};
}
async function fetchPublic(url,kind){
 const r=await fetch(url,{headers:{Accept:'application/vnd.github+json',
  'User-Agent':'closet-current-main1054-read-only-source-provenance'},
  signal:AbortSignal.timeout(45000)});
 need(r.ok,'upstream public GitHub source not readable ('+kind+')');
 const b=Buffer.from(await r.arrayBuffer());
 need(b.length>0&&b.length<1500000,'unbounded upstream source response');
 return kind==='json'?JSON.parse(b.toString('utf8')):b;
}
async function fetchOfficialSource(){
 const root='https://api.github.com/repos/microsoft/playwright';
 const raw='https://raw.githubusercontent.com/microsoft/playwright/v1.56.1';
 const [tag,webkit,browsers,config,patch]=await Promise.all([
  fetchPublic(root+'/git/ref/tags/v1.56.1','json'),
  fetchPublic('https://api.github.com/repos/WebKit/WebKit/commits/'+official.upstreamCommit,'json'),
  fetchPublic(raw+'/packages/playwright-core/browsers.json','text'),
  fetchPublic(raw+'/browser_patches/webkit/UPSTREAM_CONFIG.sh','text'),
  fetchPublic(raw+'/browser_patches/webkit/patches/bootstrap.diff','binary')
 ]);
 return verifyPublicProvenance({tag,webkit,
  browsers:browsers.toString('utf8'),config:config.toString('utf8'),patch});
}
export function readelfMetadata(notes,sections){
 need(typeof notes==='string'&&notes.length<100000&&
  typeof sections==='string'&&sections.length<100000,'unbounded ELF info');
 const id=/Build ID:\s*([0-9a-f]{8,80})/i.exec(notes)?.[1]?.toLowerCase()??null;
 return {elfBuildId:id,dwarfSectionPresent:/\.(?:zdebug|debug)_info\b/.test(sections),
  symbolTablePresent:/\.symtab\b/.test(sections)};
}
export function classifyBinaryCandidate(p,root){
 need(typeof p==='string'&&typeof root==='string','invalid native binary path');
 if(p===official.webProcess)return 'WPE_CONTENT_PROCESS';
 need(p.startsWith(root+'/')&&!p.includes('/../'),'binary outside pinned root');
 const name=basename(p);
 if(/^libJavaScriptCore.*\.so(?:\.[0-9.]+)?$/i.test(name))return 'JSC_ENGINE_LIBRARY';
 if(/^libWPEWebKit.*\.so(?:\.[0-9.]+)?$/i.test(name))return 'WPE_WEBKIT_LIBRARY';
 if(/^libWebKit.*\.so(?:\.[0-9.]+)?$/i.test(name))return 'WEBKIT_LIBRARY';
 return null;
}
export function selectInstalledCandidates(list){
 need(Array.isArray(list)&&list.length<=8000,'unbounded native file traversal');
 const all=[official.webProcess,...list].filter((p,i,a)=>a.indexOf(p)===i);
 const rows=all.map(p=>({p,kind:classifyBinaryCandidate(p,official.browserRoot)}))
  .filter(r=>r.kind!==null);
 need(rows.length>0&&rows.length<=32,'ambiguous installed native binary identities');
 return rows;
}
function safeInstalledPaths(root){
 const out=[],todo=[root];
 while(todo.length){
  const dir=todo.shift();
  for(const ent of readdirSync(dir,{withFileTypes:true})){
   const p=join(dir,ent.name);
   if(ent.isDirectory()){
    need(out.length+todo.length<8000,'unbounded installed source root');
    todo.push(p);
   }else if(ent.isFile())out.push(p);
   need(out.length<8000,'unbounded installed native file tree');
  }
 }
 return out;
}
function hashFile(file){
 return new Promise((resolve,reject)=>{
  const hash=createHash('sha256');
  const stream=createReadStream(file);
  stream.on('data',chunk=>hash.update(chunk));
  stream.on('end',()=>resolve(hash.digest('hex')));
  stream.on('error',reject);
 });
}
function readelf(file,arg){
 const r=spawnSync('readelf',[arg,file],{encoding:'utf8',
  timeout:15000,maxBuffer:95000});
 need(r.status===0&&!r.signal,'read-only readelf unsupported');
 return String(r.stdout||'');
}
export async function fingerprintInstalled(){
 const {webkit}=await import('playwright');
 const browser=await webkit.launch({headless:true});
 let version=null;
 try{version=browser.version();}finally{await browser.close();}
 need(version===official.webkitVersion,'wrong native browser version');
 need(existsSync(official.webProcess)&&lstatSync(official.webProcess).isFile(),
  'original pinned WPE executable unavailable');
 const selected=selectInstalledCandidates(safeInstalledPaths(official.browserRoot));
 const bins=[];
 for(const {p,kind} of selected){
  need(lstatSync(p).isFile(),'native ELF not regular');
  const sha=await hashFile(p),
   meta=readelfMetadata(readelf(p,'-n'),readelf(p,'-SW'));
  need(/^[a-f0-9]{64}$/.test(sha),'wrong native binary fingerprint');
  bins.push({name:basename(p),role:kind,sha256:sha,buildId:meta.elfBuildId,
   dwarfSectionPresent:meta.dwarfSectionPresent,
   symbolTablePresent:meta.symbolTablePresent});
 }
 const wpe=bins.filter(b=>b.role==='WPE_CONTENT_PROCESS');
 need(wpe.length===1,'missing exact pinned WPE content process ELF');
 return {schema:'M286_PINNED_WPE_NATIVE_BUILD_FINGERPRINT_V1',
  playwrightVersion:official.playwrightTag,webkitRevision:official.webkitRevision,
  webkitVersion:version,sourceUpstreamWebKitCommit:official.upstreamCommit,
  playwrightPatchedBinaryBuild:true,
  sourceRevisionPatchedBuildReproduced:false,sourceMappedNativeDebugSymbolsAvailable:false,
  includedELFCount:bins.length,elf:bins,
  nativeDebuggerAttached:false,ptracePermissionModified:false,
  originalModelExecuted:false,originalTrapInstructionOffset:null,
  originalM279RedPreserved:true,originalNativeCorrectionProven:false,
  releaseAuthorized:false,familyAlpha:'HOLD'};
}
function save(dir,filename,receipt){
 mkdirSync(dir,{recursive:true});
 writeFileSync(dir+'/'+filename,JSON.stringify(receipt,null,2)+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],
  {encoding:'utf8'}).replace(/\n$/,'');
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  let receipt;
  if(process.argv[2]==='source')receipt=await fetchOfficialSource();
  else if(process.argv[2]==='binary')receipt=await fingerprintInstalled();
  else throw Error('M286 FAIL-CLOSED: unsupported research command');
  save('m286-sanitized',process.argv[2]+'-provenance.json',receipt);
  console.log('M286_PINNED_WEBKIT_PROVENANCE '+JSON.stringify({
   mode:process.argv[2],originalRedPreserved:true,
   webkitBaselineRevision:official.upstreamCommit,
   browserRevision:official.webkitRevision,
   patchBlob:official.patchGitBlob,
   binaryCount:receipt.includedELFCount??null,
   exactOriginalNativeTrapOffset:null,
   originalNativeRepairProven:false,familyAlpha:'HOLD'
  }));
 }catch(e){
  console.error('M286_EVIDENCE_BLOCKED '+String(e?.message||e).slice(0,220));
  process.exitCode=1;
 }
}
