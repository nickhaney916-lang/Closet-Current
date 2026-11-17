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
source=one(source,'const payload=exported.json;',
 ['const payload=exported.json;',
  '     const p100Connection=db,p100Auth=window.closetAuth;',
  '     const p100Owner=p100Auth?.user?.id;',
  '     const p100Epoch=captureOperationEpoch,p100Writes=writes;',
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
source=one(source,'const state=Object.fromEntries(after.state.map(x=>[x.id,x]));',
 ['const state=Object.fromEntries(after.state.map(x=>[x.id,x]));',
 '     const p100Phase={',
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