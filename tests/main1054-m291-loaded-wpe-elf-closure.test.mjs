import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {source,expected} from '../research/main1054/m290-live-native-elf-identity.mjs';
import {
  parent,branch,additions,sourceGate,approvedPinnedRelative,
  mappedPinnedRelativePaths,readElfMetadata,adjudicate
} from '../research/main1054/m291-loaded-wpe-elf-closure.mjs';
const sha='a'.repeat(40);
const event={name:'push',ref:branch,sha,attempt:'1'};
const protectedBlobs={
 'research/main1054/m290-live-native-elf-identity.mjs':'5d395b06ad76750d1d0a709daab9cfd49e88cc6e',
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/m286-pinned-webkit-source-binary-provenance.mjs':'13874630185f165d9725e2ea4b7579ab4050fa53',
 'research/main1054/m279-original-model-pointer-bounds.mjs':'f2fd27553cc6854997480ee586cb8e191e9aca11'
};
function git(cmd,...args){
 if(cmd==='rev-parse'){
  if(args[0]==='HEAD')return sha;
  return protectedBlobs[args[0].slice(sha.length+1)]||'untrusted';
 }
 if(cmd==='merge-base')return '';
 if(cmd==='diff-tree')return additions.map(p=>'A\u0000'+p+'\u0000').join('');
 if(cmd==='ls-tree')return '100644 blob '+'b'.repeat(40);
 throw Error('unrecognized synthetic git command');
}
const mutate=(test,value)=>(...args)=>test(...args)?value:git(...args);
const map=(path,n=1)=>'7f0000-7f1000 r-xp 00000000 08:01 '+n+' '+path;
const first=expected.find(x=>x.name==='WPEWebProcess');
const second=expected.find(x=>x.name==='libWPEWebKit-2.0.so.1.7.0');
const native=(relative,expectedRow)=>({
 relative,sha256:expectedRow.sha256,buildId:expectedRow.buildId,
 sizeBytes:1100000,format:'ELF'
});
const valid={
 schema:'M291_PINNED_WPE_ALL_MAPPED_ELF_SHA_V1',
 playwright:source.playwright,webkit:source.webkit,browserRevision:source.browserRevision,
 webkitUpstream:source.webkitUpstream,playwrightPatchGitBlob:source.playwrightPatchGitBlob,
 localOnly:true,ownedBrowserAncestry:true,rendererRecheckedAfterMaps:true,
 mapped:[
  native('minibrowser-wpe/bin/WPEWebProcess',first),
  native('minibrowser-wpe/lib/libWPEWebKit-2.0.so.1.7.0',second)
 ],
 originalModelExecuted:false,historicalOriginalFailureInspected:false,
 actualTrapInstructionOffset:null,cxxFaultLocation:null,causalNativeFixProven:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
};
test('M291 is a new no-deploy additive branch frozen atop completed M290',()=>{
 assert.equal(parent,'356a7782abdd965a1250a74b1dddb738e5abf290');
 assert.deepEqual(sourceGate(git,event),{
  originalSourceUnchanged:true,actualOriginalTrapPC:null,causalRepair:false,familyAlpha:'HOLD'
 });
 assert.equal(additions.length,3);
});
test('reject reruns, foreign events, revisions, modified originals and symlink files',()=>{
 for(const delta of [{attempt:'2'},{name:'pull_request_target'},
  {ref:'refs/heads/main'},{sha:'0'.repeat(40)}])
  assert.throws(()=>sourceGate(git,{...event,...delta}),/M291 FAIL-CLOSED/);
 assert.throws(()=>sourceGate(mutate(cmd=>cmd==='merge-base','bad'),event),/lineage/);
 assert.throws(()=>sourceGate(mutate(cmd=>cmd==='diff-tree','M\u0000public/outfit-worker-p94.mjs\u0000'),event),/source changes/);
 assert.throws(()=>sourceGate(mutate(cmd=>cmd==='ls-tree','120000 blob bad'),event),/non-symlink/);
 assert.throws(()=>sourceGate(mutate((cmd,arg)=>cmd==='rev-parse'&&
  arg===sha+':public/outfit-worker-p94.mjs','0'.repeat(40)),event),/protected/);
});
test('relative paths are strictly original pinned browser root only',()=>{
 const allowed='minibrowser-wpe/bin/WPEWebProcess';
 assert.equal(approvedPinnedRelative(source.root+'/'+allowed),allowed);
 for(const p of ['/tmp/credentials','/ms-playwright/other/WPEWebProcess',
   source.root+'/../secret',source.root+'//bad',
   source.root+'/dir/name (deleted)',source.root+'/dir/space file'])
  assert.equal(approvedPinnedRelative(p),null);
});
test('parse only unique native paths; never return address, inode or external filename',()=>{
 const maps=[
  map(source.wpe,123),
  map(source.wpe,124),
  map(source.root+'/minibrowser-wpe/lib/libWPEWebKit-2.0.so.1.7.0',125),
  map('/tmp/credential.txt',126),
  map('[heap]',127)
 ].join('\n');
 const files=mappedPinnedRelativePaths(maps);
 assert.equal(files.length,2);
 assert.ok(files.includes('minibrowser-wpe/bin/WPEWebProcess'));
 assert.ok(files.includes('minibrowser-wpe/lib/libWPEWebKit-2.0.so.1.7.0'));
 assert.ok(!JSON.stringify(files).includes('credential'));
 assert.ok(!JSON.stringify(files).includes('7f0000'));
 assert.throws(()=>mappedPinnedRelativePaths('x'.repeat(2000000)),/M291 FAIL-CLOSED/);
});
test('file identity cannot be promoted from a non-ELF or malicious data',()=>{
 const dir=mkdtempSync(join(tmpdir(),'m291-'));
 try{
  const path=join(dir,'not-elf');
  writeFileSync(path,'ordinary local-only test bytes');
  assert.deepEqual(readElfMetadata(path),{format:'NON_ELF',buildId:null});
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('independently verifies known original mapped WPE executable and WPE library',()=>{
 assert.deepEqual(adjudicate(valid),valid);
 assert.throws(()=>adjudicate({...valid,mapped:valid.mapped.slice(0,1)}),/missing known/);
 assert.throws(()=>adjudicate({...valid,mapped:[
  valid.mapped[0],{...valid.mapped[1],sha256:'0'.repeat(64)}]}),/missing known/);
 assert.throws(()=>adjudicate({...valid,mapped:[
  {...valid.mapped[0],buildId:null},valid.mapped[1]]}),/missing known/);
 assert.throws(()=>adjudicate({...valid,mapped:[
  {...valid.mapped[0],format:'NON_ELF'},valid.mapped[1]]}),/missing known/);
});
test('one additional installed ELF is independently reported, not a root-cause guess',()=>{
 const proof={...valid,mapped:[...valid.mapped,{
  relative:'minibrowser-wpe/lib/libFreshNativeSource.so',
  sha256:'b'.repeat(64),sizeBytes:8000,format:'ELF',buildId:null
 }]};
 assert.deepEqual(adjudicate(proof),proof);
 assert.equal(proof.actualTrapInstructionOffset,null);
 assert.equal(proof.causalNativeFixProven,false);
});
test('reject fake original failure/root-cause/release and unauthenticated WPE',()=>{
 for(const change of [
  {originalModelExecuted:true},{historicalOriginalFailureInspected:true},
  {actualTrapInstructionOffset:7022509},{cxxFaultLocation:'a native cause'},
  {causalNativeFixProven:true},{releaseAuthorized:true},{familyAlpha:'GO'},
  {localOnly:false},{ownedBrowserAncestry:false},
  {rendererRecheckedAfterMaps:false},{webkit:'26.1'}
 ])assert.throws(()=>adjudicate({...valid,...change}),/M291 FAIL-CLOSED/);
});
test('reject duplicates, external path attempts and unbounded reported content',()=>{
 const withExtra=(x)=>({...valid,mapped:[...valid.mapped,x]});
 assert.throws(()=>adjudicate(withExtra(valid.mapped[0])),/duplicated/);
 assert.throws(()=>adjudicate(withExtra({
  relative:'../../etc/shadow',sha256:'b'.repeat(64),
  sizeBytes:4,format:'ELF',buildId:null
 })),/unsafe/);
 assert.throws(()=>adjudicate(withExtra({
  relative:'minibrowser-wpe/lib/libSource.so',sha256:'b'.repeat(64),
  sizeBytes:4,format:'ELF',buildId:'a b'
 })),/unsafe/);
});
