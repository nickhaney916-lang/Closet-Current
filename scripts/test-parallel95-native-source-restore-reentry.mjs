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
 "     statusClass:status.includes('original photo(s) verified')?'verified':",
 "      status.includes('Verifying')?'verifying':",
 "      status.includes('Outfit or saved photo changed')?'source-changed':",
 "      status.includes('Preview refused')?'refused':'other'};",
 "   });",
 "   console.log('P95_REENTRY_STATE',JSON.stringify({engine,width,cycle,point,...state}));",
 "  };",
 "  for(let cycle=0;cycle<6;cycle++){",
 "   stage='p95-restored-jpeg-signed-reentry-cycle-'+cycle;",
 "   await p95State('before-click',cycle);",
 "   try{await clickPreview(page);assert.equal(await count(page),1);}",
 "   catch(error){await p95State('after-error',cycle);throw error;}",
 "   await p95State('after-click',cycle);",
 "   if(cycle<5){",
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
 console.log('P95_NATIVE_REENTRY_PASS engine='+engine+' widths=320,390,430 extraSourceCycles=5 each');
}finally{rmSync(temp,{force:true});}
