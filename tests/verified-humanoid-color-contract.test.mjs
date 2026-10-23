import test from 'node:test';
import assert from 'node:assert/strict';
import {toVerifiedHumanoidColors} from '../public/verified-humanoid-color-contract.mjs';
const source=(slot,itemId)=>({slot,itemId,sourceIdentity:'source-'+itemId,sourceVersion:'sha256:verified'});
const red=[1,0,0,1],blue=[0,0,1,1];
test('verified top and bottom map to procedural humanoid colors',()=>{
 const colors=toVerifiedHumanoidColors({placeholderOnly:true,selected:[source('top','a'),source('bottom','b')],colors:{top:red,bottom:blue},hasDress:false});
 assert.deepEqual(colors,{top:red,bottom:blue});
 assert.notStrictEqual(colors.top,red);
});
test('verified dress maps top garment to dress mesh without trousers',()=>{
 const colors=toVerifiedHumanoidColors({placeholderOnly:true,selected:[source('top','dress')],colors:{top:red},hasDress:true});
 assert.deepEqual(colors,{dress:red});
});
test('unverified, duplicate, incomplete and missing color selections fail closed',()=>{
 const valid={placeholderOnly:true,selected:[source('top','a')],colors:{top:red},hasDress:false};
 for(const bad of [{...valid,placeholderOnly:false},{...valid,selected:[source('top','a'),source('bottom','a')]},{...valid,selected:[{slot:'top',itemId:'a'}]},{...valid,colors:{}},{...valid,colors:{top:[2,0,0,1]}}]){
  assert.throws(()=>toVerifiedHumanoidColors(bad));
 }
});

test('unselected renderer layers and conflicting dress outerwear are rejected',()=>{
 const top=source('top','a');
 assert.throws(()=>toVerifiedHumanoidColors({placeholderOnly:true,selected:[top],colors:{top:red,layer:blue},hasDress:false}),/Unselected/);
 assert.throws(()=>toVerifiedHumanoidColors({placeholderOnly:true,selected:[top,source('layer2','coat')],colors:{top:red,layer2:blue},hasDress:true}),/Invalid dress/);
 assert.throws(()=>toVerifiedHumanoidColors({placeholderOnly:true,selected:[{...top,slot:'unknown'}],colors:{top:red},hasDress:false}));
});

test('direct dress color injection cannot bypass verified top source',()=>{
 const top=source('top','a');
 assert.throws(()=>toVerifiedHumanoidColors({placeholderOnly:true,selected:[top],colors:{top:red,dress:blue},hasDress:true}),/Dress renderer color/);
 assert.throws(()=>toVerifiedHumanoidColors({placeholderOnly:true,selected:[source('dress','a')],colors:{dress:red},hasDress:false}));
});
