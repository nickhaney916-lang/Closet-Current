// Run actual legacy signed-owner outfit import source in Chromium/WebKit.
// Synthetic wardrobe/IDB commit; six viewport/engine combinations, no phones.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const out=resolve(process.argv[2]||'benchmark/mission3-owner-bound-legacy-backup-import-browser');
await mkdir(out,{recursive:true});
const source=await readFile('public/outfit-board.js','utf8');
function extract(a,b){
 const i=source.indexOf(a),j=source.indexOf(b,i);
 assert.ok(i>=0&&j>i,'Missing exact source '+a);return source.slice(i,j);
}
const lease=extract('function beginOwnerBoardUiLease(){','function beginNativeBoardMountLease(){');
const imp=extract('async function importBoardBackup(value){','for(const slot of outfitSlots){const option=');
const seed=[
 "'use strict';",
 "let captureOperationEpoch=0,db=null,nativeLossless04Active=false,boardInitialized=true,",
 " currentBoard={},savedOutfitBoards=[],items=[],outfitBoardReady=Promise.resolve(),events=[],pending=null;",
 "const $=id=>document.getElementById(id);",
 "function cleanOutfitBoard(value){return structuredClone(value??{name:'',slots:{}})}",
 "function syncBoardInputs(){events.push('sync')}",
 "function renderOutfitBoard(){events.push('render')}",
 "function persistBoardState(args){events.push('persist');return new Promise((resolve,reject)=>{pending={args,resolve,reject}})}",
 lease,imp,
 "window.__run=async mode=>{",
 " document.body.innerHTML='<div id=\"authGate\" hidden></div><main id=\"appShell\"><p id=\"message\">safe</p></main>';",
 " const auth={user:{id:'owner-a'},assertCurrent(){if(auth.revoked)throw Error('revoked')}};",
 " window.closetAuth=auth;db={name:'closet-current-user-owner-a'};captureOperationEpoch++;",
 " nativeLossless04Active=mode==='native';boardInitialized=!mode.startsWith('startup-');",
 " currentBoard={name:'ORIGINAL-OWNER-A',slots:{top:'PRIVATE-A-ID'}};",
 " savedOutfitBoards=[{name:'PRIVATE-A-SAVED'}];events=[];pending=null;",
 " let releaseReady=()=>{};",
 " outfitBoardReady=new Promise(r=>releaseReady=r);",
 " const value={current:{name:'RESTORE-A-PRIVATE',slots:{top:'PRIVATE-SHA-A'}},",
 "  saved:[{name:'PRIVATE-SAVED-IMPORT-A'}]};",
 " const change=how=>{",
 "  if(how==='switch'){window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};",
 "   db={name:'closet-current-user-owner-b'};captureOperationEpoch++;}",
 "  if(how==='relogin'){window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};",
 "   db={name:'closet-current-user-owner-a'};captureOperationEpoch++;}",
 "  if(how==='epoch')captureOperationEpoch++;",
 "  if(how==='db')db={name:'closet-current-user-owner-a'};",
 "  if(how==='revoked')auth.revoked=true;",
 "  if(how==='gate')$('authGate').hidden=false;",
 "  if(how==='shell')$('appShell').hidden=true;",
 "  currentBoard={name:'NEW-SESSION-DRAFT',slots:{top:'NEW-ID'}};",
 "  savedOutfitBoards=[{name:'NEW-SESSION-SAVED'}];events=[];",
 " };",
 " const input=mode==='invalid'?{current:{},saved:Array.from({length:51},()=>({name:'x'}))}:value;",
 " const done=importBoardBackup(input).then(()=>({ok:true}),e=>({ok:false,error:String(e.message)}));",
 " const phase=mode.startsWith('startup-')?'startup':mode.startsWith('commit-')?'commit':'normal';",
 " const why=mode.replace(/^(startup-|commit-)/,'');",
 " if(phase==='startup'){",
 "  change(why);releaseReady();",
 " }else if(mode==='invalid'||mode==='native'){",
 "  releaseReady();",
 " }else{",
 "  for(let i=0;i<25&&!pending;i++)await Promise.resolve();",
 "  if(!pending)throw Error('No pending exact signed owner import');",
 "  if(phase==='commit')change(why);",
 "  if(mode==='transaction-fail')pending.reject(Error('Synthetic IDB failed'));",
 "  else pending.resolve();",
 " }",
 " const result=await done;",
 " return {mode,ok:result.ok,error:result.error??null,events,",
 "  board:currentBoard.name,saved:savedOutfitBoards[0]?.name??null,",
 "  pendingHadImportedCurrent:pending?.args?.replaceCurrent?.name==='RESTORE-A-PRIVATE',",
 "  pendingHadImportedSaved:pending?.args?.replaceSaved?.[0]?.name==='PRIVATE-SAVED-IMPORT-A',",
 "  privateStatus:$('message').textContent==='safe'};",
 "};"
].join('\n');
const reasons=['switch','relogin','epoch','db','revoked','gate','shell'];
const modes=[
 'valid','transaction-fail','invalid','native',
 ...reasons.map(x=>'startup-'+x),
 ...reasons.map(x=>'commit-'+x)
];
const results=[];
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  for(const width of [320,390,430]){
   const ctx=await browser.newContext({viewport:{width,height:800}});
   try{
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.setContent('<div>Owner-bound backup validation</div>');
    await page.addScriptTag({content:seed});
    for(const mode of modes){
     const x=await page.evaluate(m=>window.__run(m),mode);
     assert.equal(x.privateStatus,true);
     if(mode==='valid'){
      assert.equal(x.ok,true);assert.equal(x.board,'RESTORE-A-PRIVATE');
      assert.equal(x.saved,'PRIVATE-SAVED-IMPORT-A');
      assert.deepEqual(x.events,['persist','sync','render']);
      assert.equal(x.pendingHadImportedCurrent,true);
      assert.equal(x.pendingHadImportedSaved,true);
     }else if(mode.startsWith('commit-')){
      assert.equal(x.ok,true);
      assert.equal(x.board,'NEW-SESSION-DRAFT');
      assert.equal(x.saved,'NEW-SESSION-SAVED');
      assert.deepEqual(x.events,[]);
     }else if(mode.startsWith('startup-')){
      assert.equal(x.ok,false);
      assert.match(x.error,/Your account changed/);
      assert.equal(x.board,'NEW-SESSION-DRAFT');
      assert.equal(x.saved,'NEW-SESSION-SAVED');
      assert.deepEqual(x.events,[]);
     }else{
      assert.equal(x.ok,false);
      assert.equal(x.board,'ORIGINAL-OWNER-A');
      assert.equal(x.saved,'PRIVATE-A-SAVED');
      assert.equal(x.events.filter(y=>y==='render').length,0);
     }
     results.push({engine:name,width,mode,pass:true});
    }
    assert.deepEqual(errors,[],'Browser exceptions '+name+' '+width);
    await page.screenshot({path:resolve(out,name+'-'+width+'-synthetic.png')});
   }finally{await ctx.close();}
  }
 }finally{await browser.close();}
}
assert.equal(results.length,108);
await writeFile(resolve(out,'results.json'),JSON.stringify({
 noDeploy:true,familyAlpha:'HOLD',synthetic:true,physicalDevice:false,
 cases:108,failures:0,engines:['chromium','webkit'],cssWidths:[320,390,430],results
},null,2));
console.log('Mission 3 owner-bound legacy outfit backup import: 108 controlled Chromium/WebKit CSS mobile scenarios PASS; no deploy.');
