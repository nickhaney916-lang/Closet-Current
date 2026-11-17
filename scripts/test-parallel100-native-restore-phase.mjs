/**
 * P100: observe exact native M157 v3 restore transactions without changing
 * the product or weakening any original data-integrity assertions.
 * Only aggregate counts and owner/DB/epoch equality flags may reach logs.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
const donor='scripts/test-main157-same-photo-native-outfit-browser.mjs';
const scratch='scripts/.parallel100-restore-phase-scratch.mjs';
const expected='c65c47091156c8996a1f463bff80b1c690b9fd90';
assert.equal(execFileSync('git',['rev-parse','HEAD:'+donor],
 {encoding:'utf8'}).trim(),expected,'Pinned original M157 source was changed');
const one=(source,needle,replacement)=>{
 assert.equal(source.split(needle).length,2,'P100 source anchor is not unique');
 return source.replace(needle,replacement);
};
let source=readFileSync(donor,'utf8');

// Source-only diagnostic HTTP derivative. Exact product blob remains frozen.
// Each marker is a fixed string, with no private data, app timing, or guard
// changes. Build escaped JS replacements safely by JSON.stringify.
const phaseEdits=[
 ["$('import').onchange=async e=>{const file=e.target.files[0];",
  "$('import').onchange=async e=>{window.__p100Phases?.push('entered');const file=e.target.files[0];"],
 ['  // Default owner-private v1-v3 import must never partially write clothing,',
  "  window.__p100Phases?.push('default-v3-path');\n  // Default owner-private v1-v3 import must never partially write clothing,"],
 ["  if(!idle())throw Error('Finish saving your photos and outfit changes before importing a backup.');",
  "  window.__p100Phases?.push('before-idle-check');\n  if(!idle())throw Error('Finish saving your photos and outfit changes before importing a backup.');"],
 ['  const prepared=await prepareDefaultAtomicM3({',
  "  window.__p100Phases?.push('prepare-start');\n  const prepared=await prepareDefaultAtomicM3({"],
 ["  if(!idle())throw Error('Your photo or outfit changed during backup validation. Retry when it is saved.');",
  "  window.__p100Phases?.push('prepare-done');\n  if(!idle())throw Error('Your photo or outfit changed during backup validation. Retry when it is saved.');"],
 ["  if(!confirm('Import '+prepared.counts.garments+' clothes, '+",
  "  window.__p100Phases?.push('confirm-prompt');\n  if(!confirm('Import '+prepared.counts.garments+' clothes, '"+"+"],
 ["   if(!idle())throw Error('A photo or outfit changed during backup confirmation. Retry when it is saved.');",
  "   window.__p100Phases?.push('scheduled-operation');\n   if(!idle())throw Error('A photo or outfit changed during backup confirmation. Retry when it is saved.');"],
 ['   return commitDefaultAtomicM3({',
  "   window.__p100Phases?.push('commit-enter');\n   return commitDefaultAtomicM3({"],
 ["  const reason=String(err?.message||'');",
  "  const reason=String(err?.message||'');\n  const p100IdleErrors=['Finish saving your photos and outfit changes before importing a backup.','Your photo or outfit changed during backup validation. Retry when it is saved.','A photo or outfit changed during backup confirmation. Retry when it is saved.'];\n  window.__p100Phases?.push(p100IdleErrors.includes(reason)?'refused:idle':/^LEGACY_ATOMIC_[A-Z0-9_]{1,90}$/.test(reason)?'refused:'+reason:'refused:other');"]
];

// Capture only fixed boolean/count guard flags at the instant a precommit
// idle check refuses. No original JPEGs, owner IDs, errors or token contents.
// This code executes only on refusal, never on the green import path.
const idleFlagSource="({busy:!!busy,saving:!!saving,captureProofTaking:!!captureProofTaking,cameraOpening:!!cameraOpening,photoImportActive:!!photoImportActive,videoImportActive:!!videoImportActive,automaticRunning:!!automaticRunning,queuedAutomatic:automaticQueue.length,localPending:localPending.size,failedDraftCaptures:failedDraftCaptures.size,streamActive:!!stream,openDialog:!!document.querySelector('dialog[open]'),boardHasUnsavedDraft:typeof boardHasUnsavedDraft==='function'&&boardHasUnsavedDraft()})";
for(const edit of phaseEdits.filter(([needle])=>needle.includes('if(!idle())throw Error('))){
 const [needle] = edit;
 const gate=needle.includes('Finish saving your photos')?'first':
  needle.includes('during backup validation')?'after-prepare':'queued-commit';
 const start=needle.indexOf("throw Error(");
 const thrown=needle.slice(start,needle.length-1);
 edit[1]="  window.__p100Phases?.push('idle-gate:"+gate+"');\n"+
  needle.slice(0,start)+"{window.__p100IdleFailureGate='"+gate+"';"+
  "window.__p100IdleFailureFlags="+idleFlagSource+";"+thrown+"}";
}

const servedCode=[
 "let bytes=await readFile(absolute);",
 "  if(absolute===resolve(pub,'app.js')){",
 "   let app=bytes.toString('utf8');",
 "   const inject=(needle,replacement)=>{",
 "    if(app.split(needle).length!==2)throw Error('P100 consumer phase anchor changed');",
 "    app=app.replace(needle,replacement);",
 "   };",
 ...phaseEdits.map(([oldCode,newCode])=>
  '   inject('+JSON.stringify(oldCode)+','+JSON.stringify(newCode)+');'),
 "   bytes=Buffer.from(app,'utf8');",
 "  }"
].join('\n');
source=one(source,'const bytes=await readFile(absolute);',servedCode);

// Repeat the original WebKit 390px user journey in independently launched
// browser processes, with identical strict checks and no sleep/retry bypass.
// The original M157 source in the repo remains byte-for-byte pinned.
source=one(source,'for(const width of [320,390,430]){',
 'for(const width of [320,390,390,390,390,430]){');
source=one(source,'assert.equal(cases.length,3);','assert.equal(cases.length,6);');
source=one(source,'PASS 3/3 per engine','PASS 6/6 per engine');

source=one(source,'const payload=exported.json;',
 ['const payload=exported.json;',
  '     window.__p100Phases=[];',
  '     const p100Connection=db,p100Auth=window.closetAuth;',
  '     const p100Owner=p100Auth?.user?.id;',
  '     const p100Epoch=captureOperationEpoch,p100Writes=writes;',
  '     const p100Idle=()=>({',
  '      busy:!!busy,saving:!!saving,captureProofTaking:!!captureProofTaking,',
  '      cameraOpening:!!cameraOpening,photoImportActive:!!photoImportActive,',
  '      videoImportActive:!!videoImportActive,automaticRunning:!!automaticRunning,',
  '      queuedAutomatic:automaticQueue.length,localPending:localPending.size,',
  '      failedDraftCaptures:failedDraftCaptures.size,streamActive:!!stream,',
  "      openDialog:!!document.querySelector('dialog[open]'),",
  "      boardHasUnsavedDraft:typeof boardHasUnsavedDraft==='function'&&boardHasUnsavedDraft()",
  '     });',
  '     const p100BeforeIdle=p100Idle();',
  '     const p100Tx={started:0,completed:0,aborted:0,errored:0};',
  '     const p100OriginalTx=IDBDatabase.prototype.transaction;',
  '     IDBDatabase.prototype.transaction=function(names,mode,...args){',
  '      const tx=p100OriginalTx.call(this,names,mode,...args);',
  "      const stores=typeof names==='string'?[names]:Array.from(names||[]);",
  "      if(this===p100Connection&&mode==='readwrite'&&",
  "         stores.includes('items')&&stores.includes('state')){",
  '       ++p100Tx.started;',
  "       tx.addEventListener('complete',()=>++p100Tx.completed);",
  "       tx.addEventListener('abort',()=>++p100Tx.aborted);",
  "       tx.addEventListener('error',()=>++p100Tx.errored);",
  '      }',
  '      return tx;',
  '     };'].join('\n'));
source=one(source,
 "await document.getElementById('import').onchange({target:{\n      files:[{size:payload.length,text:async()=>payload}],value:'p93-selected-backup'}});\n     const after=await readRows();",
 ["try{",
  "      await document.getElementById('import').onchange({target:{",
  "       files:[{size:payload.length,text:async()=>payload}],value:'p93-selected-backup'}});",
  "     }finally{IDBDatabase.prototype.transaction=p100OriginalTx;}",
  "     const after=await readRows();"].join('\n'));
// Deterministic owner-safe RED→GREEN control for a genuine, nonempty pending
// Outfit Builder draft. This proves the native import guard refuses rather
// than commits, and real "Load latest" clears the draft before the signed
// original restore. Critically, assert that no unsaved draft existed BEFORE
// introducing the control, so it cannot silently mask an original failure.
source=one(source,
 "     try{\n      await document.getElementById('import').onchange({target:{",
 [
  "     if(p100BeforeIdle.boardHasUnsavedDraft)",
  "      throw Error('P100 unexpected outstanding draft before control; do not hide original intermittency');",
  "     const p100BoardName=document.getElementById('boardName');",
  "     if(!p100BoardName)throw Error('P100 native outfit field not mounted');",
  "     p100BoardName.value+=' P100 unsaved control';",
  "     p100BoardName.dispatchEvent(new Event('input',{bubbles:true}));",
  "     const p100Pending=boardHasUnsavedDraft();",
  "     await document.getElementById('import').onchange({target:{",
  "      files:[{size:payload.length,text:async()=>payload}],value:'p100-refusal-control'}});",
  "     const p100RefusedRows=await readRows();",
  "     const p100RefusalText=document.getElementById('message')?.textContent||'';",
  "     const p100Negative={",
  "      pending:p100Pending,",
  "      refused:p100RefusalText.includes('Finish saving your photos and outfit changes'),",
  "      noRows:p100RefusedRows.items.length===0,",
  "      noTransaction:p100Tx.started===0,",
  "      ownerStillCurrent:db===p100Connection&&window.closetAuth===p100Auth,",
  "      explicitIdleGate:window.__p100IdleFailureGate==='first',",
  "      pendingBoardFlag:window.__p100IdleFailureFlags?.boardHasUnsavedDraft===true",
  "     };",
  "     if(Object.values(p100Negative).some(v=>v!==true))",
  "      throw Error('P100 strict fail-closed control failed (no private source logged)');",
  "     // The real, existing owner UI Load latest action explicitly discards",
  "     // unsaved board edits. Never set native private state or bypass idle().",
  "     await loadLatestBoardDraft();",
  "     if(boardHasUnsavedDraft())throw Error('P100 owner Load latest did not clear draft');",
  "     window.__p100Phases=[];",
  "     window.__p100IdleFailureGate=null;window.__p100IdleFailureFlags=null;",
  "     try{",
  "      await document.getElementById('import').onchange({target:{"
 ].join('\n'));

source=one(source,'const state=Object.fromEntries(after.state.map(x=>[x.id,x]));',
 ['const state=Object.fromEntries(after.state.map(x=>[x.id,x]));',
 '     const p100MessageCodes=[',
 "      'Finish saving your photos and outfit changes before importing a backup.',",
 "      'Your photo or outfit changed during backup validation. Retry when it is saved.',",
 "      'A photo or outfit changed during backup confirmation. Retry when it is saved.',",
 "      'LEGACY_ATOMIC_CONFLICT_REVIEW_AND_RETRY',",
 "      'LEGACY_ATOMIC_DUPLICATE_ORIGINAL_REQUIRES_OWNER_REVIEW',",
 "      'LEGACY_ATOMIC_INVALID_BACKUP',",
 "      'LEGACY_ATOMIC_INVALID_BOARD',",
 "      'LEGACY_ATOMIC_OWNER_LEASE_INVALID',",
 "      'LEGACY_ATOMIC_EXISTING_OUTFIT_CONFLICT',",
 "      'LEGACY_ATOMIC_MISSING_OUTFIT_PIECE',",
 "      'Private wardrobe is locked',",
 "      'Browser storage is unavailable',",
 "      'No data changed',",
 '     ];',
 "     const p100MessageCode=p100MessageCodes.find(code=>status.includes(code))||",
 "      (status.includes('imported atomically')?'committed':'unclassified');",
 '     const p100Phase={',
 '      beforeIdle:p100BeforeIdle,afterIdle:p100Idle(),messageCode:p100MessageCode,',
 '      stages:Array.isArray(window.__p100Phases)?window.__p100Phases.slice(0,24):[],',
 '      unsavedDraftRefusalAndOwnerDismissal:p100Negative,',
 '      idleFailureGate:window.__p100IdleFailureGate||null,',
 '      idleFailureFlags:window.__p100IdleFailureFlags||null,',
 '      beforeCount:before.items.length,afterCount:after.items.length,',
 "      topPresent:after.items.some(x=>x.id==='p93-original'),",
 "      bottomPresent:after.items.some(x=>x.id==='m127-bottom'),",
 '      distinctIDs:new Set(after.items.map(x=>x.id)).size,',
 "      extraCount:after.items.filter(x=>x.id!=='p93-original'&&x.id!=='m127-bottom').length,",
 '      everyOwnerMatches:after.items.every(x=>x.ownerId===p100Owner),',
 '      connectionUnchanged:db===p100Connection,',
 '      authUnchanged:window.closetAuth===p100Auth&&',
 '       window.closetAuth?.user?.id===p100Owner,',
 '      epochUnchanged:captureOperationEpoch===p100Epoch,',
 '      writeTailChanged:writes!==p100Writes,',
 '      txStarted:p100Tx.started,txCompleted:p100Tx.completed,',
 '      txAborted:p100Tx.aborted,txErrored:p100Tx.errored,',
 "      successMessage:status.includes('imported atomically'),",
 "      boardPresent:!!state['outfit-board'],",
 "      cloudDirty:state['cloud-sync']?.dirty===true,",
 "      cloudRevision:state['cloud-sync']?.localRevision??null",
 '     };'].join('\n'));
source=one(source,'return {largePhoto119NotSilentlySaved:largeDenied.saved===false,',
 'return {p100Phase,largePhoto119NotSilentlySaved:largeDenied.saved===false,');
source=one(source,'for(const [field,value] of Object.entries(result)){',
 ['for(const [field,value] of Object.entries(result)){',
 "     if(field==='p100Phase'){",
 "      console.log('P100_SAFE_NATIVE_IMPORT',JSON.stringify({engine,width,...value,familyAlpha:'HOLD'}));",
 '      continue;',
 '     }'].join('\n'));
assert.ok(source.includes('assert.equal(value,true,engine+'),'Strict M157 assertions missing');
assert.ok(source.includes("await document.getElementById('import').onchange("),
 'Real native backup Import UI was bypassed');
assert.ok(['webkit','chromium'].includes(process.env.P100_ENGINE),
 'P100_ENGINE must be chromium or webkit');
try{
 writeFileSync(scratch,source,{flag:'wx',mode:0o600});
 const child=spawnSync(process.execPath,[scratch],{
  env:{...process.env,M123_ENGINE:process.env.P100_ENGINE},
  stdio:'inherit',timeout:15*60*1000
 });
 if(child.error)throw child.error;
 if(child.signal)throw Error('P100 native test terminated '+child.signal);
 if(child.status!==0)process.exitCode=child.status||1;
}finally{rmSync(scratch,{force:true});}