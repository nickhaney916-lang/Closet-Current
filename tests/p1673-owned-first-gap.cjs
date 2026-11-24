'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ctx=vm.createContext({URL});
for(const file of ['outfit-matcher.js','outfit-board-engine.js','closet-stylist-engine.js'])vm.runInContext(fs.readFileSync('public/'+file,'utf8'),ctx);
const item=(id,category,itemType,color,extra={})=>({id,name:id,category,itemType,color,...extra});
const top=item('Black tee','Tops','T-shirt','Black'),bottom=item('Blue jeans','Bottoms','Jeans','Blue');
const board=(slots={},extra={})=>({slots,ideas:{},occasion:'Casual',season:'Summer',audience:'Women',...extra});
const assess=(slot,b,closet)=>{ctx.args=[slot,b,closet];return JSON.parse(JSON.stringify(vm.runInContext('assessBoardGap(...args)',ctx)));};
test('owned selected and alternative suppress purchases, not other owner state',()=>{
 const c=[top,bottom,item('White sneakers','Shoes','Sneakers','White')];
 const b=board({top:top.id,bottom:bottom.id});
 const before=JSON.stringify([b,c]);
 assert.match(assess('top',b,c).status,/selected piece/);
 const a=assess('shoes',b,c);assert.equal(a.ideas.length,0);assert.equal(a.owned[0].id,'White sneakers');
 assert.equal(JSON.stringify([b,c]),before);
});
test('real missing shoes have actual named examples, no invented owned ID',()=>{
 const a=assess('shoes',board({top:top.id,bottom:bottom.id}),[top,bottom]);
 assert.ok(a.ideas.length>0);
 for(const idea of a.ideas){assert.ok(idea.combinationExamples.length);assert.match(idea.combinationExamples[0],/Black tee.*Blue jeans/);}
 assert.equal(new Set(a.ideas.map(x=>x.type+'|'+x.color)).size,a.ideas.length);
});
test('unknown, empty and incomplete wardrobes never assert a purchase gap',()=>{
 assert.equal(assess('shoes',board(),[]).ideas.length,0);
 assert.equal(assess('shoes',board(),[top]).ideas.length,0);
 const a=assess('shoes',board(),[top,bottom,item('Unknown footwear','Shoes','Unknown','')]);
 assert.match(a.status,/not enough information/);assert.equal(a.ideas.length,0);
 assert.equal(assess('shoes',board(),[{...top,color:'Unknown'},bottom]).ideas.length,0);
});
test('occasion, season, dress and optional accessories remain context specific',()=>{
 const shoe=item('Winter shoes','Shoes','Sneakers','White',{seasons:['Winter']});
 const a=assess('shoes',board({}, {occasion:'Active'}),[top,item('Joggers','Bottoms','Joggers','Black'),shoe]);
 assert.ok(a.ideas.length);assert.ok(a.ideas.every(x=>x.type==='Sneakers'&&x.color!=='white'));
 const dress=item('Dress','Dresses','Casual dress','Black');
 assert.equal(assess('bottom',board({top:dress.id}),[dress,bottom]).ideas.length,0);
 const bag=assess('bag',board(),[top,bottom,item('Sneakers','Shoes','Sneakers','White')]);
 assert.match(bag.status,/Optional/);assert.ok(bag.ideas.length);
});
test('bounded deterministic samples with 500 rows and duplicate names',()=>{
 const c=[...Array.from({length:250},(_,i)=>item('t'+i,'Tops','T-shirt','Black',{name:'Same shirt'})),...Array.from({length:250},(_,i)=>item('b'+i,'Bottoms','Jeans','Blue',{name:'Same jeans'}))];
 const a=assess('shoes',board(),c);assert.deepEqual(a,assess('shoes',board(),c));
 assert.ok(a.ideas.length);assert.ok(a.ideas.every(x=>x.combinationExamples.length<=2));
});
