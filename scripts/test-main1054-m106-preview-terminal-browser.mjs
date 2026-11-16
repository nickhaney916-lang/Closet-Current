/**
 * M106 — reproduce a stale first-import owner lease in the actual app,
 * on real Chromium/WebKit, three mobile viewports, without stale photo pixels.
 * No source/customer/hosted cloud modifications or 3D release permission.
 * The complete inherited M51 owner SHA, preview, backup and A→B tests
 * must still pass after restoring the synthetic owner provider.
 */
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const engine=process.env.M51_ENGINE;
assert.ok(['webkit','chromium'].includes(engine),'real Chromium/WebKit required');
assert.equal(git('rev-parse','HEAD:public/outfit-board.js'),
 '22e76c92dc31d8a10d8186e259a4e3784e4b3c84','main terminal source changed');
assert.equal(git('rev-parse','HEAD:scripts/test-main51-real-app-owner-original-2d.mjs'),
 '63cc9da00eaecbeb2576482dcae1528b44ea8189','native M51 donor changed');
assert.equal(git('rev-parse','HEAD:research/main-thread-integration-1054/native-2d-preview.mjs'),
 '0af20d49d87436683630d587ec0284c611cd3414','native signed source viewer changed');
const path='scripts/test-main51-real-app-owner-original-2d.mjs';
const original=readFileSync(path,'utf8');
const marker="  stage='actual-native-app-preview-button';\n  await clickPreview(page);";
assert.equal(original.split(marker).length,2,'M51 original click stage changed');
const inserted=[
 "  stage='m106-first-module-pending-signed-owner-lease';",
 "  const modulePattern='**/research/main-thread-integration-1054/native-2d-preview.mjs';",
 "  let release,notify,requests=0;",
 "  const gate=new Promise(resolve=>{release=resolve;});",
 "  const seen=new Promise(resolve=>{notify=resolve;});",
 "  await page.route(modulePattern,async route=>{",
 "   requests++;notify();await gate;await route.fallback();",
 "  });",
 "  try{",
 "   await page.evaluate(()=>{",
 "    window.__m106OriginalAuth=window.closetAuth;",
 "    document.querySelector('#mission4Preview1054Section button').click();",
 "   });",
 "   await Promise.race([seen,new Promise((_,reject)=>setTimeout(",
 "    ()=>reject(Error('real preview import not intercepted')),15000))]);",
 "   await page.waitForFunction(()=>",
 "    document.getElementById('mission4Preview1054Status')?.textContent?.includes('Verifying'),",
 "    null,{timeout:5000});",
 "   await page.evaluate(()=>{",
 "    const auth=window.closetAuth;",
 "    window.closetAuth={...auth,user:auth.user,assertCurrent:()=>{}};",
 "   });",
 "  }finally{release();}",
 "  await page.waitForFunction(()=>{",
 "   const status=document.getElementById('mission4Preview1054Status')?.textContent||'';",
 "   return status.includes('Verification stopped')&&",
 "    document.querySelector('#mission4Preview1054Section button')?.disabled===false;",
 "  },null,{timeout:20000});",
 "  const result=await page.evaluate(()=>({",
 "   status:document.getElementById('mission4Preview1054Status')?.textContent||'',",
 "   photos:document.querySelectorAll('#mission4Preview1054Photos img').length,",
 "   buttonDisabled:document.querySelector('#mission4Preview1054Section button')?.disabled===true",
 "  }));",
 "  assert.equal(requests,1,'real first-import race not executed');",
 "  assert.equal(result.photos,0,'stale owner image pixels disclosed');",
 "  assert.equal(result.buttonDisabled,false,'pending private click remained disabled');",
 "  assert.match(result.status,/Verification stopped/,'no terminal status');",
 "  assert.doesNotMatch(result.status,/Verifying/,'stale checking text remained');",
 "  console.log('M106_TERMINAL_REAL_BROWSER',JSON.stringify({",
 "   engine,width,case:'first-import-stale-owner-lease',",
 "   sourceJPEGVisible:false,terminalState:'safe-cancelled',",
 "   releaseAuthorized:false,familyAlpha:'HOLD'",
 "  }));",
 "  await page.evaluate(()=>{",
 "   window.closetAuth=window.__m106OriginalAuth;",
 "   delete window.__m106OriginalAuth;",
 "  });",
 "  await page.unroute(modulePattern);",
 "  stage='actual-native-app-preview-button';",
 "  await clickPreview(page);"
].join('\n');
const generated=original.replace(marker,inserted);
const temp='scripts/.main1054-m106-generated.mjs';
writeFileSync(temp,generated);
try{
 const parse=spawnSync(process.execPath,['--check',temp],{encoding:'utf8'});
 assert.equal(parse.status,0,'invalid injected browser test '+parse.stderr);
 const res=spawnSync(process.execPath,[temp],{
  env:{...process.env,M51_ENGINE:engine},encoding:'utf8',
  timeout:900000,maxBuffer:20_000_000
 });
 const lines=((res.stdout||'')+'\n'+(res.stderr||'')).split('\n');
 const records=lines.filter(line=>line.includes('M106_TERMINAL_REAL_BROWSER ')).map(line=>
  JSON.parse(line.slice(line.indexOf('M106_TERMINAL_REAL_BROWSER ')+
   'M106_TERMINAL_REAL_BROWSER '.length)));
 for(const record of records)console.log('M106_TERMINAL_VIEWPORT_PASS',JSON.stringify(record));
 for(const line of lines.filter(line=>line.includes('MAIN51_APP_SOURCE_FAIL ')).slice(-2))
  console.error('M106_NATIVE_SAFETY_FAILURE',line.slice(0,1600));
 assert.equal(res.status,0,'actual M51 app/owner verification failed: '+res.stderr?.slice(-1500));
 assert.deepEqual(records.map(row=>row.width),[320,390,430]);
 assert(records.every(row=>row.terminalState==='safe-cancelled'&&
  row.sourceJPEGVisible===false&&row.releaseAuthorized===false));
 console.log('M106_NATIVE_BROWSER_PASS',JSON.stringify({
  engine,widths:[320,390,430],staleFirstImport:'safe-terminated',
  fullNativeM51Journey:true,unmodifiedOriginalJPEG:true,
  privateAuthSynthetic:true,realDevice:false,releaseAuthorized:false,
  familyAlpha:'HOLD'
 }));
}finally{rmSync(temp,{force:true});}
