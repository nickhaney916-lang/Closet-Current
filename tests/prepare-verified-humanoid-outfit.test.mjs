import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {prepareVerifiedHumanoidOutfit} from '../public/prepare-verified-humanoid-outfit.mjs';
const jpeg=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,255,217]).toString('base64');
const item=(id,category,colorHex,source=jpeg(1))=>({id,category,colorHex,image:jpeg(9),outfitSourceId:'capture-1',originalPhoto:{image:source}});
const wardrobe=[item('shirt','Tops','#123456'),item('pants','Bottoms','#abcdef')];
const owner=(item,account)=>account==='account-1'&&item.id!=='foreign';
test('verified synthetic wardrobe feeds only selected procedural colors',async()=>{
 const result=await prepareVerifiedHumanoidOutfit({slots:{top:'shirt',bottom:'pants'}},wardrobe,'account-1',owner,webcrypto);
 assert.deepEqual(Object.keys(result.colors).sort(),['bottom','top']);
 assert.equal(result.selected.length,2);
 assert.equal(result.placeholderOnly,true);
 assert.equal(result.originalPixelsRenderedAs3D,false);
 assert.equal(JSON.stringify(result).includes('data:image'),false);
});
test('dress selects dress renderer color and excludes bottoms',async()=>{
 const dress=item('dress','Dresses','#334455');
 const result=await prepareVerifiedHumanoidOutfit({slots:{top:'dress'}},[dress],'account-1',owner,webcrypto);
 assert.deepEqual(Object.keys(result.colors),['dress']);
 await assert.rejects(()=>prepareVerifiedHumanoidOutfit({slots:{top:'dress',bottom:'pants'}},[dress,wardrobe[1]],'account-1',owner,webcrypto),/Dress outfit/);
});
test('source changes, missing items and switched account cannot silently reuse a verified outfit',async()=>{
 const first=await prepareVerifiedHumanoidOutfit({slots:{top:'shirt'}},[wardrobe[0]],'account-1',owner,webcrypto);
 const changed=await prepareVerifiedHumanoidOutfit({slots:{top:'shirt'}},[{...wardrobe[0],originalPhoto:{image:jpeg(2)}}],'account-1',owner,webcrypto);
 assert.notEqual(first.selected[0].sourceVersion,changed.selected[0].sourceVersion);
 await assert.rejects(()=>prepareVerifiedHumanoidOutfit({slots:{top:'shirt'}},[],'account-1',owner,webcrypto));
 await assert.rejects(()=>prepareVerifiedHumanoidOutfit({slots:{top:'shirt'}},[wardrobe[0]],'account-2',owner,webcrypto));
});
