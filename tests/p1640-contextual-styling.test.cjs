'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {contextualCandidate}=require('../scripts/p1640-contextual-handoff.cjs');
const sourcePath=process.env.P1640_ENGINE_SOURCE||'public/closet-stylist-engine.js';
const original=fs.readFileSync(sourcePath,'utf8');
const code=process.env.P1640_BASELINE==='1'?original:contextualCandidate(original);
const context=vm.createContext({URL,Date,structuredClone,encodeURIComponent});
for(const name of ['taxonomy.js','outfit-matcher.js','trend-library.js','outfit-board-engine.js'])
 vm.runInContext(fs.readFileSync('public/'+name,'utf8'),context,{filename:name});
vm.runInContext(code,context,{filename:'closet-stylist-engine.js'});
const row=(id,category,itemType,color='Black',seasons=['All seasons'],extra={})=>({id,category,itemType,color,seasons,pattern:'Solid',...extra});
const wardrobe=[
 row('polo','Tops','Polo','White'),row('tee','Tops','T-shirt','Navy'),
 row('blouse','Tops','Blouse','Cream'),row('button','Tops','Button-down shirt','Blue'),
 row('sweater','Tops','Sweater','Gray',['Fall','Winter']),row('tank','Tops','Tank top','Red',['Summer']),
 row('hoodie','Tops','Hoodie','Gray',['Fall','Winter']),row('dress','Dresses','Formal dress','Black'),
 row('casual-dress','Dresses','Casual dress','Blue'),row('trousers','Bottoms','Trousers','Black'),
 row('jeans','Bottoms','Jeans','Blue'),row('shorts','Bottoms','Shorts','Tan',['Spring','Summer']),
 row('skirt','Bottoms','Skirt','Black'),row('leggings','Bottoms','Leggings','Black'),
 row('joggers','Bottoms','Joggers','Gray'),row('sneakers','Shoes','Sneakers','White'),
 row('loafers','Shoes','Loafers','Brown'),row('heels','Shoes','Heels','Black'),
 row('boots','Shoes','Ankle boots','Black',['Fall','Winter']),row('sandals','Shoes','Sandals','Tan',['Summer']),
 row('blazer','Outerwear','Blazer','Navy',['Spring','Fall','Winter']),
 row('coat','Outerwear','Coat','Gray',['Winter'])
];
const style=(rows,request='Casual',season='Fall',focusItemId,library=null)=>context.styleOwnedCollection(rows,{request,season,audience:'All',focusItemId},library);
const byId=(rows,id)=>rows.find(x=>x.id===id);
const complete=look=>look.missing.length===0;
const allowedShoes={School:['Sneakers','Loafers','Flats'],Casual:['Sneakers','Loafers','Flats','Sandals','Ankle boots'],'Casual date night':['Loafers','Ankle boots','Flats','Sneakers','Heels','Sandals'],'Dressy dinner':['Loafers','Heels','Flats','Ankle boots'],Work:['Loafers','Flats','Ankle boots','Heels'],Activewear:['Sneakers']};
const allowedTop={School:['Polo','T-shirt','Sweater','Button-down shirt','Blouse','Hoodie'],Casual:['T-shirt','Polo','Button-down shirt','Blouse','Sweater','Tank top','Hoodie','Casual dress','Shirt dress'],'Casual date night':['Polo','Button-down shirt','Blouse','Sweater','Casual dress','Shirt dress','T-shirt'],'Dressy dinner':['Button-down shirt','Blouse','Formal dress','Casual dress','Sweater'],Work:['Button-down shirt','Blouse','Polo','Sweater','Shirt dress','Casual dress'],Activewear:['Tank top','T-shirt','Sweatshirt','Hoodie']};
const allowedBottom={School:['Jeans','Trousers','Shorts','Skirt'],Casual:['Jeans','Trousers','Shorts','Skirt','Joggers'],'Casual date night':['Jeans','Trousers','Skirt'],'Dressy dinner':['Trousers','Skirt'],Work:['Trousers','Skirt','Jeans'],Activewear:['Leggings','Joggers','Shorts']};
function oracle(looks,rows,intent,season){
 assert.ok(looks.length<=3);
 for(const look of looks){
  const slots=look.board.slots,ids=Object.values(slots);
  assert.equal(ids.length,new Set(ids).size);
  assert.ok(ids.every(id=>byId(rows,id)));
  assert.ok(ids.every(id=>{const s=byId(rows,id).seasons;return !s?.length||s.includes('All seasons')||s.includes(season);}));
  assert.ok(!slots.top||allowedTop[intent].includes(byId(rows,slots.top).itemType));
  assert.ok(!slots.bottom||allowedBottom[intent].includes(byId(rows,slots.bottom).itemType));
  assert.ok(!slots.shoes||allowedShoes[intent].includes(byId(rows,slots.shoes).itemType));
  const dress=byId(rows,slots.top)?.category==='Dresses';
  if(dress)assert.ok(!slots.bottom&&!slots.layer);
  if(intent==='Activewear'||season==='Summer')assert.ok(!slots.layer);
  const missing=[!slots.top?'top':null,!dress&&!slots.bottom?'bottom':null,!slots.shoes?'shoes':null].filter(Boolean);
  assert.equal(Array.from(look.missing).join(','),missing.join(','));
  assert.equal(Object.keys(look.board.ideas).length,0);
 }
}
for(const intent of Object.keys(allowedShoes))for(const season of ['Spring','Summer','Fall','Winter']){
 test('matrix '+intent+' '+season,()=>{
  const before=JSON.stringify(wardrobe),looks=style(wardrobe,intent,season);
  assert.ok(looks.some(complete),'rich wardrobe must have complete choice');
  oracle(looks,wardrobe,intent,season);
  assert.equal(JSON.stringify(wardrobe),before);
  if(intent==='Activewear')assert.ok(looks.every(x=>x.notices.some(n=>n.includes('actual activity'))));
  if(intent==='School')assert.ok(looks.every(x=>x.notices.some(n=>n.includes('dress code'))));
 });
}
const base=[row('shirt','Tops','T-shirt'),row('pants','Bottoms','Joggers'),row('sneakers','Shoes','Sneakers')];
test('pinned excluded season cannot bypass eligibility',()=>{
 const rows=[...base,row('winter-shirt','Tops','T-shirt','Blue',['Winter'])];
 assert.equal(style(rows,'Casual','Summer','winter-shirt').length,0);
});
test('pinned inappropriate footwear cannot be complete activewear',()=>{
 const rows=[...base,row('heels','Shoes','Heels')];
 assert.equal(style(rows,'Activewear','Fall','heels').length,0);
});
test('pinned dressy garment cannot become activewear',()=>{
 const rows=[...base,row('formal','Dresses','Formal dress')];
 assert.equal(style(rows,'Activewear','Fall','formal').length,0);
});
test('pinned summer layer is not promoted past season layer gate',()=>{
 const rows=[...base,row('coat','Outerwear','Coat')];
 assert.equal(style(rows,'Casual','Summer','coat').length,0);
});
test('eligible pinned item stays included in all options',()=>{
 const looks=style(base,'Activewear','Fall','sneakers');assert.ok(looks.length>0&&looks.every(x=>x.board.slots.shoes==='sneakers'));
});
test('only out of season wardrobe gives no outfit',()=>{
 assert.equal(style(base.map(x=>({...x,seasons:['Winter']})),'Casual','Summer').length,0);
});
test('only inappropriate footwear produces incomplete activewear',()=>{
 const rows=[...base.slice(0,2),row('heels','Shoes','Heels')],looks=style(rows,'Activewear');
 assert.ok(looks.length>0&&looks.every(x=>!x.board.slots.shoes&&x.missing.includes('shoes')));
 oracle(looks,rows,'Activewear','Fall');
});
test('unknown and estimated colors and absent seasons are disclosed',()=>{
 const rows=base.map((x,i)=>({...x,color:i===0?'Unknown':x.color,colorSource:i===1?'photo-estimate':'user',seasons:i===2?[]:x.seasons}));
 const looks=style(rows,'Activewear');assert.ok(looks.length);
 for(const x of looks){assert.ok(x.notices.some(n=>n.includes('colors are unknown')));assert.ok(x.notices.some(n=>n.includes('colors are estimated')));assert.ok(x.notices.some(n=>n.includes('seasonal details are unknown')));}
});
const dir={slot:'top',type:'T-shirt',label:'Synthetic trend',reason:'Fixture only',sourceId:'s',audiences:[],occasions:[],seasons:[]};
const source={id:'s',title:'Synthetic source',url:'https://example.com/style'};
test('malformed trend data does not crash or fabricate citations',()=>{
 const lib={sources:[null,source],directions:[null,{...dir,seasons:null},dir]};
 const looks=style(base,'Activewear','Fall',undefined,lib);assert.ok(looks.some(complete));assert.ok(looks.every(x=>x.references.length===1&&x.references[0].source.id==='s'));
});
test('unsafe or missing trend source cannot influence outfit references',()=>{
 const lib={sources:[{...source,url:'javascript:alert(1)'}],directions:[dir,{...dir,sourceId:'absent'}]};
 const looks=style(base,'Activewear','Fall',undefined,lib);assert.ok(looks.some(complete));assert.ok(looks.every(x=>x.references.length===0));
});
test('trend score cannot override explicit season exclusion',()=>{
 const rows=[...base,row('winter-top','Tops','Tank top','Red',['Winter'])];
 const lib={sources:[source],directions:[{...dir,type:'Tank top'},{...dir,type:'Tank top',label:'second'}]};
 const looks=style(rows,'Activewear','Summer',undefined,lib);assert.ok(looks.some(complete));oracle(looks,rows,'Activewear','Summer');
 assert.ok(looks.every(x=>!Object.values(x.board.slots).includes('winter-top')));
});
test('neutral coordinated choice outranks competing saturated patterns with equal garment type',()=>{
 const rows=[row('shirt','Tops','T-shirt','Red',['All seasons'],{pattern:'Striped'}),
 row('a-clash','Bottoms','Joggers','Purple',['All seasons'],{pattern:'Floral'}),
 row('z-neutral','Bottoms','Joggers','Black'),row('sneakers','Shoes','Sneakers','White')];
 const looks=style(rows,'Activewear');assert.equal(looks[0].board.slots.bottom,'z-neutral');
});
