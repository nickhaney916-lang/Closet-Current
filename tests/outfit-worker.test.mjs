import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';import {createRequire} from 'node:module';const require=createRequire(import.meta.url),PhotoColor=require('../public/photo-color.js');
import * as segmentation from '../public/outfit-segmentation.mjs';
import {diagnoseOutfitRegions} from '../public/outfit-diagnostics.mjs';
import {dressClassCompetition} from '../public/dress-layer-review.mjs';
const source=fs.readFileSync('public/outfit-worker.mjs','utf8');
function setup({failLoad=false,failSecondCrop=false,noPerson=false,completeShoePair=false,twoUpper=false,weakUpper=false,flatLay=false,mixedDress=false,strongDress=false}={}){
 const sent=[],width=20,height=20,data=new Float32Array(18*width*height);data.fill(-10);for(let i=0;i<400;i++)data[i]=10;
 const shoeRegions=completeShoePair?[[9,5,15,4,4],[10,11,15,4,4]]:[[9,6,16,3,3],[10,10,16,3,3]];
 for(const [id,left,top,w,h]of [[4,5,4,8,5],[6,6,10,6,5],...shoeRegions,[11,7,1,4,3]])for(let y=top;y<top+h;y++)for(let x=left;x<left+w;x++){const i=y*width+x;data[i]=-10;data[id*400+i]=10;}
 if(twoUpper)for(let y=4;y<9;y++)for(let x=15;x<19;x++){const i=y*width+x;data[i]=-10;data[4*400+i]=10;}
 if(weakUpper)for(let y=4;y<9;y++)for(let x=5;x<13;x++)data[y*width+x]=9.1;
 if(flatLay){data.fill(-10);for(let i=0;i<400;i++)data[i]=10;
  for(let y=2;y<18;y++)for(let x=2;x<18;x++){
   const i=y*width+x;data[i]=-10;data[7*400+i]=10;
  }
 }
 if(mixedDress||strongDress){
  data.fill(-10);for(let i=0;i<400;i++)data[i]=10;
  for(let y=4;y<16;y++)for(let x=5;x<15;x++){
   const i=y*20+x;data[i]=-10;data[7*400+i]=10;
   if(mixedDress)data[(y<10?4:5)*400+i]=8.5;
  }
  for(let y=1;y<4;y++)for(let x=8;x<12;x++){
   const i=y*20+x;data[i]=-10;data[11*400+i]=10;
  }
 }
 let crops=0;class Image{constructor(data,width,height,channels){Object.assign(this,{data,width,height,channels});}static async read(){return new Image(new Uint8ClampedArray(1200).fill(40),20,20,3);}async toBlob(){if(failSecondCrop&&++crops===3)throw Error('private decode error');return {arrayBuffer:async()=>new Uint8Array([255,216,255]).buffer};}}
 if(noPerson)for(let y=1;y<4;y++)for(let x=7;x<11;x++){data[11*400+y*20+x]=-10;data[y*20+x]=10;}
 const runtime={AutoModelForSemanticSegmentation:{from_pretrained:async()=>{if(failLoad)throw Error('private error');return async()=>({logits:{data,dims:[1,18,20,20]}});}},AutoProcessor:{from_pretrained:async()=>async()=>({})},RawImage:Image,env:{backends:{onnx:{wasm:{}}}}};
 const safeDiagnostic=(...args)=>{try{return diagnoseOutfitRegions(...args);}catch(error){sent.push({type:'diagnostic-test-error',text:String(error.message)});throw error;}};
 const c={runtime,segmentation,diagnosticFn:safeDiagnostic,dressClassCompetition,PhotoColor,self:{postMessage:value=>sent.push(value)},Uint8Array,Uint8ClampedArray,btoa:text=>Buffer.from(text,'binary').toString('base64')};vm.createContext(c);
 vm.runInContext(source.replace(/await import\('https:[^']+'\)/,'await Promise.resolve(runtime)').replace("await import('./outfit-segmentation.mjs'+new URL(import.meta.url).search)",'await Promise.resolve(segmentation)').replace("await import('./photo-color.js'+new URL(import.meta.url).search)",'await Promise.resolve()').replace("await import('./outfit-diagnostics.mjs'+new URL(import.meta.url).search)",'await Promise.resolve({diagnoseOutfitRegions:diagnosticFn})').replace("await import('./dress-layer-review.mjs'+new URL(import.meta.url).search)",'await Promise.resolve({dressClassCompetition})'),c);
 return {sent,async run(diagnostics=false){c.self.onmessage({data:{id:'outfit',image:'data:image/jpeg;base64,AAAA',diagnostics}});await vm.runInContext('chain',c);}};
}
test('full-outfit worker emits three separate garment images and excludes body labels',async()=>{
 const h=setup();await h.run();const pieces=h.sent.filter(x=>x.type==='piece');assert.deepEqual(pieces.map(x=>x.piece.label),['Upper garment','Bottoms','Shoes']);assert.ok(pieces.every(x=>x.piece.image.startsWith('data:image/jpeg;base64,')&&x.piece.recognitionPhoto.image.startsWith('data:image/jpeg;base64,')&&x.piece.cropBounds.width<1&&x.piece.colorEstimate===null));assert.equal(h.sent.find(x=>x.type==='done').count,3);assert.ok(!JSON.stringify(pieces).includes('Face'));assert.equal(pieces[2].piece.hint.displayFallback,'original-crop','tiny separate shoes need more reliable mask evidence');assert.equal(pieces[2].piece.hint.displayFallbackReason,'fragmented-mask');assert.equal(pieces[0].piece.hint.displayFallback,null,'contiguous shirt remains clipped');
});
test('load failure returns a safe error without fabricated cutouts',async()=>{
 const h=setup({failLoad:true});await h.run();assert.equal(h.sent.filter(x=>x.type==='piece').length,0);assert.ok(h.sent.some(x=>x.type==='error'));assert.ok(!JSON.stringify(h.sent).includes('private error'));
});
test('later crop failure preserves pieces emitted earlier',async()=>{
 const h=setup({failSecondCrop:true});await h.run();assert.equal(h.sent.filter(x=>x.type==='piece').length,1);assert.ok(h.sent.some(x=>x.type==='error'));assert.ok(!h.sent.some(x=>x.type==='done'));
});

test('clothing-shaped regions without sufficient person evidence do not create cutouts',async()=>{
 const h=setup({noPerson:true});await h.run();assert.equal(h.sent.filter(x=>x.type==='piece').length,0);assert.equal(h.sent.find(x=>x.type==='done').count,0);
});

test('supported left-right shoe pair retains both white-background cutouts in outfit worker',async()=>{
 const h=setup({completeShoePair:true});await h.run();
 const pieces=h.sent.filter(x=>x.type==='piece');
 assert.equal(pieces.length,3);
 assert.equal(pieces[2].piece.label,'Shoes');
 assert.equal(pieces[2].piece.hint.displayFallback,null,
  'two full matching shoe components should not become a raw background crop');
 assert.equal(pieces[2].piece.hint.displayFallbackReason,null);
 assert.equal(pieces[0].piece.hint.displayFallback,null);
});

test('worker keeps original narrow recognition bounds despite broader risky display fallback',async()=>{
 const h=setup();await h.run();
 const pieces=h.sent.filter(x=>x.type==='piece');
 const fallback=pieces.find(x=>x.piece.hint.displayFallback==='original-crop');
 assert.ok(fallback,'tiny fragmented shoes require wider original-pixel display');
 const shoe=fallback.piece;
 assert.equal(shoe.label,'Shoes');
 assert.equal(shoe.hint.displayFallbackReason,'fragmented-mask');
 // Recognition box is still measured from original source narrow mask extent.
 assert.ok(shoe.cropBounds.width>0&&shoe.cropBounds.width<1);
 assert.ok(shoe.recognitionPhoto.image.startsWith('data:image/jpeg;base64,'));
 assert.ok(shoe.image.startsWith('data:image/jpeg;base64,'));
});

test('opt-in worker diagnostics report classification/filter counts without copying photographs',async()=>{
 const h=setup();await h.run(true);
 const messages=h.sent.filter(x=>x.type==='diagnostics');assert.equal(messages.length,1,JSON.stringify(h.sent));
 const summary=messages[0].summary;
 assert.equal(summary.version,1);assert.equal(summary.emittedGroups,3);
 assert.equal(summary.regions.find(x=>x.id===4).emitted,true);
 assert.equal(summary.regions.find(x=>x.id===9).emitted,true);
 assert.equal(summary.realPhotoAccuracy,null);assert.equal(summary.sourcePixelsUnchanged,true);
 assert.equal(JSON.stringify(summary).includes('data:image'),false);
});

test('worker sends disconnected upper regions as two unapproved original crops',async()=>{
 const h=setup({twoUpper:true});await h.run();
 const upper=h.sent.filter(x=>x.type==='piece'&&x.piece.label==='Upper garment').map(x=>x.piece);
 assert.equal(upper.length,2,'each major upper region gets a separate review candidate');
 assert.ok(upper.every(p=>p.hint.displayFallback==='original-crop'));
 assert.ok(upper.every(p=>p.hint.displayFallbackReason==='disconnected-upper-regions'));
 assert.ok(upper.every(p=>p.colorEstimate===null),'no automatic fabric color approval on ambiguous regions');
 assert.ok(upper.every(p=>p.recognitionPhoto.image.startsWith('data:image/jpeg;base64,')));
 assert.equal(h.sent.find(x=>x.type==='done').count,4);
});

test('uncertain but substantial upper region is surfaced only as original-pixel review, not approved color',async()=>{
 const h=setup({weakUpper:true});await h.run();
 const upper=h.sent.filter(x=>x.type==='piece'&&x.piece.label==='Upper garment').map(x=>x.piece);
 assert.equal(upper.length,1);
 assert.equal(upper[0].hint.displayFallback,'original-crop');
 assert.equal(upper[0].hint.displayFallbackReason,'low-confidence-upper-mask');
 assert.equal(upper[0].colorEstimate,null,'unreliable mask can never approve a color');
 assert.ok(upper[0].recognitionPhoto.image.startsWith('data:image/jpeg;base64,'));
 assert.equal(h.sent.find(x=>x.type==='done').count,3);
});

test('whole-outfit worker routes strong no-person garment only to source-pixel review',async()=>{
 const h=setup({flatLay:true});await h.run(true);
 const pieces=h.sent.filter(x=>x.type==='piece');
 assert.equal(pieces.length,1);
 const only=pieces[0].piece;
 assert.equal(only.label,'Dress');
 assert.equal(only.hint.displayFallback,'original-crop');
 assert.equal(only.hint.displayFallbackReason,'no-person-evidence-review-only');
 assert.equal(only.colorEstimate,null,'flat-lay prediction must never approve automatic color');
 assert.ok(only.recognitionPhoto.image.startsWith('data:image/jpeg;base64,'));
 const diagnostic=h.sent.find(x=>x.type==='diagnostics').summary;
 assert.equal(diagnostic.personGatePassed,false);
 assert.equal(diagnostic.regions.find(x=>x.id===7).emitted,true);
});

test('mixed dress-versus-top/skirt logits block auto-approval without splitting physical items',async()=>{
 const h=setup({mixedDress:true});await h.run(true);
 const pieces=h.sent.filter(x=>x.type==='piece').map(x=>x.piece);
 assert.equal(pieces.length,1,'the model cannot infer two physical garments from logits');
 const dress=pieces[0];
 assert.equal(dress.label,'Dress');
 assert.equal(dress.hint.displayFallback,'original-crop');
 assert.equal(dress.hint.displayFallbackReason,'dress-layer-conflict-review-only');
 assert.equal(dress.colorEstimate,null,'ambiguous layered pixels cannot approve fabric color');
 assert.ok(dress.recognitionPhoto.image.startsWith('data:image/jpeg;base64,'));
 assert.ok(dress.image.startsWith('data:image/jpeg;base64,'));
 assert.equal(h.sent.find(x=>x.type==='done')?.count,1);
 const summary=h.sent.find(x=>x.type==='diagnostics').summary;
 assert.equal(summary.personGatePassed,true);
 assert.equal(summary.realPhotoAccuracy,null);
});
test('ordinary strong dress without class alternatives is not falsely marked as layered conflict',async()=>{
 const h=setup({strongDress:true});await h.run();
 const dress=h.sent.find(x=>x.type==='piece'&&x.piece.label==='Dress')?.piece;
 assert.ok(dress);
 assert.notEqual(dress.hint.displayFallbackReason,'dress-layer-conflict-review-only');
 assert.equal(h.sent.find(x=>x.type==='done')?.count,1);
});
