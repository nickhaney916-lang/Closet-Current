'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../public/closet-review-engine.js');
const colors=require('../public/clothing-details.js').colors;
const example={
 id:'x-1',image:'original-saved-photo',recognitionPhoto:{image:'full-resolution-recognition'},
 originalPhoto:{image:'original-full-capture'},category:'Uncategorized',itemType:'Blazer',
 color:'Blue',colorSource:'photo-estimate',colorMethod:'garment-mask',
 sleeveLength:'Long sleeve',fit:'Fitted',savedAt:'2026-10-18T01:00:00Z',
 requiresOwnershipConfirmation:true,notes:'Kept fabric'
};
test('unsorted queue counts only saved uncategorized clothing and supports skip once per session',()=>{
 const items=[example,{...example,id:'x-2',category:'Tops'}, {...example,id:'x-3'}];
 assert.deepEqual(engine.pending(items).map(x=>x.id),['x-1','x-3']);
 assert.deepEqual(engine.pending(items,new Set(['x-1'])).map(x=>x.id),['x-3']);
 assert.equal(engine.needsReview({...example,category:'Shoes'}),false);
 assert.deepEqual(engine.pending(null),[]);
});
test('confirming category + user-chosen color leaves all original photo inputs intact',()=>{
 const before=JSON.stringify(example);
 const result=engine.confirm(example,'Outerwear','Green',colors);
 assert.equal(result.id,example.id);
 assert.equal(result.image,example.image);
 assert.deepEqual(result.recognitionPhoto,example.recognitionPhoto);
 assert.deepEqual(result.originalPhoto,example.originalPhoto);
 assert.equal(result.savedAt,example.savedAt);
 assert.equal(result.notes,example.notes);
 assert.equal(result.category,'Outerwear');
 assert.equal(result.itemType,'Unknown','Old AI subtype must not cross category changes');
 assert.equal(result.sleeveLength,'Unknown');
 assert.equal(result.color,'Green');
 assert.equal(result.colorSource,'user');
 assert.equal(result.colorMethod,undefined);
 assert.equal(result.userAdjusted,true);
 assert.equal(result.requiresOwnershipConfirmation,false);
 assert.equal(JSON.stringify(example),before);
});
test('bottoms and shoes never inherit an old incorrect sleeve classification',()=>{
 for(const category of ['Bottoms','Shoes','Accessories']){
  const value=engine.confirm(example,category,'Black',colors);
  assert.equal(value.sleeveLength,'Not applicable');
 }
});
test('cannot promote unidentified category or unconfirmed color into the owned wardrobe',()=>{
 for(const cat of ['',null,'Uncategorized','Unknown','Blazers']){
  assert.throws(()=>engine.confirm(example,cat,'Blue',colors));
 }
 for(const color of ['',null,'Unknown','transparent','Electric Laser Red']){
  assert.throws(()=>engine.confirm(example,'Tops',color,colors));
 }
 assert.throws(()=>engine.confirm({...example,category:'Shoes'},'Tops','Blue',colors),
  'Already reviewed garment cannot be silently rewritten by the unsorted queue');
});
test('quick review stays in closet, requires human color choice and never auto-runs paid recognition',()=>{
 const fs=require('node:fs');
 const source=fs.readFileSync('public/closet-browser.js','utf8');
 const html=fs.readFileSync('public/index.html','utf8');
 assert.match(source,/function reviewUnsortedClosetPiece\(/);
 assert.match(source,/ClosetReviewEngine\.confirm\(current,category\.value,color\.value,ClothingDetails\.colors\)/);
 assert.match(source,/await writeAll\(\[confirmed\]\)/);
 assert.match(source,/dialog\.showModal\(\)/);
 assert.match(source,/Skip for now/);
 assert.match(source,/View original photograph/);
 assert.match(html,/src="closet-review-engine\.js"/);
 assert.doesNotMatch(source.slice(source.indexOf('function reviewUnsortedClosetPiece('),source.indexOf("$('closetUnsorted').onclick")),/localRequest\(|checkPhoto\(|fetch\(/);
});
