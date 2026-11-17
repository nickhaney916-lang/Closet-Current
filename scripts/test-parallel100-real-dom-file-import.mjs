/**
 * P100 genuine browser FileList/DOM change event acceptance.
 * The immutable M157 native app/owner/v3/outfit tests are retained, except
 * its final mock onchange invocation is replaced by Playwright setInputFiles
 * using the same public JPEG/synthetic owner backup. No private JPEG logged.
 * This is an additional control, NOT a replacement for exact-source M157.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
const donor='scripts/test-main157-same-photo-native-outfit-browser.mjs';
const scratch='scripts/.parallel100-native-real-file-scratch.mjs';
assert.equal(execFileSync('git',['rev-parse','HEAD:'+donor],{encoding:'utf8'}).trim(),
 'c65c47091156c8996a1f463bff80b1c690b9fd90',
 'P100 original M157 strict acceptance source is not immutable');
const once=(source,oldText,newText)=>{
 assert.equal(source.split(oldText).length,2,'P100 real-file anchor not unique');
 return source.replace(oldText,newText);
};
let source=readFileSync(donor,'utf8');
source=once(source,'const result=await page.evaluate(async(', 
 'const p100Evaluation=page.evaluate(async(');
source=once(source,
 "await document.getElementById('import').onchange({target:{\n      files:[{size:payload.length,text:async()=>payload}],value:'p93-selected-backup'}});",
 ["// The REAL input event comes from installed browser setInputFiles below.",
  "     const p100Input=document.getElementById('import');",
  "     const p100Handler=p100Input.onchange;",
  "     const p100Completed=new Promise(resolve=>{",
  "      p100Input.onchange=async event=>{",
  "       try{await p100Handler(event);}",
  "       finally{p100Input.onchange=p100Handler;resolve();}",
  "      };",
  "     });",
  "     window.__p100PublicBackup=payload;",
  "     window.__p100NativeFileReady=true;",
  "     await p100Completed;",
  "     delete window.__p100PublicBackup;",
  "     delete window.__p100NativeFileReady;"].join('\n'));
source=once(source,
 '    for(const [field,value] of Object.entries(result)){',
 ["    await page.waitForFunction(()=>window.__p100NativeFileReady===true,null,{timeout:90000});",
  "    const p100PublicJSON=await page.evaluate(()=>window.__p100PublicBackup);",
  "    assert.equal(typeof p100PublicJSON,'string','Public owner fixture backup unavailable');",
  "    await page.locator('#import').setInputFiles({",
  "     name:'p100-public-original-owner-v3.json',",
  "     mimeType:'application/json',buffer:Buffer.from(p100PublicJSON)",
  "    });",
  "    const result=await p100Evaluation;",
  "    console.log('P100_REAL_DOM_FILE_IMPORT_SAFE',JSON.stringify({",
  "     engine,width,allOriginalAssertionsRetained:true,",
  "     exactTwoRestored:result.restoredOnlyOwnOriginal===true,",
  "     nativeUIAccepted:result.actualUIImport===true,familyAlpha:'HOLD'",
  "    }));",
  '    for(const [field,value] of Object.entries(result)){'].join('\n'));
assert.ok(source.includes('assert.equal(value,true,engine+'),
 'P100 strict owner/source refusal assertions were removed');
assert.ok(source.includes("page.locator('#import').setInputFiles"),
 'Real browser FileList path was not inserted');
assert.ok(['webkit','chromium'].includes(process.env.P100_ENGINE),
 'P100_ENGINE must be chromium or webkit');
try{
 writeFileSync(scratch,source,{flag:'wx',mode:0o600});
 const child=spawnSync(process.execPath,[scratch],{
  env:{...process.env,M123_ENGINE:process.env.P100_ENGINE},
  stdio:'inherit',timeout:15*60*1000
 });
 if(child.error)throw child.error;
 if(child.signal)throw Error('P100 native real file picker terminated '+child.signal);
 if(child.status!==0)process.exitCode=child.status||1;
}finally{rmSync(scratch,{force:true});}