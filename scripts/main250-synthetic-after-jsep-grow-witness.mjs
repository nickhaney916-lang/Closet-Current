/**
 * M250 deliberately SYNTHETIC post-JSEP JS memory.grow failure harness.
 *
 * Only a disposable original-Worker-derived research copy is instrumented.
 * The original ONNX model, public WASM, photo, owner confirmations, private
 * wardrobe and production Worker are not changed. Throwing from JavaScript
 * does NOT reproduce or prove a real native/C++ WebKit allocator bug.
 */
import assert from 'node:assert/strict';
export const M250_JSEP_SHA='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const GROW_CALL="    const result=Reflect.apply(nativeGrow,this,args);";
export function injectM250SyntheticGrowFailure(originalM249Worker){
 assert.equal(typeof originalM249Worker,'string');
 assert.equal(originalM249Worker.split(GROW_CALL).length,2,
  'Original native grow pass-through changed or ambiguous');
 assert.ok(originalM249Worker.includes("device:'wasm',dtype:'fp32'"),
  'Actual pinned SegFormer CPU-WASM model changed');
 assert.ok(originalM249Worker.includes("m249ClassifyOriginal(error);m247Emit(requestId,'error');loader=null;throw error;"),
  'Original model-load failure must be rethrown and observed');
 // The subsequent JS-observed grows occur within genuine pinned JSEP session
 // initialization. Force an artificial JS exception BEFORE calling native
 // growth for all subsequent calls; ORT must not recover the synthetic failure.
 // m247Stats increments growCalls before this position, while its original
 // catch increments growErrors and rethrows; original model catch still RED.
 const inserted=[
  '    if(m247Stats.calls>=2){',
  "     throw new WebAssembly.RuntimeError('memory access out of bounds');",
  '    }',
  GROW_CALL
 ].join('\n');
 const output=originalM249Worker.replace(GROW_CALL,inserted);
 assert.ok(output.includes("if(m247Stats.calls>=2)"));
 assert.ok(output.includes('throw new WebAssembly.RuntimeError('));
 assert.ok(output.includes(GROW_CALL));
 // Absolutely no model-retry, implicit owner approval, synthetic logits,
 // memory-content capture or network replacement is permitted.
 assert.equal(output.split('const model=await AutoModelForSemanticSegmentation.from_pretrained').length,2);
 assert.equal(output.split("self.postMessage({type:'piece'").length,2);
 assert.equal(output.split("self.postMessage({type:'done'").length,2);
 return output;
}
export function verifyM250ControlledPostJsepReceipt(receipt){
 assert.equal(receipt?.schema,'M249_ORIGINAL_FAILED_JSEP_SAME_ATTEMPT/v1');
 assert.equal(receipt.engine,'webkit');
 assert.equal(receipt.controlledPublicOnnxAbort,false);
 assert.equal(receipt.realOriginalP94ModelAttemptFailed,true);
 assert.equal(receipt.originalTestFailedNonzero,true);
 assert.equal(receipt.directOriginalJsepBrowserBodySHAProven,true,
  'The SAME failed WebKit browser did not provide pinned actual JSEP bytes');
 assert.equal(receipt.actualPublicRuntimeIdentity,'DIRECT_SAME_ATTEMPT_JSEP_SHA');
 assert.equal(receipt.publicWasmResponseCount,1);
 assert.equal(receipt.publicWasmStatus,200);
 assert.equal(receipt.exactOneObservedException,true);
 assert.equal(receipt.modelExceptionName,'RuntimeError');
 assert.ok(['wasm_memory_access','network_abort','other'].includes(receipt.modelExceptionCategory),
  'Actual ORT RuntimeError category was not a bounded observed enum');
 // The original M249 heuristic matches /abort/ in a RuntimeError message.
 // A WebAssembly.RuntimeError may therefore be reported as network_abort.
 // Preserve the exact observed enum, but NEVER promote that word to proof
 // of a network failure or a native C++ memory bug.
 const originalSanitizedErrorCategory=receipt.modelExceptionCategory;
 assert.equal(receipt.originalHeapTerminalSeen,true);
 assert.ok(Number.isInteger(receipt.observedGrowCalls)&&receipt.observedGrowCalls>=2);
 assert.ok(Number.isInteger(receipt.observedGrowErrors)&&receipt.observedGrowErrors>=1);
 assert.ok(receipt.observedFirstPages>=256&&receipt.observedTerminalPages>=receipt.observedFirstPages);
 assert.equal(receipt.nativeCppAllocatorCauseProven,false);
 assert.equal(receipt.nativeMemoryAccessRootCauseProven,false);
 assert.equal(receipt.realRedToGreenFixProven,false);
 assert.equal(receipt.privatePhotoBytesLogged,false);
 assert.equal(receipt.releaseAuthorized,false);
 assert.equal(receipt.familyAlphaHold,true);
 return {
  schema:'M250_SYNTHETIC_POST_JSEP_GROW_REDACTION/v1',
  originalJsepDirectlyHashedInSameFailingWebkitBrowser:true,
  syntheticJavascriptGrowThrowVerified:true,
  originalReportedErrorCategory:originalSanitizedErrorCategory,
  errorClassification:'SYNTHETIC_JAVASCRIPT_GROW_WITH_WRAPPED_RUNTIME_ERROR',
  actualNetworkAbortCauseProven:false,
  actualOriginalModelStillFailed:true,
  syntheticFaultIsNaturalWebkitBug:false,
  nativeCppAllocatorCauseProven:false,realRedToGreenFixProven:false,
  originalPrivacyAndNoAutoSaveAssertionsUnmodified:true,
  releaseAuthorized:false,familyAlphaHold:true
 };
}
