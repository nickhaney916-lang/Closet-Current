import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

// Real built editor, native JPEG decoding, canvas and pointer actions.
// Only delivery of the decoded image's onload callback is held and reordered.
async function exercise(browser,engine,width){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 try{
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>route.abort());
  await page.setContent('<!doctype html><meta name="viewport" content="width=device-width"><style>dialog{width:250px;max-width:90vw;max-height:90vh;overflow:auto}.crop-stage{position:relative;width:200px;height:160px}.crop-stage img{width:100%;height:100%}.crop-frame{position:absolute;touch-action:none}.crop-preview{max-width:200px}.crop-handle{display:none}</style>');
  for(const file of ['photo-crop-engine.js','garment-mask-engine.js','photo-crop-editor.js'])
   await page.addScriptTag({path:'dist/'+file});
  await page.evaluate(()=>{
   const NativeImage=window.Image;
   window.pendingPreviews=[];
   window.Image=function(...args){
    const img=new NativeImage(...args);
    Object.defineProperty(img,'onload',{configurable:true,set(fn){
     const entry={img,fn,loaded:false};
     window.pendingPreviews.push(entry);
     img.addEventListener('load',()=>{entry.loaded=true;},{once:true});
    }});
    return img;
   };
   const canvas=document.createElement('canvas');canvas.width=200;canvas.height=160;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#a02020';ctx.fillRect(0,0,200,160);
   window.fixtureOriginal=canvas.toDataURL('image/jpeg',.95);
   window.fixtureCurrent=true;
   window.openFixture=()=>window.openPhotoCrop({image:window.fixtureOriginal},{isCurrent:()=>window.fixtureCurrent,analyze:async()=>null,save:async()=>{throw Error('Unexpected save');}});
   window.deliverPreview=index=>{const p=window.pendingPreviews[index];if(!p.loaded)throw Error('Image not decoded');p.fn.call(p.img,new Event('load'));};
   window.readPreview=()=>document.querySelector('.crop-preview').toDataURL();
  });
  await page.evaluate(()=>window.openFixture());
  const frame=page.locator('.crop-frame');
  const click=async(x,y)=>{await frame.click({position:{x,y}});};
  const wait=async index=>page.waitForFunction(index=>window.pendingPreviews[index]?.loaded,index);
  await page.getByRole('button',{name:'Erase background'}).click();
  await click(50,80);await click(150,80);
  await wait(0);await wait(1);
  const newest=await page.evaluate(()=>{window.deliverPreview(1);return window.readPreview();});
  const pixels=await page.evaluate(()=>{const ctx=document.querySelector('.crop-preview').getContext('2d');return [50,150].map(x=>Array.from(ctx.getImageData(x,80,1,1).data));});
  assert.ok(pixels.every(p=>p.slice(0,3).every(v=>v>230)),'newest preview must contain both erased regions');
  assert.equal(await page.evaluate(()=>{window.deliverPreview(0);return window.readPreview();}),newest);
  await click(100,40);await wait(2);
  await page.getByRole('button',{name:'Reset mask'}).click();
  await click(100,120);await wait(3);
  const restored=await page.evaluate(()=>{window.deliverPreview(3);return window.readPreview();});
  assert.notEqual(restored,newest);
  assert.equal(await page.evaluate(()=>{window.deliverPreview(2);return window.readPreview();}),restored);
  await click(100,80);await wait(4);
  const closed=await page.evaluate(()=>{
   const dialog=document.querySelector('dialog'),canvas=document.querySelector('.crop-preview');
   const before=canvas.toDataURL();dialog.close();window.deliverPreview(4);
   return {before,after:canvas.toDataURL(),open:dialog.open};
  });
  assert.equal(closed.open,false);assert.equal(closed.after,closed.before);
  await page.locator('.photo-crop-editor').waitFor({state:'detached'});
  await page.evaluate(()=>window.openFixture());
  await page.getByRole('button',{name:'Erase background'}).click();
  await click(50,80);await wait(5);
  const locked=await page.evaluate(()=>{
   const before=window.readPreview();window.fixtureCurrent=false;window.deliverPreview(5);return {before,after:window.readPreview()};
  });
  assert.equal(locked.after,locked.before);
  assert.deepEqual(errors,[]);
  console.log(engine,width,'PASS latest masked crop preview and closed/revoked lease');
 }finally{await context.close();}
}
for(const [engine,type] of Object.entries({chromium,webkit})){
 if(process.env.CC_CROP_ENGINE&&process.env.CC_CROP_ENGINE!==engine)continue;
 const browser=await type.launch();
 try{for(const width of [320,390,430])await exercise(browser,engine,width);}
 finally{await browser.close();}
}
