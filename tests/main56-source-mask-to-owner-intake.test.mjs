/** MAIN1054 M56: source masks are real bytes in source-logic tests, but
 * painted class labels are SYNTHETIC, never independent photo accuracy. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {evidenceFromP88Mask56} from '../research/master-consolidation-1054/p88-source-mask-ledger-56.mjs';
import {openP88SourceIntake55} from '../research/master-consolidation-1054/p88-source-key-adapter-55.mjs';
import {UNRESOLVED_SEGMENT_STATUS54} from '../research/multi-garment-capture-01/atomic-group.mjs';
if(!globalThis.crypto?.subtle)globalThis.crypto=webcrypto;
const jpeg=readFileSync('benchmark/fixtures/commons-0003.jpg');
const sha=createHash('sha256').update(jpeg).digest('hex');
const lock=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
 .find(x=>x.id==='commons-0003');
assert.equal(lock.sha256,sha);
const image='data:image/jpeg;base64,'+jpeg.toString('base64');
const proof={image,sourceSHA256:sha,sourceHashVerified:true,
 originalPhoto:{image,sha256:sha}};
const cropBounds={x:.12,y:.08,width:.4,height:.5};
const requested='7c7cbfe3-276b-4fce-b0a4-b45ef52a36c0';
const labels=new Uint8Array(64),selected=new Uint8Array(64);
for(const i of [9,10,11,17,18,19,25,26,27]){
 labels[i]=4;selected[i]=1;
}
const map={labels,width:8,height:8};
const group=()=>({id:4,label:'Upper garment',selected:new Uint8Array(selected),
 count:9,categories:['Tops','Outerwear'],confidence:.98,clipped:false,
 instanceMethod:'native_semantic_group_unresolved_fragments'});
const make=(extra={})=>evidenceFromP88Mask56({
 map,group:group(),sourceSHA256:sha,instanceOrdinal:0,cropBounds,
 requestId:requested,...extra
});
async function lease(){
 const owner='m56-fixture-'+randomUUID();
 const live={owner,source:sha,epoch:1,request:requested,
  db:'closet-current-user-'+owner};
 const intake=await openP88SourceIntake55({
  proof,ownerId:owner,requestId:live.request,reviewEpoch:live.epoch,
  getOwner:()=>live.owner,getSourceSHA256:()=>live.source,
  getReviewEpoch:()=>live.epoch,getActiveRequestId:()=>live.request,
  getDbName:()=>live.db
 });
 return {live,intake};
}
test('M56 source mask digest comes from all accepted binary pixels, not crop or model claims',()=>{
 const obs=make();
 assert.equal(obs.positive,9);
 assert.equal(obs.maskSha256,createHash('sha256').update(selected).digest('hex'));
 assert.equal(obs.event.piece.reconciliation70.maskSha256,obs.maskSha256);
 assert.equal(obs.event.piece.instanceKey,undefined);
 assert.equal(obs.event.piece.image,undefined);
 assert.equal(obs.event.piece.maskPixels,undefined);
});
test('M56 source mask that is non-binary, mislabeled or incomplete cannot become an intake event',()=>{
 const badBinary=group();badBinary.selected[9]=2;
 assert.throws(()=>make({group:badBinary}),/nonbinary/);
 const wrongClass=group();wrongClass.selected[12]=1;wrongClass.count=10;
 assert.throws(()=>make({group:wrongClass}),/escapes original predicted class/);
 const wrongCount=group();wrongCount.count=7;
 assert.throws(()=>make({group:wrongCount}),/lost or duplicated/);
 const empty=group();empty.selected.fill(0);empty.count=0;
 assert.throws(()=>make({group:empty}),/lost or duplicated/);
});
test('M56 exact negative P88 source fragment survives real M55 bounded adapter into manual review',async()=>{
 const {intake}=await lease();
 const obs=make();
 const result=intake.intake(obs.event);
 assert.equal(result.accepted,true,result.reason);
 assert.equal(result.piece.hint.componentReviewStatus,UNRESOLVED_SEGMENT_STATUS54);
 assert.equal(result.piece.instanceKey,'seg-'+BigInt('0x'+obs.maskSha256).toString(10));
 assert.equal(result.piece.colorEstimate.color,'');
 assert.equal(result.piece.personDetected,false);
 assert.deepEqual(Object.keys(result.piece).sort(),
  ['colorEstimate','cropBounds','hint','instanceKey','personDetected']);
 intake.close();
});
test('M56 replacing source original or spoofing mask cannot invent a second identity',async()=>{
 const {intake}=await lease();
 const evidence=make();
 assert.equal(intake.intake(evidence.event).accepted,true);
 const replay=structuredClone(evidence.event);
 replay.piece.reconciliation70.instanceOrdinal=1;
 assert.equal(intake.intake(replay).reason,'duplicate-source-mask');
 intake.close();
});
test('M56 rejected receipt cannot be repaired by caller-supplied instanceKey',async()=>{
 const {intake}=await lease();
 const event=structuredClone(make().event);
 event.piece.reconciliation70.sourceSha256='0'.repeat(64);
 event.piece.instanceKey='seg-999';
 assert.equal(intake.intake(event).reason,'invalid-P88-source-mask-receipt');
 intake.close();
});
test('M56 owner session switch prevents stale source-masked proposed garment despite valid original',async()=>{
 const {intake,live}=await lease();
 live.db='closet-current-user-other';
 assert.equal(intake.intake(make().event).reason,'stale-source-or-owner-lease');
 intake.close();
});
test('M56 model output not yet run by synthetic fixtures is never falsely accepted as photo accuracy',()=>{
 assert.equal(!!make().event.piece.ownerConfirmed,false);
 assert.equal(!!make().event.piece.threeDReady,false);
 assert.equal(!!make().event.piece.recognitionAccuracyVerified,false);
});
