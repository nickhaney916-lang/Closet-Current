'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const engine=readFileSync('public/outfit-board-engine.js','utf8');
const source=readFileSync('public/saved-outfit-search.js','utf8');
const context=vm.createContext({});
vm.runInContext(engine.slice(0,engine.indexOf('function cleanOutfitBoard'))+
 source.slice(0,source.indexOf('let savedOutfitSearchView')),context);
const category=(id,name,ownerId='A')=>({id,name,ownerId,category:'Tops',itemType:'T-shirt',color:'Pewter'});
test('indexes stored name/occasion and current admitted garment metadata',()=>{
 const board={name:'  Friday   Plans ',occasion:'Dinner',slots:{top:'current',bottom:'absent'}};
 let wardrobe=new Map([['current',category('current','Travel  Shirt')]]);
 assert.equal(context.savedOutfitSearchText(board,wardrobe,'A'),'friday plans dinner travel shirt tops t-shirt pewter');
 wardrobe=new Map([['current',category('current','Edited Shirt')]]);
 assert.match(context.savedOutfitSearchText(board,wardrobe,'A'),/edited shirt/);
 assert.doesNotMatch(context.savedOutfitSearchText(board,wardrobe,'A'),/travel shirt|absent/);
 assert.equal(context.normalizeSavedOutfitSearch('  DINNER\t PEWTER '),'dinner pewter');
});
test('missing, foreign, category-incompatible and unsupported slots cannot supply garment matches',()=>{
 const wardrobe=new Map([
  ['foreign',category('foreign','Foreign name','B')],
  ['wrong',category('wrong','Unsupported bottom match')],
  ['invented',category('invented','Unsupported slot')]
 ]);
 const board={name:'Saved',occasion:'Work',slots:{top:'foreign',bottom:'wrong',hat:'invented',shoes:'missing'}};
 assert.equal(context.savedOutfitSearchText(board,wardrobe,'A'),'saved work');
});
