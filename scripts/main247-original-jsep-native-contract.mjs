/**
 * M247 isolated, same-original-SegFormer graph in pinned JSEP-capable ORT ESM.
 * The original P94 Worker still uses its published CDN runtime, untouched.
 * No inference/owner acceptance and no WebKit remediation can be inferred.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {instrumentOriginalGraphSession} from './main243-original-segformer-native-abi.mjs';
import {PINNED_ORT,ORIGINAL_WORKER_GIT_BLOB} from './main242-ort-session-abi-trace.mjs';
import {P94_JSEP,PINNED_LOCAL_NON_JSEP} from './main246-local-ort-wasm-identity.mjs';

const sha256=b=>createHash('sha256').update(b).digest('hex');
const gitBlob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
export const JSEP_SOURCE='ort.webgpu.mjs';
export const JSEP_WASM='ort-wasm-simd-threaded.jsep.wasm';
export function attestJsepOriginalGraph({engine,arm,model,identity,session,esmSha256}){
 assert.ok(['chromium','webkit'].includes(engine),'Genuine engine required');
 assert.ok(['baseline','pattern_off'].includes(arm),'Single option A/B only');
 assert.match(esmSha256||'',/^[a-f0-9]{64}$/,'JSEP entry SHA unavailable');
 assert.equal(model?.sha256,'02e6f1545475bc549184b6710487555b4e70b08354cc3a480fb4fab1473a9d3'.replace('4e70','4ab'), 'Pinned original ONNX source SHA changed');
 assert.equal(model?.bytes,15199746,'Original ONNX model changed');
 assert.ok(identity&&identity.localRuntimeName===JSEP_WASM,'Original JSEP asset not actually served');
 assert.equal(identity.localRuntimeSha256,P94_JSEP,'JSEP bytes differ from original P94 Worker');
 assert.equal(identity.actualBrowserResponseBodyShaVerified,true,'No verified actual browser WASM bytes');
 assert.equal(identity.matchesP94OriginalWebkitJsepBinary,true);
 assert.equal(identity.installedOriginalPinnedBinaryExactMatch,true);
 assert.equal(session?.success,true,'Original model native session genuinely RED');
 assert.equal(session?.nativeCalls?.length,1,'Real native session export missing');
 assert.equal(session.nativeCalls[0].actualNativeExportCalled,true);
 assert.equal(session.nativeCalls[0].returnedHandle,true);
 assert.equal(session.apiCalls?.length,1,'Native options call missing');
 assert.equal(session.apiCalls[0].memPatternFlag,arm!=='pattern_off');
 assert.equal(session.apiCalls[0].arenaFlag,true);
 assert.notEqual(P94_JSEP,PINNED_LOCAL_NON_JSEP,'JSEP/non-JSEP identity conflated');
 return {schema:'M247_ORIGINAL_SEGFORMER_JSEP_NATIVE/v1',engine,arm,
  pinnedOriginalGraph:true,verifiedRealModelSession:true,
  runtimeBinarySameAsOriginalWebkitP94:true,sourceESMSha256:esmSha256,
  originalGraphSha256:model.sha256,originalGraphBytes:model.bytes,
  runtimeSha256:identity.localRuntimeSha256,
  originalOwnerWorkerNotExercised:true,
  originalFailureReproduced:false,permanentWebkitRepairProven:false,
  authenticatedCloudChecked:false,physicalPhoneChecked:false,
  releaseAuthorized:false,familyAlphaHold:true};
}
export async function auditOriginalJsep(root=process.cwd()){
 const base=join(root,'node_modules/onnxruntime-web');
 const [pkg,bytes,worker]=await Promise.all([
  readFile(join(base,'package.json'),'utf8'),
  readFile(join(base,'dist',JSEP_SOURCE)),
  readFile(join(root,'public/outfit-worker-p94.mjs'))]);
 assert.equal(JSON.parse(pkg).version,PINNED_ORT,'Published ORT package version drift');
 assert.equal(gitBlob(worker),ORIGINAL_WORKER_GIT_BLOB,'Original consumer Worker changed');
 const source=bytes.toString('utf8'),digest=sha256(bytes);
 assert.ok(bytes.length>100000,'JSEP-capable published ESM missing/truncated');
 const derived=instrumentOriginalGraphSession(source,digest);
 assert.equal(derived.audit.originalP94WorkerUnmodified,true);
 return {source:{sha256:digest,bytes:bytes.length,name:JSEP_SOURCE},
   derived:{...derived,audit:{...derived.audit,CAllocatorStateObserved:false}}};
}
