const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/app.js','utf8');
const code=source.slice(source.indexOf('function snap('),source.indexOf('function beep('));
function setup(encode){
 const sizes=[],canvas={width:0,height:0,getContext:()=>({drawImage(){}}),toDataURL(){sizes.push([canvas.width,canvas.height]);return encode(canvas.width);}};
 const c={canvas,video:{videoWidth:4000,videoHeight:3000,readyState:2}};
 vm.createContext(c);vm.runInContext(code,c);return {c,sizes};
}
test('video fallback stays under storage budget and redraws original frame',()=>{
 const h=setup(width=>width>1536?'x'.repeat(2850001):'bounded');
 assert.equal(h.c.snap(),'bounded');assert.deepEqual(h.sizes,[[2048,1536],[1536,1152]]);
});
test('video fallback rejects oversize encoding instead of queuing unexportable photo',()=>{
 const h=setup(()=> 'x'.repeat(2850001));
 assert.throws(()=>h.c.snap(),/storage limits/);assert.equal(h.sizes.length,3);
});
test('empty video canvas encoder fails instead of saving blank image',()=>{
 const h=setup(()=> 'data:,');assert.throws(()=>h.c.snap(),/encode/);
});
