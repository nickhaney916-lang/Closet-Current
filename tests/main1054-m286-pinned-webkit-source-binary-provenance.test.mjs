import test from 'node:test';
import assert from 'node:assert/strict';
import {
 sourceGate,branch,additions,pinned,official,originalRed,
 verifyUpstreamConfig,verifyBrowserManifest,verifyPatch,verifyPublicProvenance,
 readelfMetadata,classifyBinaryCandidate,selectInstalledCandidates
} from '../research/main1054/m286-pinned-webkit-source-binary-provenance.mjs';
const sha='a'.repeat(40),e={name:'push',ref:branch,sha,attempt:'1'};
function git(op,...args){
 if(op==='rev-parse')return args[0]==='HEAD'?sha:pinned[args[0].slice(sha.length+1)]||'b'.repeat(40);
 if(op==='merge-base')return '';
 if(op==='diff-tree')return additions.map(p=>'A\0'+p+'\0').join('');
 if(op==='ls-tree')return '100644 blob '+'b'.repeat(40);
 throw Error('unplanned git operation');
}
const alter=(match,newValue)=>(...a)=>match(...a)?newValue:git(...a);
test('source changes strictly additive to immutable actual original M279 failure ancestry',()=>{
 assert.deepEqual(sourceGate(git,e),{
  immutableOriginalRed:true,originalAppModelWasmUnchanged:true,
  originalNativeTrapPc:null,permanentWebKitFixProven:false,familyAlpha:'HOLD'
 });
 assert.equal(originalRed.run,44640727828);
 assert.equal(originalRed.job,135971719127);
 assert.equal(originalRed.topFunctionIndex,4846);
 assert.equal(originalRed.offset,null);
 assert.deepEqual(originalRed.wasmFunctionIndexStack,[4846,1384,11276,7427]);
});
test('source gate blocks branch/rerun/source drift/extra changes/symlinks',()=>{
 for(const delta of [{name:'pull_request_target'},{ref:'refs/heads/main'},{attempt:'2'},
  {sha:'f'.repeat(40)},{sha:''}])
  assert.throws(()=>sourceGate(git,{...e,...delta}),/M286 FAIL-CLOSED/);
 assert.throws(()=>sourceGate(alter(op=>op==='merge-base','wrong'),e),/source parent/);
 assert.throws(()=>sourceGate(alter(op=>op==='diff-tree','M\0public/outfit-worker-p94.mjs\0'),e),/protected file/);
 assert.throws(()=>sourceGate(alter(op=>op==='ls-tree','120000 blob symlink'),e),/unsafe research/);
 assert.throws(()=>sourceGate(alter((op,arg)=>op==='rev-parse'&&arg===sha+':public/outfit-worker-p94.mjs','0'.repeat(40)),e),/protected source drift/);
});
const conf=[
 'REMOTE_URL="https://github.com/WebKit/WebKit.git"',
 'BASE_BRANCH="main"',
 'BASE_REVISION="db897909f7c31d9b38793374c66427b6a4cb3dd3"',
 ''
].join('\n');
test('exact Playwright upstream WebKit BASE_REVISION is only an upstream baseline',()=>{
 const good=verifyUpstreamConfig(conf);
 assert.equal(good.upstreamWebKitCommit,official.upstreamCommit);
 assert.equal(good.upstreamBaselineOnly,true);
 assert.equal(good.patchedBinaryEquivalenceProven,false);
 for(const altered of [
  conf.replace(official.upstreamCommit,'0'.repeat(40)),
  conf.replace('main','release'),
  conf.replace('https://github.com/WebKit/WebKit.git','https://invalid.example/forged'),
  conf+'\nBASE_REVISION="0"\n'
 ])assert.throws(()=>verifyUpstreamConfig(altered),/M286 FAIL-CLOSED/);
});
function manifest(overrides={}){return {browsers:[
 {name:'chromium',revision:'1194',browserVersion:'141.0.7390.37'},
 {name:'webkit',revision:'2215',browserVersion:'26.0',revisionOverrides:{
  'ubuntu20.04-x64':'2092',...overrides}}
]};}
test('Playwright tag v1.56.1 pins WebKit revision 2215 but not base engine equivalence',()=>{
 const a=verifyBrowserManifest(manifest());
 assert.equal(a.linuxWebKitBrowserRevision,'2215');
 assert.equal(a.browserVersion,'26.0');
 assert.equal(a.upstreamSourceBuildExact,false);
 assert.equal(a.playwrightPatchAppliedBuild,true);
 for(const bad of [
  {...manifest(),browsers:[{name:'webkit',revision:'2200',browserVersion:'26.0'}]},
  {...manifest(),browsers:[{name:'webkit',revision:'2215',browserVersion:'26.1'}]},
  {...manifest(),browsers:[...manifest().browsers,...manifest().browsers.slice(1)]},
  manifest({'ubuntu24.04-x64':'2199'})
 ])assert.throws(()=>verifyBrowserManifest(bad),/M286 FAIL-CLOSED/);
});
test('reject fake/downstream bootstrap patch before claiming source/build identity',()=>{
 for(const bad of [Buffer.alloc(980815),Buffer.from('diff --git a b\n'),Buffer.alloc(0)])
  assert.throws(()=>verifyPatch(bad),/M286 FAIL-CLOSED/);
});
test('reject stale Playwright release tag or different WebKit baseline before symbol claims',()=>{
 const falseTag={ref:'refs/tags/v1.56.1',object:{sha:'0'.repeat(40),type:'commit'}};
 assert.throws(()=>verifyPublicProvenance({tag:falseTag}),/source tag/);
 const tag={...falseTag,object:{sha:official.playwrightCommit,type:'commit'}};
 assert.throws(()=>verifyPublicProvenance({tag,webkit:{sha:'0'.repeat(40)}}),/upstream commit/);
});
test('native ELF metadata parsed as scalar Build ID, not raw register PC',()=>{
 const r=readelfMetadata('GNU\n Build ID: 008877aabbCC012345\n','[12] .symtab SYMTAB\n[27] .debug_info PROGBITS');
 assert.deepEqual(r,{elfBuildId:'008877aabbcc012345',dwarfSectionPresent:true,symbolTablePresent:true});
 const stripped=readelfMetadata('no build id','[27] .dynsym DYNSYM');
 assert.equal(stripped.elfBuildId,null);
 assert.equal(stripped.dwarfSectionPresent,false);
 assert.equal(stripped.symbolTablePresent,false);
 assert.throws(()=>readelfMetadata('x'.repeat(100000),''),/unbounded/);
});
test('only pinned native WPE/JavaScriptCore libraries are accepted',()=>{
 assert.equal(classifyBinaryCandidate(official.webProcess,official.browserRoot),'WPE_CONTENT_PROCESS');
 assert.equal(classifyBinaryCandidate(official.browserRoot+'/lib/libJavaScriptCore.so.1',official.browserRoot),'JSC_ENGINE_LIBRARY');
 assert.equal(classifyBinaryCandidate(official.browserRoot+'/lib/libWPEWebKit.so.1',official.browserRoot),'WPE_WEBKIT_LIBRARY');
 assert.equal(classifyBinaryCandidate(official.browserRoot+'/lib/libWebKit.so',official.browserRoot),'WEBKIT_LIBRARY');
 assert.equal(classifyBinaryCandidate(official.browserRoot+'/lib/libc.so',official.browserRoot),null);
 assert.throws(()=>classifyBinaryCandidate('/tmp/foreign/libJavaScriptCore.so',official.browserRoot),/outside pinned/);
 assert.throws(()=>classifyBinaryCandidate(official.browserRoot+'/../other/libJavaScriptCore.so',official.browserRoot),/outside pinned/);
 const selected=selectInstalledCandidates([official.browserRoot+'/lib/libJavaScriptCore.so.1',official.browserRoot+'/junk.bin']);
 assert.equal(selected.length,2);
 assert.equal(selected[0].kind,'WPE_CONTENT_PROCESS');
 assert.equal(selected[1].kind,'JSC_ENGINE_LIBRARY');
 assert.throws(()=>selectInstalledCandidates(Array.from({length:8001},()=>official.webProcess)),/unbounded/);
});
test('upstream commit and Playwright patched-binary ownership are deliberately distinct',()=>{
 assert.equal(official.webkitRevision,'2215');
 assert.equal(official.webkitVersion,'26.0');
 assert.equal(official.upstreamCommit,'db897909f7c31d9b38793374c66427b6a4cb3dd3');
 assert.equal(official.patchLength,980815);
 assert.equal(official.patchGitBlob,'f713c6fa093a1f45956c84844d50635376923b75');
 assert.equal(official.pinnedWasmSHA256,'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39');
 assert.equal(originalRed.offset,null);
});
