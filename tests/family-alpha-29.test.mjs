import {test} from 'node:test';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {harness,A,B} from './fixtures/family-alpha-29.mjs';
test('#276 engine bytes are unchanged',()=>assert.equal(readFileSync('research/family-alpha-19/style-my-new-clothes.mjs','utf8'),execFileSync('git',['show','0fb6ab04ab79c36d449acee21aaaf4318871d647:research/family-alpha-19/style-my-new-clothes.mjs'],{encoding:'utf8'})));
test('saved confirmed new item yields three pinned owned outfits without touching originals',async()=>{const h=harness(),before=JSON.stringify(h.clothes),r=await h.client.generate('pin');assert.equal(r.options.length,3,r.reason);for(const look of r.options){assert.equal(look.board.slots.top,'pin');assert.ok(Object.values(look.board.slots).every(id=>h.clothes.some(x=>x.id===id)));}assert.equal(new Set(r.options.map(x=>x.signature)).size,3);assert.equal(JSON.stringify(h.clothes),before);});
test('unsaved and unreviewed/unknown new items are blocked',async()=>{for(const change of [h=>h.clothes.shift(),h=>h.clothes[0].recognitionReviewRequired=true,h=>h.clothes[0].itemType='Unknown',h=>h.clothes[0].color='']){const h=harness();change(h);await assert.rejects(h.client.generate('pin'));assert.equal(h.writes,0);}});
test('small closets clearly return fewer than three options',async()=>{const h=harness();h.clothes=h.clothes.filter(x=>['pin','bottom1','shoe1'].includes(x.id));const r=await h.client.generate('pin');assert.equal(r.options.length,1);assert.match(r.reason,/Only 1/);});
test('one-piece swap keeps pin and all other slots',async()=>{const h=harness(),r=await h.client.generate('pin');await assert.rejects(h.client.swap(0,'top','top2'));const old=r.options[0].board.slots,id=h.clothes.find(x=>x.category==='Shoes'&&!Object.values(old).includes(x.id)).id;const swapped=await h.client.swap(0,'shoes',id);assert.deepEqual(swapped.options[0].board.slots,{...old,shoes:id});});
test('favorite references restore with source verification and preserve prior favorites',async()=>{const h=harness();await h.client.generate('pin');const f=await h.client.save(0);assert.equal(f.ownerId,A);assert.equal(JSON.stringify(f).includes('data:image'),false);const favoriteList=await h.client.favorites();assert.equal(favoriteList.length,1);const r=await h.client.restore(f);assert.equal(r.current.slots.top,'pin');assert.equal(r.saved[0].name,'Existing favorite');});
test('removal, changed details or photo invalidate old recommendations and favorites',async()=>{for(const change of [h=>h.clothes.shift(),h=>h.clothes[0].color='Red',h=>h.clothes[0].pattern='Striped',h=>h.clothes[0].image=h.clothes[1].image]){const h=harness();await h.client.generate('pin');const f=await h.client.save(0),writes=h.writes;change(h);assert.throws(()=>h.client.getResult());await assert.rejects(h.client.save(0));await assert.rejects(h.client.restore(f));assert.equal(h.writes,writes);}});
test('foreign items, favorites and pending account changes fail closed',async()=>{const foreign=harness();foreign.clothes[1].ownerId=B;await assert.rejects(foreign.client.generate('pin'));const h=harness();await h.client.generate('pin');const f=await h.client.save(0);f.ownerId=B;await assert.rejects(h.client.restore(f));let release;h.verify=()=>new Promise(r=>release=r);const request=h.client.generate('pin');h.ctx={...h.ctx,authenticatedUserId:B,currentUserId:B,cloudOwnerId:B,indexedDbName:'closet-current-user-'+B,sessionGeneration:2};release({ownerId:A,sessionGeneration:1});await assert.rejects(request);assert.equal(h.writes,1);});
test('interrupted favorite save cannot claim success and leaves wardrobe unchanged',async()=>{const h=harness(),original=JSON.stringify(h.clothes);h.deps.store.saveFavorite=async()=>{throw Error('synthetic interruption');};await h.client.generate('pin');await assert.rejects(h.client.save(0));assert.equal(h.favorites.length,0);assert.equal(JSON.stringify(h.clothes),original);});

test('offline UI is hard off on staging/public hosts and without explicit opt-in',async()=>{
 const boot=readFileSync('research/family-alpha-29/boot.js','utf8');
 for(const [hostname,flag]of [['closet-current-staging.pages.dev',true],['closet-current.pages.dev',true],['localhost',false],['127.0.0.1',undefined]]){
  await vm.runInNewContext(boot,{location:{hostname},window:{__CLOSET_ALPHA29_OFFLINE__:flag},document:{getElementById(){throw Error('Blocked boot accessed private UI');}}});
 }
});
test('candidate leaves inherited auth/recognition/avatar bytes unchanged',()=>{
 const base='dist-family-alpha-recognition-integration-hold/',out='dist-family-alpha-29-hold/';
 for(const name of ['auth.js','cloud-backup.js','app.js','family-alpha-2d-photo-renderer.mjs','family-alpha-2d-saved-board.mjs','alpha-stage-config.js'])assert.equal(readFileSync(out+name,'utf8'),readFileSync(base+name,'utf8'),name);
 const manifest=JSON.parse(readFileSync(out+'alpha29-manifest.json','utf8'));assert.equal(manifest.release,'HOLD');assert.equal(manifest.stageAuthEnabled,false);
});
