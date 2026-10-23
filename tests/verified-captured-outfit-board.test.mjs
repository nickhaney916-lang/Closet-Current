import assert from 'node:assert/strict';
import {test} from 'node:test';
import {webcrypto} from 'node:crypto';
import {verifyCapturedOutfitBoard} from '../public/verified-captured-outfit-board.mjs';
const jpeg=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,255,217]).toString('base64');
const owned=(item,scope)=>scope==='account-1'&&item.id!=='foreign';
const item=(id,category,colorHex,source=jpeg(1))=>({id,category,colorHex,image:jpeg(9),outfitSourceId:'outfit-1',originalPhoto:{image:source}});
const board={slots:{top:'shirt',bottom:'pants'}};
test('saved board resolves verified shared source for multiple garments',async()=>{
 const result=await verifyCapturedOutfitBoard(board,[item('shirt','Tops','#123456'),item('pants','Bottoms','#abcdef')],'account-1',owned,webcrypto);
 assert.equal(result.selected.length,2);
 assert.equal(result.selected[0].sourceVersion,result.selected[1].sourceVersion);
 assert.equal(result.placeholderOnly,true);
});
test('changed original invalidates shared saved board even when previews stay unchanged',async()=>{
 const items=[item('shirt','Tops','#123456'),item('pants','Bottoms','#abcdef')];
 const before=await verifyCapturedOutfitBoard(board,items,'account-1',owned,webcrypto);
 const changed=items.map(x=>({...x,originalPhoto:{image:jpeg(2)}}));
 const after=await verifyCapturedOutfitBoard(board,changed,'account-1',owned,webcrypto);
 assert.notEqual(before.selected[0].sourceVersion,after.selected[0].sourceVersion);
 const mixed=[items[0],changed[1]];
 await assert.rejects(()=>verifyCapturedOutfitBoard(board,mixed,'account-1',owned,webcrypto),/Conflicting original photographs/);
});
test('saved board rejects deleted garments and foreign ownership',async()=>{
 await assert.rejects(()=>verifyCapturedOutfitBoard(board,[item('shirt','Tops','#123456')],'account-1',owned,webcrypto),/Missing saved wardrobe item/);
 await assert.rejects(()=>verifyCapturedOutfitBoard({slots:{top:'foreign'}},[item('foreign','Tops','#123456')],'account-1',owned,webcrypto),/ownership/);
});
