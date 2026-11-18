/**
 * M233: Close the original-photo owner-private 2D/v4 recovery gap when the
 * genuine installed P94 Worker has been stopped during an ONNX network stall.
 * Negative controlled STALL, never genuine model success. All consumers and
 * original M231/M58 tests remain byte-identical, test-only composition.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const gitBlob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
const donorPath='scripts/test-main231-stalled-p94-native-owner-manual-browser.mjs';
const positivePath='scripts/test-parallel94-native-p88-browser.mjs';
const donor=await readFile(donorPath,'utf8');
const original=await readFile(positivePath,'utf8');
assert.equal(gitBlob(Buffer.from(donor)),'e853f1bc693e0359fd079a0017f5279911ecfc9d',
 'M233 pinned M231 controlled ONNX stall/manual owner test source changed');
assert.equal(gitBlob(Buffer.from(original)),'4f75a40cf153fa4b4d139d782b202dbe7bc55e41',
 'M233 original genuine P94 positive native owner test source changed');
const worker=await readFile('public/outfit-worker-p94.mjs');
assert.equal(gitBlob(worker),'d66651b616de54c51eb7ef986324b30f1580888f',
 'real installed P94 model Worker changed');
const review=await readFile('research/multi-garment-capture-01/review-ui.mjs');
assert.equal(gitBlob(review),'1bd97b80b51fab1cb269ae565acb73a274b6e6d0',
 'real app owner-review/Stop AI logic changed');

const start=" stage='verified-outfit-source-admission-check';";
const end=" // M67: A real browser-indexed private original can change AFTER the photo";
assert.equal(original.split(start).length,2,'original private saved-v4 acceptance anchor moved');
assert.equal(original.split(end).length,2,'original A->B->A completed recovery anchor moved');
let verified=original.slice(original.indexOf(start),original.indexOf(end));
assert.ok(verified.includes("const handoff=await page.evaluate(async()=>"));
assert.ok(verified.includes("const v4=JSON.parse(await readFile(await download.path(),'utf8'));"));
assert.ok(verified.includes("const bForeignRestoreNotice=await submitBackup(v4,true);"));
assert.ok(verified.includes("M66_OWNER_A_RETURN_PRIVATE_SOURCE_RECOVERY"));
assert.ok(verified.includes("assert.equal(after.cloudDirty,true);"));
assert.ok(verified.includes("actualP88InferenceFirst:true"));
// This is an intentionally STALLED/STOPPED model. No claim of positive
// inference is carried forward from the donor's genuine model path.
verified=verified
 .replaceAll("after real model","after stopped local AI")
 .replaceAll("genuine-worker M58","stopped AI manual owner")
 .replaceAll("real P88 inference","stopped AI/manual review")
 .replaceAll("genuine P88 WASM","intentionally stopped P94")
 .replaceAll("same-real-worker-session","same-stopped-model-manual-session")
 .replaceAll("M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS","M233_STOPPED_ONNX_MANUAL_TO_OWNER_V4_COMPLETE")
 .replaceAll("M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY","M233_STOPPED_ONNX_OWNER_SWITCH_PRIVACY")
 .replaceAll("M58_SYNTHETIC_OWNER_NATIVE_SAVE_TO_M51_FAIL_CLOSED","M233_MANUAL_OWNER_SOURCE_M51_FAIL_CLOSED")
 .replaceAll("M66_OWNER_A_RETURN_PRIVATE_SOURCE_RECOVERY","M233_MANUAL_OWNER_A_RETURN_RECOVERY")
 .replaceAll("modelExecuted:true","modelExecuted:false")
 .replaceAll("actualP88InferenceFirst:true","actualP88InferenceFirst:false")
 .replaceAll("realWorkerFirst:true","realWorkerFirst:false")
 .replaceAll("actualSourceWorkerRanOnce:true","actualSourceWorkerRanOnce:true");
// Explicitly attach accurate NEGATIVE milestone only after every original
// live app v4 export, guard, import, owner isolation and A recovery assertion.
verified+="\n console.log('M233_STALLED_MODEL_FULL_OWNER_RECOVERY_VERIFIED',JSON.stringify({"+
 "engine,width,modelAssetIntentionallyStalled:true,modelPositive:false,"+
 "manualOwnerConfirmed:true,sourceSHA256:sha,privateOriginalItems:1,"+
 "saved2DOutfits:1,downloadedRealV4:true,atomicV4Recovered:true,"+
 "crossOwnerRejected:true,ownerARecovered:true,fitted3D:false,"+
 "hostedRLS:false,physicalPhone:false,hold:true}));\n";
const marker=' " for(const route of heldRequests){try{await route.abort();}catch{}route.__m231Resolve?.();}",';
assert.equal(donor.split(marker).length,2,
 'M231 canonical held-model cleanup anchor moved or duplicated');
const additions=verified.trimEnd().split('\n').map(line=>' '+JSON.stringify(line)+',').join('\n');
const adapted=donor.replace(marker,additions+'\n'+marker);
assert.equal(adapted.split('M233_STALLED_MODEL_FULL_OWNER_RECOVERY_VERIFIED').length,2);
assert.ok(adapted.includes("assert.equal(p.status,0,'real native owner stall/manual fallback failed')"));
const temp=resolve('scripts/.main233-full-original-manual-v4-safety.mjs');
const engine=process.env.M58_ENGINE||'webkit';
const width=process.env.P94_WIDTH||'430';
assert.ok(['chromium','webkit'].includes(engine));
assert.ok(['320','390','430'].includes(String(width)));
try {
 await writeFile(temp,adapted,{flag:'wx'});
 const run=spawnSync(process.execPath,[temp],{
  stdio:'inherit',
  env:{...process.env,M58_ENGINE:engine,P94_WIDTH:width},
  timeout:10*60*1000
 });
 if(run.error)throw run.error;
 assert.equal(run.status,0,
  'M233 genuine native installed app controlled model stall, manual owner full 2D/v4/A-B-A recovery RED');
}finally {await rm(temp,{force:true});}
