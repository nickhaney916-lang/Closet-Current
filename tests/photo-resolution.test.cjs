const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/photo-import.js','utf8');
function setup(width,height){
 const calls=[],canvas={getContext:()=>({fillRect(){},drawImage(...args){calls.push(args.slice(1));}}),toDataURL(type,quality){calls.push({type,quality});return 'jpeg';}};
 const c={URL:{createObjectURL:()=> 'photo',revokeObjectURL(){}},Image:class{constructor(){Object.assign(this,{width,height});}async decode(){}},document:{createElement:()=>canvas}};
 vm.createContext(c);vm.runInContext(source,c);return {c,canvas,calls};
}
test('whole-outfit conversion retains detail before isolating smaller garments',async()=>{
 const h=setup(3024,4032);await h.c.photoToJPEG({}, {maxDimension:2048,quality:.94});
 assert.equal(h.canvas.width,1536);assert.equal(h.canvas.height,2048);assert.deepEqual(h.calls[0],[0,0,1536,2048]);assert.equal(h.calls[1].quality,.94);
});
test('small originals are never enlarged and regular photo imports keep their existing limits',async()=>{
 const h=setup(600,800);await h.c.photoToJPEG({}, {maxDimension:2048,quality:.94});assert.equal(h.canvas.width,600);assert.equal(h.canvas.height,800);
 const regular=setup(3024,4032);await regular.c.photoToJPEG({});assert.equal(regular.canvas.height,900);assert.equal(regular.calls[1].quality,.8);
});
