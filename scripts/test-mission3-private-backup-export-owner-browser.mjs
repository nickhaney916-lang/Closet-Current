// Actual production backup click and owner lease in Chromium/WebKit.
// Synthetic users, photos, and in-memory Blob receipts; no real downloads.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const out=resolve(process.argv[2]||'benchmark/mission3-owner-bound-private-backup-export-browser');
await mkdir(out,{recursive:true});
const app=await readFile('public/app.js','utf8');
const board=await readFile('public/outfit-board.js','utf8');
function slice(s,a,b){
 const i=s.indexOf(a),j=s.indexOf(b,i);
 assert.ok(i>=0&&j>i,'Missing production source '+a);
 return s.slice(i,j);
}
const aLease=slice(app,'function ownerWardrobeMutationLease(){','function writeAll(');
const handler=slice(app,"$('export').onclick=async()=>{","$('import').onchange=async e=>");
const bLease=slice(board,'function beginOwnerBoardUiLease(){','function beginNativeBoardMountLease(){');
const bBackup=slice(board,'function boardBackup(){','function boardHasUnsavedDraft(){');
const bootstrap=[
 "'use strict';",
 "let captureOperationEpoch=1,db=null,nativeLossless04Active=false,nativeLossless04=null;",
 "let items=[],inspirationLooks=[],outfitBoardReady=Promise.resolve(),currentBoard={},savedOutfitBoards=[],events=[],created=[];",
 "const $=id=>document.getElementById(id);",
 "function message(s){events.push('message:'+s)}",
 "function node(tag){const el=document.createElement(tag);el.click=()=>events.push('click:'+el.download);return el}",
 "const createObjectURL=URL.createObjectURL?.bind(URL);",
 "URL.createObjectURL=blob=>{created.push(blob);return 'blob:synthetic-'+created.length};",
 "URL.revokeObjectURL=()=>{};",
 aLease,bLease,bBackup,handler,
 "window.__probe=async mode=>{",
 " document.body.innerHTML='<div id=\"authGate\" hidden></div><div id=\"appShell\"><button id=\"export\">Export</button></div>';",
 " const auth={user:{id:'owner-a'},assertCurrent(){if(auth.revoked)throw Error('revoked')}};",
 " window.closetAuth=auth;db={name:'closet-current-user-owner-a'};captureOperationEpoch++;",
 " nativeLossless04Active=false;nativeLossless04=null;",
 " currentBoard={name:'OWNER-A-OUTFIT',slots:{top:'private-a'}};",
 " savedOutfitBoards=[{name:'OWNER-A-SAVED'}];",
 " items=[{id:'private-a',image:'data:image/jpeg;base64,/9j/AA==',name:'PRIVATE-A-JPEG'}];",
 " inspirationLooks=[];events=[];created=[];",
 " const v4=mode.startsWith('v4-');history.replaceState(null,'',v4?'?restoreAtomic01=research':'/');",
 " if(mode==='legacy-empty')items=[];",
 " let resumeReady,resumeBridge;",
 " outfitBoardReady=new Promise(r=>resumeReady=r);",
 " const bridge={async exportJSON(){events.push('bridge-read');await new Promise(r=>resumeBridge=r);",
 "  return {data:{format:'private-v4',original:'PRIVATE-A-ORIGINAL'}}}};",
 " window.restoreAtomic01Bridge=bridge;",
 " const mutate=(how)=>{",
 "  if(how==='switch'){window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};",
 "   db={name:'closet-current-user-owner-b'};captureOperationEpoch++;}",
 "  if(how==='relogin'){window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};",
 "   db={name:'closet-current-user-owner-a'};captureOperationEpoch++;}",
 "  if(how==='db')db={name:'closet-current-user-owner-a'};",
 "  if(how==='epoch')captureOperationEpoch++;",
 "  if(how==='revoked')auth.revoked=true;",
 "  if(how==='gate')$('authGate').hidden=false;",
 "  if(how==='shell')$('appShell').hidden=true;",
 "  currentBoard={name:'NEW-SESSION-DRAFT',slots:{}};",
 "  savedOutfitBoards=[{name:'NEW-SESSION-SAVED'}];",
 "  items=[{id:'private-b',image:'data:image/jpeg;base64,/9j/BB=='}];",
 " };",
 " if(mode==='legacy-guest'||mode==='v4-guest')window.closetAuth=null;",
 " const pending=$('export').onclick();",
 " const reason=mode.split('-').slice(1).join('-');",
 " if(v4){",
 "  resumeReady();",
 "  for(let i=0;i<40&&!events.includes('bridge-read')&&reason!=='guest';i++)await Promise.resolve();",
 "  if(reason==='guest'){await pending}",
 "  else {if(reason==='no-bridge')window.restoreAtomic01Bridge=null;",
 "   else if(reason==='bridge')window.restoreAtomic01Bridge={exportJSON:bridge.exportJSON};",
 "   else if(reason!=='valid')mutate(reason);",
 "   resumeBridge?.();await pending;}",
 " }else{",
 "  if(reason!=='valid'&&reason!=='empty'&&reason!=='guest')mutate(reason);",
 "  resumeReady();await pending;",
 " }",
 " const content=created.length?JSON.parse(await created[created.length-1].text()):null;",
 " return {mode,clicks:events.filter(x=>x.startsWith('click:')),messages:events.filter(x=>x.startsWith('message:')),",
 "  blobs:created.length,original:content?.original??content?.items?.[0]?.id??null,",
 "  board:content?.outfitBoard?.current?.name??null};",
 "};"
].join('\n');
const reasons=['switch','relogin','db','epoch','revoked','gate','shell'];
const modes=[
 'legacy-valid','v4-valid','legacy-empty','legacy-guest','v4-guest','v4-no-bridge','v4-bridge',
 ...reasons.flatMap(why=>['legacy-'+why,'v4-'+why])
];
assert.equal(modes.length,21);
const results=[];
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  for(const width of [320,390,430]){
   const ctx=await browser.newContext({viewport:{width,height:800}});
   try{
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    // A routed, local-only synthetic origin permits real location.search and
    // history.replaceState without redefining the browser's window.location.
    await page.route('https://closet-current.synthetic.test/**',route=>
      route.fulfill({status:200,contentType:'text/html',body:'<main id="fixture"></main>'}));
    await page.goto('https://closet-current.synthetic.test/',{waitUntil:'domcontentloaded'});
    await page.addScriptTag({content:bootstrap});
    const installed=await page.evaluate(()=>typeof window.__probe);
    assert.equal(installed,'function','Source harness initialization: '+errors.join(' | '));
    for(const mode of modes){
     const x=await page.evaluate(m=>window.__probe(m),mode);
     if(mode==='legacy-valid'){
      assert.deepEqual(x.clicks,['click:closet-current-backup.json']);
      assert.equal(x.original,'private-a');assert.equal(x.board,'OWNER-A-OUTFIT');
     }else if(mode==='v4-valid'){
      assert.deepEqual(x.clicks,['click:closet-current-owner-backup-v4.json']);
      assert.equal(x.original,'PRIVATE-A-ORIGINAL');
     }else{
      assert.equal(x.clicks.length,0,'Stale account downloaded backup '+mode);
      assert.equal(x.blobs,0,'Stale session created private Blob '+mode);
     }
     results.push({engine:name,width,mode,pass:true});
    }
    assert.deepEqual(errors,[],'Browser errors '+name+' width '+width);
    await page.screenshot({path:resolve(out,name+'-'+width+'-synthetic.png')});
   }finally{await ctx.close();}
  }
 }finally{await browser.close();}
}
assert.equal(results.length,126);
await writeFile(resolve(out,'results.json'),JSON.stringify({
 noDeploy:true,familyAlpha:'HOLD',synthetic:true,physicalDevice:false,
 cases:results.length,failures:0,engines:['chromium','webkit'],cssWidths:[320,390,430],results
},null,2));
console.log('Mission 3 exact-owner legacy/v4 private backup export: 126 Chromium/WebKit synthetic mobile-width cases PASS; HOLD NO DEPLOY.');
