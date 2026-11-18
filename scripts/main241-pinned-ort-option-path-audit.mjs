/**
 * M241: pinned, read-only ONNX Runtime option-path audit. This deliberately
 * does NOT claim that source-text markers prove a native ORT allocator
 * setting or fix a genuine WebKit model-session fault.
 *
 * Intended for the isolated no-deploy CI runner after installing exact
 * @huggingface/transformers@3.8.1 and ORT web 1.22.0-dev.20250409-89f8206ba4.
 */
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

export const REQUIRED_TRANSFORMERS='3.8.1';
export const REQUIRED_ORT='1.22.0-dev.20250409-89f8206ba4';
export const EXPECTED_ORT_INTEGRITY='sha512-0uS76OPgH0hWCPrFKlL8kYVV7ckM7t/36HfbgoFw6Nd0CZVVbQC4PkrR8mBX8LtNUFZO25IQBqV2Hx2ho3FlbQ==';
export const SOURCE_P94_BLOB='d66651b616de54c51eb7ef986324b30f1580888f';
export const SOURCE_P101_BLOB='ad8ab0eb33322a34f8cc3f45a1fe26feff87b2ab';
const gitBlob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const sha256=b=>createHash('sha256').update(b).digest('hex');

export function classifyForwardingEvidence({declaredAPI=false,hasNativeSetterName=false,
                                         observedNativeCall=false,observedNativeSetting=false}={}){
 // The only truthful "proven" state needs an actual pinned native-session
 // observation, not a JS API declaration, text search, library version,
 // synthetic export, or a successful original browser positive.
 if(observedNativeCall&&observedNativeSetting)return 'native-setting-observed';
 if(observedNativeCall)return 'native-call-observed-setting-unverified';
 if(declaredAPI||hasNativeSetterName)return 'static-API-only-native-unverified';
 return 'no-source-evidence-native-unverified';
}

const current=fileURLToPath(import.meta.url);
const root=resolve(current,'../../..');
const readJson=async p=>JSON.parse(await readFile(p,'utf8'));

export async function auditPinnedOptionPath(repositoryRoot=process.cwd()){
 const r=resolve(repositoryRoot);
 const worker=await readFile(join(r,'public/outfit-worker-p94.mjs'));
 const p101=await readFile(join(r,'scripts/test-parallel101-real-p94-model-init-stage-browser.mjs'));
 assert.equal(gitBlob(worker),SOURCE_P94_BLOB,'Original deployed P94 Worker modified');
 assert.equal(gitBlob(p101),SOURCE_P101_BLOB,'Source-pinned real P101 model test moved');
 const tr=await readJson(join(r,'node_modules/@huggingface/transformers/package.json'));
 assert.equal(tr.version,REQUIRED_TRANSFORMERS,'Transformers.js package drift');
 const candidateDirs=[
  join(r,'node_modules/@huggingface/transformers/node_modules/onnxruntime-web'),
  join(r,'node_modules/onnxruntime-web')
 ];
 const installed=[];
 for(const dir of candidateDirs){
  try{ const pkg=await readJson(join(dir,'package.json'));
   installed.push({dir,pkg});
  }catch(err){if(err.code!=='ENOENT')throw err;}
 }
 assert.ok(installed.length>0,'No installed pinned ORT package to audit');
 for(const found of installed)assert.equal(found.pkg.version,REQUIRED_ORT,'ORT Web package version mismatch');
 // This is source/package audit ONLY. Installed worker uses pinned CDN
 // Transformers and ORT; presence of npm package alone does not prove that
 // WebKit loaded the same bytes. That is a separate native network receipt.
 const reports=[];
 for(const {dir,pkg} of installed){
  const dist=join(dir,'dist');
  let names=[];
  try{names=(await readdir(dist)).filter(n=>/^ort\..*\.mjs$/.test(n)).sort();}
  catch(err){if(err.code!=='ENOENT')throw err;}
  assert.ok(names.length>0,'Pinned ORT dist ESM family absent');
  for(const name of names){
   const bytes=await readFile(join(dist,name));
   const code=bytes.toString('utf8');
   const marked=(needle)=>code.includes(needle);
   reports.push({
    file:relative(r,join(dist,name)),
    sha256:sha256(bytes),
    bytes:bytes.length,
    hasEnableMemPatternToken:marked('enableMemPattern'),
    hasNativeDisableName:marked('OrtDisableMemPattern')||marked('_OrtDisableMemPattern'),
    hasNativeEnableName:marked('OrtEnableMemPattern')||marked('_OrtEnableMemPattern'),
    // Structural presence is not proof a bool makes it into the native
    // option handle used by THIS model. We do not infer that.
    optionToNativeObserved:false
   });
  }
 }
 const markerSummary={
  packageVersion:REQUIRED_ORT,
  transformersVersion:REQUIRED_TRANSFORMERS,
  packageLicense:installed[0].pkg.license||'unknown',
  manifestDependency:tr.dependencies?.['onnxruntime-web']||null,
  fileCount:reports.length,
  declaredAPI:reports.some(x=>x.hasEnableMemPatternToken),
  hasNativeSetterName:reports.some(x=>x.hasNativeDisableName||x.hasNativeEnableName),
  nativeSettingObserved:false,
  forwardingEvidence:classifyForwardingEvidence({
   declaredAPI:reports.some(x=>x.hasEnableMemPatternToken),
   hasNativeSetterName:reports.some(x=>x.hasNativeDisableName||x.hasNativeEnableName)
  }),
  metadataOnly:true,modelOriginal:true,installedProductUnmodified:true,
  releaseAuthorized:false,familyAlphaHold:true
 };
 return {summary:markerSummary,files:reports};
}

if(process.argv[1]&&resolve(process.argv[1])===current){
 const result=await auditPinnedOptionPath(process.cwd());
 console.log('M241_PINNED_ORT_OPTION_PATH_AUDIT',JSON.stringify(result));
 assert.equal(result.summary.nativeSettingObserved,false,
  'Static API evidence must not be called native allocator proof');
}
