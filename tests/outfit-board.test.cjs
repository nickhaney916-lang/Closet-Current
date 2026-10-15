const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c={URL,encodeURIComponent};vm.createContext(c);vm.runInContext(fs.readFileSync('public/outfit-board-engine.js','utf8'),c);
const closet=[{id:'top',category:'Tops',itemType:'Sweater',color:'Cream',pattern:'Solid',image:'actual-photo-top'},{id:'bottom',category:'Bottoms',itemType:'Jeans',color:'Blue',image:'actual-photo-jeans'},{id:'layer',category:'Outerwear',itemType:'Jacket',color:'Brown',image:'actual-photo-jacket'},{id:'bag',category:'Accessories',itemType:'Bag',color:'Brown',image:'actual-photo-bag'},{id:'accessory',category:'Accessories',itemType:'Jewelry',color:'Gold',image:'actual-photo-jewelry'},{id:'finish',category:'Accessories',itemType:'Scarf',color:'Cream',image:'actual-photo-scarf'},{id:'shoe',category:'Shoes',itemType:'Loafers',color:'Brown',image:'actual-photo-shoes'}];
test('six own garments leave shoes as the one open slot',()=>{
 const b=c.cleanOutfitBoard({slots:Object.fromEntries(closet.slice(0,6).map(x=>[x.id,x.id]))},closet);assert.deepEqual(Array.from(c.boardGaps(b,closet),x=>x.id),['shoes']);assert.equal(b.slots.top,'top');assert.equal(closet[0].image,'actual-photo-top');
});
test('shoe directions use palette and occasion and include purchase sources',()=>{
 const b=c.cleanOutfitBoard({slots:{top:'top',bottom:'bottom',bag:'bag'},occasion:'Work',audience:'Women',size:'8',budget:200},closet);
 const ideas=c.wardrobeGapIdeas('shoes',b,closet);assert.equal(ideas.length,3);assert.equal(ideas[0].type,'Loafers');assert.equal(ideas[0].color,'brown');assert.match(ideas[0].reason,/cream, blue, brown/);assert.ok(ideas[0].examples.some(x=>x.name.includes('Loraine')));assert.match(decodeURIComponent(ideas[0].shoppingUrl),/size 8 under \$200/);assert.equal(new URL(ideas[0].retailerUrl).hostname,'www.nordstrom.com');
});
test('budget excludes product examples above their dated observed price',()=>{
 const b=c.cleanOutfitBoard({occasion:'Work',budget:50,audience:'Women'},closet);for(const idea of c.wardrobeGapIdeas('shoes',b,closet))assert.equal(idea.examples.length,0);
});
test('existing closet shoes are offered without reusing an already selected item',()=>{
 const b=c.cleanOutfitBoard({},closet);assert.equal(c.closetGapOptions('shoes',b,closet)[0].id,'shoe');b.slots.shoes='shoe';assert.equal(c.closetGapOptions('shoes',b,closet).length,0);
});
test('dress covers top and bottom and incompatible or deleted references are removed',()=>{
 const dress={id:'dress',category:'Dresses',itemType:'Casual dress'},all=[...closet,dress];const b=c.cleanOutfitBoard({slots:{top:'dress',bottom:'bottom',bag:'top',layer:'missing'}},all);assert.equal(b.slots.bottom,undefined);assert.equal(b.slots.bag,undefined);assert.equal(b.slots.layer,undefined);assert.ok(!c.boardGaps(b,all).some(x=>x.id==='bottom'));
});
test('same clothing ID cannot be placed in two slots',()=>{
 const unknown={id:'unknown',category:'Accessories',itemType:'Unknown'};const b=c.cleanOutfitBoard({slots:{bag:'unknown',finish:'unknown'}},[unknown]);assert.equal(Object.values(b.slots).length,1);
});
test('shopping ideas remain separate from owned clothing and round-trip with backups',()=>{
 const value={name:'Dinner',slots:{top:'top'},ideas:{shoes:{type:'Kitten heel pumps',color:'black'}},occasion:'Dinner'};const b=c.cleanOutfitBoard(value,closet),restored=c.cleanOutfitBoard(JSON.parse(JSON.stringify(b)),closet);assert.equal(restored.ideas.shoes.type,'Kitten heel pumps');assert.equal(restored.slots.shoes,undefined);assert.equal(restored.slots.top,'top');assert.equal(closet.length,7);
});
test('men and all-style searches do not include women-only product examples',()=>{
 for(const audience of ['Men','All']){const b=c.cleanOutfitBoard({audience},closet);assert.ok(c.wardrobeGapIdeas('shoes',b,closet).every(x=>x.examples.length===0));}
});

test('two distinct optional layers survive save and restore with their colors',()=>{const second={id:'second-layer',category:'Outerwear',color:'Blue'},all=[...closet,second];const b=c.cleanOutfitBoard({slots:{top:'top',layer:'layer',layer2:'second-layer'}},all),restored=c.cleanOutfitBoard(JSON.parse(JSON.stringify(b)),all);assert.equal(restored.layerCount,2);assert.equal(restored.slots.layer2,'second-layer');assert.ok(c.boardPalette(restored,all).includes('blue'));assert.equal(closet.length,7);});
test('legacy single layers migrate and extra slots reject duplicate or incompatible clothing',()=>{assert.equal(c.cleanOutfitBoard({slots:{layer:'layer'}},closet).layerCount,1);assert.equal(c.cleanOutfitBoard({},closet).layerCount,0);assert.equal(c.cleanOutfitBoard({slots:{layer:'layer',layer2:'layer'}},closet).slots.layer2,undefined);assert.equal(c.cleanOutfitBoard({slots:{layer2:'top'}},closet).slots.layer2,undefined);});

test('dress outfits exclude pants and every layer without deleting owned clothing',()=>{const dress={id:'dress',category:'Dresses'},all=[...closet,dress,{id:'extra',category:'Outerwear'}];const b=c.cleanOutfitBoard({layerCount:3,slots:{top:'dress',bottom:'bottom',layer:'layer',layer2:'extra'},ideas:{layer3:{type:'Coat',color:'black'}}},all);assert.equal(b.slots.top,'dress');assert.equal(b.slots.bottom,undefined);assert.equal(b.slots.layer,undefined);assert.equal(b.slots.layer2,undefined);assert.equal(b.ideas.layer3,undefined);assert.equal(b.layerCount,0);assert.ok(!c.boardGaps(b,all).some(slot=>slot.id==='bottom'||slot.level));assert.equal(all.length,9);assert.equal(closet[1].image,'actual-photo-jeans');});
