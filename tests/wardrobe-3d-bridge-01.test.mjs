import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSyntheticWardrobeSession10,SYNTHETIC_SOURCES10,
 planOwnerBoundSelection10,prepareSourceBoundOutfit10,displaySourceBoundOutfit10} from '../research/wardrobe-3d-bridge-01/account-source-bridge.mjs';

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
 const files=['research/wardrobe-3d-bridge-01/account-source-bridge.mjs',
  'research/wardrobe-3d-bridge-01/wardrobe-demo.mjs'];
 const source=files.map(f=>readFileSync(f,'utf8')).join('\n');
 for(const key of ['createSyntheticWardrobeSession10','createAccountBoundCloset3DBridge',
  'prepareIndexedGarmentsFor3D','applyIndexed3DSelection','planOwnerBoundSelection10',
  'originalPhoto','SHA-256','readSavedItems','wrong-owner',
  'data:image/jpeg','getSessionGeneration','releaseAuthorized:false'])
  assert.ok(source.includes(key),key);
 assert.doesNotMatch(source,/createClient\(|supabase\.auth|fetch\('https:|localStorage\.setItem|indexedDB\.open/);
});
