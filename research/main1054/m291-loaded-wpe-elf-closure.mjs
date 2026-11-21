/**
 * M291 HOLD: independently fingerprint every on-disk ELF loaded under the
 * exact pinned Playwright WPE root in ONE browser-owned local-only process.
 * This is NOT a real original ONNX model failure, trapping PC or native fix.
 * No ptrace, permissions changes, memory access, remote inspector or private data.
 */
import {createHash} from 'node:crypto';
import {
  createReadStream, readdirSync, readFileSync, readlinkSync, realpathSync,
  lstatSync, openSync, closeSync, readSync, statSync, mkdirSync, writeFileSync
} from 'node:fs';
import {execFileSync, spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {
  source, expected, parseMapsLine, identifyWpeProcess,
  processParentPid, processStartToken, hasVerifiedBrowserAncestry
} from './m290-live-native-elf-identity.mjs';

export const parent='356a7782abdd965a1250a74b1dddb738e5abf290';
export const branch='refs/heads/research/main1054-m291-loaded-wpe-native-elf-closure-HOLD';
export const additions=[
 '.github/workflows/main1054-m291-loaded-wpe-native-elf-no-deploy.yml',
 'research/main1054/m291-loaded-wpe-elf-closure.mjs',
 'tests/main1054-m291-loaded-wpe-elf-closure.test.mjs'
];
const frozen={
 'research/main1054/m290-live-native-elf-identity.mjs':'5d395b06ad76750d1d0a709daab9cfd49e88cc6e',
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/m286-pinned-webkit-source-binary-provenance.mjs':'13874630185f165d9725e2ea4b7579ab4050fa53',
 'research/main1054/m279-original-model-pointer-bounds.mjs':'f2fd27553cc6854997480ee586cb8e191e9aca11'
};
const demand=(ok,msg)=>{if(!ok)throw Error('M291 FAIL-CLOSED: '+msg);};

export function sourceGate(git,event){
 demand(event?.name==='push'&&event.ref===branch&&event.attempt==='1','wrong event or rerun');
 demand(/^[0-9a-f]{40}$/.test(event.sha||'')&&git('rev-parse','HEAD')===event.sha,
  'head does not match immutable CI event');
 demand(git('merge-base','--is-ancestor',parent,event.sha)==='','M290 lineage lost');
 const actual=git('diff-tree','--no-commit-id','-r','--no-renames','--name-status','-z',parent,event.sha);
 demand(actual===additions.map(p=>'A\u0000'+p+'\u0000').join(''),
  'source changes beyond three additive diagnostics');
 for(const file of additions)
  demand(git('ls-tree',event.sha,'--',file).startsWith('100644 blob '),
   'not an ordinary non-symlink research file');
 for(const [file,sha] of Object.entries(frozen))
  demand(git('rev-parse',event.sha+':'+file)===sha,'protected ancestor drift');
 return {originalSourceUnchanged:true,actualOriginalTrapPC:null,causalRepair:false,familyAlpha:'HOLD'};
}

export function approvedPinnedRelative(path){
 if(typeof path!=='string'||!path.startsWith(source.root+'/'))return null;
 const rel=path.slice(source.root.length+1);
 if(rel.length>340||rel.length===0||! /^[A-Za-z0-9_.+/-]+$/.test(rel)||
    rel.split('/').some(x=>x==='.'||x==='..'||x===''))return null;
 return rel;
}

/** Never expose /proc addresses, flags, inode, PID or non-browser paths. */
export function mappedPinnedRelativePaths(maps){
 demand(typeof maps==='string'&&maps.length>0&&maps.length<2000000,'unbounded native maps');
 const paths=new Set();let rows=0;
 for(const line of maps.split(/\r?\n/)){
  if(!line)continue;
  demand(++rows<=20000,'unbounded maps line count');
  const path=parseMapsLine(line);
  const rel=approvedPinnedRelative(path);
  if(rel)paths.add(rel);
  demand(paths.size<=64,'too many pinned-root mapped entries');
 }
 return [...paths].sort();
}

export function adjudicate(receipt){
 demand(receipt?.schema==='M291_PINNED_WPE_ALL_MAPPED_ELF_SHA_V1'&&
   receipt.playwright===source.playwright&&receipt.webkit===source.webkit&&
   receipt.browserRevision===source.browserRevision&&
   receipt.webkitUpstream===source.webkitUpstream&&
   receipt.playwrightPatchGitBlob===source.playwrightPatchGitBlob,
   'unmatched native engine version');
 demand(receipt.localOnly===true&&receipt.ownedBrowserAncestry===true&&
  receipt.rendererRecheckedAfterMaps===true,'unattributed native renderer');
 demand(Array.isArray(receipt.mapped)&&receipt.mapped.length>=2&&
   receipt.mapped.length<=64&&
   receipt.mapped.every(x=>approvedPinnedRelative(source.root+'/'+x.relative)===x.relative&&
    /^[a-f0-9]{64}$/.test(x.sha256)&&typeof x.sizeBytes==='number'&&
    Number.isSafeInteger(x.sizeBytes)&&x.sizeBytes>0&&
    ['ELF','NON_ELF'].includes(x.format)&&
    (x.buildId===null||/^[a-f0-9]{8,80}$/.test(x.buildId))),
   'unsafe or unverified native mapped file metadata');
 const names=new Set(receipt.mapped.map(x=>x.relative));
 demand(names.size===receipt.mapped.length,'duplicated mapped identity');
 const expectedLoaded=expected.filter(x=>x.name==='WPEWebProcess'||
    x.name==='libWPEWebKit-2.0.so.1.7.0');
 for(const pinned of expectedLoaded){
  const matching=receipt.mapped.filter(x=>x.relative.split('/').at(-1)===pinned.name);
  demand(matching.length===1&&matching[0].sha256===pinned.sha256&&
   matching[0].buildId===pinned.buildId&&matching[0].format==='ELF',
   'missing known M290 native loaded ELF provenance');
 }
 demand(receipt.originalModelExecuted===false&&
  receipt.historicalOriginalFailureInspected===false&&
  receipt.actualTrapInstructionOffset===null&&receipt.cxxFaultLocation===null&&
  receipt.causalNativeFixProven===false&&receipt.releaseAuthorized===false&&
  receipt.familyAlpha==='HOLD','attempted inference of native repair/release');
 return receipt;
}

function currentProc(pid){
 demand(Number.isSafeInteger(pid)&&pid>=2,'invalid local process identity');
 const stat=readFileSync('/proc/'+pid+'/stat','utf8');
 return {pid,ppid:processParentPid(stat),startToken:processStartToken(stat)};
}
function wpeCandidates(){
 const candidates=[];
 for(const ent of readdirSync('/proc')){
  if(!/^\d+$/.test(ent))continue;
  try{
   const pid=Number(ent);
   if(readFileSync('/proc/'+pid+'/comm','utf8').trim()!=='WPEWebProcess')continue;
   const exe=readlinkSync('/proc/'+pid+'/exe');
   if(exe!==source.wpe)continue;
   candidates.push({...currentProc(pid),exe,comm:'WPEWebProcess'});
  }catch{}
 }
 return candidates;
}
async function sha256File(path){
 return new Promise((resolve,reject)=>{
  const h=createHash('sha256'),stream=createReadStream(path);
  stream.on('data',chunk=>h.update(chunk));
  stream.once('error',reject);
  stream.once('end',()=>resolve(h.digest('hex')));
 });
}
export function readElfMetadata(path){
 const fd=openSync(path,'r');const buf=Buffer.alloc(4);
 try{demand(readSync(fd,buf,0,4,0)===4,'short installed file');}
 finally{closeSync(fd);}
 const isElf=buf.equals(Buffer.from([0x7f,0x45,0x4c,0x46]));
 if(!isElf)return {format:'NON_ELF',buildId:null};
 const result=spawnSync('readelf',['-n',path],
  {encoding:'utf8',timeout:18000,maxBuffer:200000});
 demand(result.status===0&&!result.signal,'readelf failed on original pinned native file');
 const match=/Build ID:\s*([0-9a-f]{8,80})/i.exec(result.stdout||'');
 return {format:'ELF',buildId:match?match[1].toLowerCase():null};
}

async function fingerprint(rel){
 demand(approvedPinnedRelative(source.root+'/'+rel)===rel,'unapproved native path');
 const path=join(source.root,rel);
 demand(lstatSync(path).isFile()&&realpathSync(path)===path,
  'symlink or non-file native path not accepted');
 const sizeBytes=statSync(path).size;
 demand(Number.isSafeInteger(sizeBytes)&&sizeBytes>0&&sizeBytes<800000000,
  'unbounded installed native file');
 const format=readElfMetadata(path),sha256=await sha256File(path);
 return {relative:rel,sha256,sizeBytes,...format};
}
async function observe(){
 const prior=new Map(wpeCandidates().map(x=>[x.pid,x.startToken]));
 const {webkit}=await import('playwright');
 const server=await webkit.launchServer({headless:true,host:'127.0.0.1',port:0});
 let browser;
 try{
  const endpoint=new URL(server.wsEndpoint());
  demand(endpoint.protocol==='ws:'&&endpoint.hostname==='127.0.0.1'&&
   Number(endpoint.port)>0,'not exact loopback transport');
  const rootPid=server.process()?.pid;
  const root=currentProc(rootPid);
  browser=await webkit.connect(server.wsEndpoint());
  demand(browser.version()===source.webkit,'unpinned WebKit engine');
  const page=await browser.newPage();
  await page.goto('data:text/html,<main>m291-local-native-file-proof</main>');
  demand(await page.evaluate(()=>document.querySelector('main')?.textContent)===
    'm291-local-native-file-proof','local-only renderer did not execute');
  let fresh=wpeCandidates().filter(x=>
   identifyWpeProcess(x.comm,x.exe,x.startToken,prior.get(x.pid)));
  if(!fresh.length){
   await new Promise(ok=>setTimeout(ok,350));
   fresh=wpeCandidates().filter(x=>
    identifyWpeProcess(x.comm,x.exe,x.startToken,prior.get(x.pid)));
  }
  demand(fresh.length===1,'not exactly one new source-pinned WPE renderer');
  const child=fresh[0];
  const ancestry=()=>hasVerifiedBrowserAncestry(child,root,currentProc);
  demand(ancestry(),'candidate renderer is not descendant of our BrowserServer');
  const text=readFileSync('/proc/'+child.pid+'/maps','utf8');
  demand(ancestry()&&currentProc(rootPid).startToken===root.startToken&&
   readlinkSync('/proc/'+child.pid+'/exe')===source.wpe,
   'renderer identity/reparenting race after /proc maps');
  const mappedPaths=mappedPinnedRelativePaths(text);
  const mapped=[];
  for(const rel of mappedPaths)mapped.push(await fingerprint(rel));
  // Re-check after the bounded read-only file hashing phase, before attesting.
  demand(ancestry()&&currentProc(rootPid).startToken===root.startToken&&
   readlinkSync('/proc/'+child.pid+'/exe')===source.wpe,
   'native process identity changed during static file hash');
  return adjudicate({
   schema:'M291_PINNED_WPE_ALL_MAPPED_ELF_SHA_V1',
   playwright:source.playwright,webkit:source.webkit,
   browserRevision:source.browserRevision,webkitUpstream:source.webkitUpstream,
   playwrightPatchGitBlob:source.playwrightPatchGitBlob,
   localOnly:true,ownedBrowserAncestry:true,rendererRecheckedAfterMaps:true,
   mapped,
   originalModelExecuted:false,historicalOriginalFailureInspected:false,
   actualTrapInstructionOffset:null,cxxFaultLocation:null,
   causalNativeFixProven:false,releaseAuthorized:false,familyAlpha:'HOLD'
  });
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
  demand(process.argv[2]==='probe','not a sanctioned no-deploy action');
  const receipt=await observe();
  mkdirSync('m291-sanitized',{recursive:true});
  writeFileSync('m291-sanitized/pinned-wpe-mapped-native-file-shas.json',
   JSON.stringify(receipt,null,2)+'\n');
  console.log('M291_NATIVE_LOADED_FINGERPRINTS '+JSON.stringify({
   count:receipt.mapped.length,
   elfCount:receipt.mapped.filter(x=>x.format==='ELF').length,
   otherThanM290Known:receipt.mapped.length-2,
   actualOriginalTrapPC:null,causalRepair:false,familyAlpha:'HOLD'
  }));
 }catch(e){
  console.error('M291_FAIL_CLOSED '+String(e?.message||e).slice(0,240));
  process.exitCode=1;
 }
}
