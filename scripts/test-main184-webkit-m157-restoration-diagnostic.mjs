/**
 * M184 evidence-only WebKit original JPEG v3 owner-restore diagnosis.
 * Executes the exact pinned M157 source with unchanged acceptance assertions.
 * The scratch adaptation adds only bounded owner-safe counts/boolean categories.
 * NO photograph bytes, hashes, user IDs, JWTs, remote writes, CI retries or 3D.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';

const donor='scripts/test-main157-same-photo-native-outfit-browser.mjs';
const scratch='scripts/.main184-webkit-m157-restore-diagnostic.mjs';
const exact='c65c47091156c8996a1f463bff80b1c690b9fd90';
const actual=execFileSync('git',['rev-parse','HEAD:'+donor],{encoding:'utf8'}).trim();
assert.equal(actual,exact,'M184 original M157 browser test source changed');
const original=readFileSync(donor,'utf8');
const single=(source,needle,replacement)=>{
 assert.equal(source.split(needle).length,2,'M184 source match unexpectedly changed');
 return source.replace(needle,replacement);
};
let safe=single(original,
 'const state=Object.fromEntries(after.state.map(x=>[x.id,x]));',
 'const state=Object.fromEntries(after.state.map(x=>[x.id,x]));\n'+
 '     const m184Restore={\n'+
 '      beforeItemCount:before.items.length,afterItemCount:after.items.length,\n'+
 '      everyOwnerMatches:after.items.every(x=>x.ownerId===owner),\n'+
 '      distinctRestoredIDs:new Set(after.items.map(x=>x.id)).size,\n'+
 '      topOriginalPresent:after.items.some(x=>x.id==="p93-original"),\n'+
 '      bottomOriginalPresent:after.items.some(x=>x.id==="m127-bottom"),\n'+
 '      unrelatedIDCount:after.items.filter(x=>x.id!=="p93-original"&&x.id!=="m127-bottom").length,\n'+
 '      successMessage:status.includes("imported atomically"),\n'+
 '      boardStatePresent:!!state["outfit-board"],\n'+
 '      cloudDirty:state["cloud-sync"]?.dirty===true,\n'+
 '      cloudRevision:state["cloud-sync"]?.localRevision??null\n'+
 '     };');
safe=single(safe,
 'return {largePhoto119NotSilentlySaved:largeDenied.saved===false,',
 'return {m184Restore,\n      largePhoto119NotSilentlySaved:largeDenied.saved===false,');
safe=single(safe,
 'for(const [field,value] of Object.entries(result)){',
 'for(const [field,value] of Object.entries(result)){\n'+
 '     if(field==="m184Restore"){\n'+
 '      console.log("M184_WEBKIT_M157_PREASSERT_SANITIZED",JSON.stringify({engine,width,...value,familyAlpha:"HOLD"}));\n'+
 '      continue;\n'+
 '     }');
assert.ok(safe.includes('assert.equal(value,true,engine+'),'unmodified original refusal assertions absent');
assert.ok(safe.includes('await document.getElementById(\'import\').onchange('),'unmodified original restore absent');
assert.equal(process.env.M184_ENGINE||'webkit','webkit','M184 only diagnoses original WebKit');
let child;
try{
 writeFileSync(scratch,safe,{flag:'wx',mode:0o600});
 child=spawnSync(process.execPath,[scratch],{
  env:{...process.env,M123_ENGINE:'webkit'},stdio:'inherit',timeout:15*60*1000
 });
}finally{rmSync(scratch,{force:true});}
if(child.error)throw child.error;
if(child.signal)throw Error('M184 WebKit M157 original-source test ended with signal '+child.signal);
if(child.status!==0)process.exitCode=child.status||1;
