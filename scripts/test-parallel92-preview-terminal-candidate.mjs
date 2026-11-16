/**
 * P92 genuine native app scratch test: first-import stale-owner lease.
 * 320: byte-identical M101 source must reproduce known UI status omission.
 * 390/430: scratch-only response replaces finalizer to safely terminate it.
 * All native M51 source/SHA/owner/IDB/2D/3D/backup guards remain unchanged.
 * This does NOT edit public/ or prove causality of incidental DB-ref failures.
 */
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const engine=process.env.P92_ENGINE,trial=Number(process.env.P92_CANDIDATE_TRIAL||1);
assert.ok([1,2].includes(trial));
assert.ok(['webkit','chromium'].includes(engine),'real browser required');
const head=git('rev-parse','HEAD'),source='3bf2bdad10d264ebe23ba58e156389a1db5feb0b';
assert.equal(head,process.env.P92_CHECKOUT_SHA,'refuse synthetic PR merge checkout');
assert.equal(git('merge-base',source,head),source,'immutable M101 ancestry required');
for(const [path,blob] of Object.entries({
 'public/outfit-board.js':'42dc1a7a2503a1722e6addcd0b8613a7eb029b60',
 'scripts/test-main51-real-app-owner-original-2d.mjs':'63cc9da00eaecbeb2576482dcae1528b44ea8189',
 'research/main-thread-integration-1054/native-2d-preview.mjs':'0af20d49d87436683630d587ec0284c611cd3414'
}))assert.equal(git('rev-parse','HEAD:'+path),blob,'native protected source changed '+path);
const original=readFileSync('scripts/test-main51-real-app-owner-original-2d.mjs','utf8');
const consumer=readFileSync('public/outfit-board.js','utf8');
const oldFinally="    }finally{\n     if(serial===mission4Preview1054ClickSerial&&button.isConnected)button.disabled=false;\n    }";
const newFinally=[
 "    }finally{",
 "     if(serial===mission4Preview1054ClickSerial&&button.isConnected){",
 "      if((status.textContent||'').startsWith('Verifying')&&!live()){",
 "       // Only current serial: revoke stale owner pixels, never approve source.",
 "       mission4Preview1054Pinned=null;",
 "       mission4Preview1054Viewer?.clear();photos.replaceChildren();",
 "       status.textContent='Verification stopped because the signed account, private session or selected outfit changed. Reopen the signed-owner photo preview.';",
 "      }",
 "      button.disabled=false;",
 "     }",
 "    }"
].join('\n');
assert.equal(consumer.split(oldFinally).length,2,'native finalizer source changed');
const ctxAnchor="  const page=await context.newPage();";
assert.equal(original.split(ctxAnchor).length,2,'native page creation changed');
const routePatch=[
 "  let p92ServedCandidate=0;",
 "  if(width!==320){",
 "   const exactConsumer=await readFile('public/outfit-board.js','utf8');",
 "   const prior="+JSON.stringify(oldFinally)+";",
 "   const proposed="+JSON.stringify(newFinally)+";",
 "   assert.equal(exactConsumer.split(prior).length,2,'native main app finalizer changed');",
 "   await context.route('**/public/outfit-board.js',async route=>{",
 "    p92ServedCandidate++;",
 "    await route.fulfill({status:200,contentType:'text/javascript',body:exactConsumer.replace(prior,proposed)});",
 "   });",
 "  }"
].join('\n');
let generated=original.replace(ctxAnchor,routePatch+'\n'+ctxAnchor);
const firstPreview="  stage='actual-native-app-preview-button';\n  await clickPreview(page);";
assert.equal(generated.split(firstPreview).length,2,'native first preview source changed');
const race=[
 "  stage='p92-first-import-stale-lease-baseline-versus-candidate';",
 "  const modulePattern='**/research/main-thread-integration-1054/native-2d-preview.mjs';",
 "  let releaseModule,notifyModule,requestCount=0;",
 "  const gate=new Promise(resolve=>{releaseModule=resolve;});",
 "  const seen=new Promise(resolve=>{notifyModule=resolve;});",
 "  await page.route(modulePattern,async route=>{",
 "   requestCount++;notifyModule();await gate;await route.fallback();",
 "  });",
 "  try{",
 "   await page.evaluate(()=>{",
 "    window.__p92OldAuthReference=window.closetAuth;",
 "    document.querySelector('#mission4Preview1054Section button').click();",
 "   });",
 "   await Promise.race([seen,new Promise((_,reject)=>setTimeout(",
 "    ()=>reject(Error('P92 actual module import not intercepted')),15000))]);",
 "   await page.waitForFunction(()=>",
 "    document.getElementById('mission4Preview1054Status')?.textContent?.includes('Verifying'),",
 "    null,{timeout:5000});",
 "   await page.evaluate(()=>{",
 "    const auth=window.closetAuth;",
 "    window.closetAuth={...auth,user:auth.user,assertCurrent:()=>{}};",
 "   });",
 "  }finally{releaseModule();}",
 "  await page.waitForFunction(()=>",
 "   document.querySelector('#mission4Preview1054Section button')?.disabled===false,",
 "   null,{timeout:20000});",
 "  const race=await page.evaluate(()=>({",
 "   status:document.getElementById('mission4Preview1054Status')?.textContent||'',",
 "   photoCount:document.querySelectorAll('#mission4Preview1054Photos img').length,",
 "   buttonDisabled:document.querySelector('#mission4Preview1054Section button')?.disabled===true",
 "  }));",
 "  console.log('P92_CANDIDATE_STAGE_SAFE',JSON.stringify({",
 "   engine,width,requestCount,candidateRouteHits:p92ServedCandidate,",
 "   photoCount:race.photoCount,buttonDisabled:race.buttonDisabled,",
 "   statusClass:race.status.includes('Verification stopped')?'safe-terminal':",
 "    race.status.includes('Verifying')?'stale-verifying':",
 "    race.status.includes('Preview refused')?'refused':'other',",
 "   familyAlpha:'HOLD'",
 "  }));",
 "  assert.equal(requestCount,1,'first real module import required');",
 "  assert.equal(race.photoCount,0,'stale private source was displayed');",
 "  assert.equal(race.buttonDisabled,false,'button still blocked');",
 "  if(width===320){",
 "   assert.match(race.status,/Verifying/,'unchanged source did not reproduce');",
 "   assert.equal(p92ServedCandidate,0,'baseline unexpectedly patched');",
 "  }else{",
 "   assert.match(race.status,/Verification stopped/,'scratch guard did not terminate');",
 "   assert.doesNotMatch(race.status,/Verifying/,'stale owner status persisted');",
 "   assert.equal(p92ServedCandidate,1,'scratch consumer was not served exactly once');",
 "  }",
 "  console.log('P92_NATIVE_TERMINAL_CANDIDATE',JSON.stringify({",
 "   engine,width,mode:width===320?'M101_UNCHANGED_KNOWN_DEFECT':'DISPOSABLE_GUARD_CANDIDATE',",
 "   sourceJPEGVisible:false,terminalState:width===320?'stuck-verifying':'safe-cancelled',",
 "   syntheticOwnerReferenceSwap:true,publicGitBlobUnchanged:true,",
 "   releaseAllowed:false,familyAlpha:'HOLD'",
 "  }));",
 "  await page.evaluate(()=>{",
 "   window.closetAuth=window.__p92OldAuthReference;",
 "   delete window.__p92OldAuthReference;",
 "  });",
 "  await page.unroute(modulePattern);",
 "  stage='actual-native-app-preview-button';",
 "  await clickPreview(page);"
].join('\n');
generated=generated.replace(firstPreview,race);
const filename='scripts/.parallel92-preview-terminal-candidate.generated.mjs';
const out=join('benchmark','parallel92-preview-terminal-candidate',engine,'trial-'+trial);
mkdirSync(out,{recursive:true});
writeFileSync(filename,generated);
try{
 const check=spawnSync(process.execPath,['--check',filename],{encoding:'utf8'});
 assert.equal(check.status,0,'scratch script invalid '+check.stderr);
 const test=spawnSync(process.execPath,[filename],{
  env:{...process.env,M51_ENGINE:engine},encoding:'utf8',
  maxBuffer:16_000_000,timeout:800000
 });
 const lines=((test.stdout||'')+'\n'+(test.stderr||'')).split('\n');
 const comparisons=lines.filter(v=>v.includes('P92_NATIVE_TERMINAL_CANDIDATE ')).map(line=>
  JSON.parse(line.slice(line.indexOf('P92_NATIVE_TERMINAL_CANDIDATE ')+
   'P92_NATIVE_TERMINAL_CANDIDATE '.length)));
 const status=test.status===0&&comparisons.length===3?'PASS':'FAIL';
 const result={
  schema:'P92_DISPOSABLE_STALE_LEASE_TERMINAL_DEMONSTRATION/v1',
  exactHead:head,mainSource:source,engine,trial,status,comparisons,
  nativeSourceUnchanged:true,scratchResponseOnly:true,
  originalJPEGChecksUnchanged:true,allNativeM51AssertionsRun:true,
  genuineBrowser:true,localSyntheticOwner:true,hostedRLS:false,
  physicalPhones:false,sourceFit3D:false,releaseAllowed:false,
  familyAlpha:'HOLD',exitCode:test.status,errorClass:test.error?.name||null
 };
 writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2)+'\n');
 comparisons.forEach(v=>console.log('P92_CANDIDATE_VIEWPORT',JSON.stringify(v)));
 const diagnostics=lines.filter(v=>v.includes('P92_CANDIDATE_STAGE_SAFE ')).map(v=>{
  try{return JSON.parse(v.split('P92_CANDIDATE_STAGE_SAFE ')[1]);}catch{return {parseFailed:true};}
 });
 diagnostics.forEach(v=>console.log('P92_CANDIDATE_SAFE_STAGE',JSON.stringify(v)));
 const failures=lines.filter(v=>v.includes('MAIN51_APP_SOURCE_FAIL '));
 for(const line of failures.slice(-2)){
  try{const v=JSON.parse(line.split('MAIN51_APP_SOURCE_FAIL ')[1]);
   console.error('P92_CANDIDATE_REAL_NATIVE_FAIL',JSON.stringify({
    engine,width:v.width,stage:v.stage,errorClass:v.errorName||'unknown',
    reasonClass:(()=>{const message=String(v.message||'');return
     message.includes('scratch guard did not safely terminate')?'candidate-no-terminal':
     message.includes('scratch guard did not terminate')?'candidate-no-terminal':
     message.includes('scratch consumer was not served')?'scratch-route-count':
     message.includes('stale private source')?'source-exposure':
     message.includes('first real module import')?'module-interception-count':
     message.includes('native main app finalizer')?'app-source-drift':
     message.includes('unchanged source did not reproduce')?'baseline-drift':
     message.includes('P92')?'test-harness':'unclassified';})()
   }));
  }catch{}
 }
 assert.equal(status,'PASS','native app scratch candidate or source safety failed: no retry');
 console.log('P92_NATIVE_CANDIDATE_STRICT_PASS',JSON.stringify({
  exactHead:head,engine,trial,widths:[320,390,430],
  unchangedBaselineDefect:true,safeScratchTerminal:true,
  sourceConsumerGitUnmodified:true,familyAlpha:'HOLD'
 }));
}finally{rmSync(filename,{force:true});}
