import test from 'node:test';
import assert from 'node:assert/strict';
import {mountAlphaBuilderPreview} from '../public/family-alpha-preview-controller.mjs';

test('family-alpha-18: interrupted pending account check clears images and permits retry',async()=>{
 const oldWindow=globalThis.window,oldDocument=globalThis.document;
 globalThis.window=new EventTarget();globalThis.document={getElementById:()=>null};
 const box=()=>({hidden:true,replaceChildren(){this.cleared=true;}});
 const launch=Object.assign(new EventTarget(),{disabled:true}),review=box(),avatar=box();
 const owner='a1111111-1111-4111-8111-111111111111',db={name:'closet-current-user-'+owner};
 let release;
 const controller=mountAlphaBuilderPreview({panel:box(),launch,review,avatar,status:{},
  auth:{user:{id:owner},getSessionGeneration:()=>1,getAccessToken:()=>new Promise(r=>release=r)},
  cloud:{getOwnerId:()=>owner},getDatabase:()=>db,getLatestItem:()=>null,
  fetchFn:async()=>({ok:false,status:401}),publicKey:'synthetic',localApproved:true});
 try{
  const pending=controller.start();assert.equal(launch.disabled,true);
  window.dispatchEvent(new Event('closet:alpha-board-changed'));
  assert.equal(avatar.cleared,true);assert.equal(review.cleared,true);
  assert.equal(launch.disabled,false,'interrupted preview must not strand the retry button');
  release?.('mock');await pending;
  assert.equal(launch.disabled,false);
 }finally{controller.stop();globalThis.window=oldWindow;globalThis.document=oldDocument;}
});
