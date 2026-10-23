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
