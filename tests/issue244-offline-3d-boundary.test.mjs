import test from 'node:test';
import assert from 'node:assert/strict';
import {syntheticAuthSource,createOfflineIntegrationQA} from '../research/issue244/offline-3d-integration-qa.mjs';
import {makeSyntheticCloset,makeSyntheticPiece,syntheticJPEGs} from '../research/issue244/qa-fixtures.mjs';
import {classifySavedOutfitFor3D} from '../research/issue244/reference/pr231/saved-outfit-3d-compatibility.mjs';
import {bridgeSavedOutfit} from '../research/issue244/reference/pr232/humanoid-3d-saved-bridge.mjs';
import {createDetailedHumanoid3D} from '../research/issue244/reference/pr232/humanoid-3d-detailed-renderer.mjs';
const board=slots=>({name:'Synthetic owned look',slots});
const basic=()=>board({top:'top-1',bottom:'bottom-1',shoes:'shoes-1'});
const setup=()=>{const a=makeSyntheticCloset(),b=[makeSyntheticPiece('top-1','Tops','Polo'),makeSyntheticPiece('shoes-1','Shoes','Sneakers')];
 const store=syntheticAuthSource({'account-A':a,'account-B':b});store.signIn('account-A');return {store,qa:createOfflineIntegrationQA(store),a,b};};
const noLeak=result=>{const json=JSON.stringify(result);assert.ok(!json.includes('data:image/'));assert.ok(!json.includes('/9j/'));assert.ok(!json.includes('originalPhoto'));assert.ok(!json.includes('closet-photo:'));};

test('real pinned PR231 and PR232 interfaces accept shared original for distinct garment crops',async()=>{
 const {qa}=setup(),result=await qa.present(basic());
 assert.equal(result.mode,'3d-placeholder',JSON.stringify(result));
 assert.equal(result.contracts.pr231,true);assert.equal(result.contracts.pr232,true);
 assert.deepEqual(Object.keys(result.board.slots).sort(),['bottom','shoes','top']);
 assert.equal(result.renderer.solidColorOnly,true);
 assert.equal(result.renderer.unseenSurfacesEstimated,true);
 for(const [slot,color]of Object.entries(result.renderer.colors)){assert.ok(['top','bottom','shoes'].includes(slot));assert.equal(color.length,4);assert.ok(color.every(v=>v>=0&&v<=1));}
 noLeak(result);
});
test('renderer interface accepts valid RGBA, rejects invalid RGBA and has 2D unavailable fallback',async()=>{
 assert.throws(()=>createDetailedHumanoid3D({getContext:null}),/Canvas/);
 const renderer=createDetailedHumanoid3D({getContext:()=>null});
 assert.equal(renderer.supported,false);assert.equal(renderer.render(),false);assert.equal(renderer.rotate(Math.PI),false);
 const qa=setup().qa, result=await qa.present(basic());
 assert.equal(result.mode,'3d-placeholder');
 assert.equal(Object.keys(result.renderer.colors).length,3);
 noLeak(result);
});
test('legacy 2D saved board stays 2D and cannot silently promote to unverified 3D',async()=>{
 const {qa}=setup(),legacy=basic();
 assert.equal(classifySavedOutfitFor3D(legacy).mode,'legacy-2d');
 const view=await qa.restore(legacy);
 assert.equal(view.mode,'2d');assert.deepEqual(view.board.slots,legacy.slots);noLeak(view);
});
test('verified saved snapshot round trip binds selected SHA, category, color and crop',async()=>{
 const {qa}=setup(),saved=await qa.save(basic());
 assert.equal(saved.mode,'3d-placeholder',JSON.stringify(saved));
 assert.equal(saved.record.schemaVersion,1);
 assert.equal(saved.record.verifiedSnapshot.selected.length,3);
 assert.equal(Object.keys(saved.record.qaSelectionMetadata).length,3);
 noLeak(saved.record);
 const view=await qa.restore(saved.record);
 assert.equal(view.mode,'3d-placeholder');noLeak(view);
});
test('reject changed original with same crop and preserve available owned 2D board',async()=>{
 const {store,qa,a}=setup(),saved=(await qa.save(basic())).record;
 const next=structuredClone(a);next[0].originalPhoto.image=syntheticJPEGs.olive;
 assert.equal(next[0].image,a[0].image);
 store.update('account-A',next);
 assert.equal((await qa.restore(saved)).mode,'2d');
 const view=await qa.present(basic());
 assert.equal(view.mode,'2d');noLeak(view);
});
test('saved source color edit, category-compatible subtype edit and crop edit each refuse stale 3D',async t=>{
 for(const [label,change]of [
  ['color',(x)=>x[0].color='pink'],
  ['type',(x)=>x[0].itemType='Polo'],
  ['pattern',(x)=>x[0].pattern='Striped'],
  ['crop',(x)=>x[0].image=syntheticJPEGs.olive]
 ])await t.test(label,async()=>{
  const {store,qa,a}=setup(),saved=(await qa.save(basic())).record;
  const changed=structuredClone(a);change(changed);store.update('account-A',changed);
  const view=await qa.restore(saved);
  assert.equal(view.mode,'2d',JSON.stringify(view));noLeak(view);
 });
});
test('invalid or missing garment data never feeds 3D; safe 2D only when preview valid',async t=>{
 const variants=[
  ['blank original',x=>{delete x[0].originalPhoto;},'2d'],
  ['corrupt source',x=>{x[0].originalPhoto.image='data:image/jpeg;base64,%%%';},'2d'],
  ['unknown color',x=>{x[0].color='unconfirmed';},'2d'],
  ['cropped photo invalid',x=>{x[0].image='data:image/jpeg;base64,YWJj';},'unavailable'],
  ['missing owned item',x=>{x.splice(0,1);},'unavailable'],
  ['duplicate clothing ID',x=>{x.push({...x[0]});},'unavailable'],
  ['blank recognition flagged',x=>{x[0].scanFailed=true;},'unavailable'],
  ['wrong category',x=>{x[0].category='Bottoms';},'unavailable'],
  ['wrong shoe category',x=>{x[2].category='Tops';},'unavailable'],
  ['same item reused',null,'unavailable']
 ];
 for(const [label,change,expected]of variants)await t.test(label,async()=>{
  const {store,qa,a}=setup();
  const next=structuredClone(a);
  if(change)change(next);else{assert.equal((await qa.present(board({top:'top-1',bottom:'top-1'}))).mode,'unavailable');return;}
  store.update('account-A',next);
  const view=await qa.present(basic());assert.equal(view.mode,expected,JSON.stringify(view));noLeak(view);
 });
});
test('independent selected garments can share full capture but mismatched versions reject 3D',async()=>{
 const {store,qa,a}=setup(),next=structuredClone(a);
 next[1].originalPhoto.image=syntheticJPEGs.olive;
 store.update('account-A',next);
 const view=await qa.present(basic());
 assert.equal(view.mode,'2d',JSON.stringify(view));
});
test('dress, bottom and layer conflicts rejected without losing valid 2D source',async()=>{
 const {qa}=setup();
 const legal=await qa.present(board({top:'dress-1',shoes:'shoes-1'}));
 assert.equal(legal.mode,'3d-placeholder',JSON.stringify(legal));assert.ok(legal.renderer.colors.dress);noLeak(legal);
 for(const slot of ['bottom','layer','layer2','layer3']){
  const id={bottom:'bottom-1',layer:'jacket-1',layer2:'jacket-1',layer3:'coat-1'}[slot];
  const result=await qa.present(board({top:'dress-1',shoes:'shoes-1',[slot]:id}));
  assert.equal(result.mode,'unavailable',slot);noLeak(result);
 }
});
test('PR231 unsupported jackets, coats and accessory slots safely retain existing 2D board instead of silently dropping layers',async()=>{
 const {qa}=setup();
 for(const [slot,id]of [['layer2','jacket-1'],['layer3','coat-1']]){
  const view=await qa.present(board({...basic().slots,[slot]:id}));
  assert.equal(view.mode,'2d',JSON.stringify(view));
  assert.equal(view.board.slots[slot],id);
  noLeak(view);
 }
 const accessory=makeSyntheticPiece('bag','Accessories','Bag');
 const {store,a}=setup();store.update('account-A',[...a,accessory]);
 const v=await createOfflineIntegrationQA(store).present(board({...basic().slots,bag:'bag'}));
 assert.equal(v.mode,'2d');assert.equal(v.board.slots.bag,'bag');
});
test('pin cannot swap pinned selection, one-piece compatible swap preserves all other owned IDs',async()=>{
 const {qa}=setup(),old=basic();
 await qa.setPin('top','top-1');
 const nope=await qa.swap(old,'top','top-2');assert.equal(nope.mode,'unavailable');
 const updated=await qa.swap(old,'bottom','bottom-1');
 assert.equal(updated.mode,'3d-placeholder');
 assert.deepEqual(updated.board.slots,old.slots);
 await qa.clearPin();
 const yes=await qa.swap(old,'top','top-2');
 assert.equal(yes.mode,'3d-placeholder',JSON.stringify(yes));
 assert.equal(yes.board.slots.bottom,old.slots.bottom);
 assert.equal(yes.board.slots.shoes,old.slots.shoes);noLeak(yes);
 assert.equal((await qa.swap(old,'shoes','bottom-1')).mode,'unavailable');
});
test('owner switch and forged editable owner labels cannot read saved other-account items',async()=>{
 const {store,qa,a,b}=setup(),saved=(await qa.save(basic())).record;
 store.signIn('account-B');
 assert.equal((await qa.restore(saved)).mode,'unavailable');
 assert.equal((await qa.present(basic())).mode,'unavailable');
 const fakes=structuredClone(b);for(const item of fakes){item.accountId='account-A';item.ownerId='account-A';item.originalPhoto.ownerId='account-A';}
 store.update('account-B',fakes);
 assert.equal((await qa.present(basic())).mode,'unavailable');
 store.signOut();
 assert.equal((await qa.present(basic())).mode,'unavailable');
 noLeak(saved);
});
test('account changes during awaited verification invalidate all output, including fallback',async()=>{
 const a=makeSyntheticCloset(),b=[makeSyntheticPiece('else','Tops','T-shirt')];
 const base=syntheticAuthSource({'A':a,'B':b});base.signIn('A');
 let switched=false;
 const source={current:()=>base.current(),read:async token=>{
  const values=await base.read(token);
  if(!switched){switched=true;base.signIn('B');}
  return values;
 }};
 assert.equal((await createOfflineIntegrationQA(source).present(basic())).mode,'unavailable');
});
test('PR232 plain bridge trusts editable owner tags, but QA boundary never treats tags as authentication',()=>{
 const original=makeSyntheticCloset().slice(0,3);
 for(const item of original){
  item.ownerId='fake';item.originalPhoto.ownerId='fake';item.originalPhoto.id=item.outfitSourceId;
 }
 assert.throws(()=>bridgeSavedOutfit(basic(),original,'real'),/foreign|unknown|invalid|incompatible/i);
});
test('never put a source image, account secret, customer value or external URL into renderer-only object',async()=>{
 const view=await setup().qa.present(basic());
 assert.equal(view.mode,'3d-placeholder');
 const rendererJSON=JSON.stringify(view.renderer);
 assert.ok(!rendererJSON.includes('data:'));assert.ok(!rendererJSON.includes('ownerId'));assert.ok(!rendererJSON.includes('http'));
 assert.ok(!rendererJSON.includes('reference'));assert.equal(view.renderer.solidColorOnly,true);
});
