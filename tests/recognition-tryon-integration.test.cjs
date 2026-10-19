// Integrated handoff of the REAL Closet Current source-photo classifier helper
// and the REAL selected garment AI-try-on planner. Synthetic fixture pixels,
// NO model/proxy/provider networking, no closet DB mutation.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const TryOn=require('../public/ai-tryon-plan.js');
const source=fs.readFileSync('public/app.js','utf8');
const start=source.indexOf('function recognitionSourcePhoto(');
const end=source.indexOf('function clothingFields(',start);
assert.ok(start>0&&end>start,'integrated build must retain original RGB recognition source');
const context={};vm.createContext(context);vm.runInContext(source.slice(start,end),context);
const uri=character=>'data:image/jpeg;base64,'+character.repeat(180);

test('original full outfit is context, unmasked crop is classification input, cleaned catalog garment is try-on input',()=>{
 const full=uri('A'),rawTop=uri('B'),displayTop=uri('C'),rawPants=uri('D'),displayPants=uri('E');
 const top={id:'top',category:'Tops',itemType:'T-shirt',outfitSourceId:'scene-1',
   image:displayTop,recognitionPhoto:{image:rawTop},originalPhoto:{image:full},
   normalizedPreview:{image:uri('F')}};
 const bottom={id:'bottom',category:'Bottoms',itemType:'Jeans',outfitSourceId:'scene-1',
   image:displayPants,recognitionPhoto:{image:rawPants},originalPhoto:{image:full}};
 const before=structuredClone([top,bottom]);
 assert.equal(context.recognitionSourcePhoto(top),rawTop);
 assert.equal(context.recognitionSourcePhoto(bottom),rawPants);
 const board={slots:{top:'top',bottom:'bottom'}};
 const steps=TryOn.plan(board,[top,bottom]).steps;
 assert.deepEqual(steps.map(x=>({slot:x.slot,category:x.category})),
  [{slot:'top',category:'tops'},{slot:'bottom',category:'bottoms'}]);
 assert.equal(steps[0].image,displayTop);
 assert.equal(steps[1].image,displayPants);
 assert.ok(steps.every(step=>step.image!==full&&step.image!==rawTop&&step.image!==rawPants),
  'never upload full wearer scene or scene-context crop as the model garment');
 assert.notEqual(steps[0].image,top.normalizedPreview.image,
  'AI filled / prettified derivative is never used to infer garment identity');
 assert.deepEqual([top,bottom],before,'planning cannot mutate original camera/source records');
});
test('missing raw crop fails closed for outfit classification, never swaps in generated preview',()=>{
 const top={id:'top',outfitSourceId:'scene-2',category:'Tops',itemType:'Unknown',
  image:uri('C'),originalPhoto:{image:uri('A')},
  normalizedPreview:{image:uri('Z')}};
 assert.equal(context.recognitionSourcePhoto(top),null);
 assert.equal(context.recognitionSourcePhoto({...top,recognitionPhoto:{image:''}}),null);
 assert.equal(context.recognitionSourcePhoto({...top,recognitionPhoto:{image:uri('B')}}),uri('B'));
 const single={id:'standalone',category:'Tops',image:uri('G'),normalizedPreview:{image:uri('Z')}};
 assert.equal(context.recognitionSourcePhoto(single),single.image);
});
test('changing garment try-on tile does not rewrite full-scene recognition provenance',()=>{
 const full=uri('A'),raw=uri('B');
 const garment={id:'top',category:'Tops',itemType:'Blouse',outfitSourceId:'scene-3',
  image:uri('C'),recognitionPhoto:{image:raw},originalPhoto:{image:full}};
 const originalSource=context.recognitionSourcePhoto(garment);
 const before=TryOn.plan({slots:{top:'top'}},[garment]).steps[0].image;
 garment.image=uri('H');
 const after=TryOn.plan({slots:{top:'top'}},[garment]).steps[0].image;
 assert.notEqual(before,after,'updated clipped display produces a new try-on input');
 assert.equal(context.recognitionSourcePhoto(garment),originalSource);
 assert.equal(garment.originalPhoto.image,full);
});
