// Actual source renderBoardSuggestions callbacks, synthetic signed accounts only.
// Playwright Chromium + WebKit, 320 / 390 / 430 CSS mobile widths. No phones.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const out=resolve(process.argv[2]||'benchmark/mission3-owner-bound-outfit-suggestions-browser');
await mkdir(out,{recursive:true});
const src=await readFile('public/outfit-board.js','utf8');
function extract(a,b){
 const i=src.indexOf(a),j=src.indexOf(b,i);
 assert.ok(i>=0&&j>i,'Production source missing '+a);
 return src.slice(i,j);
}
const lease=extract('function beginOwnerBoardUiLease(){','function beginNativeBoardMountLease(){');
const suggestions=extract('function renderBoardSuggestions(){','function renderSavedOutfitBoards(){');
const js=[
 "'use strict';",
 "let nativeLossless04Active=false,nativeLossless04=null,db=null,captureOperationEpoch=0;",
 "let currentBoard={slots:{},ideas:{}},items=[],events=[];",
 "const outfitSlots=[{id:'shoes',label:'Shoes',level:0}];",
 "const $=id=>document.getElementById(id);",
 "function node(tag,label,cl){const x=document.createElement(tag);if(label!=null)x.textContent=label;if(cl)x.className=cl;return x;}",
 "function boardLink(label,url){const a=node('a',label);a.href=url;return a}",
 "function closetGapOptions(target,board,rows){return rows}",
 "function wardrobeGapIdeas(){return [{type:'sneakers',color:'Blue',label:'Blue sneakers',",
 "  reason:'Synthetic direction',trendSource:null,examples:[],retailerLinks:[],",
 "  shoppingUrl:'https://example.org/search',query:'blue sneakers'}]}",
 "function selectBoardPiece(slot,id){events.push('selected:'+slot+':'+id)}",
 "function nativeLossless04Edit(fn){events.push('native-edit');fn()}",
 "function renderOutfitBoard(){events.push('render')}",
 "function storeBoard(){events.push('store');return Promise.resolve(true)}",
 lease,suggestions,
 "window.__probe=mode=>{",
 " document.body.innerHTML='<div id=\"authGate\" hidden></div><main id=\"appShell\">'+",
 "  '<select id=\"boardTarget\"><option value=\"shoes\">Shoes</option><option value=\"top\">Top</option></select>'+",
 "  '<p id=\"boardGapStatus\"></p><div id=\"boardOwnedOptions\"></div><div id=\"boardRecommendations\"></div></main>';",
 " const auth={user:{id:'owner-a'},assertCurrent(){if(auth.revoked)throw Error('revoked')}};",
 " window.closetAuth=auth;db={name:'closet-current-user-owner-a'};captureOperationEpoch++;",
 " nativeLossless04Active=mode.startsWith('native-');",
 " const controller={active:true,status(){return {active:this.active}},setIdea(target,idea){events.push('native-idea:'+target+':'+idea.type)}};",
 " nativeLossless04=controller;",
 " currentBoard={name:'OWNER-A',slots:{},ideas:{}};",
 " items=[{id:'PRIVATE-A-ITEM',name:'PRIVATE-A-ORIGINAL-JPEG',category:'Shoes',",
 "  itemType:'Sneakers',image:'data:image/jpeg;base64,/9j/AA==',color:'Brown'}];",
 " events=[];",
 " renderBoardSuggestions();",
 " const type=mode.includes('-owned-')?'owned':'idea';",
 " const b=type==='owned'?$('boardOwnedOptions').querySelector('button'):",
 "  $('boardRecommendations').querySelector('button');",
 " if(!b)throw Error('Missing source rendered callback '+mode);",
 " const reason=mode.substring(mode.indexOf(type+'-')+type.length+1);",
 " if(reason==='switch'){window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};",
 "  db={name:'closet-current-user-owner-b'};captureOperationEpoch++}",
 " if(reason==='relogin'){window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};",
 "  db={name:'closet-current-user-owner-a'};captureOperationEpoch++}",
 " if(reason==='epoch')captureOperationEpoch++;",
 " if(reason==='db')db={name:'closet-current-user-owner-a'};",
 " if(reason==='revoked')auth.revoked=true;",
 " if(reason==='gate')$('authGate').hidden=false;",
 " if(reason==='shell')$('appShell').hidden=true;",
 " if(reason==='target')$('boardTarget').value='top';",
 " if(reason==='detach')b.remove();",
 " if(reason==='refresh')items=[{...items[0]}];",
 " if(reason==='controller')nativeLossless04={status(){return {active:true}},setIdea(){events.push('WRONG-CONTROLLER')}};",
 " if(reason==='inactive')controller.active=false;",
 " if(reason!=='valid'){currentBoard={name:'NEW-SESSION-DRAFT',slots:{top:'NEW-ID'},ideas:{}}}",
 " events=[];b.click();",
 " return {mode,events,board:currentBoard.name,idea:currentBoard.ideas.shoes?.type??null};",
 "};"
].join('\n');
const reasons=['switch','relogin','epoch','db','revoked','gate','shell','target','detach'];
const modes=[
 'default-owned-valid','default-idea-valid','native-owned-valid','native-idea-valid',
 ...['default','native'].flatMap(scope=>
  ['owned','idea'].flatMap(kind=>reasons.map(reason=>scope+'-'+kind+'-'+reason))),
 'default-owned-refresh','native-owned-refresh',
 'native-idea-controller','native-idea-inactive'
];
const results=[];
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:800},hasTouch:true});
   try{
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.setContent('<main></main>');await page.addScriptTag({content:js});
    for(const mode of modes){
     const x=await page.evaluate(m=>window.__probe(m),mode);
     if(mode.endsWith('owned-valid')){
      assert.deepEqual(x.events,['selected:shoes:PRIVATE-A-ITEM']);
     }else if(mode==='default-idea-valid'){
      assert.deepEqual(x.events,['render','store']);
      assert.equal(x.idea,'sneakers');
     }else if(mode==='native-idea-valid'){
      assert.deepEqual(x.events,['native-edit','native-idea:shoes:sneakers']);
     }else{
      assert.deepEqual(x.events,[],'old callback changed signed owner '+mode);
      assert.equal(x.board,'NEW-SESSION-DRAFT');
      assert.equal(x.idea,null);
     }
     results.push({engine:engineName,width,mode,pass:true});
    }
    assert.deepEqual(errors,[],'JS browser errors '+engineName+' '+width);
    await page.screenshot({path:resolve(out,engineName+'-'+width+'-synthetic.png')});
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
assert.equal(modes.length,44);
assert.equal(results.length,264);
await writeFile(resolve(out,'results.json'),JSON.stringify({
 familyAlpha:'HOLD',noDeploy:true,synthetic:true,physicalDevice:false,
 cases:results.length,failures:0,engines:['chromium','webkit'],cssWidths:[320,390,430],results
},null,2));
console.log('Mission 3 owner-bound original outfit suggestions: '+results.length+' Chromium/WebKit synthetic CSS-phone cases PASS; HOLD NO DEPLOY.');
