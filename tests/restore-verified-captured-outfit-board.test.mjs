import assert from 'node:assert/strict';
import {test} from 'node:test';
import {webcrypto} from 'node:crypto';
import {verifyCapturedOutfitBoard} from '../public/verified-captured-outfit-board.mjs';
import {restoreVerifiedCapturedOutfitBoard} from '../public/restore-verified-captured-outfit-board.mjs';
const jpeg=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,255,217]).toString('base64');
const owns=()=>true;
const make=(id,category,colorHex,n=1)=>({id,category,colorHex,image:jpeg(8),originalPhoto:{image:jpeg(n)},outfitSourceId:'capture-1'});
const board={slots:{top:'top',bottom:'bottom'}};
const garments=n=>[make('top','Tops','#112233',n),make('bottom','Bottoms','#445566',n)];
test('restores saved outfit with unchanged original source versions',async()=>{
 const saved=await verifyCapturedOutfitBoard(board,garments(1),'owner',owns,webcrypto);
 const restored=await restoreVerifiedCapturedOutfitBoard(saved,board,garments(1),'owner',owns,webcrypto);
 assert.deepEqual(restored.selected,saved.selected);
});
test('invalidates saved outfit when original changes but crop does not',async()=>{
 const saved=await verifyCapturedOutfitBoard(board,garments(1),'owner',owns,webcrypto);
 await assert.rejects(()=>restoreVerifiedCapturedOutfitBoard(saved,board,garments(2),'owner',owns,webcrypto),/source changed/);
});
test('invalidates saved outfit after garment removal, substitution or source reassignment',async()=>{
 const saved=await verifyCapturedOutfitBoard(board,garments(1),'owner',owns,webcrypto);
 await assert.rejects(()=>restoreVerifiedCapturedOutfitBoard(saved,board,garments(1).slice(0,1),'owner',owns,webcrypto));
 const substitute=[make('other','Tops','#112233'),garments(1)[1]];
 await assert.rejects(()=>restoreVerifiedCapturedOutfitBoard(saved,{slots:{top:'other',bottom:'bottom'}},substitute,'owner',owns,webcrypto),/source changed/);
 const reassigned=garments(1).map(x=>({...x,outfitSourceId:'capture-2'}));
 await assert.rejects(()=>restoreVerifiedCapturedOutfitBoard(saved,board,reassigned,'owner',owns,webcrypto),/source changed/);
});
test('rejects tampered saved snapshots and duplicate slots',async()=>{
 const saved=await verifyCapturedOutfitBoard(board,garments(1),'owner',owns,webcrypto);
 await assert.rejects(()=>restoreVerifiedCapturedOutfitBoard({...saved,selected:[saved.selected[0],saved.selected[0]]},board,garments(1),'owner',owns,webcrypto));
});

test('rejects saved snapshot from another account even when item IDs and sources match',async()=>{
 const saved=await verifyCapturedOutfitBoard(board,garments(1),'owner',owns,webcrypto);
 await assert.rejects(()=>restoreVerifiedCapturedOutfitBoard(saved,board,garments(1),'other-owner',owns,webcrypto),/account scope mismatch/);
 await assert.rejects(()=>restoreVerifiedCapturedOutfitBoard({...saved,accountId:undefined},board,garments(1),'owner',owns,webcrypto),/account scope mismatch/);
});
