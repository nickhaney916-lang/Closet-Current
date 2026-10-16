const fs=require('node:fs');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
const source=fs.readFileSync('public/app.js','utf8');
const qualityCode=source.slice(source.indexOf('function cameraFrameQuality('),source.indexOf('function snap('));
function assess(value){
 const data=new Uint8ClampedArray(64*48*4);
 for(let i=0;i<data.length;i+=4){data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;}
 const doc={createElement(){return {getContext(){return {drawImage(){},getImageData(){return {data};}};}};}};
 const sandbox={document:doc,video:{readyState:2,videoWidth:1920,videoHeight:1080},Float32Array,Math};
 vm.createContext(sandbox);vm.runInContext(qualityCode,sandbox);
 return sandbox.cameraFrameQuality();
}
test('nearly black frame is rejected',()=>assert.equal(assess(3).usable,false));
test('plain white garment frame remains accepted',()=>assert.equal(assess(240).usable,true));
test('medium-gray low-texture garment remains accepted',()=>assert.equal(assess(100).usable,true));
test('quality check does not reject when browser sampling is unavailable',()=>{
 const sandbox={video:{readyState:2,videoWidth:1920,videoHeight:1080},Math};
 vm.createContext(sandbox);vm.runInContext(qualityCode,sandbox);
 assert.equal(sandbox.cameraFrameQuality().usable,true);
});

test('low resolution camera frames are rejected even if bright',()=>{
 const sandbox={video:{readyState:2,videoWidth:200,videoHeight:180},document:{},Math};
 vm.createContext(sandbox);vm.runInContext(qualityCode,sandbox);
 assert.equal(sandbox.cameraFrameQuality().usable,false);
});
test('browser canvas security or device failures do not prevent capture',()=>{
 const sandbox={video:{readyState:2,videoWidth:1920,videoHeight:1080},document:{createElement(){throw Error('Canvas unavailable');}},Math};
 vm.createContext(sandbox);vm.runInContext(qualityCode,sandbox);
 assert.equal(sandbox.cameraFrameQuality().usable,true);
});
