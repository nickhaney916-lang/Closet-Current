// One small, named accessibility patch only: never loosen camera, cloud or private original-photo source trust.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const BASE='8fbe7096e655f06dd9d414521f32d1a11182c322';
const APP='7a13c7d01237813d7e906475c6f107ce67ab3f4e',HTML='698e2f1a7adab1666f6138870dec877385f83f1c';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:20000000}).trim();
assert.equal(git('merge-base','HEAD',BASE),BASE,'Must be based on verified PR #135 exactly');
assert.equal(git('rev-parse','HEAD:public/app.js'),APP,'Unexpected change in critical app code');
assert.equal(git('rev-parse','HEAD:public/index.html'),HTML,'Unexpected change in app HTML');
const allowed=new Set(['public/app.js','public/index.html',
 'tests/accessible-garment-dialogs.test.cjs','scripts/test-accessible-garment-dialogs-mobile.mjs',
 'scripts/check-accessible-garment-dialog-scope.mjs',
 '.github/workflows/accessible-garment-dialog-qa.yml',
 'docs/ACCESSIBLE-GARMENT-DIALOGS-20261021.md','docs/PROGRESS-CHECKPOINT.md']);
for(const f of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))
 assert.ok(allowed.has(f),'Unrelated app/cloud/model/review mutation: '+f);
for(const path of [
 'public/auth.js','public/photo-import.js','public/trends.js','public/outfit-board.js',
 'public/recognition-engine.mjs','public/recognition-photo.mjs',
 'public/cloud-backup.js','public/photo-color.js','public/closet-stylist.js',
 'public/style.css','public/app-theme.css','public/taxonomy.js',
 'public/trend-data.json','public/trend-library.js',
 'benchmark/independent-source-holdout/locked.json','supabase/cloud-backup.sql',
 'scripts/source-holdout-human-review.mjs'])
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',BASE+':'+path),
 'Protected recognition, storage, privacy or styling source edited: '+path);
const oldApp=execFileSync('git',['show',BASE+':public/app.js'],{encoding:'utf8'});
const oldHtml=execFileSync('git',['show',BASE+':public/index.html'],{encoding:'utf8'});
const applyExactly=(source,changes)=>{
 let updated=source;
 for(const [before,after]of changes){
  assert.equal(updated.split(before).length,2,'Anchor must exist exactly once: '+before);
  updated=updated.replace(before,after);
 }
 return updated;
};
const newApp=applyExactly(oldApp,[
 ["const dialog=document.createElement('dialog');dialog.className='photo-adjust clothing-editor';",
 "const dialog=document.createElement('dialog');dialog.className='photo-adjust clothing-editor';\n dialog.setAttribute('aria-label','Review clothing photo details');"],
 ["edit.onclick=()=>{const dialog=document.createElement('dialog');dialog.className='clothing-editor';dialog.style.cssText=",
 "edit.onclick=()=>{const dialog=document.createElement('dialog');dialog.className='clothing-editor';dialog.setAttribute('aria-label','Adjust saved clothing details');dialog.style.cssText="]
]);
const newHtml=applyExactly(oldHtml,[
 ['<select id="batchCategory">','<select id="batchCategory" aria-label="Choose a category for unfinished photos">'],
 ['<dialog id="boardPicker" class="board-picker">','<dialog id="boardPicker" class="board-picker" aria-labelledby="boardPickerTitle">']
]);
assert.equal(fs.readFileSync('public/app.js','utf8'),newApp,'App changed beyond two accessible dialog names');
assert.equal(fs.readFileSync('public/index.html','utf8'),newHtml,'HTML changed beyond two explicit input/picker labels');
const oldProgress=execFileSync('git',['show',BASE+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(oldProgress),'Prior verified release checkpoint rewritten');
const h=reconcile(packetFromLock(fs.readFileSync(LOCK)),[]);
assert.equal(h.suppliedSubmissions,0);
assert.equal(h.approvedModelAccuracy,null);
assert.equal(h.productionPromotion,'BLOCKED');
console.log(JSON.stringify({scope:'CLOTHING_DIALOG_ACCESSIBILITY_ONLY',photoProcessingUnchanged:true,
 highResolutionRecognitionUnchanged:true,cloudUserStorageUnchanged:true,
 garmentEditFieldsAndCallbacksUnchanged:true,dialogFocusNative:true,realUserScreensRead:0,
 actualPhysicalPhonesTested:0,humanGoldCount:0,accuracy:null,productionPromotion:'BLOCKED',merged:false,deployed:false}));
