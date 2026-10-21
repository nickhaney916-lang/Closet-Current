'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const ClothingDetails=require('../public/clothing-details.js');
const choice={category:'Shoes',itemType:'Sneakers',sleeveLength:'Not applicable'};

test('verified mask color keeps provenance and beats a conflicting classifier guess',()=>{
 const incoming={id:'item-one',category:'Shoes',itemType:'Sneakers',color:''};
 const fromMask=ClothingDetails.fillColor(incoming,{color:'Blue',method:'garment-mask',needsConfirmation:false});
 assert.equal(fromMask.color,'Blue');
 assert.equal(fromMask.colorSource,'photo-estimate');
 assert.equal(fromMask.colorMethod,'garment-mask');
 const item=ClothingDetails.fill(fromMask,choice,{color:'Red',pattern:'Solid'});
 assert.equal(item.color,'Blue','an independently verified garment pixel sample outranks a model-only guess');
 assert.equal(item.colorMethod,'garment-mask');
 assert.equal(item.colorSource,'photo-estimate');
 assert.equal(item.pattern,'Solid','unrelated verified detail still fills');
 assert.equal(incoming.color,'','source object must remain unchanged');
});
test('verified white-background segmentation color keeps original-pixel evidence',()=>{
 const mask=ClothingDetails.fillColor({category:'Shoes',color:''},{
  color:'Black',method:'uniform-light-background',needsConfirmation:false});
 const item=ClothingDetails.fill(mask,choice,{color:'White'});
 assert.equal(item.color,'Black');
 assert.equal(item.colorMethod,'uniform-light-background');
});
test('an ordinary photo estimate can still be corrected by independently verified model detail',()=>{
 const photo=ClothingDetails.fillColor({category:'Shoes',color:''},{color:'Beige'});
 assert.equal(photo.color,'Beige');
 assert.equal(photo.colorMethod,undefined);
 const updated=ClothingDetails.fill(photo,choice,{color:'Brown'});
 assert.equal(updated.color,'Brown');
 assert.equal(updated.colorSource,'recognition');
});
test('uncertain foreground evidence never creates a verified photo color',()=>{
 const value=ClothingDetails.fillColor({category:'Shoes',color:''},{
  color:'Red',method:'garment-mask',needsConfirmation:true});
 assert.equal(value.color,'');
 assert.equal(value.colorMethod,undefined);
});
test('color from user correction always wins during automatic detail completion',()=>{
 const original={category:'Shoes',color:'Green',colorSource:'user',colorMethod:null};
 const photo=ClothingDetails.fillColor(original,{color:'Blue',method:'garment-mask'});
 const result=ClothingDetails.fill(photo,choice,{color:'Red'});
 assert.equal(result.color,'Green');
 assert.equal(result.colorSource,'user');
});
test('unrecognized or unverified method cannot impersonate a garment-mask observation',()=>{
 for(const method of ['crop-preview','original-background','garment-mask-unverified',null]){
  const withColor=ClothingDetails.fillColor({category:'Shoes',color:''},{color:'Blue',method});
  assert.equal(withColor.colorMethod,undefined);
  const result=ClothingDetails.fill(withColor,choice,{color:'Red'});
  assert.equal(result.color,'Red');
  assert.equal(result.colorSource,'recognition');
 }
});
test('clothing category mismatch does not import unrelated color detail',()=>{
 const photo=ClothingDetails.fillColor({category:'Bottoms',color:''},{color:'Blue',method:'garment-mask'});
 const unexpected=ClothingDetails.fill(photo,choice,{color:'Red'});
 assert.equal(unexpected.category,'Bottoms');
 assert.equal(unexpected.color,'Blue');
 assert.equal(unexpected.colorMethod,'garment-mask');
});
