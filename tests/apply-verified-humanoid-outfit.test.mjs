import test from 'node:test';
import assert from 'node:assert/strict';
import {applyVerifiedHumanoidOutfit,clearVerifiedHumanoidOutfit} from '../public/apply-verified-humanoid-outfit.mjs';
const top={slot:'top',itemId:'shirt',sourceIdentity:'capture',sourceVersion:'sha'};
const bottom={slot:'bottom',itemId:'pants',sourceIdentity:'capture',sourceVersion:'sha'};
const rgba=[.1,.2,.3,1];
test('clears all previous renderer layers during account/outfit replacement',()=>{
 const calls=[];const renderer={supported:true,setOutfit:payload=>{calls.push(payload);return true;}};
 assert.equal(applyVerifiedHumanoidOutfit(renderer,{placeholderOnly:true,originalPixelsRenderedAs3D:false,selected:[top,bottom],colors:{top:rgba,bottom:rgba}}),true);
 assert.deepEqual(calls[0].bottom,rgba);
 assert.equal(calls[0].layer2,null);
 assert.equal(applyVerifiedHumanoidOutfit(renderer,{placeholderOnly:true,originalPixelsRenderedAs3D:false,selected:[top],colors:{top:rgba}}),true);
 assert.equal(calls[1].bottom,null);
 assert.equal(calls[1].dress,null);
});
test('unsupported renderer safely preserves 2D fallback',()=>{
 assert.equal(applyVerifiedHumanoidOutfit({supported:false},{placeholderOnly:true}),false);
});
test('rejects extra colors and incomplete selection before renderer call',()=>{
 let called=false;const renderer={supported:true,setOutfit:()=>{called=true;return true;}};
 assert.throws(()=>applyVerifiedHumanoidOutfit(renderer,{placeholderOnly:true,originalPixelsRenderedAs3D:false,selected:[top],colors:{top:rgba,layer2:rgba}}),/match selected/);
 assert.equal(called,false);
});

test('renderer boundary rejects spoofed source identity, duplicate garments, invalid colors and dress conflicts',()=>{
 let calls=0;const renderer={supported:true,setOutfit:()=>{calls++;return true;}};
 const base={placeholderOnly:true,originalPixelsRenderedAs3D:false,selected:[top],colors:{top:rgba}};
 assert.throws(()=>applyVerifiedHumanoidOutfit(renderer,{...base,selected:[{...top,sourceVersion:''}]}),/Incomplete/);
 assert.throws(()=>applyVerifiedHumanoidOutfit(renderer,{...base,selected:[top,{...top,slot:'bottom'}],colors:{top:rgba,bottom:rgba}}),/Duplicate/);
 assert.throws(()=>applyVerifiedHumanoidOutfit(renderer,{...base,colors:{top:[1,2,3,4]}}),/RGBA/);
 assert.throws(()=>applyVerifiedHumanoidOutfit(renderer,{...base,selected:[top,bottom],colors:{dress:rgba,bottom:rgba}}),/Invalid dress/);
 assert.equal(calls,0);
});

test('sign-out clears all garment slots before a new account is verified',()=>{
 const calls=[];const renderer={supported:true,setOutfit:next=>{calls.push(next);return true;}};
 applyVerifiedHumanoidOutfit(renderer,{placeholderOnly:true,originalPixelsRenderedAs3D:false,selected:[top],colors:{top:rgba}});
 assert.equal(clearVerifiedHumanoidOutfit(renderer),true);
 assert.deepEqual(Object.keys(calls[1]).sort(),['top','bottom','shoes','layer','layer2','layer3','dress'].sort());
 assert.ok(Object.values(calls[1]).every(value=>value===null));
 assert.equal(clearVerifiedHumanoidOutfit({supported:false}),false);
});

test('lost or disposed WebGL context returns 2D fallback instead of reporting success',()=>{
 const prepared={placeholderOnly:true,originalPixelsRenderedAs3D:false,selected:[top],colors:{top:rgba}};
 let calls=0;
 for(const flag of ['lost','disposed']){
  const renderer={supported:true,getState:()=>({[flag]:true}),setOutfit:()=>{calls++;return true;}};
  assert.equal(applyVerifiedHumanoidOutfit(renderer,prepared),false);
 }
 assert.equal(calls,0);
 const renderer={supported:true,getState:()=>({lost:false,disposed:false}),setOutfit:()=>false};
 assert.equal(applyVerifiedHumanoidOutfit(renderer,prepared),false);
});

test('WebGL exception during outfit update does not crash the 2D fallback path',()=>{
 const prepared={placeholderOnly:true,originalPixelsRenderedAs3D:false,selected:[top],colors:{top:rgba}};
 const renderer={supported:true,setOutfit:()=>{throw Error('WebGL context lost');}};
 assert.equal(applyVerifiedHumanoidOutfit(renderer,prepared),false);
 assert.equal(clearVerifiedHumanoidOutfit(renderer),false);
});

test('renderer state inspection exceptions preserve fallback both before and after rendering',()=>{
 const prepared={placeholderOnly:true,originalPixelsRenderedAs3D:false,selected:[top],colors:{top:rgba}};
 let calls=0;
 assert.equal(applyVerifiedHumanoidOutfit({supported:true,getState:()=>{throw Error('context inaccessible');},setOutfit:()=>{calls++;return true;}},prepared),false);
 assert.equal(calls,0);
 assert.equal(applyVerifiedHumanoidOutfit({supported:true,getState:()=>{if(calls++)throw Error('context lost after draw');return {};},setOutfit:()=>true},prepared),false);
});
