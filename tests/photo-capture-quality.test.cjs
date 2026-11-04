const fs=require('node:fs');
const assert=require('node:assert/strict');
const test=require('node:test');
const vm=require('node:vm');
const source=fs.readFileSync('public/app.js','utf8');
const snap=source.slice(source.indexOf('function snap('),source.indexOf('function beep('));
test('camera capture requests high quality downsampling and preserves actual frame dimensions',()=>{
 const calls=[];
 const context={imageSmoothingEnabled:false,imageSmoothingQuality:'low',drawImage(...args){calls.push(args);}};
 const canvas={width:0,height:0,getContext(){return context;},toDataURL(format,quality){assert.equal(format,'image/jpeg');assert.equal(quality,.94);return 'photo';}};
 const video={videoWidth:4000,videoHeight:3000,readyState:2};
 const sandbox={video,canvas,Error,Math};vm.createContext(sandbox);vm.runInContext(snap,sandbox);
 assert.equal(sandbox.snap(),'photo');assert.equal(canvas.width,2048);assert.equal(canvas.height,1536);
 assert.equal(context.imageSmoothingEnabled,true);assert.equal(context.imageSmoothingQuality,'high');assert.equal(calls.length,1);
 video.videoWidth=640;video.videoHeight=480;sandbox.snap();assert.equal(canvas.width,640);assert.equal(canvas.height,480);
});
