import test from 'node:test';
import assert from 'node:assert/strict';
import {
 sourceGate,branch,additions,pinned,source,expected,
 parseMapsLine,classifyMaps,identifyWpeProcess,processStartToken,processParentPid,
 hasVerifiedBrowserAncestry,adjudicate
} from '../research/main1054/m290-live-native-elf-identity.mjs';
const sha='a'.repeat(40),event={name:'push',ref:branch,sha,attempt:'1'};
function git(cmd,...args){
 if(cmd==='rev-parse')return args[0]==='HEAD'?sha:pinned[args[0].slice(sha.length+1)]||'notpinned';
 if(cmd==='merge-base')return '';
 if(cmd==='diff-tree')return additions.map(x=>'A\0'+x+'\0').join('');
 if(cmd==='ls-tree')return '100644 blob '+'b'.repeat(40);
 throw Error('unexpected git query');
}
const change=(predicate,value)=>(...args)=>predicate(...args)?value:git(...args);
const paths=expected.map((x,i)=>i===0?source.wpe:source.root+'/minibrowser-wpe/lib/'+x.name);
const map=(path,i)=>['7f0000-7f1000','r-xp','00000000','08:01',String(1000+i),path].join(' ');
const receipt={
 schema:'M290_ACTUAL_PINNED_WPE_MAPPED_ELF_V1',
 playwright:'1.56.1',webkit:'26.0',browserRevision:'2215',
 upstreamBaseSource:source.webkitUpstream,downstreamPatchBlob:source.playwrightPatchGitBlob,
 discovery:'MAPPED_ELF_ATTESTED',localLoopbackTransportOnly:true,
 browserServerRootAncestryVerified:true,
 elf:expected.map((x,i)=>({...x,mappedIntoLocalLiveWpe:i===0})),
 originalModelExecuted:false,historicalM279FailedProcessInspected:false,
 originalTrapInstructionOffset:null,cxxNativeFaultLocation:null,
 originalCausalFixProven:false,releaseAuthorized:false,familyAlpha:'HOLD'
};
test('freeze original historical true WebKit RED and never change protected model, source or security',()=>{
 assert.deepEqual(sourceGate(git,event),{
  originalM279RedPreserved:true,originalWorkerUnchanged:true,originalTrapPc:null,
  originalCxxCause:null,permanentRepairProven:false,
  releaseAuthorized:false,familyAlpha:'HOLD'});
 assert.equal(source.webkitUpstream,'db897909f7c31d9b38793374c66427b6a4cb3dd3');
 assert.equal(source.canonicalOriginalJsepSHA256,'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39');
 assert.equal(expected.length,5);
});
test('branch or rerun or protected file drift/symlink fails closed',()=>{
 for(const delta of [{name:'pull_request_target'},{ref:'refs/heads/main'},
  {attempt:'2'},{sha:'0'.repeat(40)},{sha:''}])
  assert.throws(()=>sourceGate(git,{...event,...delta}),/M290 FAIL-CLOSED/);
 assert.throws(()=>sourceGate(change(cmd=>cmd==='merge-base','bad'),event),/parent lost/);
 assert.throws(()=>sourceGate(change(cmd=>cmd==='diff-tree','M\0public/outfit-worker-p94.mjs\0'),event),/original model/);
 assert.throws(()=>sourceGate(change(cmd=>cmd==='ls-tree','120000 blob symlink'),event),/regular file/);
 assert.throws(()=>sourceGate(change((cmd,arg)=>cmd==='rev-parse'&&arg===sha+':public/outfit-worker-p94.mjs','0'.repeat(40)),event),/protected source drift/);
});
test('parse only immutable ELF path from Linux proc maps and never expose addresses or inode',()=>{
 const line=map(source.wpe,0);
 assert.equal(parseMapsLine(line),source.wpe);
 assert.equal(parseMapsLine(line.replace(source.wpe,'[heap]')),null);
 assert.equal(parseMapsLine(line.replace(source.wpe,source.wpe+' (deleted)')),null);
 assert.equal(parseMapsLine('7f0000-7f1000 rw-p 00000000 00:00 0'),null);
 assert.throws(()=>parseMapsLine('x'.repeat(6001)),/unbounded/);
});
test('map exactly unique loaded pinned native code paths, never foreign mappings',()=>{
 const content=[
  map(paths[0],0),map(paths[0],1),map(paths[4],2),
  map('/usr/lib/libc.so.6',3),
  map(source.root+'/unclassified/another.so',4),
  map('/tmp/foreign-credential.txt',5)
 ].join('\n');
 const result=classifyMaps(content,paths);
 assert.deepEqual(result.mappedIndices,[0,4]);
 assert.equal(result.mappedInstalledCount,2);
 assert.equal(result.pinnedRootOtherMappedPathCount,1);
 assert.equal(result.sourceIsOriginalLiveWPEProcess,false);
 assert.ok(!JSON.stringify(result).includes('credential'));
 for(const altered of [[...paths.slice(0,2),'/tmp/foreign/'+expected[2].name,...paths.slice(3)],
  paths.slice(0,4),[paths[0],paths[0],...paths.slice(2)]])
  assert.throws(()=>classifyMaps(content,altered),/M290 FAIL-CLOSED/);
 assert.throws(()=>classifyMaps('x'.repeat(2000001),paths),/unbounded/);
});
test('process identity must exactly match new WPE process and start-time nonce',()=>{
 assert.equal(identifyWpeProcess('WPEWebProcess',source.wpe,'341','340'),true);
 assert.equal(identifyWpeProcess('WPEWebProcess',source.wpe,'341','341'),false);
 assert.equal(identifyWpeProcess('WebKitWebProces',source.wpe,'341','340'),false);
 assert.equal(identifyWpeProcess('WPEWebProcess','/tmp/WPEWebProcess','341','340'),false);
 assert.throws(()=>identifyWpeProcess('WPEWebProcess',source.wpe,'???'),/start token/);
 const suffix=Array.from({length:25},(_,i)=>i===19?'987654321':String(i));
 const stat='123 (WPEWebProcess) '+suffix.join(' ');
 assert.equal(processStartToken(stat),'987654321');
 assert.throws(()=>processStartToken('123 (WPEWebProcess) x'),/start time/);
});

test('supported BrowserServer process roots identify only actual renderer descendants',()=>{
 const root={pid:400,startToken:'9921'};
 const browser={pid:400,ppid:3,startToken:'9921'};
 const renderer={pid:401,ppid:400,startToken:'9925'};
 const foreignRoot={pid:950,ppid:3,startToken:'9922'};
 const foreignWpe={pid:951,ppid:950,startToken:'9926'};
 const collection=new Map([browser,renderer,foreignRoot,foreignWpe].map(row=>[row.pid,row]));
 const read=pid=>collection.get(pid);
 assert.equal(hasVerifiedBrowserAncestry(
  {pid:renderer.pid,startToken:renderer.startToken},root,read),true);
 assert.equal(hasVerifiedBrowserAncestry(
  {pid:foreignWpe.pid,startToken:foreignWpe.startToken},root,read),false,
  'concurrent newly launched unrelated WPE must not be treated as the test browser');
 assert.equal(hasVerifiedBrowserAncestry(
  {pid:renderer.pid,startToken:'1'},root,read),false,
  'reused child PID must never be accepted');
 assert.equal(hasVerifiedBrowserAncestry(
  {pid:renderer.pid,startToken:renderer.startToken},{...root,startToken:'1'},read),false,
  'reused BrowserServer PID must never be accepted');
 assert.equal(hasVerifiedBrowserAncestry(
  {pid:renderer.pid,startToken:renderer.startToken},root,
  pid=>pid===renderer.pid?{...renderer,ppid:950}:read(pid)),false,
  'renderer reparenting from browser to unrelated process must fail closed');
 assert.equal(hasVerifiedBrowserAncestry(
  {pid:renderer.pid,startToken:renderer.startToken},root,
  pid=>pid===root.pid?null:read(pid)),false,
  'disappearing browser process must never be treated as a valid root');
});
test('ancestry is source-bound through bounded parent chain, rejecting cycles and concurrent roots',()=>{
 const root={pid:200,startToken:'50'};
 const chain=new Map([
  [200,{pid:200,startToken:'50',ppid:1}],
  [201,{pid:201,startToken:'51',ppid:200}],
  [202,{pid:202,startToken:'52',ppid:201}],
  [300,{pid:300,startToken:'80',ppid:1}],
  [301,{pid:301,startToken:'81',ppid:300}],
 ]);
 const lookup=pid=>chain.get(pid);
 assert.equal(hasVerifiedBrowserAncestry({pid:202,startToken:'52'},root,lookup),true);
 assert.equal(hasVerifiedBrowserAncestry({pid:301,startToken:'81'},root,lookup),false);
 assert.equal(hasVerifiedBrowserAncestry({pid:201,startToken:'51'},root,
  pid=>pid===201?{pid:201,startToken:'51',ppid:202}:lookup(pid)),false);
 assert.throws(()=>hasVerifiedBrowserAncestry(
  {pid:202,startToken:'X'},root,lookup),/M290 FAIL-CLOSED/);
 assert.throws(()=>hasVerifiedBrowserAncestry(
  {pid:-1,startToken:'52'},root,lookup),/M290 FAIL-CLOSED/);
});
test('read-only Linux stat parent metadata is parsed independently of PID starttime',()=>{
 const suffix=Array.from({length:25},(_,i)=>i===1?'400':i===19?'9925':String(i));
 const line='401 (WPEWebProcess) '+suffix.join(' ');
 assert.equal(processParentPid(line),400);
 assert.equal(processStartToken(line),'9925');
 assert.throws(()=>processParentPid('401 (WPEWebProcess) S X'),/M290 FAIL-CLOSED/);
});
test('provenance adjudicator blocks falsely attributed mapped ELF without browser ancestry',()=>{
 assert.throws(()=>adjudicate({...receipt,browserServerRootAncestryVerified:false}),
  /mapped ELF cannot be attributed/);
 assert.throws(()=>adjudicate({...receipt,localLoopbackTransportOnly:false}),
  /missing loopback browser parent provenance/);
});

test('historical native trap, exact invalid C++ access or consumer release can never be promoted by a mapped ELF',()=>{
 assert.deepEqual(adjudicate(receipt),receipt);
 const errors=[
  {originalModelExecuted:true},{historicalM279FailedProcessInspected:true},
  {originalTrapInstructionOffset:7022509},{cxxNativeFaultLocation:'out of bounds'},
  {originalCausalFixProven:true},{releaseAuthorized:true},{familyAlpha:'RELEASED'},
  {playwright:'1.57.0'},{upstreamBaseSource:'different'},
  {downstreamPatchBlob:'different'},{discovery:'TRAP_PC_PROVEN'},
  {elf:expected.map((x,i)=>({...x,sha256:'0'.repeat(64),mappedIntoLocalLiveWpe:i===0}))},
  {elf:expected.map(x=>({...x,mappedIntoLocalLiveWpe:false}))}
 ];
 for(const delta of errors)assert.throws(()=>adjudicate({...receipt,...delta}),/M290 FAIL-CLOSED/);
});
test('honest unavailable/ambiguous native mapping remains BLOCKED not a PC',()=>{
 for(const mode of ['MAPS_UNAVAILABLE','NO_UNIQUE_NEW_WPE','MAPS_INCOMPLETE']){
  const x=adjudicate({...receipt,discovery:mode,elf:expected.map(x=>({...x,mappedIntoLocalLiveWpe:false}))});
  assert.equal(x.originalTrapInstructionOffset,null);
  assert.equal(x.originalCausalFixProven,false);
 }
});
