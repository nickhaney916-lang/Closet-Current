// Source-integrity regression; exercises client-side preview invalidation only.
// No AI model, hosted inference, credentials, photos, or billable request.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/ai-tryon.js','utf8');
const definitions=source.slice(source.indexOf('function tryOnInputs(){'),source.indexOf('function resetTryOnPreview(){'));
if(!definitions.includes('function sameTryOnInputs('))throw Error('Missing exact photo identity comparator');
const uri='data:image/jpeg;base64,'+'B'.repeat(150)+'STABLETRAILINGTWENTYFOUR';
function environment(){
 const c={tryOnFigure:'female',currentBoard:{slots:{top:'piece',bottom:'pants'}},
  items:[{id:'piece',category:'Tops',itemType:'T-shirt',image:uri},
   {id:'pants',category:'Bottoms',itemType:'Jeans',image:uri}]};
 vm.createContext(c);vm.runInContext(definitions,c);
 return c;
}
test('full source contents matter even for equal-length images with identical trailing bytes',()=>{
 const c=environment(),first=c.tryOnInputs();
 const other=uri.slice(0,42)+(uri[42]==='A'?'B':'A')+uri.slice(43);
 assert.equal(other.length,uri.length);
 assert.equal(other.slice(-24),uri.slice(-24));
 c.items[0].image=other;
 assert.equal(c.sameTryOnInputs(first,c.tryOnInputs()),false,
  'a changed captured photo can never retain the generated preview');
 c.items[0].image=uri;
 assert.equal(c.sameTryOnInputs(first,c.tryOnInputs()),true);
});
test('reclassification, removed wardrobe items, outfit selection and avatar changes invalidate',()=>{
 const c=environment(),before=c.tryOnInputs();
 c.items[0].category='Dresses';
 assert.equal(c.sameTryOnInputs(before,c.tryOnInputs()),false);
 c.items[0].category='Tops';c.items[0].itemType='Blouse';
 assert.equal(c.sameTryOnInputs(before,c.tryOnInputs()),false);
 c.items[0].itemType='T-shirt';
 c.currentBoard.slots.top='pants';
 assert.equal(c.sameTryOnInputs(before,c.tryOnInputs()),false);
 c.currentBoard.slots.top='piece';c.items.pop();
 assert.equal(c.sameTryOnInputs(before,c.tryOnInputs()),false);
 c.items.push({id:'pants',category:'Bottoms',itemType:'Jeans',image:uri});
 c.tryOnFigure='male';
 assert.equal(c.sameTryOnInputs(before,c.tryOnInputs()),false);
});
test('snapshot retains source strings without cloning or expanding embedded garment JPEGs',()=>{
 const c=environment(),snapshot=c.tryOnInputs();
 assert.equal(snapshot.slots.find(x=>x.slot==='top').image,uri);
 assert.equal(snapshot.slots.length,6);
 assert.equal(c.sameTryOnInputs(snapshot,c.tryOnInputs()),true);
 assert.equal(c.sameTryOnInputs(null,c.tryOnInputs()),false);
 assert.ok(!source.includes('item?.image?.slice(-24)'), 'no lossy preview image signature');
});
