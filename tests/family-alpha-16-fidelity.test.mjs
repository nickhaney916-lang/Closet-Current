import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {runMatrix,fixture} from '../research/family-alpha-16/run-matrix.mjs';
import {syntheticScene,garmentCases} from '../research/family-alpha-16/synthetic-scenes.mjs';
import {auditMask,fingerprintSavedCrop} from '../research/family-alpha-16/source-mask-audit.mjs';
import {fingerprintAlphaRetainedOriginal}
 from '../public/family-alpha-2d-saved-board.mjs';
const make=async(kind='short-sleeve',serial=1)=>fixture(syntheticScene(kind),serial);
test('eleven independently-labeled garment classes and wrinkle photo preserve source RGB, pattern and silhouette',async()=>{
 const {summary,rows}=await runMatrix();
 for(const r of rows.filter(x=>x.expected==='pass')){
  assert.equal(r.observed,'pass',r.kind+' '+r.condition+' '+r.reason);
  assert.equal(r.metrics.sourceMismatchPixels,0,r.kind);
  assert.equal(r.metrics.rgbRMSE,0,r.kind);
  assert.ok(r.metrics.maskIoU>=.98,r.kind+' '+r.metrics.maskIoU);
  assert.ok(r.metrics.foregroundPrecision>=.98,r.kind);
  assert.ok(r.metrics.foregroundRecall>=.98,r.kind);
 }
 assert.equal(garmentCases.length,11);
 assert.equal(summary.syntheticExpectedPass,12);
});
test('difficult conditions never become approved transparent garments without reliable isolation',async()=>{
 const {summary,rows}=await runMatrix();
 for(const r of rows.filter(x=>x.expected==='review'))
  assert.notEqual(r.observed,'pass','unsafe auto-presentation for '+r.kind+' '+r.condition);
 assert.equal(summary.unsafeAccepts,0);
});
test('a completely synthetic original cannot be passed as a real encoded JPEG',async()=>{
 const f=await make();
 f.item.originalPhoto.image='not even an image';
 const v=await auditMask(f);
 assert.equal(v.status,'reject');
});
test('stale original JPEG digest cannot reuse prior mask',async()=>{
 const f=await make();f.prepared={...f.prepared,originalSha:'sha256:deadbeef',sourceVersion:'sha256:deadbeef'};
 assert.equal((await auditMask(f)).reason,'foreign-stale-or-wrong-derivative');
});
test('crop-only edit invalidates previous derivative even when original photo is unchanged',async()=>{
 const f=await make();const original=f.item.originalPhoto.image;
 f.item={...f.item,image: (await make('short-sleeve',2)).item.image};
 f.getItem=()=>f.item;
 assert.equal(f.item.originalPhoto.image,original);
 assert.equal((await auditMask(f)).reason,'foreign-stale-or-wrong-derivative');
});
test('a different saved item with same parent outfit photo cannot use sibling prepared layer',async()=>{
 const first=await make('short-sleeve',3),second=await make('long-sleeve',3);
 second.item.originalPhoto.image=first.item.originalPhoto.image;
 second.prepared={...first.prepared};
 second.getItem=()=>second.item;
 assert.equal((await auditMask(second)).reason,'foreign-stale-or-wrong-derivative');
});
test('matching fake approved:true and self-reported hashes cannot bypass source pixel mismatch',async()=>{
 const f=await make();const rgba=f.prepared.rgba.slice();
 const p=rgba.findIndex((x,i)=>i%4===3&&x===255);
 rgba[p-3]^=25;
 f.prepared={...f.prepared,rgba,approved:true};
 const result=await auditMask(f);
 assert.equal(result.status,'reject');
 assert.equal(result.reason,'pixels-do-not-match-retained-original');
 assert.ok(result.metrics.sourceMismatchPixels>=1);
});
test('fabric over-erasure is caught by synthetic recall/IoU',async()=>{
 const f=await make(),arr=f.prepared.rgba.slice();
 for(let i=0;i<arr.length;i+=4)if((i/4)%5===0)arr[i+3]=0;
 f.prepared={...f.prepared,rgba:arr};
 const v=await auditMask(f);assert.equal(v.status,'review');assert.equal(v.reason,'segmentation-fidelity-below-synthetic-gate');
 assert.ok(v.metrics.foregroundRecall<.98);
});
test('background leak with pixels copied faithfully is still rejected by ground-truth foreground precision',async()=>{
 const f=await make(),v=f.prepared,arr=v.rgba.slice();
 // Existing original RGB is already embedded at transparent positions by PR257.
 let added=0;for(let i=0;i<arr.length&&added<200;i+=4)if(arr[i+3]===0){arr[i+3]=255;added++;}
 f.prepared={...v,rgba:arr};
 const result=await auditMask(f);assert.equal(result.status,'review');
 assert.ok(result.metrics.backgroundLeakPixels>0);
});
test('a mostly opaque whole photo cannot count as a transparent garment',async()=>{
 const f=await make(),arr=f.prepared.rgba.slice();for(let i=3;i<arr.length;i+=4)arr[i]=255;
 f.prepared={...f.prepared,rgba:arr};
 assert.notEqual((await auditMask(f)).status,'pass');
});
test('same capture group never removes requirement for distinct saved clothing item identity',async()=>{
 const f=await make('dress',6),s=await make('skirt',6);
 assert.notEqual(f.item.id,s.item.id);
 assert.equal(f.item.outfitSourceId,s.item.outfitSourceId);
 assert.notEqual(f.prepared.itemId,s.prepared.itemId);
});
test('foreign account metadata is rejected without checking a persisted photo',async()=>{
 const f=await make();f.prepared={...f.prepared,ownerId:'b2222222-2222-4222-8222-222222222222'};
 assert.equal((await auditMask(f)).status,'reject');
});
test('owner session epoch change during independent decode cancels old result',async()=>{
 const f=await make();let epoch=1;f.getScope=()=>({ownerId:f.ownerId,epoch});
 const read=f.decodeOriginal;f.decodeOriginal=async src=>{epoch=2;return read(src);};
 assert.equal((await auditMask(f)).reason,'session-changed');
});
test('source replaced during asynchronous decode is rejected',async()=>{
 const f=await make();const other=await make('long-sleeve',7);const read=f.decodeOriginal;
 f.decodeOriginal=async src=>{f.item.image=other.item.image;return read(src);};
 assert.equal((await auditMask(f)).reason,'saved-photo-changed');
});
test('older pending audit loses to newer request generation',async()=>{
 const f=await make();let valid=true;f.isCurrent=()=>valid;const read=f.decodeOriginal;
 f.decodeOriginal=async src=>{valid=false;return read(src);};
 assert.equal((await auditMask(f)).reason,'superseded');
});
test('unsupported or missing source decoding, corrupt mask bounds and invalid pixel buffers fail closed',async()=>{
 const f=await make();
 assert.equal((await auditMask({...f,decodeOriginal:null})).status,'reject');
 assert.equal((await auditMask({...f,prepared:{...f.prepared,bounds:{...f.prepared.bounds,right:1}}})).status,'reject');
 assert.equal((await auditMask({...f,prepared:{...f.prepared,rgba:new Uint8Array(10)}})).status,'reject');
});
test('one unrelated approved mask copied from another original fails even if metadata copied to target',async()=>{
 const f=await make('jacket',12),other=await make('dress',13);
 f.prepared={...f.prepared,rgba:other.prepared.rgba,
 width:other.prepared.width,height:other.prepared.height,bounds:other.prepared.bounds,
 approved:true};
 assert.notEqual((await auditMask(f)).status,'pass');
});
test('without independent synthetic ground-truth, pixel consistency is reported as needs review not production acceptance',async()=>{
 const f=await make();f.groundTruth=null;
 const result=await auditMask(f);
 assert.equal(result.status,'review');assert.equal(result.canDisplay,false);
 assert.equal(result.reason,'source-pixels-match-but-matting-unverified');
});
test('fingerprints are distinct for different original/crop images and no input is mutated',async()=>{
 const f=await make('short-sleeve',19),before=JSON.stringify(f.item),g=await make('short-sleeve',20);
 assert.notEqual(await fingerprintSavedCrop(f.item,webcrypto),await fingerprintSavedCrop(g.item,webcrypto));
 assert.notEqual(await fingerprintAlphaRetainedOriginal(f.item.originalPhoto.image,webcrypto),
 await fingerprintAlphaRetainedOriginal(g.item.originalPhoto.image,webcrypto));
 await auditMask(f);assert.equal(JSON.stringify(f.item),before);
});
