'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const matcher=fs.readFileSync('public/outfit-matcher.js','utf8');
const trends=fs.readFileSync('public/trends.js','utf8');
const evaluate=(code,vars={})=>vm.runInNewContext(matcher+'\n'+code,{crypto,URL,...vars});
const component=(id,extra={})=>({id,label:id,category:'Tops',itemType:'T-shirt',color:'Black',sleeveLength:'Unknown',pattern:'Unknown',fit:'Unknown',...extra});
test('reserve both close matches when a flexible pattern request competes with a sleeve request',()=>{
 const components=[component('pattern',{pattern:'Solid'}),component('sleeve',{sleeveLength:'Long sleeve'})];
 const closet=[component('long',{pattern:'Solid',sleeveLength:'Long sleeve'}),component('short',{pattern:'Solid',sleeveLength:'Short sleeve'})];
 const result=evaluate('matchOutfit(components,closet)',{components,closet});
 assert.equal(result[0].best.item.id,'short');assert.equal(result[1].best.item.id,'long');
 assert.ok(result.every(x=>x.status==='match'));
});
test('substitute cannot consume an exact match or duplicate the same garment ID',()=>{
 const components=[component('specific',{pattern:'Plaid',sleeveLength:'Long sleeve'}),component('plain')];
 const closet=[component('only'),component('only')];
 const result=evaluate('matchOutfit(components,closet)',{components,closet});
 assert.equal(result[0].status,'gap');assert.equal(result[1].status,'match');
 assert.equal(result[0].alternatives.length,0);
});
test('manual parsing: ambiguous shirt stays unknown, singular footwear and dress retain types',()=>{
 const result=evaluate('parseOutfit(description)',{description:'Black shirt\nBrown ankle boot\nCream sweater dress\nWhite sneaker'});
 assert.equal(result.map(x=>x.itemType).join('|'),'Unknown|Ankle boots|Sweater dress|Sneakers');
 assert.equal(result[0].category,'Tops');
});
test('unknown and estimated color cannot be labeled verified close',()=>{
 for(const row of [component('unknown',{color:'Unknown'}),component('estimate',{colorSource:'photo-estimate'})]){
  const result=evaluate('matchOutfit([wanted],[row])',{wanted:component('wanted'),row});
  assert.equal(result[0].status,'substitute');
 }
});
function harness(){
 const els=new Map(),listeners=new Map(),decodes=[];
 const el=()=>({value:'',hidden:true,disabled:false,append(){},replaceChildren(){},setAttribute(){},removeAttribute(k){delete this[k];},scrollIntoView(){}});
 const $=id=>{if(!els.has(id))els.set(id,el());return els.get(id);};
 let candidateCalls=0;
 const auth={user:{id:'owner-A'},assertCurrent(){}};
 const context=vm.createContext({$,node:el,field:el,empty(){},message(){},crypto,structuredClone,
  window:{closetAuth:auth,addEventListener:(event,fn)=>listeners.set(event,fn)},db:{name:'closet-current-user-owner-A'},captureOperationEpoch:0,
  clothingSchema:{seasons:['Spring','Summer','Fall','Winter'],types:{},sleeve:['Unknown'],pattern:['Unknown'],fit:['Unknown']},categories:['Uncategorized'],
  closetReady:new Promise(()=>{}),items:[],matchOutfit:()=>[],candidate:()=>candidateCalls++,switchView(){},
  URL:{createObjectURL:()=> 'blob:reference',revokeObjectURL(){}},
  Image:class{width=100;height=100;decode(){return new Promise(resolve=>decodes.push(resolve));}},
  document:{createElement:()=>({getContext:()=>({drawImage(){}}),toDataURL:()=> 'data:image/jpeg;base64,AAAA'})}
 });
 vm.runInContext(trends,context);
 const input=()=>$('lookImage').onchange({target:{files:[{size:1}],value:'x'}});
 return {$,input,decodes,context,listeners,read:()=>vm.runInContext('({image:lookImage,pieces:lookPieces.length})',context),calls:()=>candidateCalls};
}
test('delayed image decode cannot republish after a new look',async()=>{
 const h=harness(),pending=h.input();
 h.$('newLook').onclick();h.decodes[0]();await pending;
 assert.equal(h.read().image,'');assert.equal(h.read().pieces,0);
 assert.equal(h.$('inspirationPreview').hidden,true);
});
test('session lock invalidates delayed reference and clears existing image source',async()=>{
 const h=harness(),pending=h.input();
 h.context.captureOperationEpoch++;h.context.window.closetAuth.user=null;h.context.db=null;
 h.listeners.get('closet:session-locked')();h.decodes[0]();await pending;
 assert.equal(h.read().image,'');assert.equal(h.$('inspirationPreview').src,undefined);
 assert.equal(h.$('savedLooks').hidden,true);
});
test('resized reference never becomes garment intake even when invoked directly',async()=>{
 const h=harness(),pending=h.input();h.decodes[0]();await pending;
 assert.ok(h.read().image);assert.equal(h.$('referenceToCloset').hidden,true);
 h.$('referenceToCloset').onclick();assert.equal(h.calls(),0);
});
