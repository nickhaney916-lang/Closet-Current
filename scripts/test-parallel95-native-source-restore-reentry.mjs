/**
 * #95 actual native M51 regression extension: repeat real original JPEG
 * source-mutation -> revocation -> source restoration -> signed re-entry.
 * Changes only a temporary copy of the test script, never application code.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
const engine=process.env.M51_ENGINE;
assert.ok(engine==='webkit'||engine==='chromium','real engine required');
const sha=execFileSync('git',
 ['rev-parse','HEAD:scripts/test-main51-real-app-owner-original-2d.mjs'],
 {encoding:'utf8'}).trim();
assert.equal(sha,'63cc9da00eaecbeb2576482dcae1528b44ea8189',
 'exact native M51 source has moved; re-audit required');
const original=readFileSync('scripts/test-main51-real-app-owner-original-2d.mjs','utf8');
const marker="  await clickPreview(page);\n  assert.equal(await count(page),1);\n  stage='m97-inflight-changed-source-must-not-publish-stale-original';";
assert.equal(original.split(marker).length,2,'M97 original restore stage moved');
const instrumentation=[
 "  const p95State=async(point,cycle)=>{",
 "   const state=await page.evaluate(()=>{",
 "    const row=items.find(item=>item?.id===currentBoard?.slots?.top);",
 "    const b=document.querySelector('#mission4Preview1054Section button');",
 "    const status=document.getElementById('mission4Preview1054Status')?.textContent||'';",
 "    let leaseCurrent=false,phase='absent';",
 "    try{leaseCurrent=!!beginOwnerBoardUiLease()?.current();}catch{}",
 "    try{phase=mission4Preview1054Viewer?.status?.phase||'absent';}catch{phase='error';}",
 "    return {leaseCurrent,phase,buttonDisabled:b?.disabled===true,",
 "     buttonConnected:b?.isConnected===true,",
 "     count:document.querySelectorAll('#mission4Preview1054Photos img').length,",
 "     boardSelected:!!currentBoard?.slots?.top,",
 "     sourcePresent:typeof row?.originalPhoto?.image==='string',",
 "     sourceReceiptPresent:!!row?.sourceSHA256,",
 "     pinned:mission4Preview1054Pinned!==null,",
 "     sourceSame:mission4Preview1054SameSource(mission4Preview1054Pinned,",
 "      mission4Preview1054SourceSnapshot()),",
 "     traceTail:(window.__p95Events||[]).slice(-15),",
 "     statusClass:status.includes('original photo(s) verified')?'verified':",
 "      status.includes('Verifying')?'verifying':",
 "      status.includes('Outfit or saved photo changed')?'source-changed':",
 "      status.includes('Preview refused')?'refused':'other'};",
 "   });",
 "   console.log('P95_REENTRY_STATE',JSON.stringify({engine,width,cycle,point,...state}));",
 "  };",
 "  await page.evaluate(()=>{",
 "   window.__p95Events=[];",
 "   const b=document.querySelector('#mission4Preview1054Section button');",
 "   const status=document.getElementById('mission4Preview1054Status');",
 "   const emit=(kind)=>{",
 "    const text=status?.textContent||'';",
 "    let lease=false;try{lease=!!beginOwnerBoardUiLease()?.current();}catch{}",
 "    window.__p95Events.push({kind,lease,buttonDisabled:b?.disabled===true,",
 "     pinned:mission4Preview1054Pinned!==null,",
 "     sameSource:mission4Preview1054SameSource(mission4Preview1054Pinned,",
 "      mission4Preview1054SourceSnapshot()),",
 "     statusClass:text.includes('original photo(s) verified')?'verified':",
 "      text.includes('Verifying')?'verifying':",
 "      text.includes('Outfit or saved photo changed')?'source-changed':",
 "      text.includes('Preview refused')?'refused':'other'});",
 "    if(window.__p95Events.length>100)window.__p95Events.shift();",
 "   };",
 "   b?.addEventListener('click',()=>emit('DOM-click-capture'),true);",
 "   if(status)new MutationObserver(()=>emit('status-mutated')).observe(status,",
 "    {childList:true,characterData:true,subtree:true});",
 "   if(b)new MutationObserver(()=>emit('button-disabled-change')).observe(b,",
 "    {attributes:true,attributeFilter:['disabled']});",
 "  });",
 "  for(let cycle=0;cycle<12;cycle++){",
 "   stage='p95-restored-jpeg-signed-reentry-cycle-'+cycle;",
 "   if(cycle%2===1)await page.evaluate(()=>window.dispatchEvent(new Event('focus')));",
 "   await p95State('before-click',cycle);",
 "   try{await clickPreview(page);assert.equal(await count(page),1);}",
 "   catch(error){",
 "    await p95State('after-error',cycle);",
 "    const diagnostic=await page.evaluate(async()=>{",
 "     const b=document.querySelector('#mission4Preview1054Section button');",
 "     if(!b||b.disabled)return {attempted:false};",
 "     try{await b.onclick();}catch{return {attempted:true,completed:false};}",
 "     const s=document.getElementById('mission4Preview1054Status')?.textContent||'';",
 "     return {attempted:true,completed:true,",
 "      statusClass:s.includes('original photo(s) verified')?'verified':",
 "       s.includes('Preview refused')?'refused':'other',",
 "      count:document.querySelectorAll('#mission4Preview1054Photos img').length,",
 "      leaseCurrent:!!beginOwnerBoardUiLease()?.current()};",
 "    });",
 "    console.error('P95_DIAGNOSTIC_DIRECT_AFTER_WEBKIT_TIMEOUT',",
 "     JSON.stringify({engine,width,cycle,...diagnostic}));",
 "    throw error;",
 "   }",
 "   await p95State('after-click',cycle);",
 "   if(cycle<11){",
 "    await page.evaluate(()=>{",
 "     const row=items.find(item=>item.id===currentBoard.slots.top);",
 "     row.originalPhoto.image='data:image/jpeg;base64,/9j/2Q==';",
 "     renderOutfitBoard();",
 "    });",
 "    await blank(page,'P95 source mutation must revoke old original');",
 "    await page.evaluate(original=>{",
 "     const row=items.find(item=>item.id===currentBoard.slots.top);",
 "     row.originalPhoto.image=original;renderOutfitBoard();",
 "    },originalJPEG);",
 "   }",
 "  }",
 "  stage='m97-inflight-changed-source-must-not-publish-stale-original';"
].join('\n');
const modified=original.replace(marker,instrumentation);
const temp='scripts/.p95-m51-instrumented-'+process.pid+'.mjs';
try{
 writeFileSync(temp,modified,{flag:'wx'});
 const result=spawnSync(process.execPath,[temp],{env:process.env,stdio:'inherit',timeout:12*60*1000});
 if(result.error)throw result.error;
 assert.equal(result.status,0,'P95 actual M51 browser reentry failed');
 console.log('P95_NATIVE_REENTRY_PASS engine='+engine+' widths=320,390,430 extraSourceCycles=11 each');
}finally{rmSync(temp,{force:true});}
