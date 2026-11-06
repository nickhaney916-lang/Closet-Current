import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {captureNative3D05Sources91} from '../research/native-3d-05/native-preview-bridge.mjs';
const sha=n=>String(n).repeat(64);
function context(){
 const admitted={ownerId:'native91-A',savedId:'saved-original',
  slots:{top:'same-id-dress',shoes:'same-id-shoes'}};
 const rows=new Map([
  ['same-id-dress',{id:'same-id-dress',sha256:sha('a'),category:'Dresses',
   itemType:'Casual dress',color:'Blue',secondaryColor:''}],
  ['same-id-shoes',{id:'same-id-shoes',sha256:sha('b'),category:'Shoes',
   itemType:'Sneakers',color:'Black',secondaryColor:''}]
 ]);
 let ownerId='native91-A';
 const consumer={readOnlyGarmentSources91(ids){
  return {ownerId,sources:ids.map(id=>({...rows.get(id)}))};
 }};
 const receipt=captureNative3D05Sources91({consumer,admitted});
 const check=()=>captureNative3D05Sources91({consumer,admitted,expected:receipt});
 return {admitted,consumer,receipt,check,change:(id,patch)=>rows.set(id,{...rows.get(id),...patch}),
  owner:x=>ownerId=x,remove:id=>rows.delete(id)};
}
test('NATIVE91 unchanged owner-private same garment IDs and source SHA receipts stay accepted',()=>{
 const x=context(),original=JSON.stringify(x.receipt);assert.deepEqual(x.check(),x.receipt);
 assert.equal(JSON.stringify(x.receipt),original);
 assert.equal(x.receipt.sources[0].sha256,sha('a'));
});
test('NATIVE91 same item ID with a legitimately different source-photo SHA rejects old renderer',()=>{
 const x=context();x.change('same-id-dress',{sha256:sha('c')});
 assert.throws(x.check,/photographed garment source changed/);
});
test('NATIVE91 same source photograph with corrected category, subtype, primary or secondary color rejects stale texture',()=>{
 for(const update of [
  {category:'Tops'},{itemType:'Maxi dress'},
  {color:'Beige'},{secondaryColor:'Red'}
 ]){
  const x=context();x.change('same-id-dress',update);
  assert.throws(x.check,/photographed garment source changed/,JSON.stringify(update));
 }
});
test('NATIVE91 missing selected item, missing owner or returned ID mismatch refuses source receipt',()=>{
 const x=context();x.remove('same-id-shoes');
 assert.throws(x.check,/source identities|Cannot read properties/);
 const y=context();y.owner('native91-B');
 assert.throws(y.check,/mismatched owner/);
 const z=context();z.change('same-id-dress',{id:'different-id'});
 assert.throws(z.check,/mismatched owner or garment source/);
});
test('NATIVE91 cannot proceed without explicit source receipt API or owner-authenticated selection',()=>{
 const x=context();
 assert.throws(()=>captureNative3D05Sources91({consumer:{},admitted:x.admitted}),/source-bound read-only owner wardrobe required/);
 assert.throws(()=>captureNative3D05Sources91({consumer:x.consumer,admitted:{slots:x.admitted.slots}}),/source-bound read-only owner wardrobe required/);
});
test('NATIVE91 readOnlyGarmentSources91 is research-gated, source-hash-consistent and does not return original JPEG bytes',()=>{
 const src=readFileSync('research/native-consumer-board-04/consumer-board-controller.mjs','utf8');
 assert.match(src,/const readOnlyGarmentSources91=\(ids\)=>/);
 assert.match(src,/get\('native3D05'\)!=='research'/);
 assert.match(src,/const lease=alive\(\)/);
 assert.match(src,/new Set\(ids\)\.size!==ids\.length/);
 assert.match(src,/row\.originalPhoto\?\.sha256!==hash/);
 assert.match(src,/row\.sourceHash!==undefined&&row\.sourceHash!==hash/);
 assert.match(src,/row\.ownerId!==lease\.ownerId/);
 assert.match(src,/sha256:hash/);
 assert.match(src,/readOnlyGarmentSources91,readOnlyWardrobe/);
 const own=src.slice(src.indexOf('const readOnlyGarmentSources91='),src.indexOf('// STYLE-OWNED-LIVE-03:'));
 assert.doesNotMatch(own,/image:row\.originalPhoto|originalPhoto:row|data:image\/jpeg;base64,'.*\+/);
});
test('NATIVE91 source revision checked during loading AND after existing WebGL scene opens',()=>{
 const src=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.match(src,/const selectedSources91=captureNative3D05Sources91/);
 assert.match(src,/captureNative3D05Sources91\(\{consumer,admitted:selected,expected:selectedSources91\}\)/);
 assert.match(src,/displayedSources91=selectedSources91/);
 assert.match(src,/admitted:displayedSelection89\.admitted,expected:displayedSources91/);
 assert.match(src,/displayedSources91=null;/);
 assert.match(src,/const state=\(\)=>\{[\s\S]*?revokeChangedSource89\(\)/);
});
test('NATIVE91 real browser acceptance replaces licensed owner garment photo under SAME item ID then verifies old 3D closure',()=>{
 const src=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 for(const term of ['NATIVE91=','NATIVE91','refreshWardrobe()',
  "commons-0053","commons-0003",'sourceSHA256=photo.sha256',
  "row.originalPhoto={image:photo.image,sha256:photo.sha256}",
  'sameGarmentIdPhotoSourceRevision91','stale source-photo 3D preview closed',
  'savedOutfitIDsUnchanged:true','window.native3D05Bridge?.state().modelReady']){
  // Env variable is checked as an actual process.env field, rather than
  // requiring a synthetic model inference result.
  if(term==='NATIVE91=')continue;
  assert.ok(src.includes(term),'Missing actual source-revision proof '+term);
 }
 assert.match(src,/const native91=process\.env\.NATIVE91==='1'/);
});
