const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const engine=vm.createContext({});
for(const name of ['outfit-matcher.js','outfit-board-engine.js','daily-weather-context.js','closet-stylist-engine.js']){
 vm.runInContext(readFileSync('public/'+name,'utf8'),engine);
}
const row=(id,category,itemType,fields={})=>({id,category,itemType,name:'Same label',color:'Black',seasons:['All seasons'],...fields});
const rows=[
 row('tee','Tops','T-shirt'),row('twin','Tops','T-shirt'),row('sweater','Tops','Sweater'),
 row('dress','Dresses','Casual dress'),row('jeans','Bottoms','Jeans'),
 row('boots','Shoes','Ankle boots'),row('sneakers','Shoes','Sneakers'),
 row('laundry','Shoes','Sneakers',{availability:'laundry'}),row('layer','Outerwear','Jacket')
];
const context={request:'Casual',occasion:'Casual',audience:'All',season:'Fall'};
const board=slots=>engine.cleanOutfitBoard({...context,slots},rows);
test('new recommendations exclude explicitly unavailable and revoked pieces',()=>{
 const blocked=[rows[7],row('revoked','Tops','T-shirt',{sourceRevoked:true})];
 assert.equal(engine.styleOwnedCollection(blocked,context).length,0);
 assert.equal(engine.styleOwnedCollection(rows,{...context,focusItemId:'laundry'}).length,0);
});
test('same-label pieces are distinct and a swap preserves every other slot',()=>{
 const current=board({top:'tee',bottom:'jeans',shoes:'boots',layer:'layer'});
 const before=JSON.stringify(current);
 const next=engine.stylistOwnedSubstitute(rows,current,'top',context,null);
 assert.equal(next.slots.top,'twin');
 assert.equal(next.slots.bottom,'jeans');
 assert.equal(next.slots.shoes,'boots');
 assert.equal(next.slots.layer,'layer');
 assert.equal(JSON.stringify(current),before);
 assert.equal(engine.stylistOwnedSubstitute(rows,current,'top',context,null,new Set(['twin'])).slots.top,'sweater');
 assert.equal(engine.stylistOwnedSubstitute(rows,current,'layer',context,null,new Set(['sweater'])),null);
});
test('focus, season, audience, footwear and dress structure are hard constraints',()=>{
 const separates=board({top:'tee',bottom:'jeans',shoes:'sneakers'});
 const dress=board({top:'dress',shoes:'sneakers'});
 assert.equal(engine.stylistOwnedSubstitute(rows,dress,'top',context,null),null);
 assert.equal(engine.stylistOwnedSubstitute(rows,separates,'top',context,null,new Set(['twin','sweater'])),null);
 assert.equal(engine.stylistOwnedSubstitute(rows,separates,'top',{...context,focusItemId:'tee'},null),null);
 assert.equal(engine.stylistOwnedSubstitute(rows,separates,'shoes',{...context,request:'Activewear'},null),null);
 const restrictions=[...rows,row('winter','Shoes','Sneakers',{seasons:['Winter']}),row('heels','Shoes','Heels')];
 const work={...context,request:'Work',audience:'Men'};
 assert.equal(engine.stylistOwnedSubstitute(restrictions,board({top:'tee',shoes:'boots'}),'shoes',work,null),null);
 assert.equal(engine.stylistOwnedSubstitute(rows,board({top:'tee',bottom:'jeans',shoes:'laundry'}),'top',context,null),null);
});
