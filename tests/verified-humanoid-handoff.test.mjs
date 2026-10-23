import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {prepareVerifiedHumanoidOutfit} from '../public/prepare-verified-humanoid-outfit.mjs';
import {applyVerifiedHumanoidOutfit} from '../public/apply-verified-humanoid-outfit.mjs';
const photo=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,255,217]).toString('base64');
const item=(id,category,colorHex)=>({id,category,colorHex,image:photo(9),outfitSourceId:'session-1',originalPhoto:{image:photo(1)}});
const closet=[item('shirt','Tops','#ff0000'),item('pants','Bottoms','#0000ff'),item('dress','Dresses','#00ff00')];
const owns=(item,account)=>account==='a'&&item.id!=='foreign';
test('verified capture-to-renderer handoff resets stale layers across dress and separates photo bytes',async()=>{
 const calls=[];
 const renderer={supported:true,setOutfit:next=>{calls.push(next);return true;}};
 const first=await prepareVerifiedHumanoidOutfit({slots:{top:'shirt',bottom:'pants'}},closet.slice(0,2),'a',owns,webcrypto);
 assert.equal(applyVerifiedHumanoidOutfit(renderer,first),true);
 const second=await prepareVerifiedHumanoidOutfit({slots:{top:'dress'}},[closet[2]],'a',owns,webcrypto);
 assert.equal(applyVerifiedHumanoidOutfit(renderer,second),true);
 assert.equal(calls.length,2);
 assert.ok(Array.isArray(calls[1].dress));
 assert.equal(calls[1].top,null);
 assert.equal(calls[1].bottom,null);
 assert.equal(calls[1].layer2,null);
 assert.equal(JSON.stringify(calls).includes('data:image'),false);
});
test('failed account switch never reaches 3D renderer',async()=>{
 let calls=0;const renderer={supported:true,setOutfit:()=>{calls++;return true;}};
 await assert.rejects(()=>prepareVerifiedHumanoidOutfit({slots:{top:'shirt'}},[closet[0]],'b',owns,webcrypto));
 assert.equal(calls,0);
 assert.equal(applyVerifiedHumanoidOutfit({supported:false},{placeholderOnly:true}),false);
});
