/**
 * P102 research-only exact-version transformers WEB bundle bound to same-build
 * onnxruntime-web/wasm (not its default JSEP export).
 * Runs only in no-deploy tests; never writes public/, model weights or app code.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {build} from 'esbuild';

const version='1.22.0-dev.20250409-89f8206ba4';
const packageJson=JSON.parse(await readFile('node_modules/onnxruntime-web/package.json','utf8'));
const hf=JSON.parse(await readFile('node_modules/@huggingface/transformers/package.json','utf8'));
assert.equal(packageJson.version,version);
assert.equal(hf.version,'3.8.1');
assert.equal(hf.dependencies['onnxruntime-web'],version,
 'transformers must depend on exactly the CPU runtime tested');
const target='research/.parallel102-wasm-only-transformers.mjs';
await mkdir('research',{recursive:true});
const out=await build({
 entryPoints:['node_modules/@huggingface/transformers/dist/transformers.web.js'],
 outfile:target,
 bundle:true,
 format:'esm',
 platform:'browser',
 target:'es2022',
 alias:{'onnxruntime-web':'onnxruntime-web/wasm'},
 metafile:true,
 legalComments:'none',
 logLevel:'warning',
 write:true
});
const inputs=Object.keys(out.metafile.inputs);
const ortInputs=inputs.filter(x=>x.includes('onnxruntime-web'));
assert.ok(ortInputs.length>0,'CPU-only ORT dependency missing');
const exportedCpuEntries=ortInputs.filter(x=>/(?:^|\/)ort\.wasm(?:\.min)?\.mjs$/.test(x));
console.log('P102_CPU_BUNDLE_ORT_INPUT_NAMES',
 JSON.stringify(ortInputs.slice(0,16).map(x=>x.split('/').at(-1))));
assert.equal(exportedCpuEntries.length,1,
 'Expected exactly one exported WASM-only ONNX runtime ESM entrypoint');
assert.ok(ortInputs.every(x=>!/(?:ort\.all|ort\.webgpu|ort\.min\.mjs)/.test(x)),
 'Default/JSEP runtime appears in CPU-only bundle');
const bytes=await readFile(resolve(target));
assert.ok(bytes.length>100000,'Model runtime bundle unexpectedly small');
const hash=createHash('sha256').update(bytes).digest('hex');
const bundleEvidence={
 schema:'P102_CPU_SOURCE_BUNDLE/v1',
 transformers: hf.version,
 ort:packageJson.version,
 selectedORT:'onnxruntime-web/wasm',
 cpuEntryIncluded:true,
 cpuEntryFilename:exportedCpuEntries[0].split('/').at(-1),
 bundledBytes:bytes.length,
 bundleSHA256:hash,
 observedInputCount:inputs.length,
 noProductOrModelFileModified:true,
};
await writeFile('research/.parallel102-cpu-bundle-manifest.json',
 JSON.stringify(bundleEvidence,null,2)+'\n');
console.log('P102_CPU_BUNDLE_PROVENANCE',JSON.stringify(bundleEvidence));
