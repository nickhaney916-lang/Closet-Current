import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyReviewedEraser,hasTwoClearlySeparatedFootwearComponents}
 from '../../research/family-alpha-35/reviewed-mask-controls.mjs';
import {patchSource,assert35HOLD,OUTPUT}
 from '../../scripts/build-family-alpha-35-visual-repair-hold.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const rgba=(w,h,regions)=>{
 const data=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const p=4*(y*w+x);
  data[p]=(x*5+y*7)%255;data[p+1]=(x*2+y*3)%255;data[p+2]=(x+19*y)%255;
  data[p+3]=regions.some(([a,b,c,d])=>x>=a&&x<c&&y>=b&&y<d)?255:0;
 }
 return {width:w,height:h,rgba:data};
};
test('reviewer eraser removes only alpha; never changes RGB, source or original image',()=>{
 const source=rgba(128,160,[[12,12,116,145]]);
 const old=new Uint8ClampedArray(source.rgba);
 const edited=applyReviewedEraser(source,[{x:.5,y:.13,radius:.08}]);
 assert.ok(edited.removedPixels>150,'Human-erased mannequin area was not removed');
 assert.ok(edited.visiblePixels/edited.originalVisiblePixels>=.55);
 for(let p=0;p<old.length;p+=4){
  assert.equal(edited.rgba[p],old[p]);assert.equal(edited.rgba[p+1],old[p+1]);
  assert.equal(edited.rgba[p+2],old[p+2]);assert.ok(edited.rgba[p+3]<=old[p+3]);
 }
 assert.deepEqual(source.rgba,old,'Input/source image was modified');
});
test('manual eraser rejects too much cloth deletion, malformed strokes and nonexistent foreground',()=>{
 const source=rgba(80,100,[[8,8,72,92]]);
 for(const e of [
  [{x:.5,y:.5,radius:0}],
  [{x:-1,y:.5,radius:.05}],
  [{x:.5,y:.5,radius:.4}],
  Array.from({length:41},()=>({x:.5,y:.5,radius:.1}))
 ])assert.throws(()=>applyReviewedEraser(source,e),/Invalid/);
 assert.throws(()=>applyReviewedEraser(source,[...Array.from({length:40},()=>({x:.5,y:.5,radius:.1}))],{minRetained:1}),/Too much/);
 assert.throws(()=>applyReviewedEraser(rgba(80,100,[]),[]),/no meaningful garment/);
});
test('single sneaker, boot and a two-piece disconnected artifact are never represented as verified pair',()=>{
 const single=rgba(160,120,[[12,25,148,103]]);
 assert.equal(hasTwoClearlySeparatedFootwearComponents(single),false);
 const tiny=rgba(160,120,[[12,25,148,103],[153,34,157,45]]);
 assert.equal(hasTwoClearlySeparatedFootwearComponents(tiny),false);
 const stacked=rgba(160,120,[[12,15,145,45],[10,65,148,98]]);
 assert.equal(hasTwoClearlySeparatedFootwearComponents(stacked),false);
});
test('only two separated meaningful left-right components qualify as possible pair, not automatic approval',()=>{
 const pair=rgba(180,120,[[8,35,72,90],[110,35,174,90]]);
 assert.equal(hasTwoClearlySeparatedFootwearComponents(pair),true);
 const cleaned=applyReviewedEraser(pair,[]);
 assert.equal(hasTwoClearlySeparatedFootwearComponents(cleaned),true);
 const overlap=rgba(180,120,[[20,35,90,100],[87,35,168,100]]);
 assert.equal(hasTwoClearlySeparatedFootwearComponents(overlap),false);
});
test('source-pinned compiled candidate preserves Work #34 atomic-saving and restricts changed paths',async()=>{
 const manifest=await assert35HOLD();
 assert.equal(manifest.releaseGate,'HOLD');
 assert.equal(manifest.storageOverlay318Applied,true);
 assert.equal(manifest.sourceOriginalJpegUnchanged,true);
 assert.equal(manifest.foregroundRGBUnchanged,true);
 assert.equal(manifest.allFootwearWithoutVerifiedPairShownAsReference,true);
 assert.equal(manifest.ownerVisualApproved,false);
 assert.equal(manifest.realCutoutMattingCertified,false);
 assert.equal(manifest.actualFourAccountPrivacyTestPassed,false);
 assert.equal(manifest.deployAuthorized,false);
 const renderer=await readFile(OUTPUT+'/family-alpha-2d-photo-renderer.mjs','utf8');
 assert.match(renderer,/footwear-photo-reference/);
 assert.match(renderer,/NOT fitted to both feet/);
 const provider=await readFile(OUTPUT+'/__alpha_research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs','utf8');
 assert.match(provider,/applyReviewedEraser/);assert.match(provider,/auditEdited/);
 assert.match(provider,/footwearPairVerified:verifiedPair/);
 const boot=await readFile(OUTPUT+'/__alpha_research/family-alpha-29/boot.js','utf8');
 assert.match(boot,/confirmReviewedCutoutWithEraser/);
 assert.match(boot,/family-alpha-35\/review-cutout\.mjs/);
});
test('bad release claims and tampered preview scripts cannot be marked ready',async()=>{
 const m=OUTPUT+'/alpha35-visual-repair-HOLD-manifest.json';
 const before=await readFile(m,'utf8');
 try{
  for(const [field,val] of [['releaseGate','READY'],['deployAuthorized',true],
   ['realCutoutMattingCertified',true],['ownerVisualApproved',true],
   ['actualFourAccountPrivacyTestPassed',true]]){
   const updated=JSON.parse(before);updated[field]=val;
   await writeFile(m,JSON.stringify(updated));
   await assert.rejects(()=>assert35HOLD());
  }
 }finally{await writeFile(m,before);}
 await assert35HOLD();
});

test('human-traced neckline polygon removes only selected mask alpha without erasing fabric RGB',()=>{
 const source=rgba(180,240,[[12,12,170,218]]);
 const old=new Uint8ClampedArray(source.rgba);
 const outline={kind:'polygon',points:[
  {x:.43,y:.1},{x:.66,y:.1},{x:.61,y:.22},{x:.54,y:.33},{x:.45,y:.2}
 ]};
 const result=applyReviewedEraser(source,[outline]);
 assert.ok(result.removedPixels>300);
 assert.ok(result.visiblePixels/result.originalVisiblePixels>.55);
 assert.equal(result.rgba[(20*180+90)*4+3],old[(20*180+90)*4+3],
  'Outside manually outlined region stays visible');
 assert.equal(result.rgba[(39*180+99)*4+3],0,
  'Inside the explicitly traced polygon becomes transparent');
 for(let i=0;i<old.length;i+=4)for(let k=0;k<3;k++)
  assert.equal(result.rgba[i+k],old[i+k],'No alpha-only edit can touch authentic garment RGB');
 assert.deepEqual(source.rgba,old,'Retained original array is immutable');
});
test('malicious or too broad trace rejected and no automatic semantic mannequin removal occurs',()=>{
 const orig=rgba(128,180,[[8,8,120,170]]);
 for(const shape of [
  {kind:'polygon',points:[]},
  {kind:'polygon',points:[{x:.4,y:.3},{x:.5,y:.3},{x:8,y:.3}]},
  {kind:'polygon',points:[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}]},
  {kind:'polygon',points:[{x:.3,y:.3},{x:.31,y:.3},{x:.32,y:.3}]}
 ])assert.throws(()=>applyReviewedEraser(orig,[shape]),/Invalid/);
 const noManualEdits=applyReviewedEraser(orig,[]);
 assert.equal(noManualEdits.removedPixels,0,'Never infer unwanted skin from fabric color');
});
