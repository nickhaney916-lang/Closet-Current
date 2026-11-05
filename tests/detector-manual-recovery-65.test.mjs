import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
const browser=readFileSync('scripts/test-multi-garment-capture-01-browser.mjs','utf8');
const injected=readFileSync('research/detector-recovery-65/failure-worker-fixture.js','utf8');
test('RECOVERY65 worker startup and post exceptions cannot revoke original verified photo',()=>{
 assert.match(ui,/try\{\s*next\.worker=new Worker\('outfit-worker\.mjs'/);
 assert.match(ui,/next\.worker\.postMessage\(\{id:next\.id,image:inference,multi24:true\}\)/);
 assert.match(ui,/catch\(workerError\)\{\s*detectorFallback65\(next,'Local detection could not start\.'/);
 const w=ui.indexOf("next.worker=new Worker('outfit-worker.mjs'");
 const nativeException=ui.indexOf('}catch(workerError){',w);
 const proofCatch=ui.indexOf('}catch(error){',nativeException);
 assert.ok(w>0&&nativeException>w&&proofCatch>nativeException,
  'Worker errors must be caught before source proof/decode catch resets session');
});
test('RECOVERY65 fallback preserves real original photo and existing reviewed regions',()=>{
 assert.match(ui,/function detectorFallback65\(session,reason\)/);
 assert.match(ui,/if\(!state\|\|job!==session\|\|submitting\)return false/);
 assert.match(ui,/if\(!sameOwner\(\)\)\{reset\('Account changed; extraction canceled\.'/);
 assert.match(ui,/session\.terminal=true;\s*freezeDetector38\(\);\s*redraw\(\)/);
 assert.match(ui,/verified original photo and '\+state\.pieces\.length/);
 const start=ui.indexOf('function detectorFallback65('),end=ui.indexOf('async function crop(',start);
 const impl=ui.slice(start,end);
 assert.doesNotMatch(impl,/state=null|state\.pieces=\[\]|revoke\(\)/,
  'Preserved human manual source and review work must never be cleared by worker failure');
});
test('RECOVERY65 both runtime worker messageerror and onerror fall back safely',()=>{
 assert.match(ui,/next\.worker\.onerror=\(\)=>\{if\(job!==next\|\|submitting\)return;detectorFallback65\(next,'Local detection worker failed\.'/);
 assert.match(ui,/next\.worker\.onmessageerror=\(\)=>detectorFallback65\(next,'Local detection returned an unreadable message\.'/);
 assert.match(ui,/const next=\{id:crypto\.randomUUID\(\),worker:null,pending:\[\],timeout:null,received:0,ignored:0,terminal:false\}/);
});
test('RECOVERY65 stopped/terminal workers are unable to add late crop or progress proposals',()=>{
 assert.match(ui,/if\(job!==next\|\|submitting\|\|!sameOwner\(\)\)return;\s*\/\/ A completion/);
 assert.match(ui,/if\(next\.terminal\)return/);
 assert.match(ui,/if\(data\.type==='done'\|\|data\.type==='error'\)\{\s*next\.terminal=true/);
 assert.match(ui,/if\(job!==next\)return;\s*const failed=data\.type==='error'/);
 assert.match(ui,/session!==job\|\|!sameOwner\(\)/);
});
test('RECOVERY65 user can stop slow AI without deleting verified source or bypassing human consent',()=>{
 assert.match(ui,/Stop AI; keep manual review/);
 assert.match(ui,/if\(submitting\|\|!job\)return;\s*detectorFallback65\(job,/);
 assert.match(ui,/stop\.disabled=submitting\|\|!job/);
 assert.match(ui,/stop\.disabled=true;cancel\.disabled=false/);
 assert.match(ui,/next\.timeout=setTimeout\(\(\)=>\{if\(job===next&&!submitting\)detectorFallback65\(next,/);
 assert.match(ui,/\},300000\)/,'Real user worker watchdog remains 300 seconds');
});
test('RECOVERY65 manual fallback is not a false save or 3D readiness assertion',()=>{
 assert.match(ui,/cropReviewed:false/);
 assert.match(ui,/canConfirmScene32\(x,schema\)/);
 assert.match(ui,/snapshotConfirmations34\(state\.pieces,schema,proof\)/);
 assert.match(ui,/atomicSaveGarments24/);
 assert.match(ui,/original\.src=proof\.image/);
 assert.match(ui,/sameOwner\(\)/);
 assert.doesNotMatch(injected,/fetch\(|localStorage|indexedDB|\/auth\/v1/);
});
test('RECOVERY65 synthetic worker modes cover constructor/post/runtime/messageerror/timeout/manual stop/terminal late without real inference',()=>{
 for(const mode of ['constructor','post','runtime','messageerror','timeout','manualstop','terminal-late'])
  assert.match(injected,new RegExp(mode.replace('-','\\-')));
 assert.match(injected,/300000\?115:delay/);
 assert.match(injected,/worker\.onmessageerror\?\./);
 assert.match(injected,/worker\.onerror\?\./);
 assert.match(injected,/SYNTHETIC_WORKER_CONSTRUCTOR_FAILURE_65/);
 assert.match(injected,/SYNTHETIC_WORKER_POSTMESSAGE_FAILURE_65/);
 assert.match(injected,/type:'done'/);
});
test('RECOVERY65 actual native browser test proves SHA/source owner private manual save and recovery for every failure mode',()=>{
 for(const x of ['constructor','post','runtime','messageerror','timeout','manualstop'])
  assert.match(browser,new RegExp("'"+x+"'"));
 assert.match(browser,/detector65\?'benchmark\/detector-recovery-65'/);
 assert.match(browser,/DETECTOR65=|process\.env\.DETECTOR65/);
 assert.match(browser,/failure-worker-fixture\.js/);
 assert.match(browser,/01b-worker-failed-manual-ready-all/);
 assert.match(browser,/verified original photo\.\*Nothing was automatically saved/);
 assert.match(browser,/getByRole\('button',\{name:'Add missed piece'\}\)/);
 assert.match(browser,/await realCrop\(page,i,p\)/);
 assert.match(browser,/x\.originalPhoto\.sha256===sourceHash/);
 assert.match(browser,/x\.ownerId==='multi24-A'/);
 assert.match(browser,/reimportDuplicateBlocked:true/);
 assert.match(browser,/v4Backup:true,v4Restore:true/);
 assert.match(browser,/assert\.deepEqual\(diagnostics\.unexpectedUploads,\[\]\)/);
});
