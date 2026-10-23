const syntheticPhoto=require('./helpers/issue204-photo.cjs');
// Cross-feature integration from ACTUAL customer source functions: original
// unclipped RGB -> color provenance -> owned-only three outfits -> dress/normal
// fitting inputs -> account-scoped preview cache. No model or provider traffic.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ClothingDetails=require('../public/clothing-details.js');
const TryOn=require('../public/ai-tryon-plan.js');
const Cache=require('../public/figure-preview-cache.js');

const app=fs.readFileSync('public/app.js','utf8');
const first=app.indexOf('function recognitionSourcePhoto(');
const last=app.indexOf('function clothingFields(',first);
assert.ok(first>=0&&last>first,'original RGB source helper must exist');
const sandbox={URL,encodeURIComponent,Date,crypto:{randomUUID:()=> 'synthetic'}};
vm.createContext(sandbox);
vm.runInContext(app.slice(first,last),sandbox);
for(const f of ['outfit-matcher.js','trend-library.js','outfit-board-engine.js','closet-stylist-engine.js'])
 vm.runInContext(fs.readFileSync('public/'+f,'utf8'),sandbox);

const image=letter=>syntheticPhoto(letter);
const piece=(id,category,itemType,color='Black',extra={})=>({
 id,category,itemType,color,name:id,image:image('D'),pattern:'Solid',
 sleeveLength:'Unknown',fit:'Regular',seasons:[],...extra
});
function checkOwned(boards,owned,anchor){
 const valid=new Set(owned.map(x=>x.id));
 assert.ok(boards.length>0&&boards.length<=3);
 for(const option of boards){
  const ids=Object.values(option.board.slots);
  assert.ok(ids.includes(anchor),'newly recognized garment must stay included');
  assert.ok(ids.every(id=>valid.has(id)),'never recommend an unsaved/other-account piece');
  assert.equal(new Set(ids).size,ids.length,'no article fills multiple board positions');
  assert.deepEqual(Object.keys(option.board.ideas),[],'no shopping placeholders in owned-only flow');
 }
}
test('raw original outfit crop is classified before clip, then source-corrected top is styled with owned items',()=>{
 const full=image('A'),raw=image('B'),display=image('C'),normalized=image('Z');
 const item=piece('fresh-top','Tops','T-shirt','',{
  image:display,outfitSourceId:'first-scene',originalPhoto:{image:full},
  recognitionPhoto:{image:raw},normalizedPreview:{image:normalized}
 });
 const exact=structuredClone(item);
 assert.equal(sandbox.recognitionSourcePhoto(item),raw,'classification must use original unmasked RGB crop');
 const observed=ClothingDetails.fillColor(item,{
  color:'Black',source:'photo-estimate',method:'uniform-light-background',support:.95
 });
 const indexed=ClothingDetails.fill(observed,{category:'Tops',itemType:'T-shirt'},
  {color:'White',pattern:'Solid'});
 assert.equal(indexed.color,'Black','verified actual garment foreground beats white backdrop guess');
 assert.equal(indexed.colorMethod,'uniform-light-background','do not forge mask evidence');
 assert.equal(sandbox.recognitionSourcePhoto(indexed),raw);
 const owned=[indexed,piece('denim','Bottoms','Jeans','Blue'),
  piece('slacks','Bottoms','Trousers','Beige'),
  piece('shoes','Shoes','Sneakers','White'),
  piece('loafers','Shoes','Loafers','Brown')];
 const before=structuredClone(owned);
 const options=sandbox.styleOwnedCollection(owned,{
  request:'Casual',season:'Fall',audience:'All',anchorItemId:'fresh-top'
 });
 checkOwned(options,owned,'fresh-top');
 for(const option of options){
  assert.equal(option.board.slots.top,'fresh-top');
  assert.equal(option.board.slots.bottom!==undefined,true);
  const plan=TryOn.plan(option.board,owned);
  assert.ok(plan.steps.length>=1);
  assert.equal(plan.steps[0].image,display,'render ONLY approved visible garment, not the unmasked person-scene source');
  assert.ok(plan.steps.every(s=>s.image!==full&&s.image!==raw&&s.image!==normalized));
  assert.equal(plan.completeOutfit,false,'AI provider plan does not prove complete realistic fitting');
 }
 assert.deepEqual(owned,before,'styled outfits must not mutate saved clothing');
 assert.deepEqual(item,exact,'classification and styling cannot alter original source metadata');
});
test('a newly recognized dress stays a one-piece outfit, never gets false bottom or jacket',()=>{
 const owned=[piece('new-dress','Dresses','Casual dress','Red',{
   outfitSourceId:'second-scene',originalPhoto:{image:image('A')},
   recognitionPhoto:{image:image('B')},image:image('C')}),
  piece('heel','Shoes','Heels','Black'),piece('flat','Shoes','Flats','Brown'),
  piece('skirt','Bottoms','Skirt','Blue'),piece('sweater','Tops','Sweater','Black'),
  piece('coat','Outerwear','Coat','Black')];
 assert.equal(sandbox.recognitionSourcePhoto(owned[0]),image('B'));
 const looks=sandbox.styleOwnedCollection(owned,{
  request:'Casual',season:'Fall',audience:'Women',anchorItemId:'new-dress'
 });
 checkOwned(looks,owned,'new-dress');
 for(const option of looks){
  assert.equal(option.board.slots.top,'new-dress');
  for(const forbidden of ['bottom','layer','layer2','layer3'])
   assert.equal(option.board.slots[forbidden],undefined,'dress must not become a skirt/separates outfit');
  const plan=TryOn.plan(option.board,owned);
  assert.equal(plan.dress,true);
  assert.equal(plan.steps.length,1);
  assert.equal(plan.steps[0].category,'one-pieces');
  assert.equal(plan.steps[0].image,image('C'));
 }
});
test('restored whole-scene preview with missing unclipped RGB cannot masquerade as a new classified garment',()=>{
 const item=piece('missing-original','Uncategorized','Unknown','',{
  outfitSourceId:'restored-scene',originalPhoto:{image:image('A')},
  normalizedPreview:{image:image('Z')},image:image('C')});
 assert.equal(sandbox.recognitionSourcePhoto(item),null);
 assert.equal(sandbox.styleOwnedCollection([item],{
  anchorItemId:item.id,request:'Casual'}).length,0,'unverified candidate cannot be styled as known item');
});
test('account-specific figure cache cannot reuse a preview after owner/source switches',()=>{
 const cache=Cache.create(),q={id:'new-dress',owner:'account-A',
  source:image('C'),category:'Dresses',primaryColor:'Red'};
 assert.equal(cache.put(q,{image:image('P'),width:300,height:500}),true);
 assert.equal(cache.get(q)?.image,image('P'));
 assert.equal(cache.get({...q,owner:'account-B'}),null);
 assert.equal(cache.info().entryCount,0);
 assert.equal(cache.get(q),null);
 assert.equal(cache.put(q,{image:image('P'),width:300,height:500}),true);
 assert.equal(cache.get({...q,source:image('Q')}),null,'source/photo changes reject stale preview');
 cache.dispose();assert.equal(cache.info().entryCount,0);
});
