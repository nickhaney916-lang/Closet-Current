'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('public/starter-wardrobe.js','utf8');
const engine=readFileSync('public/closet-stylist-engine.js','utf8');
const board=readFileSync('public/outfit-board-engine.js','utf8');
const ctx=vm.createContext({colorFamily:value=>String(value).toLowerCase()});
vm.runInContext(board.slice(0,board.indexOf('function boardPalette'))+'\n'+engine+'\n'+source.slice(0,source.indexOf('function renderStarterWardrobe')),ctx);
const item=(id,category,itemType)=>({id,category,itemType,color:'Black',seasons:['All seasons']});
const shirt=item('shirt','Tops','T-shirt'),jeans=item('jeans','Bottoms','Jeans'),shoe=item('shoe','Shoes','Sneakers');
const dress=item('dress','Dresses','Casual dress');
const casual={request:'Casual',audience:'All',season:'Fall'};
test('guidance follows actual engine gaps including dress and shoes',()=>{
 assert.match(ctx.starterWardrobePlan([],casual).message,/one top or dress/);
 assert.match(ctx.starterWardrobePlan([shirt],casual).message,/photographing bottoms/);
 assert.match(ctx.starterWardrobePlan([shirt,jeans],casual).message,/photographing shoes/);
 assert.match(ctx.starterWardrobePlan([dress],casual).message,/photographing shoes/);
 assert.equal(ctx.starterWardrobePlan([shirt,jeans,shoe],casual).style,true);
 assert.equal(ctx.starterWardrobePlan([dress,shoe],casual).photo,undefined);
});
test('saved but incompatible categories are settings guidance, without relaxed ranking',()=>{
 const roster=[shirt,jeans,shoe];
 assert.equal(ctx.starterWardrobePlan([dress],{...casual,audience:'Men'}).settings,true);
 for(const request of [
  {...casual,request:'Activewear'},
  {...casual,focusItemId:'missing'},
  {...casual,season:'Summer'}
 ]){
  const pieces=request.season==='Summer'?roster.map(item=>({...item,seasons:['Winter']})):roster;
  const plan=ctx.starterWardrobePlan(pieces,request);
  assert.equal(plan.settings,true);
  assert.equal(plan.photo,undefined);
 }
});
