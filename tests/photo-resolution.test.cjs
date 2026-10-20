const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/photo-import.js','utf8');
function setup(width,height){
 const calls=[],canvas={getContext:()=>({fillRect(){},drawImage(...args){calls.push(args.slice(1));}}),toDataURL(type,quality){calls.push({type,quality});return 'jpeg';}};
 const c={setTimeout,clearTimeout,URL:{createObjectURL:()=> 'photo',revokeObjectURL(){}},
  Image:class{constructor(){Object.assign(this,{width,height});}async decode(){}},
  document:{createElement:()=>canvas}};
 vm.createContext(c);vm.runInContext(source,c);return {c,canvas,calls};
}
test('whole-outfit conversion retains detail before isolating smaller garments',async()=>{
 const h=setup(3024,4032);await h.c.photoToJPEG({}, {maxDimension:3072,quality:.94});
 assert.equal(h.canvas.width,2304);assert.equal(h.canvas.height,3072);assert.deepEqual(h.calls[0],[0,0,2304,3072]);assert.equal(h.calls[1].quality,.94);
});
test('small originals are never enlarged and regular imports use the improved clarity defaults',async()=>{
 const h=setup(600,800);await h.c.photoToJPEG({}, {maxDimension:3072,quality:.94});assert.equal(h.canvas.width,600);assert.equal(h.canvas.height,800);
 const regular=setup(3024,4032);await regular.c.photoToJPEG({});assert.equal(regular.canvas.height,2048);assert.equal(regular.calls[1].quality,.94);
});
