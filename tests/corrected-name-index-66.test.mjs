import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {syncOwnerGarmentName66} from '../research/corrected-name-index-66/owner-label-sync.mjs';
const sourceSHA256='e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff';
const baseline=()=>({
 id:'source-shoes-1',ownerId:'independent-test-owner-A',
 sourceSHA256,sourceHashVerified:true,sourcePieceKey:sourceSHA256+'/manual-123-44-42-88',
 originalPhoto:{sha256:sourceSHA256,image:'trusted original fixture bytes held outside this function'},
 image:'source-crop-intentionally-unchanged',
 sourceCropReviewed:true,extractionReview:'human-confirmed',
 confirmed:true,category:'Shoes',itemType:'Sneakers',color:'Blue',
 name:'Blue Sneakers',userAdjusted:true,colorSource:'user',threeDReady:false,
 recognitionSuggestion42:{source:'local-fashionclip',category:'Tops',
  itemType:'T-shirt',color:'Red'}
});
const changed=(before,props={})=>({...structuredClone(before),itemType:'Ankle boots',color:'Black',...props});
test('LABELSYNC66 corrected saved human shoe type/color updates exact prior generated name',()=>{
 const before=baseline(),after=changed(before);
 const originalJSON=JSON.stringify(before),target=JSON.stringify(after);
 assert.deepEqual(syncOwnerGarmentName66(before,after),{
  name:'Black Ankle boots',renamed:true,reason:'human-corrected-derived-label'
 });
 assert.equal(JSON.stringify(before),originalJSON);
 assert.equal(JSON.stringify(after),target,'Pure name suggestion cannot overwrite original JPEG/crop/owner DB');
});
test('LABELSYNC66 explicit custom name before the edit must survive category/subtype/color correction',()=>{
 const before={...baseline(),name:'My favorite weekend shoes'},after=changed(before);
 assert.deepEqual(syncOwnerGarmentName66(before,after),{
  name:'My favorite weekend shoes',renamed:false,reason:'existing-custom-name-preserved'
 });
});
test('LABELSYNC66 user edits Name and color in same save; custom Name always wins',()=>{
 const before=baseline(),after=changed(before,{name:'My gym shoes'});
 assert.equal(syncOwnerGarmentName66(before,after).name,'My gym shoes');
 assert.equal(syncOwnerGarmentName66(before,after).renamed,false);
});
test('LABELSYNC66 subtype-only correction keeps confirmed human original color',()=>{
 const before=baseline();
 assert.equal(syncOwnerGarmentName66(before,{...before,itemType:'Ankle boots'}).name,'Blue Ankle boots');
});
test('LABELSYNC66 color-only correction updates search title instead of retaining old color',()=>{
 const before=baseline();
 assert.equal(syncOwnerGarmentName66(before,{...before,color:'Black'}).name,'Black Sneakers');
});
test('LABELSYNC66 corrected category and subtype move generated title without trusting previous model hints',()=>{
 const before={...baseline(),category:'Tops',itemType:'T-shirt',color:'Red',name:'Red T-shirt'};
 const after={...before,category:'Outerwear',itemType:'Jacket',color:'Green'};
 assert.equal(syncOwnerGarmentName66(before,after).name,'Green Jacket');
 assert.equal(before.recognitionSuggestion42.itemType,'T-shirt');
});
test('LABELSYNC66 ambiguous type Other uses corrected broad category for a useful closet title',()=>{
 const before={...baseline(),category:'Tops',itemType:'Other',color:'Blue',name:'Blue Other'};
 const after={...before,category:'Outerwear',itemType:'Other',color:'Black'};
 assert.equal(syncOwnerGarmentName66(before,after).name,'Black Outerwear');
});
test('LABELSYNC66 normal notes-only and sizing edits cannot rename any garment',()=>{
 const before=baseline();
 for(const b of [{...before,notes:'Special pair'},{...before,material:'Leather'},
  {...before,seasons:['Winter']}])
  assert.equal(syncOwnerGarmentName66(before,b).renamed,false);
});
test('LABELSYNC66 never invents title change on unverified or forged photograph provenance',()=>{
 const original=baseline();
 const mutate=[
  {sourceCropReviewed:false},{extractionReview:'model-confirmed'},
  {sourceHashVerified:false},{sourceSHA256:'0'.repeat(64)},
  {sourcePieceKey:'forged-source/seg-0-0'},
  {originalPhoto:{sha256:'0'.repeat(64)}},
  {category:'Accessories'},{ownerId:'different-owner',sourcePieceKey:null}
 ];
 for(const edit of mutate){
  const before={...original,...edit};
  assert.equal(syncOwnerGarmentName66(before,changed(before)).renamed,false,JSON.stringify(edit));
 }
});
test('LABELSYNC66 no silent rename for old manually entered custom label approximating category',()=>{
 const before={...baseline(),name:'Blue Gym Sneakers'};
 assert.equal(syncOwnerGarmentName66(before,changed(before)).name,'Blue Gym Sneakers');
});
test('LABELSYNC66 no unexpected rename for explicit name clearing',()=>{
 const before=baseline();
 assert.equal(syncOwnerGarmentName66(before,changed(before,{name:'Closet piece'})).name,'Closet piece');
});
test('LABELSYNC66 if confirmed fields cleared name follows only actual reviewed fields, not obsolete label',()=>{
 const before=baseline();
 assert.equal(syncOwnerGarmentName66(before,{...before,color:''}).name,'Sneakers');
});
test('LABELSYNC66 invalid/null untrusted source cannot cause a mislabeled saved item',()=>{
 assert.throws(()=>syncOwnerGarmentName66(null,{}),/saved rows required/);
 assert.throws(()=>syncOwnerGarmentName66(baseline(),null),/saved rows required/);
 assert.throws(()=>syncOwnerGarmentName66(baseline(),changed(baseline(),{name:12})),/human garment fields/);
 assert.throws(()=>syncOwnerGarmentName66(baseline(),changed(baseline(),{name:'A'.repeat(121)})),/human garment fields/);
});
test('LABELSYNC66 actual native corrected-name adapter requires explicit opt-in and preserves CAS owner-proof writer',()=>{
 const app=readFileSync('public/app.js','utf8');
 assert.match(app,/get\('correctedName66'\)==='research'/);
 assert.match(app,/expectedSavedRow\.sourcePieceKey/);
 assert.match(app,/syncOwnerGarmentName66\(before,updated\)\.name/);
 assert.match(app,/commitOwnerCorrection10\(updated,before,null\)/);
 const syncAt=app.indexOf('syncOwnerGarmentName66(before,updated).name');
 const commitAt=app.indexOf('commitOwnerCorrection10(updated,before,null)');
 assert.ok(syncAt>0&&syncAt<commitAt,'Updated generated title must be inside pre-commit CAS snapshot');
});
test('LABELSYNC66 genuine browser regression is source-verified private correction, search and V4 recovery, not model accuracy',()=>{
 const runner=readFileSync('scripts/test-multi-garment-capture-01-browser.mjs','utf8');
 assert.match(runner,/const name66=process\.env\.NAME66==='1'/);
 assert.match(runner,/correctedName66=research/);
 assert.match(runner,/05a-before-correction-old-blue-shoes-all/);
 assert.match(runner,/05b-after-correction-new-black-boots-all/);
 assert.match(runner,/getByLabel\('Item type',\{exact:true\}\)\.selectOption\('Ankle boots'\)/);
 assert.match(runner,/getByLabel\('Color',\{exact:true\}\)\.fill\('Black'\)/);
 assert.match(runner,/sourceSHA256,sourceHash/);
 assert.match(runner,/recovered\.originalPhoto\.sha256,sourceHash/);
 assert.match(runner,/restoreAtomic01Bridge\.importBackup/);
 assert.match(runner,/multi24-B/);
});
