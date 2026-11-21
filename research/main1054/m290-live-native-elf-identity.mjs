/**
 * Mission 4 M290: real original pinned WPE renderer's loaded native ELF identity.
 *
 * Closes the M286 limitation that ELF files were only statically installed,
 * not independently proven mapped into a live native WebContent process.
 * Only reads read-only /proc/<our freshly launched WPE>/maps plus public
 * installed ELF files. No ptrace, GDB, process memory, private data, model,
 * native runtime modifications, security policy changes or deployments.
 *
 * The live local-only browser probe is NOT the historical M279 failing process.
 * A mapped native lib is NOT its wasm trap PC or a proven causal repair.
 */
import {createHash} from 'node:crypto';
import {createReadStream,existsSync,readFileSync,readdirSync,readlinkSync,lstatSync,mkdirSync,writeFileSync} from 'node:fs';
import {basename,join} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const parent='a4891fe3cabc270a3706346b74cb778c6466a8fb';
export const branch='refs/heads/research/main1054-m290-actual-wpe-loaded-native-elf-identity-HOLD';
export const additions=[
 '.github/workflows/main1054-m290-live-native-elf-identity-no-deploy.yml',
 'research/main1054/m290-live-native-elf-identity.mjs',
 'tests/main1054-m290-live-native-elf-identity.test.mjs'
];
export const pinned=Object.freeze({
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/m286-pinned-webkit-source-binary-provenance.mjs':'13874630185f165d9725e2ea4b7579ab4050fa53',
 'research/main1054/m284-wpe-native-process-discovery.mjs':'bbdab84c7aa890ecdd7f641342736fe1376a8127',
 'research/main1054/m280-original-jsep-function-map.mjs':'c52b967bc80ce8ba4c2c69bc2ea09c70e50bb332',
 'research/main1054/m279-original-model-pointer-bounds.mjs':'f2fd27553cc6854997480ee586cb8e191e9aca11'
});
export const source=Object.freeze({
 playwright:'1.56.1',webkit:'26.0',browserRevision:'2215',
 root:'/ms-playwright/webkit-2215',
 wpe:'/ms-playwright/webkit-2215/minibrowser-wpe/bin/WPEWebProcess',
 webkitUpstream:'db897909f7c31d9b38793374c66427b6a4cb3dd3',
 playwrightPatchGitBlob:'f713c6fa093a1f45956c84844d50635376923b75',
 canonicalOriginalJsepSHA256:'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39'
});
export const expected=Object.freeze([
 {name:'WPEWebProcess',role:'WPE_CONTENT_EXECUTABLE',
  sha256:'b46f88603e43eca28083389188944f7f47fd26311c8697a14f910e4f8bfa0d66',
  buildId:'23a6254355e0ab6aa4f3672cc51bd9eb487522a7'},
 {name:'libjavascriptcoregtk-6.0.so.1.7.0',role:'JSC_LIBRARY_INSTALLED',
  sha256:'73f32b17f002381abadb8cec18cdec85fb17ace1077f993f448e3024b3014f8b',
  buildId:'e04d2e784f16edeb1612cc24cd180e328c4b3e56'},
 {name:'libwebkitgtk-6.0.so.4.14.0',role:'GTK_WEBKIT_LIBRARY_INSTALLED',
  sha256:'f70e2c9ca5869d836e3fd25a6666d7b421e59d7808c504972f55a93c5185bf10',
  buildId:'61677b8279722c85226acbb8c3081832953777af'},
 {name:'libwebkitgtkinjectedbundle.so',role:'GTK_WEBKIT_INJECTED_BUNDLE_INSTALLED',
  sha256:'0902ed151ecba6957e61ce22ab99c6659c17da1640de92bf9555be000fdad327',
  buildId:'88872f17161fc04187582a8089a3378faea894fb'},
 {name:'libWPEWebKit-2.0.so.1.7.0',role:'WPE_WEBKIT_LIBRARY_INSTALLED',
  sha256:'daa10258a2161710c7c1d6a3e3f7abe0a100a6f269c00f5843dcd0f7df46ec29',
  buildId:'8faf9134c0557d2d09f3d680f9c8b780498cf59b'}
]);
const assert=(yes,message)=>{if(!yes)throw Error('M290 FAIL-CLOSED: '+message);};
export function sourceGate(git,event){
 assert(event?.name==='push'&&event.ref===branch&&event.attempt==='1',
  'wrong branch/event or rerun');
 assert(/^[a-f0-9]{40}$/.test(event.sha||'')&&git('rev-parse','HEAD')===event.sha,
  'source head mismatch');
 assert(git('merge-base','--is-ancestor',parent,event.sha)==='','original M286 parent lost');
 assert(git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,event.sha)===
  additions.map(p=>'A\0'+p+'\0').join(''),'unexpected change to original model/source');
 for(const p of additions)assert(git('ls-tree',event.sha,'--',p).startsWith('100644 blob '),
  'research-only regular file policy');
 for(const [p,h] of Object.entries(pinned))
  assert(git('rev-parse',event.sha+':'+p)===h,'original protected source drift '+p);
 return {originalM279RedPreserved:true,originalWorkerUnchanged:true,
  originalTrapPc:null,originalCxxCause:null,permanentRepairProven:false,
  releaseAuthorized:false,familyAlpha:'HOLD'};
}
export function parseMapsLine(line){
 assert(typeof line==='string'&&line.length<=6000,'unbounded proc maps line');
 const m=/^[0-9a-f]+-[0-9a-f]+\s+[rwxps-]{4}\s+[0-9a-f]+\s+[0-9a-f]+:[0-9a-f]+\s+\d+\s+(\/\S+(?: \S+)*)$/i.exec(line);
 if(!m)return null;
 // File identity only. Never retain any virtual addresses, inode or flags.
 const p=m[1].trim();
 if(p.includes('\u0000')||p.endsWith(' (deleted)'))return null;
 return p;
}
export function classifyMaps(text,approvedPaths){
 assert(typeof text==='string'&&text.length>0&&text.length<2000000,'missing/unbounded native maps');
 assert(Array.isArray(approvedPaths)&&approvedPaths.length===expected.length,'untrusted installed ELF file list');
 const exact=new Map();
 for(let i=0;i<expected.length;i++){
  const p=approvedPaths[i];
  assert(typeof p==='string'&&p.startsWith(source.root+'/')&&!p.includes('..')&&
   basename(p)===expected[i].name&&!exact.has(p),'source-locked ELF identity mismatch');
  exact.set(p,i);
 }
 const mapped=new Set(),mapOnlyOtherPinnedPaths=new Set();
 let lines=0;
 for(const line of text.split(/\r?\n/)){
  if(!line)continue;
  lines++;assert(lines<=20000,'unbounded memory-map row count');
  const p=parseMapsLine(line);
  if(!p)continue;
  if(exact.has(p))mapped.add(exact.get(p));
  else if(p.startsWith(source.root+'/')){
   // Never retain/log external paths or addresses, even from our own browser.
   mapOnlyOtherPinnedPaths.add(p);
  }
 }
 return {
  mappedIndices:[...mapped].sort((a,b)=>a-b),
  mappedInstalledCount:mapped.size,
  pinnedRootOtherMappedPathCount:mapOnlyOtherPinnedPaths.size,
  inputMapLines:lines,
  sourceIsOriginalLiveWPEProcess:false
 };
}
export function identifyWpeProcess(comm,exe,startToken,priorToken=null){
 assert(typeof comm==='string'&&typeof exe==='string','native identity missing');
 assert(typeof startToken==='string'&&/^\d{1,30}$/.test(startToken),
  'untrusted /proc process start token');
 return comm==='WPEWebProcess'&&exe===source.wpe&&startToken!==priorToken;
}
export function processStartToken(stat){
 assert(typeof stat==='string'&&stat.length>20&&stat.length<4000,'invalid /proc start time');
 const end=stat.lastIndexOf(') ');
 assert(end>=0,'invalid proc stat process name');
 const suffix=stat.slice(end+2).trim().split(/\s+/);
 // /proc/pid/stat field 3 begins after "<pid> (<comm>) "; starttime is field 22.
 assert(suffix.length>=20&&/^\d+$/.test(suffix[19]),'cannot validate original process start time');
 return suffix[19];
}

/** /proc/stat field 4 (PPID), with field 22 starttime checked independently. */
export function processParentPid(stat){
 assert(typeof stat==='string'&&stat.length>20&&stat.length<4000,'invalid process parent stat');
 const cut=stat.lastIndexOf(') ');
 assert(cut>=0,'missing process name terminator');
 const tokens=stat.slice(cut+2).trim().split(/\s+/);
 const ppid=tokens[1];
 assert(tokens.length>=20&&/^\d+$/.test(ppid)&&
  Number.isSafeInteger(Number(ppid)),'invalid parent process id');
 return Number(ppid);
}
function currentProcIdentity(pid){
 assert(Number.isSafeInteger(pid)&&pid>=2,'invalid native proc PID');
 const stat=readFileSync('/proc/'+pid+'/stat','utf8');
 return {pid,ppid:processParentPid(stat),startToken:processStartToken(stat)};
}
/**
 * Authenticates a browser-controlled process, not merely another new binary.
 * Caller supplies the browserServer.process() root, from the pinned Playwright
 * launchServer API. Reject cycles, reparenting, PID reuse and unrelated WPE.
 * Returns a boolean; never logs PIDs or raw /proc/stat process information.
 */
export function hasVerifiedBrowserAncestry(target,root,lookup){
 assert(target&&root&&typeof lookup==='function'&&
  Number.isSafeInteger(target.pid)&&target.pid>=2&&
  Number.isSafeInteger(root.pid)&&root.pid>=2&&
  /^\d{1,30}$/.test(target.startToken||'')&&
  /^\d{1,30}$/.test(root.startToken||''),'untrusted browser root/child identity');
 const seen=new Set();
 let step={pid:target.pid,startToken:target.startToken};
 for(let depth=0;depth<16;depth++){
  if(seen.has(step.pid))return false;
  seen.add(step.pid);
  const observed=lookup(step.pid);
  if(!observed||observed.pid!==step.pid||observed.startToken!==step.startToken||
   !Number.isSafeInteger(observed.ppid)||observed.ppid<1)return false;
  if(step.pid===root.pid)return observed.startToken===root.startToken;
  if(observed.ppid===1||observed.ppid===step.pid)return false;
  const parent=lookup(observed.ppid);
  if(!parent||parent.pid!==observed.ppid||!/^\d{1,30}$/.test(parent.startToken||''))
   return false;
  step={pid:parent.pid,startToken:parent.startToken};
 }
 return false;
}

export function adjudicate(receipt){
 assert(receipt?.schema==='M290_ACTUAL_PINNED_WPE_MAPPED_ELF_V1','missing diagnostic schema');
 assert(receipt.playwright===source.playwright&&receipt.webkit===source.webkit&&
  receipt.browserRevision===source.browserRevision&&
  receipt.upstreamBaseSource===source.webkitUpstream&&
  receipt.downstreamPatchBlob===source.playwrightPatchGitBlob,
  'wrong pinned browser/native build');
 assert(['MAPPED_ELF_ATTESTED','MAPS_UNAVAILABLE','NO_UNIQUE_NEW_WPE',
  'MAPS_INCOMPLETE'].includes(receipt.discovery),
  'unknown process mapping verdict');
 assert(Array.isArray(receipt.elf)&&receipt.elf.length===expected.length&&
  receipt.elf.every((row,i)=>row?.name===expected[i].name&&
   row?.sha256===expected[i].sha256&&row?.buildId===expected[i].buildId&&
   typeof row?.mappedIntoLocalLiveWpe==='boolean'),
  'unverified ELF file hash/build identity');
 assert(receipt.originalModelExecuted===false&&receipt.historicalM279FailedProcessInspected===false&&
  receipt.originalTrapInstructionOffset===null&&receipt.cxxNativeFaultLocation===null&&
  receipt.originalCausalFixProven===false&&receipt.releaseAuthorized===false&&
  receipt.familyAlpha==='HOLD','forged original root cause or release');
 assert(receipt.localLoopbackTransportOnly===true&&
  typeof receipt.browserServerRootAncestryVerified==='boolean',
  'missing loopback browser parent provenance');
 if(receipt.discovery==='MAPPED_ELF_ATTESTED')
  assert(receipt.browserServerRootAncestryVerified===true&&
   receipt.elf[0].mappedIntoLocalLiveWpe===true,
   'mapped ELF cannot be attributed to launched browser');
 return receipt;
}
async function hashFile(file){
 return new Promise((resolve,reject)=>{
  const hash=createHash('sha256');
  const stream=createReadStream(file);
  stream.on('data',chunk=>hash.update(chunk));
  stream.once('end',()=>resolve(hash.digest('hex')));
  stream.once('error',reject);
 });
}
function readelfBuildId(file){
 const r=spawnSync('readelf',['-n',file],{encoding:'utf8',timeout:15000,maxBuffer:90000});
 assert(r.status===0&&!r.signal,'readelf not permitted on pinned native ELF');
 const id=/Build ID:\s*([0-9a-f]{8,80})/i.exec(String(r.stdout||''))?.[1]?.toLowerCase();
 assert(typeof id==='string','pinned native ELF build ID unavailable');
 return id;
}
function enumeratePinnedFiles(){
 const root=source.root,result=[],todo=[root];let visited=0;
 while(todo.length){
  const dir=todo.shift();
  for(const entry of readdirSync(dir,{withFileTypes:true})){
   const path=join(dir,entry.name);visited++;
   assert(visited<=8000,'unbounded installed pinned browser file tree');
   if(entry.isDirectory())todo.push(path);
   else if(entry.isFile()&&expected.some(x=>x.name===entry.name))result.push(path);
  }
 }
 return expected.map(meta=>{
  const candidates=result.filter(path=>basename(path)===meta.name);
  assert(candidates.length===1,'missing/ambiguous original ELF '+meta.name);
  return candidates[0];
 });
}
async function verifyInstalled(){
 const paths=enumeratePinnedFiles(),rows=[];
 for(let i=0;i<expected.length;i++){
  assert(lstatSync(paths[i]).isFile(),'unsafe pinned ELF file');
  const sha=await hashFile(paths[i]),build=readelfBuildId(paths[i]);
  assert(sha===expected[i].sha256&&build===expected[i].buildId,
   'M286 pinned original ELF SHA/Build ID changed '+expected[i].name);
  rows.push({...expected[i],mappedIntoLocalLiveWpe:false});
 }
 return {paths,rows};
}
function enumerateNativeProcesses(){
 const items=[];
 for(const ent of readdirSync('/proc')){
  if(!/^\d+$/.test(ent))continue;
  try{
   const comm=readFileSync('/proc/'+ent+'/comm','utf8').trim();
   if(comm!=='WPEWebProcess')continue;
   const exe=readlinkSync('/proc/'+ent+'/exe');
   if(exe!==source.wpe)continue;
   const stat=readFileSync('/proc/'+ent+'/stat','utf8');
   items.push({pid:Number(ent),comm,exe,startToken:processStartToken(stat)});
  }catch{}
 }
 return items;
}
async function inspect(){
 const {paths,rows}=await verifyInstalled();
 const previous=new Map(enumerateNativeProcesses().map(p=>[p.pid,p.startToken]));
 const {webkit}=await import('playwright');
 // Supported BrowserServer.process() exposes the exact launched browser root.
 // The transport is forced to disposable loopback, never a public inspector.
 const server=await webkit.launchServer({headless:true,host:'127.0.0.1',port:0});
 let browser=null;
 try{
  const endpoint=new URL(server.wsEndpoint());
  assert(endpoint.protocol==='ws:'&&endpoint.hostname==='127.0.0.1'&&
   Number(endpoint.port)>0,'Playwright transport not loopback-only');
  const rootPid=server.process()?.pid;
  assert(Number.isSafeInteger(rootPid)&&rootPid>=2,
   'supported BrowserServer process ID unavailable');
  const root=currentProcIdentity(rootPid);
  browser=await webkit.connect(server.wsEndpoint());
  assert(browser.version()===source.webkit,'wrong original WebKit engine');
  const page=await browser.newPage();
  await page.goto('data:text/html,<html><body><main>m290-original-pinned-local-only</main></body></html>');
  assert(await page.evaluate(()=>document.querySelector('main')?.textContent)==='m290-original-pinned-local-only',
   'native pinned renderer did not execute local-only page');
  let natives=enumerateNativeProcesses().filter(p=>
   identifyWpeProcess(p.comm,p.exe,p.startToken,previous.get(p.pid)));
  if(natives.length===0){
   await new Promise(resolve=>setTimeout(resolve,350));
   natives=enumerateNativeProcesses().filter(p=>
    identifyWpeProcess(p.comm,p.exe,p.startToken,previous.get(p.pid)));
  }
  let discovery='NO_UNIQUE_NEW_WPE',maps=null,failCategory=null;
  let browserServerRootAncestryVerified=false;
  if(natives.length===1){
   const target=natives[0];
   try{
    const belongsToBrowser=()=>hasVerifiedBrowserAncestry(target,root,currentProcIdentity);
    // Before reading /proc maps, independently tie this WPE to the exact
    // BrowserServer process, rather than any other new WPE launched concurrently.
    browserServerRootAncestryVerified=belongsToBrowser();
    if(browserServerRootAncestryVerified){
     const stat=readFileSync('/proc/'+target.pid+'/stat','utf8');
     assert(processStartToken(stat)===target.startToken,'native process PID reused');
     const comm=readFileSync('/proc/'+target.pid+'/comm','utf8').trim();
     const exe=readlinkSync('/proc/'+target.pid+'/exe');
     assert(identifyWpeProcess(comm,exe,target.startToken,previous.get(target.pid)),
      'native process identity changed before reading maps');
     const text=readFileSync('/proc/'+target.pid+'/maps','utf8');
     // A native renderer can be reparented while /proc/maps is read: recheck
     // browser root and full parent chain before calling anything attested.
     browserServerRootAncestryVerified=belongsToBrowser()&&
      currentProcIdentity(rootPid).startToken===root.startToken&&
      readlinkSync('/proc/'+target.pid+'/exe')===source.wpe;
     if(browserServerRootAncestryVerified){
      maps=classifyMaps(text,paths);
      rows.forEach((r,i)=>r.mappedIntoLocalLiveWpe=maps.mappedIndices.includes(i));
      discovery=rows[0].mappedIntoLocalLiveWpe?'MAPPED_ELF_ATTESTED':'MAPS_INCOMPLETE';
     }
    }
   }catch(error){
    const code=String(error?.code||'');
    if(code==='EACCES'||code==='EPERM'||code==='ENOENT'||code==='ESRCH'){
     discovery='MAPS_UNAVAILABLE';
     failCategory=code==='EACCES'||code==='EPERM'?'READ_DENIED':'PROCESS_EXIT_RACE';
    }else throw error;
   }
  }
  const receipt={
   schema:'M290_ACTUAL_PINNED_WPE_MAPPED_ELF_V1',
   playwright:source.playwright,webkit:source.webkit,browserRevision:source.browserRevision,
   upstreamBaseSource:source.webkitUpstream,downstreamPatchBlob:source.playwrightPatchGitBlob,
   observedFreshWpeCount:natives.length,discovery,failCategory,
   browserServerRootAncestryVerified,localLoopbackTransportOnly:true,
   mappedPinnedNativeELFCount:maps?.mappedInstalledCount??null,
   otherPinnedNativeMappedPathCount:maps?.pinnedRootOtherMappedPathCount??null,
   originalM286FiveInstalledELFVerified:true,elf:rows,
   originalModelExecuted:false,historicalM279FailedProcessInspected:false,
   originalJsepProcessSHAProvenInHistoricalRed:false,
   originalTrapInstructionOffset:null,cxxNativeFaultLocation:null,
   originalCausalFixProven:false,releaseAuthorized:false,familyAlpha:'HOLD'
  };
  return adjudicate(receipt);
 }finally{
  if(browser)await browser.close().catch(()=>{});
  await server.close();
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd(),...args],
  {encoding:'utf8'}).replace(/\n$/,'');
 try{
  sourceGate(git,{name:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
   sha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT});
  assert(process.argv[2]==='probe','unapproved research mode');
  const receipt=await inspect();
  mkdirSync('m290-sanitized',{recursive:true});
  writeFileSync('m290-sanitized/live-original-wpe-elf-identity.json',
   JSON.stringify(receipt,null,2)+'\n');
  console.log('M290_REAL_PINNED_WPE_MAPPED_ELF_RECEIPT '+JSON.stringify({
   browser:receipt.webkit,newWpeCount:receipt.observedFreshWpeCount,
   discovery:receipt.discovery,linkedToBrowserServer:receipt.browserServerRootAncestryVerified,
   mappedPinnedELFs:receipt.elf.filter(x=>x.mappedIntoLocalLiveWpe).map(x=>x.name),
   mapReadBlocker:receipt.failCategory,
   historicalOriginalModelFailReproduced:false,actualNativeTrapPc:null,
   permanentRepairProven:false,familyAlpha:'HOLD'
  }));
 }catch(error){
  console.error('M290_FAIL_CLOSED '+String(error?.message||error).slice(0,220));
  process.exitCode=1;
 }
}
