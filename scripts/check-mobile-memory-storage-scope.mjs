// Assignment 136: bounded temporary resources/draft persistence, no recognition/backup integration.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const BASE='8fbe7096e655f06dd9d414521f32d1a11182c322';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20000000}).trim();
const source=p=>execFileSync('git',['show',BASE+':'+p],{encoding:'utf8'});
assert.equal(git('merge-base','HEAD',BASE),BASE);
const pins={"public/app.js": "afb8e0e77270c6ae4db46d0104051bb025c22a2c", "public/index.html": "106316b96ac4e93e984a78e94dfc940dee40e053", "public/photo-import.js": "b82a641d6a232dd7644fb1237a5f9862e6ca704e", "public/cloud-backup-bridge.js": "1fdbc7994021f308d7fa597f398d9bd54be16290"};
for(const [p,sha]of Object.entries(pins))assert.equal(git('rev-parse','HEAD:'+p),sha,'Unexpected source: '+p);
const allowed=new Set(["public/app.js", "public/index.html", "public/photo-import.js", "public/cloud-backup-bridge.js", "scripts/test-photo-batch-owner-mobile.mjs", "tests/mobile-draft-storage.test.cjs", "tests/mobile-photo-resource-release.test.cjs", "tests/photo-resolution.test.cjs", "tests/photo-import-untyped-and-timeout.test.cjs", "scripts/test-mobile-memory-storage-browsers.mjs", "scripts/check-mobile-memory-storage-scope.mjs", ".github/workflows/mobile-memory-storage-qa.yml", "docs/MOBILE-MEMORY-STORAGE-20261021.md", "docs/PROGRESS-CHECKPOINT.md"]);
for(const p of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))assert.ok(allowed.has(p),'Unrelated source/evidence changed: '+p);
let current=fs.readFileSync('public/app.js','utf8'),old=source('public/app.js');
const start=current.indexOf('// Copy mutable metadata now,'),end=current.indexOf('function readDraft()',start);
assert.ok(start>0&&end>start);
const oldStart=old.indexOf('function persistDraft()'),oldEnd=old.indexOf('function readDraft()',oldStart);
current=current.slice(0,start)+old.slice(oldStart,oldEnd)+current.slice(end);
current=current.split('\n').filter(line=>!line.startsWith("$('retryDraftSave').onclick=")).join('\n');
assert.equal(current,old,'App outside draft persistence/retry must remain byte-identical, including classifier/save/video/account import logic');
const oldHarness=source('scripts/test-photo-batch-owner-mobile.mjs').replace(
 "   let finish;\n   photoToJPEG=()=>new Promise(resolve=>finish=resolve);",
 "   let finish,enteredDecode;\n   const decodeStarted=new Promise(resolve=>enteredDecode=resolve);\n   photoToJPEG=()=>new Promise(resolve=>{finish=resolve;enteredDecode();});"
).replace("   window.closetAuth.user.id='test-owner-b';", "   await decodeStarted; // The importer now yields before starting each decode.\n   window.closetAuth.user.id='test-owner-b';");
assert.equal(fs.readFileSync('scripts/test-photo-batch-owner-mobile.mjs','utf8'),oldHarness,'Keep every account switch assertion; only await actual decode entry');
assert.equal(fs.readFileSync('public/cloud-backup-bridge.js','utf8'),source('public/cloud-backup-bridge.js').replace('canRestore:()=>!busy','canRestore:()=>window.closetUnsavedDraftOwner!==window.closetAuth?.user?.id&&!busy'),'Only block cloud replacement while this owner has undurable drafts');
for(const p of ['public/auth.js','public/cloud-backup.js','public/cloud-backup-engine.js','public/trends.js','public/photo-color.js','public/recognition-engine.mjs','public/recognition-photo.mjs','public/outfit-board.js','public/closet-stylist.js','public/outfit-board-engine.js','public/reusable-figure-preview.js'])assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',BASE+':'+p),'Protected source changed: '+p);
assert.equal(git('rev-parse','HEAD:benchmark'),git('rev-parse',BASE+':benchmark'));
assert.equal(git('rev-parse','HEAD:supabase'),git('rev-parse',BASE+':supabase'));
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(source('docs/PROGRESS-CHECKPOINT.md')));
console.log(JSON.stringify({scope:'TEMPORARY_PHOTO_BUFFERS_AND_DRAFT_STORAGE_ONLY',photoAdmission135Unchanged:true,video133Unchanged:true,recognitionSaveAndAccountLogicUnchanged:true,backup134NotIntegrated:true,reviewEvidenceUnchanged:true,physicalPhone:false,paidCalls:false,merged:false,deployed:false}));
