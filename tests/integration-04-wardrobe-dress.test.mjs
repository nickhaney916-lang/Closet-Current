import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSyntheticWardrobeSession10,SYNTHETIC_SOURCES10,
 planOwnerBoundSelection10,prepareSourceBoundOutfit10,displaySourceBoundOutfit10} from '../research/integration-04-wardrobe-dress/account-source-bridge.mjs';

test('two separate nonproduction accounts, real original source fingerprints and sensible categories are pinned',()=>{
 assert.deepEqual(Object.keys(SYNTHETIC_SOURCES10),['shirt','public','second','dress']);
 assert.deepEqual([...new Set(Object.values(SYNTHETIC_SOURCES10).map(x=>x.sha))].length,4);
 for(const s of Object.values(SYNTHETIC_SOURCES10)){
  assert.match(s.url,/^\/benchmark\//);
  assert.match(s.sha,/^[a-f0-9]{64}$/);
  assert.ok(['Tops','Bottoms','Dresses'].includes(s.category));
  assert.ok(s.color&&s.itemType);
 }
 assert.throws(()=>createSyntheticWardrobeSession10({closets:{}}),/two local synthetic/);
});
test('session owner and generation change synchronously and log out revokes access',()=>{
 const closets={
  'fixture-account-a':[],
  'fixture-account-b':[]
 };
 const s=createSyntheticWardrobeSession10({closets});
 assert.equal(s.current().ownerId,'fixture-account-a');
 const first=s.current().generation;
 s.switchAccount('fixture-account-b');
 assert.ok(s.current().generation>first);
 assert.equal(s.current().ownerId,'fixture-account-b');
 assert.throws(()=>s.switchAccount('real-account-user'),/Unknown synthetic account/);
 s.logout();
 assert.equal(s.current().authenticated,false);
 assert.throws(()=>planOwnerBoundSelection10({},s.current,{}),/invalidated/);
});
test('cannot authorize any arbitrary user JPEG as a genuine skinned model',()=>{
 assert.throws(()=>displaySourceBoundOutfit10({viewer:{},prepared:{
  status:'original-photo-fallback'},live:()=>({authenticated:true})}),/Missing independently verified/);
 const files=['research/integration-04-wardrobe-dress/account-source-bridge.mjs',
  'research/integration-04-wardrobe-dress/wardrobe-demo.mjs'];
 const source=files.map(f=>readFileSync(f,'utf8')).join('\n');
 for(const key of ['createSyntheticWardrobeSession10','createAccountBoundCloset3DBridge',
  'prepareIndexedGarmentsFor3D','applyIndexed3DSelection','planOwnerBoundSelection10',
  'originalPhoto','SHA-256','readSavedItems','wrong-owner',
  'data:image/jpeg','getSessionGeneration','releaseAuthorized:false'])
  assert.ok(source.includes(key),key);
 assert.doesNotMatch(source,/createClient\(|supabase\.auth|fetch\('https:|localStorage\.setItem|indexedDB\.open/);
});

test('integration-03 source-bound denim flex is off unless locally opted-in and current-owner verified',()=>{
 const src=readFileSync('research/integration-04-wardrobe-dress/wardrobe-demo.mjs','utf8');
 assert.ok(src.includes("from '../dress-mobile-01/dress-mobile-showroom.mjs'"));
 assert.ok(src.includes("planSavedSourceDress({bound,live:current,slots,dress:dressCandidate})"));
 assert.ok(src.includes("app.applyOutfit('none')"));
 assert.ok(src.includes("photoDenimFlex79:new URLSearchParams(location.search).get('flex79')==='after'"));
 assert.ok(src.includes('window.ccWardrobeFlexPose=next=>'));
 assert.ok(src.includes('!authorized()||!viewerReady||!last3D'));
 assert.ok(src.includes('realKneeSkinnedBodyToDenimCrossings78!==0'));
 assert.doesNotMatch(src,/createClient\(|supabase\.auth/);
});

import {planSavedSourceDress,applySavedSourceDress,DRESS_SHA} from '../research/integration-04-wardrobe-dress/owner-dress-guard.mjs';
test('owner-bound original dress must be exclusive one-piece, source SHA-true and session current',()=>{
 const live=()=>({authenticated:true,ownerId:'fixture-account-a',generation:2});
 const item={id:'fixture-account-a-dress',ownerId:'fixture-account-a',category:'Dresses',itemType:'Dress',sourceSHA256:DRESS_SHA};
 const bound={ownerId:'fixture-account-a',generation:2,indexed:{byId:new Map([[item.id,item]])}};
 const dress={id:'commons-0053',sourceSHA256:DRESS_SHA,realFabricTexture:true};
 const plan=planSavedSourceDress({bound,live,slots:{top:item.id},dress});
 assert.equal(plan.sourceSHA256,DRESS_SHA);assert.equal(plan.releaseAuthorized,false);
 assert.throws(()=>planSavedSourceDress({bound,live,slots:{top:item.id,bottom:'jeans'},dress}),/One-piece/);
 assert.throws(()=>planSavedSourceDress({bound,live:()=>({...live(),generation:3}),slots:{top:item.id},dress}),/stale/);
 assert.throws(()=>planSavedSourceDress({bound,live,slots:{top:item.id},dress:{...dress,sourceSHA256:'0'.repeat(64)}}),/invalid/);
 assert.throws(()=>applySavedSourceDress({viewer:{},plan,live:()=>({...live(),ownerId:'fixture-account-b'})}),/revoked/);
});
test('actual anatomical one-piece verdict rejects pants, fake rig and photo drift',()=>{
 const live=()=>({authenticated:true,ownerId:'fixture-account-a',generation:2});
 const item={id:'a-dress',ownerId:'fixture-account-a',category:'Dresses',itemType:'Dress',sourceSHA256:DRESS_SHA};
 const bound={ownerId:'fixture-account-a',generation:2,indexed:{byId:new Map([[item.id,item]])}};
 const dress={id:'commons-0053',sourceSHA256:DRESS_SHA,realFabricTexture:true};
 const plan=planSavedSourceDress({bound,live,slots:{top:item.id},dress});
 const observed={mode:'dress',slots:['dress'],shirt:null,pants:null,dress:{sourceId:'commons-0053',sourceSHA256:DRESS_SHA,
  dress74ProvisionalDrape:true,dress74OriginalPhotoCoordinatesPreserved:true,dress74OriginalSkinWeightsPreserved:true,
  dress74SourcePhotographUnchanged:true,releaseAuthorized:false}};
 const viewer={applyOutfit:(type)=>assert.equal(type,'dress'),getState:()=>({stats:{bones:163},outfit:observed})};
 assert.equal(applySavedSourceDress({viewer,plan,live}).anatomicalSkeletonBones,163);
 observed.pants={};assert.throws(()=>applySavedSourceDress({viewer,plan,live}),/integrity/);observed.pants=null;
 observed.dress.sourceSHA256='0'.repeat(64);assert.throws(()=>applySavedSourceDress({viewer,plan,live}),/integrity/);
});
