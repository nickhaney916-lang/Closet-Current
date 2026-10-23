import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {examineOriginalFirst,originalRegionPixels,sourceFingerprint,readStoredJpegBytes,auditOriginalOutfitRegions} from '../research/original-context/original-first-index-gate.mjs';

const jpeg=(tag='original')=>'data:image/jpeg;base64,'+Buffer.from([255,216,...new Array(100).fill(0).map((_,i)=>tag.charCodeAt(i%tag.length)),255,217]).toString('base64');
const frame=(width=64,height=96,regions=false)=>{
 const data=new Uint8ClampedArray(width*height*3);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*3;
  data.set(regions&&x<width/2?[220,35,40]:[35,80,215],i);
 }
 return {width,height,channels:3,data};
};
const candidate=(partial={})=>({id:'garment-1',image:jpeg('cropped-preview'),originalPhoto:{image:jpeg('full-original')},...partial});
const strong=(category,itemType,pattern='Striped')=>({strong:true,choices:[{category,itemType}],details:{pattern}});
function setup({record=candidate(),pred=['Tops','T-shirt'],independent=pred,photo=frame(),color={primary:'Blue'},onRole=()=>{},decode=async()=>photo}={}){
 let active={owner:'account-A',generation:1},roles=[],savedSources=[];
 const recognize=async(p,context)=>{roles.push(context.sourceRole);onRole(p,context);return strong(...pred);};
 const confirm=async(p,context)=>{roles.push(context.sourceRole);onRole(p,context);return strong(...independent);};
 const colorSample=async(p,context)=>{savedSources.push(context.sourceRole);return color;};
 return {record,opts:{decode,recognize,confirm,colorSample,ownerToken:{...active},currentOwner:()=>active,cryptoProvider:webcrypto},
  roles,savedSources,changeOwner:()=>{active={owner:'account-B',generation:2};}};
}
test('single garment uses first app-retained original instead of cropped display and preserves raw pixels',async()=>{
 const item=candidate(),source=frame(),inputBefore=source.data.slice(),h=setup({record:item,photo:source});
 const result=await examineOriginalFirst(item,h.opts);
 assert.equal(result.status,'indexed');assert.equal(result.itemType,'T-shirt');assert.equal(result.sourceRole,'original-whole');
 assert.deepEqual(h.roles,['original-whole','original-whole-confirm']);
 assert.equal(result.region.width,64);assert.equal(result.region.height,96);
 assert.equal(result.pattern,'Striped');assert.equal(result.color,'Blue');assert.equal(result.autoSaved,false);
 assert.deepEqual(source.data,inputBefore);assert.equal(item.image,jpeg('cropped-preview'));
 assert.equal(result.sourceVersion,await sourceFingerprint(item.originalPhoto.image,webcrypto));
});
test('new single capture without originalPhoto falls back to the first saved full item.image',async()=>{
 const item={id:'fresh',image:jpeg('fresh')},h=setup({record:item});
 const result=await examineOriginalFirst(item,h.opts);
 assert.equal(result.status,'indexed');assert.equal(result.sourceVersion,await sourceFingerprint(item.image,webcrypto));
});
test('outfit item uses original frame crop, not a whole-scene garment vote or opaque display cutout',async()=>{
 const item=candidate({outfitSourceId:'group-1',recognitionPhoto:{image:jpeg('textured-view')},cropBounds:{x:0,y:0,width:.5,height:1},
  segmentHint:{categories:['Bottoms'],clipped:false}});
 const photo=frame(64,96,true),h=setup({record:item,pred:['Bottoms','Shorts'],independent:['Bottoms','Shorts'],photo,color:{primary:'Red'}});
 const source=photo.data.slice();
 const result=await examineOriginalFirst(item,h.opts);
 assert.equal(result.status,'indexed');assert.equal(result.sourceRole,'original-instance');
 assert.equal(result.region.width,32);assert.equal(result.region.height,96);
 assert.deepEqual(h.roles,['original-instance','original-instance-confirm']);
 assert.equal(result.color,'Red');assert.equal(result.itemType,'Shorts');
 assert.equal(photo.data.length,64*96*3);assert.deepEqual(photo.data,source);
});
test('shorts vs skirt disagreement preserves safe Bottoms and color but does not auto-index a subtype',async()=>{
 const h=setup({pred:['Bottoms','Shorts'],independent:['Bottoms','Skirt']});
 const result=await examineOriginalFirst(h.record,h.opts);
 assert.equal(result.status,'indexed');assert.equal(result.category,'Bottoms');assert.equal(result.itemType,'Unknown');
 assert.equal(result.indexingLevel,'category-color');assert.equal(result.subtypeDisagreement,true);
 assert.equal(result.requiresTypeReview,true);
});
test('shoes vs other families requires human review, not an unsafe Shoe label',async()=>{
 const h=setup({pred:['Shoes','Sneakers'],independent:['Tops','T-shirt']});
 const result=await examineOriginalFirst(h.record,h.opts);
 assert.equal(result.status,'review');assert.equal(result.reason,'category_disagreement');
 assert.equal(result.category,'Uncategorized');assert.equal(result.color,'Blue');
});
test('shoes versus boots within Shoes requires subtype review and keeps category/color',async()=>{
 const h=setup({pred:['Shoes','Sneakers'],independent:['Shoes','Boots']});
 const result=await examineOriginalFirst(h.record,h.opts);
 assert.equal(result.status,'indexed');assert.equal(result.itemType,'Unknown');assert.equal(result.category,'Shoes');
 assert.equal(result.indexingLevel,'category-color');assert.equal(result.requiresTypeReview,true);
});
test('skirt vs dress does not auto-label a skirt and broad conflicting categories are held',async()=>{
 const h=setup({pred:['Bottoms','Skirt'],independent:['Dresses','Dress']});
 assert.equal((await examineOriginalFirst(h.record,h.opts)).status,'review');
});
test('jacket vs coat differences keep Outerwear but do not guess exact subtype',async()=>{
 const h=setup({pred:['Outerwear','Jacket'],independent:['Outerwear','Coat']});
 const v=await examineOriginalFirst(h.record,h.opts);
 assert.equal(v.category,'Outerwear');assert.equal(v.itemType,'Unknown');assert.equal(v.color,'Blue');
});
test('optional pattern disagreement cannot overwrite source clothing, core category and color remain indexed',async()=>{
 const h=setup();h.opts.confirm=async()=>strong('Tops','T-shirt','Plaid');
 const v=await examineOriginalFirst(h.record,h.opts);
 assert.equal(v.status,'indexed');assert.equal(v.pattern,'Unknown');assert.equal(v.category,'Tops');assert.equal(v.color,'Blue');
});
test('color sample is taken only from masked source-derived instance, not full scene',async()=>{
 const source=frame(64,96,true),item=candidate({outfitSourceId:'capture',recognitionPhoto:{image:jpeg('full-crop')},
  cropBounds:{x:0,y:0,width:.5,height:1},instanceMask:new Uint8Array(32*96).fill(1)});
 let seen;
 const h=setup({record:item,photo:source,pred:['Bottoms','Shorts'],independent:['Bottoms','Shorts']});
 h.opts.colorSample=async pixels=>{seen=pixels;return {primary:'Red'};};
 const r=await examineOriginalFirst(item,h.opts);
 assert.equal(r.status,'indexed');assert.equal(seen.width,32);assert.equal(seen.data[0],220);
 assert.equal(seen.data[1],35);assert.equal(seen.data[2],40);
 assert.equal(seen.originalWidth,64);assert.equal(seen.originalHeight,96);
});
test('source mask removes background from color without masking classifier RGB',async()=>{
 const source=frame(64,96,true),item=candidate({outfitSourceId:'capture',recognitionPhoto:{image:jpeg('crop')},
 cropBounds:{x:0,y:0,width:.5,height:1},instanceMask:Uint8Array.from({length:32*96},(_,i)=>i%2)});
 let classifierPixels,samplerPixels;
 const h=setup({record:item,pred:['Bottoms','Shorts'],independent:['Bottoms','Shorts'],photo:source});
 h.opts.recognize=async pixels=>{classifierPixels=pixels;return strong('Bottoms','Shorts');};
 h.opts.colorSample=async pixels=>{samplerPixels=pixels;return {primary:'Red'};};
 const r=await examineOriginalFirst(item,h.opts);
 assert.equal(r.status,'indexed');
 assert.equal(classifierPixels.data[3],255);
 assert.equal(samplerPixels.data[3],0);assert.equal(samplerPixels.data[7],255);
});
test('blank and ambiguous photos cannot fabricate type or color',async()=>{
 const empty=setup({record:candidate({originalPhoto:{image:jpeg('bad').replace('data:image/jpeg;base64,','data:image/png;base64,')}})});
 assert.equal((await examineOriginalFirst(empty.record,empty.opts)).status,'review');
 const unknownColor=setup({color:null});
 assert.equal((await examineOriginalFirst(unknownColor.record,unknownColor.opts)).reason,'color_unverified');
 const ambiguous=setup({color:{primary:'Red',secondary:'Blue',needsConfirmation:true}});
 assert.equal((await examineOriginalFirst(ambiguous.record,ambiguous.opts)).reason,'color_unverified');
});
test('invalid instance, clipped instance and absent unmasked recognitionPhoto never auto-index multi-source',async t=>{
 const changes=[
 ['no parent',i=>{delete i.originalPhoto;}],
 ['no crop',i=>{delete i.cropBounds;}],
 ['no raw recognition',i=>{delete i.recognitionPhoto;}],
 ['clipped',i=>i.segmentHint.clipped=true]
 ];
 for(const [label,fn]of changes)await t.test(label,async()=>{
  const item=candidate({outfitSourceId:'capture',recognitionPhoto:{image:jpeg('view')},
   cropBounds:{x:.1,y:.1,width:.6,height:.6},segmentHint:{categories:['Tops'],clipped:false}});
  fn(item);const h=setup({record:item});
  const v=await examineOriginalFirst(item,h.opts);assert.equal(v.status,'review',label);
 });
});
test('mismatched segmentation family blocks subtype and broad auto-index',async()=>{
 const item=candidate({outfitSourceId:'frame',recognitionPhoto:{image:jpeg('crop')},
   cropBounds:{x:0,y:0,width:.5,height:1},segmentHint:{categories:['Shoes'],clipped:false}});
 const h=setup({record:item,pred:['Bottoms','Shorts'],independent:['Bottoms','Shorts']});
 assert.equal((await examineOriginalFirst(item,h.opts)).reason,'mask_category_disagreement');
});
test('malformed, out-of-frame, fractional and tiny boxes cannot create invalid crop',()=>{
 const p=frame(64,96),cases=[
 {x:-.1,y:0,width:.5,height:.5},{x:.8,y:.8,width:.3,height:.3},
 {x:0,y:0,width:0,height:1},{x:0,y:0,width:.01,height:.1},
 {x:NaN,y:0,width:1,height:1},{x:0,y:0,width:Infinity,height:1}
 ];
 for(const bounds of cases)assert.throws(()=>originalRegionPixels(p,bounds),/Invalid|Unsafe/);
});
test('uniform original region retains full native pixel resolution, patterns and source unchanged',()=>{
 const source=frame(130,290,true),before=source.data.slice();
 const crop=originalRegionPixels(source,{x:.1,y:.05,width:.5,height:.8});
 assert.equal(crop.width,65);assert.equal(crop.height,233);
 for(let y=0;y<crop.height;y++)for(let x=0;x<crop.width;x++){
  const i=(y*crop.width+x)*4,j=((y+crop.bounds.top)*130+x+crop.bounds.left)*3;
  assert.deepEqual(Array.from(crop.data.slice(i,i+3)),Array.from(before.slice(j,j+3)));
 }
 assert.deepEqual(source.data,before);
});
test('mask length, mask contents and source dimensions fail before use',()=>{
 const image=frame();assert.throws(()=>originalRegionPixels(image,null,new Uint8Array(1)),/Invalid/);
 assert.throws(()=>originalRegionPixels(image,null,new Uint8Array(image.width*image.height).fill(255)),/Invalid/);
 assert.throws(()=>originalRegionPixels({...image,width:0}),/Invalid/);
 assert.throws(()=>originalRegionPixels({...image,data:new Uint8ClampedArray(2)}),/Invalid/);
});
test('tiny segmentation area cannot drive confident color or label',async()=>{
 const item=candidate({outfitSourceId:'group',recognitionPhoto:{image:jpeg('crop')},
   cropBounds:{x:0,y:0,width:1,height:1},instanceMask:new Uint8Array(64*96).fill(0)});
 const h=setup({record:item});
 assert.equal((await examineOriginalFirst(item,h.opts)).reason,'mask_too_small');
});
test('no cross-account image or label after asynchronous decoder or model',async()=>{
 const h=setup();h.opts.decode=async()=>{h.changeOwner();return frame();};
 assert.equal((await examineOriginalFirst(h.record,h.opts)).reason,'owner_changed');
 const v=setup();v.opts.confirm=async()=>{v.changeOwner();return strong('Tops','T-shirt');};
 assert.equal((await examineOriginalFirst(v.record,v.opts)).reason,'owner_changed');
});
test('user corrections are never overwritten by automatic source decisions',async()=>{
 const h=setup({record:candidate({userAdjusted:true,category:'Outerwear',itemType:'Jacket'})});
 const v=await examineOriginalFirst(h.record,h.opts);
 assert.equal(v.status,'preserve-user');assert.equal(v.autoSaved,false);assert.equal(h.roles.length,0);
});
test('identity changes of same-cropped photo are detected through independent original SHA',async()=>{
 const one=jpeg('first-source'),two=jpeg('second-source');
 assert.notEqual(await sourceFingerprint(one,webcrypto),await sourceFingerprint(two,webcrypto));
 const a=candidate({originalPhoto:{image:one}}),b=candidate({originalPhoto:{image:two}});
 assert.equal(a.image,b.image);
 const [x,y]=await Promise.all([examineOriginalFirst(a,setup({record:a}).opts),examineOriginalFirst(b,setup({record:b}).opts)]);
 assert.notEqual(x.sourceVersion,y.sourceVersion);
});
test('optional attribute failures do not discard reliably confirmed category and color',async()=>{
 const h=setup({pred:['Tops','T-shirt'],independent:['Tops','Polo']});
 const v=await examineOriginalFirst(h.record,h.opts);
 assert.equal(v.status,'indexed');assert.equal(v.indexingLevel,'category-color');assert.equal(v.itemType,'Unknown');
 assert.equal(v.color,'Blue');
});
test('missing owner or incomplete classifier interface refuses synthetic QA usage',async()=>{
 const h=setup();
 await assert.rejects(examineOriginalFirst(h.record,{decode:h.opts.decode}),/inputs required/);
});
test('source decoder rejects forged image envelope and oversized base64',()=>{
 for(const x of ['',null,'https://example.org/item.jpg','data:image/png;base64,abcd','data:image/jpeg;base64,%%%%'])
  assert.throws(()=>readStoredJpegBytes(x),/Invalid/);
 assert.throws(()=>readStoredJpegBytes(jpeg('okay').slice(0,-8)),/Invalid/);
});

test('multi-garment capture admits distinct regions with identical full original photos',async()=>{
 const original=jpeg('one-full-frame');
 const a=candidate({id:'shirt',outfitSourceId:'same-shot',originalPhoto:{image:original},recognitionPhoto:{image:jpeg('shirt-view')},
  cropBounds:{x:.05,y:.05,width:.45,height:.75}});
 const b=candidate({id:'shoes',outfitSourceId:'same-shot',originalPhoto:{image:original},recognitionPhoto:{image:jpeg('shoe-view')},
  cropBounds:{x:.55,y:.68,width:.4,height:.27}});
 const result=await auditOriginalOutfitRegions([a,b],{cryptoProvider:webcrypto});
 assert.equal(result.status,'safe');assert.equal(result.verifiedSharedOriginal,true);
 assert.equal(result.originalSourceSha,await sourceFingerprint(original,webcrypto));
 assert.equal(result.issues.length,0);
 assert.ok(!JSON.stringify(result).includes('data:image/'));
});
test('duplicate source region or one garment with two IDs triggers review without deleting any record',async()=>{
 const original=jpeg('shared-shot');
 const part=candidate({id:'one',outfitSourceId:'one-shot',originalPhoto:{image:original},recognitionPhoto:{image:jpeg('piece')},
   cropBounds:{x:.2,y:.2,width:.5,height:.65}});
 const other={...structuredClone(part),id:'two'};
 const result=await auditOriginalOutfitRegions([part,other],{cryptoProvider:webcrypto});
 assert.equal(result.status,'review');
 assert.ok(result.issues.some(x=>x.reason==='overlapping-instance-review'));
 assert.equal(result.garmentCount,2);
});
test('independent outfit frames, duplicate IDs and bad crop bounds never appear source-verified',async()=>{
 const original=jpeg('shared-shot');
 const a=candidate({id:'one',outfitSourceId:'shot',originalPhoto:{image:original},recognitionPhoto:{image:jpeg('piece-a')},
  cropBounds:{x:0,y:0,width:.4,height:.8}});
 const b=candidate({id:'one',outfitSourceId:'shot',originalPhoto:{image:jpeg('different-parent')},recognitionPhoto:{image:jpeg('piece-b')},
  cropBounds:{x:.7,y:0,width:.5,height:.9}});
 const r=await auditOriginalOutfitRegions([a,b],{cryptoProvider:webcrypto});
 assert.equal(r.status,'review');assert.ok(r.issues.some(x=>x.reason==='duplicate-or-invalid-garment-id'));
 assert.ok(r.issues.some(x=>x.reason==='different-original-frames'));
 assert.ok(r.issues.some(x=>x.reason==='unverified-region-bounds'));
});
test('valid shirt-over-coat overlap is kept for human review rather than silently excluded',async()=>{
 const original=jpeg('shared-shot');
 const a=candidate({id:'jacket',outfitSourceId:'shot',originalPhoto:{image:original},recognitionPhoto:{image:jpeg('outer')},
  cropBounds:{x:.2,y:.1,width:.7,height:.8}});
 const b=candidate({id:'shirt',outfitSourceId:'shot',originalPhoto:{image:original},recognitionPhoto:{image:jpeg('inner')},
  cropBounds:{x:.35,y:.25,width:.3,height:.35}});
 const v=await auditOriginalOutfitRegions([a,b],{cryptoProvider:webcrypto});
 assert.equal(v.status,'review');assert.equal(v.garmentCount,2);
 assert.ok(v.issues.some(x=>x.reason==='overlapping-instance-review'));
});
