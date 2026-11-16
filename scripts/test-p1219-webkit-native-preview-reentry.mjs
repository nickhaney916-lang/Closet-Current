/**
 * #1219 event-controlled, actual native M51 original-photo supersession witness.
 * Retains source digest, signed synthetic local-owner/DB, negative checks and
 * exact original app DOM. No private photographs, accounts, hosted calls or 3D.
 * A successful old verification is deliberately held AFTER its final SHA,
 * preflight/session/board lease check, exposing stale consumer completion order.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync,execFileSync} from 'node:child_process';
const engine=process.env.M51_ENGINE;
assert.ok(['webkit','chromium'].includes(engine),'actual browser engine required');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const parent='c4e45aa684f7120d216ae4eec192d4085823b073';
assert.equal(git('merge-base',parent,'HEAD'),parent,'p1219 main base ancestry changed');
assert.equal(git('rev-parse','HEAD:scripts/test-main51-real-app-owner-original-2d.mjs'),
 '63cc9da00eaecbeb2576482dcae1528b44ea8189','native M51 source changed');
assert.equal(git('rev-parse','HEAD:research/main-thread-integration-1054/native-2d-preview.mjs'),
 '0af20d49d87436683630d587ec0284c611cd3414',
 'pinned signed owner source viewer changed');
const original=readFileSync('scripts/test-main51-real-app-owner-original-2d.mjs','utf8');
const viewerSource=readFileSync('research/main-thread-integration-1054/native-2d-preview.mjs','utf8');
assert.equal(viewerSource.split('   return verified;\n  },').length,2,
 'P1219 real signed-owner attested-success timing hook missing');
const routeMarker='    body:previewText.replace(originalCatch,classifiedCatch)}));';
const routeReplacement=[
 "    body:previewText.replace(originalCatch,classifiedCatch).replace(",
 "     '   return verified;\\n  },',[",
 "      '    if(globalThis.__p1219PauseOneSuccess===true){',",
 "      '     globalThis.__p1219PauseOneSuccess=false;',",
 "      '     await new Promise(resolve=>{globalThis.__p1219ReleaseOriginal=resolve;});',",
 "      '    }',",
 "      '    return verified;',",
 "      '  },'",
 "     ].join('\\n'))}));"
].join('\n');
assert.equal(original.split(routeMarker).length,2,'M51 viewer response hook changed');
const stageMarker="  stage='m95-unchanged-board-rerender-keeps-verified-owner-original';";
const probe=[
 "  stage='p1219-stale-success-cannot-clear-new-owner-photo';",
 "  await page.evaluate(()=>{",
 "   const button=document.querySelector('#mission4Preview1054Section button');",
 "   if(!button||button.disabled)throw Error('p1219 original preview unavailable');",
 "   window.__p1219PauseOneSuccess=true;",
 "   window.__p1219OldClickPromise=button.onclick();",
 "  });",
 "  await page.waitForFunction(()=>",
 "   typeof window.__p1219ReleaseOriginal==='function'&&",
 "   document.querySelector('#mission4Preview1054Section button')?.disabled===true&&",
 "   document.querySelectorAll('#mission4Preview1054Photos img').length===1,",
 "   null,{timeout:20000});",
 "  await page.evaluate(()=>{",
 "   // A real style change revokes old pixels immediately. Restore the exact",
 "   // same authorized source before starting another independently checked click.",
 "   currentBoard.occasion='Dinner';renderOutfitBoard();",
 "   if(document.querySelectorAll('#mission4Preview1054Photos img').length!==0)",
 "    throw Error('p1219 old photo not revoked on real board change');",
 "   currentBoard.occasion='Casual';renderOutfitBoard();",
 "   const button=document.querySelector('#mission4Preview1054Section button');",
 "   if(button.disabled)throw Error('p1219 reentry locked after source change');",
 "   window.__p1219NewClickPromise=button.onclick();",
 "  });",
 "  await page.waitForFunction(()=>{",
 "   const s=document.getElementById('mission4Preview1054Status')?.textContent||'';",
 "   return s.includes('original photo(s) verified')&&",
 "    document.querySelectorAll('#mission4Preview1054Photos img').length===1&&",
 "    document.querySelector('#mission4Preview1054Section button')?.disabled===false;",
 "  },null,{timeout:20000});",
 "  await page.evaluate(async()=>{",
 "   window.__p1219ReleaseOriginal();",
 "   await window.__p1219OldClickPromise;",
 "   await window.__p1219NewClickPromise;",
 "  });",
 "  const p1219=await page.evaluate(()=>({",
 "   visibleOriginals:document.querySelectorAll('#mission4Preview1054Photos img').length,",
 "   viewerPhase:mission4Preview1054Viewer?.status?.phase||'absent',",
 "   verified:document.getElementById('mission4Preview1054Status')?.textContent?.includes('original photo(s) verified')===true,",
 "   ownerLeaseCurrent:!!beginOwnerBoardUiLease()?.current(),",
 "   sourcePinned:mission4Preview1054Pinned!==null,",
 "   unauthorized3D:mission4Preview1054Viewer?.status?.renderAuthorized3D===true",
 "  }));",
 "  console.log('P1219_NATIVE_STALE_COMPLETION',JSON.stringify({engine,width,...p1219,familyAlpha:'HOLD'}));",
 "  assert.equal(p1219.visibleOriginals,1,'stale async click erased newer verified owner photo');",
 "  assert.equal(p1219.viewerPhase,'visible','stale request revoked newer viewer ticket');",
 "  assert.equal(p1219.verified,true,'stale request overwrote newer signed verification');",
 "  assert.equal(p1219.ownerLeaseCurrent,true);",
 "  assert.equal(p1219.unauthorized3D,false);"
].join('\n');
assert.equal(original.split(stageMarker).length,2,'M51 native insertion stage changed');
const previewWait=" await page.waitForFunction(approve=>{\n  const text=document.getElementById('mission4Preview1054Status')?.textContent||'';\n  return approve?text.includes('2D only')||text.includes('Preview refused'):\n   text.includes('Preview refused');\n },approved,{timeout:20000});";
assert.equal(original.split(previewWait).length,2,'M51 real preview verification wait changed');
const safeWait=" try{\n await page.waitForFunction(approve=>{\n  const text=document.getElementById('mission4Preview1054Status')?.textContent||'';\n  return approve?text.includes('2D only')||text.includes('Preview refused'):\n   text.includes('Preview refused');\n },approved,{timeout:20000});\n }catch(error){\n  const facts=await page.evaluate(()=>{\n   const status=document.getElementById('mission4Preview1054Status')?.textContent||'';\n   const pinned=mission4Preview1054Pinned,snap=mission4Preview1054SourceSnapshot();\n   let phase='absent';try{phase=mission4Preview1054Viewer?.status?.phase||'absent';}catch{}\n   return {phase,serial:mission4Preview1054ClickSerial,\n    statusKind:status.includes('Verifying')?'checking':status.includes('Preview refused')?'refused':\n     status.includes('Outfit or saved photo changed')?'source-changed':\n     status.includes('Verification stopped')?'cancelled':\n     status.includes('original photo(s) verified')?'verified':'other',\n    ownerLeaseLive:!!beginOwnerBoardUiLease()?.current(),\n    boardSelected:!!currentBoard?.slots?.top,\n    dbReady:!!db,documentHidden:document.hidden===true,\n    pinned:!!pinned,sameSource:mission4Preview1054SameSource(pinned,snap),\n    buttonDisabled:document.querySelector('#mission4Preview1054Section button')?.disabled===true,\n    images:document.querySelectorAll('#mission4Preview1054Photos img').length,\n    trace:(window.__p1219Trace||[]).slice(-30),reconcile:(window.__p1219Reconcile||[]).slice(-10)};\n  });\n  console.error('P1219_NATIVE_TIMEOUT_SAFE',JSON.stringify({engine,width:activeWidth,stage,...facts}));\n  throw error;\n }";
const instrumentation="  await page.evaluate(()=>{\n   const events=[],status=document.getElementById('mission4Preview1054Status');\n   window.__p1219Trace=events;\n   const add=(kind)=>{\n    const pin=mission4Preview1054Pinned,snap=mission4Preview1054SourceSnapshot();\n    const s=status?.textContent||'';\n    events.push({kind,serial:mission4Preview1054ClickSerial,pin:!!pin,\n     same:mission4Preview1054SameSource(pin,snap),\n     boardEqual:!!pin&&!!snap&&pin.board===snap.board,\n     detailEqual:!!pin?.selected?.[0]&&!!snap?.selected?.[0]&&pin.selected[0].details===snap.selected[0].details,\n     originalEqual:!!pin?.selected?.[0]&&!!snap?.selected?.[0]&&pin.selected[0].original===snap.selected[0].original,\n     status:s.includes('Verifying')?'checking':s.includes('Outfit or saved photo changed')?'source-changed':\n      s.includes('Preview refused')?'refused':s.includes('Verification stopped')?'cancelled':\n      s.includes('original photo(s) verified')?'verified':'other',\n     buttonDisabled:document.querySelector('#mission4Preview1054Section button')?.disabled===true,\n     images:document.querySelectorAll('#mission4Preview1054Photos img').length,\n     hidden:document.hidden===true});\n    if(events.length>65)events.shift();\n   };\n   new MutationObserver(()=>add('status')).observe(status,{childList:true,subtree:true,characterData:true});\n   for(const name of ['focus','pagehide','closet:session-locked',\n       'closet:style-owned-inventory-committed'])window.addEventListener(name,()=>add(name));\n   document.addEventListener('visibilitychange',()=>add('visibilitychange'));\n   add('init');\n  });";
assert.equal(original.split("  stage='actual-native-app-preview-button';").length,2,'M51 original app click changed');
let generated=original.replace(routeMarker,routeReplacement)
 .replace(previewWait,safeWait)
 .replace("  stage='actual-native-app-preview-button';",(process.env.P1219_TRACE_EVENTS==='true'?instrumentation+'\n':'')+"  stage='actual-native-app-preview-button';")
 .replace(stageMarker,probe+'\n'+stageMarker);
if(process.env.P1219_TRACE_SOURCE==='true'){
 const needle="  const page=await context.newPage();";
 if(generated.split(needle).length!==2)throw Error('P1219 exact owner app page mount changed');
 generated=generated.replace(needle,"  const appText=await readFile('public/outfit-board.js','utf8');\n  const reconcileNeedle=' const hadPinned=mission4Preview1054Pinned!==null;';\n  if(appText.split(reconcileNeedle).length!==2)throw Error('P1219 real consumer reconciliation changed');\n  await context.route('**/public/outfit-board.js',route=>route.fulfill({\n   status:200,contentType:'text/javascript',\n   body:appText.replace(reconcileNeedle,\"   if(!unchanged){\\n    const left=mission4Preview1054Pinned,right=mission4Preview1054SourceSnapshot();\\n    const a=left?.selected?.[0],b=right?.selected?.[0];\\n    const rows=(globalThis.__p1219Reconcile||=[]);\\n    rows.push({phase:state?.phase||'absent',checking,visible,pin:!!left,snapshot:!!right,\\n     boardSame:!!left&&!!right&&left.board===right.board,\\n     slotSame:!!a&&!!b&&a.slot===b.slot&&a.id===b.id,\\n     detailsSame:!!a&&!!b&&a.details===b.details,\\n     displaySame:!!a&&!!b&&a.image===b.image,\\n     originalSame:!!a&&!!b&&a.original===b.original,\\n     images:document.querySelectorAll('#mission4Preview1054Photos img').length});\\n    if(rows.length>20)rows.shift();\\n   }\"+'\\n'+reconcileNeedle)\n  }));"+'\n'+needle);
}
const reentryStages=[["  await page.evaluate(()=>{currentBoard.occasion='Casual';});\n  await clickPreview(page);","  await page.evaluate(()=>{currentBoard.occasion='Casual';});\n  stage='p1219-reentry-after-occasion-restore';\n  await clickPreview(page);"],["  await blank(page,'same owner new auth reference');\n  await clickPreview(page);","  await blank(page,'same owner new auth reference');\n  stage='p1219-reentry-after-auth-reference';\n  await clickPreview(page);"],["  await blank(page,'same named private DB connection changed');\n  await clickPreview(page);","  await blank(page,'same named private DB connection changed');\n  stage='p1219-reentry-after-private-db-reference';\n  await clickPreview(page);"],["  await blank(page,'native owner generation changed');\n  await clickPreview(page);","  await blank(page,'native owner generation changed');\n  stage='p1219-reentry-after-owner-epoch';\n  await clickPreview(page);"]];
for(const [from,to] of reentryStages){
 if(generated.split(from).length!==2)throw Error('P1219 M51 reentry stage changed '+from.slice(0,50));
 generated=generated.replace(from,to);
}
const temp='scripts/.p1219-stale-photo-generated.mjs';
writeFileSync(temp,generated);
try{
 const parsed=spawnSync(process.execPath,['--check',temp],{encoding:'utf8'});
 assert.equal(parsed.status,0,'generated native test syntax invalid: '+parsed.stderr);
 const run=spawnSync(process.execPath,[temp],{encoding:'utf8',
  env:{...process.env,M51_ENGINE:engine},timeout:900000,maxBuffer:20_000_000});
 for(const line of (run.stdout||'').split('\n').filter(l=>l.includes('P1219_NATIVE_STALE_COMPLETION ')))
  console.log(line);
 for(const line of ((run.stderr||'')+'\n'+(run.stdout||'')).split('\n')
  .filter(l=>l.includes('MAIN51_APP_SOURCE_FAIL ')||l.includes('M88_SOURCE_SAFE_WEBKIT_PREVIEW_REFUSAL ')||l.includes('P1219_NATIVE_TIMEOUT_SAFE ')).slice(-4))
  console.error('P1219_NATIVE_FAILED_STAGE',line.slice(0,1700));
 assert.equal(run.status,0,'strict actual native M51 journey failed: '+(run.stderr||'').slice(-1200));
 const receipts=(run.stdout||'').split('\n').filter(l=>l.includes('P1219_NATIVE_STALE_COMPLETION '))
  .map(l=>JSON.parse(l.slice(l.indexOf('P1219_NATIVE_STALE_COMPLETION ')+
   'P1219_NATIVE_STALE_COMPLETION '.length)));
 assert.deepEqual(receipts.map(r=>r.width),[320,390,430]);
 assert(receipts.every(r=>r.visibleOriginals===1&&r.viewerPhase==='visible'&&r.verified===true&&
  r.ownerLeaseCurrent===true&&r.unauthorized3D===false));
 console.log('P1219_NATIVE_EXACT_HEAD_3_WIDTH_PASS',JSON.stringify({
  engine,widths:[320,390,430],signedSyntheticOwner:true,
  independentOriginalSha:true,realApp:true,securityNegativesRetained:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 }));
}finally{rmSync(temp,{force:true});}
