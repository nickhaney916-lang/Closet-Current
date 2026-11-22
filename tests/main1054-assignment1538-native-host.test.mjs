import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import { hostPins, verifyHostInventory, inspectHost } from '../research/main1054/assignment1538-native-host.mjs';

const valid={
  webkitSourceCommit:hostPins.webkitSource,
  playwrightPatchGitBlob:hostPins.playwrightPatch,
  originalWorkerGitBlob:hostPins.originalWorkerGitBlob,
  playwrightVersion:hostPins.playwright,
  renderer:hostPins.renderer,webkitElf:hostPins.webkitElf,jscElf:hostPins.jscElf,
  originalModel:{sha256:hostPins.modelSha256,bytes:hostPins.originalModelBytes},
  originalJsep:{sha256:hostPins.jsepSha256,bytes:hostPins.originalJsepBytes},
};

test('accepting exact pinned host files never asserts native observation, approval or repair',()=>{
  const result=verifyHostInventory(valid);
  assert.equal(result.verdict,'PINNED_HOST_FILES_VERIFIED_ONLY');
  assert.equal(result.freshOriginalModelRedObserved,false);
  assert.equal(result.liveRendererIdentityVerified,false);
  assert.equal(result.observerAuthorizationVerified,false);
  assert.equal(result.nativeTrapPc,null);
  assert.equal(result.invalidEffectiveMemoryAccess,null);
  assert.equal(result.causalFixProven,false);
  assert.equal(result.releaseAllowed,false);
  assert.equal(result.familyAlpha,'HOLD');
});

for(const [name,change,reason] of [
  ['unknown engine checkout',{webkitSourceCommit:'f'.repeat(40)},/WEBKIT_SOURCE_MISMATCH/],
  ['upstream-only missing downstream patch',{playwrightPatchGitBlob: 'f'.repeat(40)},/PLAYWRIGHT_PATCH_MISMATCH/],
  ['different original Worker',{originalWorkerGitBlob:'f'.repeat(40)},/ORIGINAL_WORKER_MISMATCH/],
  ['different Playwright package',{playwrightVersion:'1.57.0'},/PLAYWRIGHT_VERSION_MISMATCH/],
  ['different WPE renderer',{renderer:{...hostPins.renderer,sha256:'f'.repeat(64)}},/RENDERER_BINARY_MISMATCH/],
  ['wrong WPE renderer build ID',{renderer:{...hostPins.renderer,buildId:'f'.repeat(40)}},/RENDERER_BINARY_MISMATCH/],
  ['changed WebKit binary',{webkitElf:{...hostPins.webkitElf,sha256:'f'.repeat(64)}},/WEBKITELF_BINARY_OR_BUILD_ID_MISMATCH/],
  ['wrong WPE WebKit build ID',{webkitElf:{...hostPins.webkitElf,buildId:'a'.repeat(40)}},/WEBKITELF_BINARY_OR_BUILD_ID_MISMATCH/],
  ['wrong JavaScriptCore build ID',{jscElf:{...hostPins.jscElf,buildId:'f'.repeat(40)}},/JSCELF_BINARY_OR_BUILD_ID_MISMATCH/],
  ['wrong original ONNX',{originalModel:{...valid.originalModel,sha256:'f'.repeat(64)}},/ORIGINAL_MODEL_MISMATCH/],
  ['truncated ONNX',{originalModel:{...valid.originalModel,bytes:15199745}},/ORIGINAL_MODEL_MISMATCH/],
  ['CPU-only substituted for JSEP',{originalJsep:{...valid.originalJsep,sha256:'f061472c6e77d6d50d079aacdc0ff9b63fee287ddd2cbf46cf62438d3891de2b'}},/ORIGINAL_JSEP_MISMATCH/],
  ['truncated JSEP',{originalJsep:{...valid.originalJsep,bytes:21596018}},/ORIGINAL_JSEP_MISMATCH/],
]) test(`rejects ${name}`,()=>assert.throws(()=>verifyHostInventory({...valid,...change}),reason));

test('requires complete, absolute operator paths, never substitutes a local guess',async()=>{
  await assert.rejects(inspectHost({}),/PATH_MANIFEST_INVALID/);
  await assert.rejects(inspectHost({webkitSourceDir:'/somewhere'}),/PATH_MANIFEST_INVALID/);
  assert.throws(()=>verifyHostInventory(null),/INVALID_INVENTORY/);
});

test('CLI without pinned local operator files fails closed and emits no fake receipt',()=>{
  const p=spawnSync(process.execPath,['research/main1054/assignment1538-native-host.mjs'],{encoding:'utf8'});
  assert.equal(p.status,1);
  assert.equal(p.stdout,'');
  assert.match(p.stderr,/^BLOCKED: USAGE_PREPARE_ONLY/);
  assert.doesNotMatch(p.stderr,/originalModelRedObserved:true|causalFixProven:true/);
});

test('scope pins are immutable published originals, no altered model or runtime',()=>{
  assert.equal(hostPins.modelSha256,'02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3');
  assert.equal(hostPins.jsepSha256,'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39');
  assert.equal(hostPins.webkitSource,'db897909f7c31d9b38793374c66427b6a4cb3dd3');
  assert.equal(hostPins.playwrightPatch,'f713c6fa093a1f45956c84844d50635376923b75');
});
