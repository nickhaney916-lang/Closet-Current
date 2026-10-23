import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mapSavedOutfitToAvatar} from '../public/humanoid-3d-outfit-adapter.mjs';
const item=(category,originalPhotoId,colorHex,accountId='a')=>({category,originalPhotoId,colorHex,accountId});
test('maps account-scoped original-photo garment metadata without exposing photos',()=>{
 const result=mapSavedOutfitToAvatar({items:[item('Tops','original-1','#ff0000'),item('Bottoms','original-2','#0000ff')]},'a');
 assert.deepEqual(result.colors.top,[1,0,0,1]);
 assert.deepEqual(result.colors.bottom,[0,0,1,1]);
 assert.deepEqual(result.sourceIds,['original-1','original-2']);
 assert.equal(result.syntheticPlaceholderOnly,true);
});
test('rejects cross-account and absent original source identities',()=>{
 assert.throws(()=>mapSavedOutfitToAvatar({items:[item('Tops','orig','#ffffff','b')]},'a'),/Foreign/);
 assert.throws(()=>mapSavedOutfitToAvatar({items:[item('Tops','','#ffffff')]},'a'),/Original/);
});
test('rejects duplicate source, bad color, and ambiguous layers',()=>{
 assert.throws(()=>mapSavedOutfitToAvatar({items:[item('Tops','same','#ffffff'),item('Shoes','same','#ffffff')]},'a'),/Duplicate/);
 assert.throws(()=>mapSavedOutfitToAvatar({items:[item('Tops','x','blue')]},'a'),/color/);
 assert.throws(()=>mapSavedOutfitToAvatar({items:[item('Tops','x','#ffffff'),item('Tops','y','#000000')]},'a'),/Multiple/);
});
