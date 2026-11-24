'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(process.env.P1636_STYLIST_SOURCE||'public/closet-stylist.js','utf8');
function harness(){
 const fields=new Map(),items=[{id:'old',category:'Tops'},{id:'new',category:'Tops'}];
 const $=id=>{if(!fields.has(id))fields.set(id,{value:'',hidden:id==='authGate',disabled:false,textContent:'',replaceChildren(){},add(){}});return fields.get(id);};
 $('stylistFocusItem').value='old';
 $('stylistOccasion').value='Casual';
 let release;
 const trend=new Promise(resolve=>{release=resolve;});
 const auth={user:{id:'synthetic-test'},assertCurrent(){}};
 const db={name:'closet-current-user-synthetic-test'};
 const context=vm.createContext({$,items,closetReady:Promise.resolve(),window:{closetAuth:auth,addEventListener(){}},db,captureOperationEpoch:0,
  refreshTrendLibrary:()=>trend,activeTrendLibrary:null,Option:function(){},styleOwnedCollection:(rows,request)=>[{focusItemId:request.focusItemId}],renders:0});
 vm.runInContext(source+'\nrenderStyledCollection=()=>{renders++;};',context);
 const run=code=>vm.runInContext(code,context);
 const seed=()=>run("styledCollectionResults=[{focusItemId:'old'}]");
 const focus=()=>run('styledCollectionResults.map(x=>x.focusItemId).join(",")');
 const serial=()=>run('styledCollectionRequestSerial');
 const change=value=>{$('stylistFocusItem').value=value;$('stylistFocusItem').onchange?.();};
 const submit=()=>$('styleCollectionForm').onsubmit({preventDefault(){}});
 return {$,seed,focus,serial,change,submit,release};
}
test('manual pinned garment change immediately revokes earlier outfit cards and request serial',()=>{
 const h=harness();h.seed();const serial=h.serial();h.change('new');
 assert.equal(h.focus(),'');assert.equal(h.serial(),serial+1);
 assert.equal(h.$('createCollectionOutfits').disabled,false);
});
test('programmatic pinned garment submission removes old actions before any asynchronous work',async()=>{
 const h=harness();h.seed();h.$('stylistFocusItem').value='new';
 const pending=h.submit();const shown=h.focus();const disabled=h.$('createCollectionOutfits').disabled;
 h.release();await pending;
 assert.equal(shown,'');assert.equal(disabled,true);assert.equal(h.focus(),'new');
});
test('focus A to B to A cannot republish an obsolete asynchronous request',async()=>{
 const h=harness();const pending=h.submit();await Promise.resolve();await Promise.resolve();
 h.change('new');h.change('old');h.release();await pending;
 assert.equal(h.focus(),'');assert.equal(h.$('createCollectionOutfits').disabled,false);
});
test('unchanged current pinned request still publishes its own result',async()=>{
 const h=harness();const pending=h.submit();h.release();await pending;
 assert.equal(h.focus(),'old');assert.equal(h.$('createCollectionOutfits').disabled,false);
});
