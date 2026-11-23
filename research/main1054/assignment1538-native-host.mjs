/**
 * Mission 4 / #1538: read-only exact-asset preflight for an independently
 * authorized native observer host. No debugger, ptrace, browser or model is
 * started by this tool. A PASS is NOT an original-model failure receipt.
 *
 * Usage: node assignment1538-native-host.mjs --preflight host-paths.json
 * Paths stay local: never write or publish the config or raw diagnostics.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { pinned } from './assignment1538-correlate.mjs';

export const hostPins = Object.freeze({
  ...pinned,
  originalModelBytes: 15_199_746,
  originalJsepBytes: 21_596_019,
  originalWorkerGitBlob: 'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
  renderer: Object.freeze({sha256:'b46f88603e43eca28083389188944f7f47fd26311c8697a14f910e4f8bfa0d66',buildId:'23a6254355e0ab6aa4f3672cc51bd9eb487522a7'}),
  webkitElf: Object.freeze({sha256:'daa10258a2161710c7c1d6a3e3f7abe0a100a6f269c00f5843dcd0f7df46ec29',buildId:'8faf9134c0557d2d09f3d680f9c8b780498cf59b'}),
  jscElf: Object.freeze({sha256:'73f32b17f002381abadb8cec18cdec85fb17ace1077f993f448e3024b3014f8b',buildId:'e04d2e784f16edeb1612cc24cd180e328c4b3e56'}),
});
const requiredPaths = Object.freeze([
  'webkitSourceDir','playwrightPatchFile','appRepoDir','playwrightPackageJson',
  'rendererElf','webkitElf','jscElf','originalModelOnnx','originalJsepWasm',
]);
function check(test, name) { if (!test) throw new Error(name); }

// Pure admission logic: testable without any native host or original weights.
export function verifyHostInventory(i) {
  check(i && typeof i==='object', 'INVALID_INVENTORY');
  check(i.webkitSourceCommit === hostPins.webkitSource, 'WEBKIT_SOURCE_MISMATCH');
  check(i.playwrightPatchGitBlob === hostPins.playwrightPatch, 'PLAYWRIGHT_PATCH_MISMATCH');
  check(i.originalWorkerGitBlob === hostPins.originalWorkerGitBlob, 'ORIGINAL_WORKER_MISMATCH');
  check(i.playwrightVersion === hostPins.playwright, 'PLAYWRIGHT_VERSION_MISMATCH');
  check(i.renderer?.sha256 === hostPins.renderer.sha256 &&
    i.renderer?.buildId === hostPins.renderer.buildId, 'RENDERER_BINARY_MISMATCH');
  for (const key of ['webkitElf','jscElf']) {
    check(i[key]?.sha256 === hostPins[key].sha256 &&
      i[key]?.buildId === hostPins[key].buildId, `${key.toUpperCase()}_BINARY_OR_BUILD_ID_MISMATCH`);
  }
  check(i.originalModel?.sha256 === hostPins.modelSha256 &&
    i.originalModel?.bytes === hostPins.originalModelBytes, 'ORIGINAL_MODEL_MISMATCH');
  check(i.originalJsep?.sha256 === hostPins.jsepSha256 &&
    i.originalJsep?.bytes === hostPins.originalJsepBytes, 'ORIGINAL_JSEP_MISMATCH');
  return Object.freeze({
    verdict: 'PINNED_HOST_FILES_VERIFIED_ONLY',
    sourceAndPatchPinned: true,
    originalWorkerPinned: true,
    originalModelAndJsepPinned: true,
    originalWebkitAndJscElfsPinned: true,
    liveRendererIdentityVerified: false,
    observerAuthorizationVerified: false,
    freshOriginalModelRedObserved: false,
    nativeTrapPc: null,
    wasmFileOffset: null,
    invalidEffectiveMemoryAccess: null,
    causalFixProven: false,
    releaseAllowed: false,
    familyAlpha: 'HOLD',
  });
}

function command(binary, args, cwd) {
  const r = spawnSync(binary, args, { cwd, encoding:'utf8', timeout:10_000, maxBuffer:32_768,
    shell:false, env:{PATH:process.env.PATH||'/usr/bin:/bin',LANG:'C'} });
  check(!r.error && r.status===0, 'HOST_TOOL_UNAVAILABLE_OR_FAILED');
  return r.stdout.trim();
}

async function checkedFile(path, max) {
  check(typeof path==='string' && path.startsWith('/') && path.length<4096, 'INVALID_LOCAL_PATH');
  const s = await lstat(path);
  check(s.isFile() && !s.isSymbolicLink() && s.size>0 && s.size<=max,
    'FILE_TYPE_OR_SIZE_INVALID');
  // Parent symlinks are resolved; never accept streams, directories or devices.
  check((await realpath(path)).startsWith('/'), 'FILE_REALPATH_INVALID');
  return s;
}
async function hash(path,max) {
  const st = await checkedFile(path,max);
  const h=createHash('sha256');
  let seen=0;
  for await (const b of createReadStream(path)) {
    seen+=b.length;
    check(seen<=max, 'FILE_SIZE_CHANGED');
    h.update(b);
  }
  check(seen===st.size, 'FILE_CHANGED_DURING_HASH');
  return {sha256:h.digest('hex'),bytes:seen};
}
async function elf(path) {
  const identity=await hash(path,1_000_000_000);
  const note=command('readelf',['-n',path]);
  const ids=[...note.matchAll(/Build ID:\s*([0-9a-f]{8,64})/gi)].map(m=>m[1].toLowerCase());
  check(ids.length===1, 'ELF_BUILD_ID_UNVERIFIED');
  return {...identity,buildId:ids[0]};
}
async function packageVersion(path) {
  await checkedFile(path,65_536);
  const json=JSON.parse(await readFile(path,'utf8'));
  check(json?.name==='playwright' && typeof json.version==='string', 'PLAYWRIGHT_PACKAGE_UNVERIFIED');
  return json.version;
}
function git(...args) { return command('git',args); }

/** Reads the actual local original artifacts. No supplied receipt may self-attest. */
export async function inspectHost(config) {
  check(config && typeof config==='object' && !Array.isArray(config) &&
    Object.keys(config).length===requiredPaths.length &&
    requiredPaths.every(k=>typeof config[k]==='string' && config[k].startsWith('/')),
  'PATH_MANIFEST_INVALID');
  const source=git('-C',config.webkitSourceDir,'rev-parse','HEAD');
  const patch=git('hash-object','--',config.playwrightPatchFile);
  const worker=git('-C',config.appRepoDir,'rev-parse','HEAD:public/outfit-worker-p94.mjs');
  const [renderer,webkitElf,jscElf,originalModel,originalJsep,playwrightVersion]=await Promise.all([
    elf(config.rendererElf),elf(config.webkitElf),elf(config.jscElf),
    hash(config.originalModelOnnx,50_000_000),hash(config.originalJsepWasm,50_000_000),
    packageVersion(config.playwrightPackageJson),
  ]);
  // Neither Git commit nor artifact hashes alone prove the binary was built
  // from this source. Exact build provenance is a separate operator receipt.
  return {webkitSourceCommit:source,playwrightPatchGitBlob:patch,
    originalWorkerGitBlob:worker,playwrightVersion,renderer,webkitElf,jscElf,
    originalModel,originalJsep};
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {
    check(process.argv.length===4 && process.argv[2]==='--preflight', 'USAGE_PREPARE_ONLY');
    await checkedFile(process.argv[3],8_192);
    const paths=JSON.parse(await readFile(process.argv[3],'utf8'));
    const report=verifyHostInventory(await inspectHost(paths));
    console.log(JSON.stringify(report));
  } catch(e) {
    // Only controlled error codes. Never expose paths, model data, stderr or PID.
    const code=/^[A-Z][A-Z0-9_]+$/.test(e?.message||'')?e.message:'HOST_PREFLIGHT_INCOMPLETE';
    console.error(`BLOCKED: ${code}`);
    process.exitCode=1;
  }
}
