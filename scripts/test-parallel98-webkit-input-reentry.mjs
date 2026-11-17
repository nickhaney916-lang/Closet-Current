/**
 * P98: actual native M51 PHOTO119 WebKit/Chromium input-boundary acceptance.
 * Reuses P95's real app + independently signed local original-JPEG scenario.
 * Runs the same assertions with click, tap, Enter and Space. No app handlers,
 * private photo data, synthetic-click fallback, hidden retries or production writes.
 * This is not proof of an iPhone Safari physical gesture.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';

const engine=process.env.M51_ENGINE;
assert.ok(engine==='webkit'||engine==='chromium','real browser engine required');
const parent='851b83390a3d933e43a0685e592f882d9009e332';
const parentCheck=spawnSync('git',['merge-base','--is-ancestor',parent,'HEAD']);
assert.equal(parentCheck.status,0,'P98 exact P95 donor is not an ancestor');
for(const [path,expected] of [
 ['public/outfit-board.js','5668a4bc6da2e94fc13d23392cd7fb4981d0bc2d'],
 ['research/main-thread-integration-1054/native-2d-preview.mjs','0af20d49d87436683630d587ec0284c611cd3414'],
 ['scripts/test-main51-real-app-owner-original-2d.mjs','63cc9da00eaecbeb2576482dcae1528b44ea8189'],
 ['scripts/test-parallel95-native-source-restore-reentry.mjs','51ca53e77573f916bfe06539f1be9687f2eded09']
]){
 const actual=execFileSync('git',['rev-parse','HEAD:'+path],{encoding:'utf8'}).trim();
 assert.equal(actual,expected,'P98 protected native-source SHA changed: '+path);
}
const donorPath='scripts/test-parallel95-native-source-restore-reentry.mjs';
let source=readFileSync(donorPath,'utf8');
const replaceOne=(before,after,label)=>{
 assert.equal(source.split(before).length,2,'P98 donor anchor moved: '+label);
 source=source.replace(before,after);
};
replaceOne(
 "   const action=cycle%2===0?'click':'tap';",
 "   const action=['click','tap','keyboard-enter','keyboard-space'][cycle%4];",
 'four input modes');
replaceOne(
 "    if(action==='tap')await p95Button.tap();",
 "    if(action==='tap')await p95Button.tap();\\n"+
 "    else if(action==='keyboard-enter'){await p95Button.focus();await p95Button.press('Enter');}\\n"+
 "    else if(action==='keyboard-space'){await p95Button.focus();await p95Button.press('Space');}",
 'genuine keyboard activation');
replaceOne(
 "     const touchOnButton=events.some(e=>e.kind==='touchend');",
 "     const touchOnButton=events.some(e=>e.kind==='touchend');\\n"+
 "     const keyAtButton=events.some(e=>e.kind.startsWith('document-keydown-preview-'));",
 'keyboard trace classification');
replaceOne(
 "     return {button,onDocument,wentElsewhere,pointerOnButton,touchOnButton};",
 "     return {button,onDocument,wentElsewhere,pointerOnButton,touchOnButton,keyAtButton};",
 'key event delivery receipt');
replaceOne(
 "    if(!delivered.button||!delivered.onDocument){",
 "    if(action.startsWith('keyboard')&&!delivered.keyAtButton)\\n"+
 "     throw Error('P98 genuine keyboard press did not reach native preview button');\\n"+
 "    if(!delivered.button||!delivered.onDocument){",
 'keyboard fail-closed expectation');
const inputs="'touchstart','touchend'";
assert.equal(source.split(inputs).length,3,
 'P98 expected exactly two native button/document event capture arrays');
source=source.replaceAll(inputs,"'touchstart','touchend','keydown','keyup'");
const tmp='scripts/.p98-gesture-acceptance-'+process.pid+'.mjs';
try{
 writeFileSync(tmp,source,{flag:'wx'});
 const syntax=spawnSync(process.execPath,['--check',tmp],{encoding:'utf8',timeout:60000});
 if(syntax.error)throw syntax.error;
 assert.equal(syntax.status,0,'P98 native donor syntax invalid: '+String(syntax.stderr).slice(0,300));
 console.log('P98_PROCESS_BEGIN',JSON.stringify({
  engine,sourcePinned:true,nativeApp:true,widths:[320,390,430],
  inputs:['click','tap','keyboard-enter','keyboard-space'],
  signedPhotoFixture:true,reviewLabelsSynthetic:true,releaseAllowed:false,
  zeroRetries:true}));
 const run=spawnSync(process.execPath,[tmp],{
  stdio:'inherit',env:process.env,timeout:16*60*1000});
 if(run.error)throw run.error;
 assert.equal(run.status,0,'P98 actual native browser input and owner-source assertions failed');
 console.log('P98_PROCESS_STRICT_PASS',JSON.stringify({
  engine,widths:[320,390,430],inputModes:4,
  sourceMutationRefusal:true,restoredTwoSlotReview:true,
  physicalPhoneWitness:false,releaseAllowed:false}));
}finally{rmSync(tmp,{force:true});}
