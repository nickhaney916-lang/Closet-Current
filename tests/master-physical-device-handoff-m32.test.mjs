// M32 purely synthetic browser-receipt adversarial tests; no physical device.
import test from 'node:test';
import assert from 'node:assert/strict';
import {auditLocalDeviceHandoff32} from '../research/master-consolidation-1054/physical-device-evidence-gate-m32.mjs';
const commit='a'.repeat(40),ids=['commons-0035','commons-0062','commons-0078','commons-0059'];
const sourceHashes=Object.fromEntries(ids.map((id,i)=>[id,String(i+1).repeat(64)]));
function fixture({count=16,abort=true}={}){
 const rows=Array.from({length:count},(_,i)=>({
  caseId:'photo-'+String(i+1).padStart(2,'0'),
  sourceId:ids[i%4],sourceSHA256:sourceHashes[ids[i%4]],
  observedSourceSHA256:sourceHashes[ids[i%4]],result:'COMPLETE_UNSAVED',
  bothModelsCompleted:true,ownerConsent:true,manualOwnerApprovalRequired:true,
  automaticAdmissions:0,privateWrites:0,unchangedSource:true,
  workerTerminatedIndependentlyVerified:false,modelMs:5000,elapsedMs:5800,
  ownerDecision:'abstain',ownerSuggestionCount:0,memoryRSSVerified:false
 }));
 if(abort)for(const [name,id] of [
  ['onnx-invoked-cancel',ids[0]],
  ['onnx-invoked-session-lock',ids[1]]
 ])rows.push({
  caseId:name,sourceId:id,sourceSHA256:sourceHashes[id],
  observedSourceSHA256:sourceHashes[id],result:'ONNX_INVOKED_ABORT_NO_RESULT',
  onnxRunInvocationObserved:true,workerTerminatedIndependentlyVerified:false,
  completedInferenceCredited:false,kernelExecutionAtCancelProven:false,
  manualOwnerApprovalRequired:true,automaticAdmissions:0,privateWrites:0,
  unchangedSource:true,elapsedMs:10000,memoryRSSVerified:false
 });
 const receipt={
  schema:'main1054-physical-device-handoff-m32-receipt-v1',
  sourceCommit:commit,manifestSchema:'main1054-physical-device-handoff-m32-v1',
  observedPlatform:'ANDROID_CHROME_RESEARCH_UNVERIFIED',
  viewportWidth:412,pixelRatio:2.625,touchPoints:5,
  observedBrowserErrors:0,observedUnhandledRejections:0,
  selectedPhotoSources:ids.map(id=>({id,sha256:sourceHashes[id]})),
  rows,hardwareVerified:false,operatorAttestationNotIndependentProof:true,
  phoneProcessMemoryVerified:false,cloudOrPrivateWardrobeTested:false,
  independentHumanLabelsVerified:false,blindAccuracy:null,
  releaseAuthorized:false,familyAlpha:'HOLD',
  caution:'Operator-run browser results require external physical device, screenshot/video, source-commit and identity verification. Local receipt is not device acceptance.'
 };
 return {receipt,expected:{commit,sourceHashes}};
}
test('complete synthetic 16+two cancellation cases can ONLY request external review',()=>{
 const {receipt,expected}=fixture();
 const a=auditLocalDeviceHandoff32(receipt,expected);
 assert.equal(a.status,'LOCAL_16_PLUS_CANCEL_LOCK_RECEIPT_REQUIRES_EXTERNAL_HARDWARE_REVIEW');
 assert.equal(a.independentlyVerifiedPhysicalRuns,0);
 assert.equal(a.releaseAuthorized,false);
 assert.equal(a.phoneRSSBytes,null);
});
test('incomplete four-photo research browser checks cannot count as physical acceptance',()=>{
 const {receipt,expected}=fixture({count:4,abort:false});
 const a=auditLocalDeviceHandoff32(receipt,expected);
 assert.equal(a.status,'INCOMPLETE_PHYSICAL_DEVICE_ACCEPTANCE');
 assert.equal(a.hardwareVerified,false);
});
const mutations={
 'fake physical hardware':r=>r.hardwareVerified=true,
 'fake phone RSS':r=>r.phoneProcessMemoryVerified=true,
 'fake private cloud':r=>r.cloudOrPrivateWardrobeTested=true,
 'fake human label accuracy':r=>r.blindAccuracy=1,
 'fake independent humans':r=>r.independentHumanLabelsVerified=true,
 'fake release status':r=>r.releaseAuthorized=true,
 'family hold removed':r=>r.familyAlpha='READY',
 'operator pretends independent':r=>r.operatorAttestationNotIndependentProof=false,
 'malicious customer photo data':r=>r.customerImage='data:image/jpeg;base64,PRIVATE',
 'private owner identity added':r=>r.rows[0].ownerId='private-owner-123',
 'source URL injected':r=>r.rows[0].privateUrl='https://user.example/secret',
 'unverified photo':r=>r.rows[0].sourceSHA256='e'.repeat(64),
 'photo changed after native inference':r=>r.rows[1].observedSourceSHA256='e'.repeat(64),
 'wrong runtime source commit':r=>r.sourceCommit='f'.repeat(40),
 'untrusted frozen manifest':r=>r.selectedPhotoSources[1].sha256='a'.repeat(64),
 'unapproved garment save':r=>r.rows[1].automaticAdmissions=1,
 'private wardrobe write':r=>r.rows[3].privateWrites=1,
 'owner consent absent':r=>r.rows[3].ownerConsent=false,
 'forgot owner review':r=>r.rows[9].manualOwnerApprovalRequired=false,
 'one missing model':r=>r.rows[2].bothModelsCompleted=false,
 'fake phone memory on row':r=>r.rows[5].memoryRSSVerified=true,
 'fake independently verified terminated worker':r=>r.rows[7].workerTerminatedIndependentlyVerified=true,
 'model time impossible':r=>r.rows[11].modelMs=600000,
 'zero model processing':r=>r.rows[6].modelMs=0,
 'elapsed faster than model':r=>r.rows[9].elapsedMs=2000,
 'unknown owner decision':r=>r.rows[0].ownerDecision='save_now',
 'uncaught browser error':r=>r.observedBrowserErrors=1,
 'unhandled worker rejection':r=>r.observedUnhandledRejections=1,
 'falsified physical device platform':r=>r.observedPlatform='CERTIFIED_IPHONE',
 'fake canceled source':r=>r.rows[16].observedSourceSHA256='d'.repeat(64),
 'no ONNX invocation on cancel':r=>r.rows[16].onnxRunInvocationObserved=false,
 'canceled result completed':r=>r.rows[17].completedInferenceCredited=true,
 'kernel residency claimed':r=>r.rows[17].kernelExecutionAtCancelProven=true,
 'cancel photo reordered':r=>r.rows[17].sourceId='commons-0035',
 'duplicate cancel':r=>r.rows[17].caseId='onnx-invoked-cancel',
 'photo id duplicate':r=>r.rows[3].caseId='photo-01',
 'secret in error code':r=>{r.rows[5].result='BLOCKED';r.rows[5].errorCode='PRIVATE_JWT_VALUE_x_y_z';},
 'invalid viewport':r=>r.viewportWidth=3000
};
for(const [name,change]of Object.entries(mutations))
 test('fail closed on '+name,()=>{
  const {receipt,expected}=fixture();change(receipt);
  assert.equal(auditLocalDeviceHandoff32(receipt,expected).status,'BLOCKED');
 });
test('blocked failure receipt never passes even with all other 16 models',()=>{
 const {receipt,expected}=fixture();
 receipt.rows[2]={caseId:'photo-03',sourceId:ids[2],sourceSHA256:sourceHashes[ids[2]],
  result:'BLOCKED',errorCode:'MODEL_WORKER_REPORTED_FAILURE',
  completedInferenceCredited:false,hardwareVerified:false,releaseAuthorized:false};
 assert.equal(auditLocalDeviceHandoff32(receipt,expected).status,'BLOCKED');
});
