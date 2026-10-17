const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');

const code=fs.readFileSync('public/app.js','utf8');
const photoCode=code.slice(code.indexOf('async function captureCameraStill('),code.indexOf('function beep('));
const tapCode=code.slice(code.indexOf('function takePhoto(){'),code.indexOf('async function startCamera('));

function harness({still=true,reject=false}={}){
 const draws=[],saved=[],messages=[],buttons={takePhoto:{disabled:false},captureState:{textContent:''}};
 let settle,closed=0;
 const bitmap={width:4000,height:3000,close(){closed++;}};
 const canvas={width:0,height:0,getContext(){return {drawImage(...args){draws.push(args);},imageSmoothingEnabled:false,imageSmoothingQuality:'low'};},toDataURL(type,quality){assert.equal(type,'image/jpeg');assert.equal(quality,.94);return 'still-jpeg';}};
 class ImageCapture{constructor(track){assert.equal(track.kind,'video');}takePhoto(){return new Promise((resolve,rejectPromise)=>{settle=()=>reject?rejectPromise(Error('unsupported still')):resolve({type:'image/jpeg',size:1024});});}}
 const stream={getVideoTracks(){return [{kind:'video'}];}};
 const c={
  stream,cameraMode:'manual',cameraRequest:1,manualStillShot:null,session:0,
  canvas,window:still?{ImageCapture}:{},createImageBitmap:async()=>bitmap,
  cameraFrameQuality:()=>({usable:true}),cameraStability:()=>({stable:true}),
  snap:()=> 'preview-jpeg',candidate:image=>{saved.push(image);c.session++;},
  beep(){},finishScan(){},$:id=>buttons[id]||(buttons[id]={}),message:msg=>messages.push(msg),
  Math,Number,Error
 };
 vm.createContext(c);vm.runInContext(photoCode+'\n'+tapCode,c);
 return {c,canvas,draws,saved,messages,buttons,bitmap,closed:()=>closed,settle:()=>settle?.()};
}
const flush=async()=>{for(let i=0;i<5;i++)await new Promise(setImmediate);};

test('native still uses a 4:3 sensor photo rather than 16:9 preview, with no enlargement',async()=>{
 const h=harness();
 h.c.takePhoto();
 assert.equal(h.saved.length,0);
 assert.equal(h.buttons.takePhoto.disabled,true);
 h.settle();await flush();
 assert.deepEqual(h.saved,['still-jpeg']);
 assert.equal(h.canvas.width,2048);
 assert.equal(h.canvas.height,1536);
 assert.equal(h.draws.length,1);
 assert.equal(h.draws[0][0],h.bitmap);
 assert.equal(h.closed(),1);
 assert.equal(h.buttons.takePhoto.disabled,false);
 assert.equal(h.c.manualStillShot,null);
});

test('unsupported native still immediately falls back to one video-frame photo',async()=>{
 const h=harness({still:false});
 h.c.takePhoto();h.c.takePhoto();
 assert.deepEqual(h.saved,['preview-jpeg','preview-jpeg']);
 assert.equal(h.buttons.takePhoto.disabled,false);
});

test('native still rejection recovers the tap with existing preview capture',async()=>{
 const h=harness({reject:true});h.c.takePhoto();h.settle();await flush();
 assert.deepEqual(h.saved,['preview-jpeg']);
 assert.equal(h.buttons.takePhoto.disabled,false);
 assert.equal(h.c.manualStillShot,null);
});

test('rapid repeat taps cannot create duplicate photos while still capture is pending',async()=>{
 const h=harness();h.c.takePhoto();h.c.takePhoto();
 assert.equal(h.saved.length,0);
 h.settle();await flush();
 assert.deepEqual(h.saved,['still-jpeg']);
});

test('a still returned after leaving camera must never be added to the closet queue',async()=>{
 const h=harness();h.c.takePhoto();
 h.c.cameraRequest++;h.c.stream=null;h.c.cameraMode=null;h.c.manualStillShot=null;
 h.settle();await flush();
 assert.deepEqual(h.saved,[]);
 assert.equal(h.closed(),0);
 assert.equal(h.draws.length,0);
});

test('still capture rejects invalid dimensions and releases decoded bitmap',async()=>{
 const h=harness();
 h.bitmap.width=100;h.bitmap.height=120;
 h.c.takePhoto();h.settle();await flush();
 assert.deepEqual(h.saved,['preview-jpeg']);
 assert.equal(h.closed(),1);
});

test('low-resolution native still is not upscaled by the encoder',async()=>{
 const h=harness();
 h.bitmap.width=800;h.bitmap.height=600;
 h.c.takePhoto();h.settle();await flush();
 assert.equal(h.canvas.width,800);assert.equal(h.canvas.height,600);
 assert.deepEqual(h.saved,['still-jpeg']);
});
