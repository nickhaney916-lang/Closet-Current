/**
 * MAIN222: genuine ORIGINAL P94 SegFormer/WASM in Chromium/WebKit with a
 * deterministic single crop-preparation rejection in a disposable local
 * review-ui copy. Unmodified native original P94 owner/source/outfit/v4
 * assertions remain active. NO fake positive inference, private data or
 * hosted changes. The injected rejection is NOT the historical WebKit
 * no-proposal root cause and cannot certify it fixed.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

const engine=process.env.M58_ENGINE;
const width=Number(process.env.P94_WIDTH||430);
assert.ok(['chromium','webkit'].includes(engine));
assert.ok([390,430].includes(width));
const blob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
const sourceTest=await readFile('scripts/test-parallel94-native-p88-browser.mjs');
const sourceUI=await readFile('research/multi-garment-capture-01/review-ui.mjs');
const realWorker=await readFile('public/outfit-worker-p94.mjs');
assert.equal(blob(sourceTest),'4f75a40cf153fa4b4d139d782b202dbe7bc55e41','original P94 browser acceptance changed');
assert.equal(blob(sourceUI),'e770cd0b2968439f6f9ed108479c967cf25cfe7a','M222 candidate UI changed');
assert.equal(blob(realWorker),'d66651b616de54c51eb7ef986324b30f1580888f','actual worker/model changed');
const replaceExactly=(source,anchor,insert,why)=>{
 assert.equal(source.split(anchor).length,2,why+' original anchor changed');
 return source.replace(anchor,insert);
};
// Only this disposable local HTTP-served research UI throws once when a
// genuine model's accepted piece is converted to a candidate review crop.
// The actual original Worker/SegFormer/real source and all owner-save code
// run unchanged; no positive model response is mocked.
const marker='  async function addDetected(raw,session){';
let ui=replaceExactly(sourceUI.toString('utf8'),marker,
 marker+"\n   if(window.__main222InjectedCropFault!==true){window.__main222InjectedCropFault=true;throw Error('MAIN222 synthetic single crop-preparation rejection');}",
 'one accepted-crop fault');
let native=sourceTest.toString('utf8');
const testFile=resolve('scripts/.main222-p94-crop-fault-original-acceptance.mjs');
const uiFile=resolve('scripts/.main222-p94-one-crop-fault-ui.mjs');
const originalRead='  const body=await readFile(absolute);';
native=replaceExactly(native,originalRead,
 "  const body=await readFile(absolute.endsWith('/research/multi-garment-capture-01/review-ui.mjs')?"+
 JSON.stringify(uiFile)+":absolute);",'local source-only HTTP review UI');
const anchor=" assert.ok(external.some(x=>x.type==='pinned-browser-library'),";
const witness=[
 ' const m222=await page.evaluate(()=>({',
 '  forcedOneCrop:window.__main222InjectedCropFault===true,',
 "  reviewCards:document.querySelectorAll('#multi24Grid .multi24-card').length,",
 "  status:document.getElementById('multi24Status')?.textContent||''",
 ' }));',
 " assert.equal(m222.forcedOneCrop,true,'real model never exercised the rejected crop');",
 " assert.ok(m222.reviewCards>0,'unaffected genuine model proposals were lost');",
 " assert.match(m222.status,/region could not be prepared for review/,",
 "  'original-photo manual fallback did not disclose incomplete crop preparation');",
 " assert.match(m222.status,/Nothing was automatically saved/,",
 "  'unreviewed crop failure incorrectly claimed a private save');",
 " assert.deepEqual(issues,[],'rejected crop escaped to page-level browser error');",
 " console.log('M222_GENUINE_MODEL_ONE_CROP_REJECTION_SAFE',JSON.stringify({",
 '  engine,width,oneRejectedCrop:true,actualSegFormerUnchanged:true,',
 '  realGenuineProposals:m222.reviewCards,unhandledPageErrors:issues.length,',
 '  originalManualReviewContinued:true,syntheticOwner:true,hostedRLS:false,',
 "  familyAlpha:'HOLD',releaseAuthorized:false",
 ' }));',
 anchor
].join('\n');
native=replaceExactly(native,anchor,witness,'before original genuine-model source assertions');
assert.ok(native.includes('Genuine P88 browser worker did not produce a bounded actual model proposal'));
assert.ok(native.includes("await page.getByRole('button',{name:'Add missed piece'}).click();"));
assert.ok(native.includes("assert.deepEqual(await ownerSnapshot(),ownerBBeforeForeignRestore"));
assert.ok(native.includes('P91_FULL_JOURNEY_PASS'));
try{
 await writeFile(uiFile,ui,{flag:'wx'});
 await writeFile(testFile,native,{flag:'wx'});
 for(const file of [uiFile,testFile]){
  const checked=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  assert.equal(checked.status,0,file+' syntax invalid: '+checked.stderr);
 }
 const run=spawnSync(process.execPath,[testFile],{
  env:{...process.env,M58_ENGINE:engine,P94_WIDTH:String(width)},
  stdio:'inherit',timeout:16*60*1000
 });
 if(run.error)throw run.error;
 assert.equal(run.status,0,
  'Genuine original P94 worker+owner 2D/v4 browser after crop rejection FAILED (do not retry to green)');
}finally{
 await rm(testFile,{force:true});
 await rm(uiFile,{force:true});
}
