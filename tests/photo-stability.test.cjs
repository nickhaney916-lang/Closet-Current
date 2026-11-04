const fs=require('node:fs'),vm=require('node:vm'),test=require('node:test'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/app.js','utf8');
const code=source.slice(source.indexOf('// Compare successive samples only'),source.indexOf('function snap('));
function harness(){let pixels=new Uint8ClampedArray(32*24*4);const document={createElement(){return {getContext(){return {drawImage(){},getImageData(){return {data:pixels};}};}};}};const context={document,video:{readyState:2},Uint8Array,Math};vm.createContext(context);vm.runInContext(code,context);return {context,frame(fn){for(let y=0;y<24;y++)for(let x=0;x<32;x++){const v=fn(x,y);const i=(y*32+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=v;pixels[i+3]=255;}return context.cameraStability();}};}
test('unchanged patterned garment remains stable',()=>{const h=harness(),pattern=(x,y)=>(x+y)%2?220:40;h.frame(pattern);assert.equal(h.frame(pattern).stable,true);});
test('major patterned movement is detected only after a previous frame',()=>{const h=harness(),a=(x,y)=>x%4<2?240:10,b=(x,y)=>x%4<2?10:240;assert.equal(h.frame(a).stable,true);assert.equal(h.frame(b).stable,false);});
test('plain garments bypass motion rejection',()=>{const h=harness();h.frame(()=>80);const r=h.frame(()=>110);assert.equal(r.lowTexture,true);});
test('unsupported canvas fails open',()=>{const context={document:{createElement(){throw Error('unavailable');}},video:{readyState:2},Uint8Array,Math};vm.createContext(context);vm.runInContext(code,context);assert.equal(context.cameraStability().stable,true);});
