const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Details=require('../public/clothing-details.js');
const PhotoColor=require('../public/photo-color.js');

const choice={category:'Tops',itemType:'Button-down shirt',sleeveLength:'Long sleeve'};
const source=()=>({id:'owner-piece-1',ownerId:'owner-A',sourceSHA256:'a'.repeat(64),
 originalPhoto:{sha256:'a'.repeat(64),image:'private-source-placeholder'},
 sourcePieceKey:'a'.repeat(64)+'/seg-4-0',category:'Tops',itemType:'Blouse',
 color:'Green',colorSource:'user',pattern:'Floral',fit:'Regular',confirmed:true});
test('user selected color cannot be overwritten even by explicit crop approval',()=>{
 const before=source();
 const after=Details.fill(before,choice,{color:'Blue',pattern:'Striped',fit:'Oversized'},true);
 assert.equal(after.color,'Green');assert.equal(after.colorSource,'user');
 assert.equal(after.pattern,'Striped','non-color deliberate overwrite remains supported');
 assert.equal(after.fit,'Oversized','non-color deliberate overwrite remains supported');
 assert.equal(before.pattern,'Floral','original input unchanged');
});
test('user correction continues to win after repeated conflicting model results',()=>{
 let item=source();
 for(const modelColor of ['Red','Blue','Black','White','Multicolor']){
  item=Details.fill(item,choice,{color:modelColor},true);
  item=Details.fill(item,choice,{color:modelColor});
  item=Details.fillColor(item,{color:modelColor,source:'photo-estimate',support:.99});
  assert.equal(item.color,'Green');assert.equal(item.colorSource,'user');
 }
 assert.equal(item.sourceSHA256,'a'.repeat(64));
 assert.equal(item.originalPhoto.sha256,item.sourceSHA256);
 assert.equal(item.ownerId,'owner-A');
 assert.equal(item.confirmed,true);
});
test('user-cleared blank color is not silently refilled by high-confidence worker',()=>{
 for(const color of ['', 'Unknown']){
  const before={...source(),color};
  const p=Details.fillColor(before,{color:'Red',source:'photo-estimate',support:1});
  assert.strictEqual(p,before);
  for(const overwrite of [true,false]){
   const c=Details.fill(before,choice,{color:'Blue'},overwrite);
   assert.equal(c.color,color);
   assert.equal(c.colorSource,'user');
  }
 }
});
test('model estimate and review output still update nonuser unconfirmed fields',()=>{
 const original={...source(),color:'Gray',colorSource:'photo-estimate',colorMethod:undefined};
 const result=Details.fill(original,choice,{color:'Blue',pattern:'Checked'});
 assert.equal(result.color,'Blue');assert.equal(result.colorSource,'recognition');
 assert.equal(result.pattern,'Floral','implicit recognition does not overwrite other existing details');
 const explicit=Details.fill(original,choice,{color:'Red',pattern:'Checked'},true);
 assert.equal(explicit.color,'Red');assert.equal(explicit.colorSource,'recognition');
 assert.equal(explicit.pattern,'Checked');
 const empty={...source(),color:'',colorSource:undefined};
 const estimate=Details.fillColor(empty,{color:'Red',source:'photo-estimate',support:.95});
 assert.equal(estimate.color,'Red');assert.equal(estimate.colorSource,'photo-estimate');
});
test('masked photocolor remains protected except under deliberate overwrite when not user confirmed',()=>{
 const masked={...source(),color:'Blue',colorSource:'photo-estimate',colorMethod:'garment-mask'};
 assert.equal(Details.fill(masked,choice,{color:'Brown'}).color,'Blue');
 assert.equal(Details.fill(masked,choice,{color:'Brown'},true).color,'Brown');
 const nowConfirmed={...masked,colorSource:'user'};
 assert.equal(Details.fill(nowConfirmed,choice,{color:'Brown'},true).color,'Blue');
});
test('a genuine uncertain PhotoColor estimate is refused after user manual correction',()=>{
 const data=new Uint8ClampedArray(16*16*4);
 for(let y=0;y<16;y++)for(let x=0;x<16;x++)
  data.set([...(x<8?[4,4,4]:[249,249,249]),255],(y*16+x)*4);
 const estimate=PhotoColor.estimate(data,16,16);
 assert.equal(estimate.needsConfirmation,true);
 assert.equal(estimate.color,'Multicolor');
 const before={...source(),color:''};
 assert.strictEqual(Details.fillColor(before,estimate),before);
 assert.equal(Details.fill(before,choice,{color:'Blue'},true).color,'');
});
test('manual color survives a known broad category mismatch and has no owner/source mutation',()=>{
 const before={...source(),category:'Dresses'};
 const result=Details.fill(before,choice,{color:'Pink'},true);
 assert.equal(result.color,'Green');assert.equal(result.colorSource,'user');
 assert.equal(result.category,'Dresses');
 assert.equal(result.ownerId,before.ownerId);
 assert.equal(result.sourcePieceKey,before.sourcePieceKey);
 assert.deepEqual(result.originalPhoto,before.originalPhoto);
});
test('invalid estimate does not silently overwrite manual even when user confirmed blank',()=>{
 const before={...source(),color:'',colorSource:'user'};
 for(const suggestion of [{color:'Red',needsConfirmation:true},{color:'Blue',support:Infinity},
  {color:'Black',needsConfirmation:'false'},{color:'Multicolor',support:1}])
  assert.strictEqual(Details.fillColor(before,suggestion),before);
});
test('the actual camera/edit UI explicitly stamps manual colors and uses shared gate',()=>{
 const app=fs.readFileSync('public/app.js','utf8');
 const shared=fs.readFileSync('public/clothing-details.js','utf8');
 assert.match(app,/if\(key==='color'\)item\.colorSource='user'/);
 assert.match(app,/if\(value\.color&&value\.colorSource==='photo-estimate'\)value\.colorSource='user'/);
 assert.match(app,/Object\.assign\(item,ClothingDetails\.fill\(item,result\.choices\[0\],result\.details\)\)/);
 assert.match(app,/ClothingDetails\.fillColor\(value,photo\.maskApplied\?/);
 assert.match(shared,/if\(key==='color'&&out\.colorSource==='user'\)continue/);
 assert.match(shared,/item\.colorSource==='user'/);
});
