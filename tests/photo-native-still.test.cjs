const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');

const code=fs.readFileSync('public/app.js','utf8');
const photoCode=code.slice(code.indexOf('async function captureCameraStill('),code.indexOf('function beep('));
const tapCode=code.slice(code.indexOf('function takePhoto(){'),code.indexOf('async function startCamera('));

function harness({still=true,reject=false}={}){
 const draws=[],saved=[],messages=[],buttons={takePhoto:{disabled:false},stop:{disabled:false},captureState:{textContent:''}};
 let settle,closed=0,nextTimer=0;const timers=new Map();
 const bitmap={width:4000,height:3000,close(){closed++;}};
 const canvas={width:0,height:0,getContext(){return {drawImage(...args){draws.push(args);},imageSmoothingEnabled:false,imageSmoothingQuality:'low'};},toDataURL(type,quality){assert.equal(type,'image/jpeg');assert.equal(quality,.94);return 'still-jpeg';}};
 class ImageCapture{constructor(track){assert.equal(track.kind,'video');}takePhoto(){return new Promise((resolve,rejectPromise)=>{settle=()=>reject?rejectPromise(Error('unsupported still')):resolve({type:'image/jpeg',size:1024});});}}
 const stream={getVideoTracks(){return [{kind:'video'}];}};
 const c={
  stream,cameraMode:'manual',cameraRequest:1,manualStillShot:null,session:0,
  canvas,window:still?{ImageCapture}:{},createImageBitmap:async()=>bitmap,
  cameraFrameQuality:()=>({usable:true}),cameraStability:()=>({stable:true}),
  cameraPreviewHealth:()=>({live:true}),
  snap:()=> 'preview-jpeg',candidate:image=>{saved.push(image);c.session++;},
  beep(){},finishScan(){},$:id=>buttons[id]||(buttons[id]={}),message:msg=>messages.push(msg),
  setTimeout:fn=>{const id=++nextTimer;timers.set(id,fn);return id;},
  clearTimeout:id=>timers.delete(id),
  Math,Number,Error
 };
 vm.createContext(c);vm.runInContext(photoCode+'\n'+tapCode,c);
 return {c,canvas,draws,saved,messages,buttons,bitmap,closed:()=>closed,settle:()=>settle?.(),expire:()=>{for(const [id,fn] of timers){timers.delete(id);fn();}},pendingTimers:()=>timers.size};
}
const flush=async()=>{for(let i=0;i<5;i++)await new Promise(setImmediate);};

test('native still uses a 4:3 sensor photo rather than 16:9 preview, with no enlargement',async()=>{
 const h=harness();
 h.c.takePhoto();
 assert.equal(h.saved.length,0);
 assert.equal(h.buttons.takePhoto.disabled,true);
 assert.equal(h.buttons.stop.disabled,true);
 h.settle();await flush();
 assert.deepEqual(h.saved,['still-jpeg']);
 assert.equal(h.canvas.width,3072);
 assert.equal(h.canvas.height,2304);
 assert.equal(h.draws.length,1);
 assert.equal(h.draws[0][0],h.bitmap);
 assert.equal(h.closed(),1);
 assert.equal(h.buttons.takePhoto.disabled,false);
 assert.equal(h.buttons.stop.disabled,false);
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

test('hung native still falls back once, and late decoded data cannot overwrite preview',async()=>{
 const h=harness();h.c.takePhoto();assert.equal(h.saved.length,0);
 assert.equal(h.pendingTimers(),1);
 h.expire();await flush();
 assert.deepEqual(h.saved,['preview-jpeg']);
 assert.equal(h.buttons.takePhoto.disabled,false);
 h.settle();await flush();
 assert.deepEqual(h.saved,['preview-jpeg']);
 assert.equal(h.draws.length,0);
});

test('detailed native photo reduces dimensions until it fits the encoded budget',async()=>{
 const h=harness(),sizes=[];
 h.canvas.toDataURL=()=>{sizes.push([h.canvas.width,h.canvas.height]);return h.canvas.width>2048?'x'.repeat(2850001):'bounded-jpeg';};
 h.c.takePhoto();h.settle();await flush();
 assert.deepEqual(sizes,[[3072,2304],[3072,2304],[3072,2304],[2560,1920],[2560,1920],[2560,1920],[2048,1536]]);
 assert.deepEqual(h.saved,['bounded-jpeg']);assert.equal(h.closed(),1);
});
test('unencodable native still safely falls back and releases its bitmap',async()=>{
 const h=harness();h.canvas.toDataURL=()=> 'data:,';
 h.c.takePhoto();h.settle();await flush();
 assert.deepEqual(h.saved,['preview-jpeg']);assert.equal(h.closed(),1);
});
test('oversize native JPEG never reaches the clothing queue',async()=>{
 const h=harness();h.canvas.toDataURL=()=> 'x'.repeat(2850001);
 h.c.takePhoto();h.settle();await flush();
 assert.deepEqual(h.saved,['preview-jpeg']);assert.equal(h.draws.length,5);assert.equal(h.closed(),1);
});
test('portrait source keeps orientation and browser color management',async()=>{
 const h=harness();let options;
 h.bitmap.width=3000;h.bitmap.height=4000;
 h.c.createImageBitmap=async(blob,opts)=>{options=opts;return h.bitmap;};
 h.c.takePhoto();h.settle();await flush();
 assert.equal(h.canvas.width,2304);assert.equal(h.canvas.height,3072);
 assert.equal(options.imageOrientation,'from-image');assert.equal(options.colorSpaceConversion,'default');
});
test('timeout invalidates pending decode before fallback, even within the same task',async()=>{
 const h=harness();let decode;
 h.c.createImageBitmap=()=>new Promise(resolve=>decode=resolve);
 h.c.takePhoto();h.settle();await flush();
 h.expire();decode(h.bitmap);await flush();
 assert.deepEqual(h.saved,['preview-jpeg']);assert.equal(h.draws.length,0);assert.equal(h.closed(),1);
});
test('retry works after timed-out decoder and ignores the old photo',async()=>{
 const h=harness();let decode;
 h.c.createImageBitmap=()=>new Promise(resolve=>decode=resolve);
 h.c.takePhoto();h.settle();await flush();h.expire();await flush();
 h.c.createImageBitmap=async()=>h.bitmap;
 h.c.takePhoto();h.settle();await flush();decode(h.bitmap);await flush();
 assert.deepEqual(h.saved,['preview-jpeg','still-jpeg']);assert.equal(h.draws.length,1);assert.equal(h.closed(),2);
});
test('native encoder does not retry identical sizes for a small source',async()=>{
 const h=harness();h.bitmap.width=800;h.bitmap.height=600;
 h.canvas.toDataURL=()=> 'x'.repeat(2850001);
 h.c.takePhoto();h.settle();await flush();
 assert.equal(h.draws.length,1);assert.deepEqual(h.saved,['preview-jpeg']);
});

test('native still retains 3072px garment details at JPEG quality .88 instead of downsampling',async()=>{
 const h=harness(),encoded=[];
 h.canvas.toDataURL=(mime,quality)=>{
  encoded.push({width:h.canvas.width,height:h.canvas.height,quality});
  return quality>.88?'x'.repeat(2850001):'full-resolution-still';
 };
 h.c.takePhoto();h.settle();await flush();
 assert.deepEqual(encoded,[{width:3072,height:2304,quality:.94},{width:3072,height:2304,quality:.88}]);
 assert.equal(h.draws.length,1,'Changing JPEG compression does not redraw or lose source pixels');
 assert.deepEqual(h.saved,['full-resolution-still']);
 assert.equal(h.closed(),1);
});
test('native still retries only bounded qualities before dropping the pixel count',async()=>{
 const h=harness(),encoded=[];
 h.canvas.toDataURL=(_,quality)=>{
  encoded.push([h.canvas.width,quality]);
  return h.canvas.width>2560||quality>.82?'x'.repeat(2850001):'native-still-safe';
 };
 h.c.takePhoto();h.settle();await flush();
 assert.deepEqual(encoded,[[3072,.94],[3072,.88],[3072,.82],[2560,.94],[2560,.88],[2560,.82]]);
 assert.deepEqual(h.saved,['native-still-safe']);
 assert.equal(h.draws.length,2);
});
test('native still quality retry abandons stale camera sessions without encoding or queueing stale items',async()=>{
 const h=harness(),encoded=[];
 h.canvas.toDataURL=(_,quality)=>{
  encoded.push(quality);
  if(quality===.94){h.c.cameraRequest++;return 'x'.repeat(2850001);}
  return 'should-not-save';
 };
 h.c.takePhoto();h.settle();await flush();
 assert.deepEqual(encoded,[.94]);
 assert.deepEqual(h.saved,[]);
 assert.equal(h.closed(),1);
});
