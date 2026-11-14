import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
export async function checkViewer90(page,width,engine){
 const state=()=>page.evaluate(()=>window.native3D05Bridge.state());
 const camera=async()=>{const s=await state();assert.equal(s.bones,163);assert.ok(s.camera90);return s.camera90;};
 const settle=()=>page.waitForTimeout(350);
 const samples=[];
 // The original and every fresh canvas must remain keyboard accessible.
 const verifyCanvas=async()=>{
  const a=await page.locator('#outfit3D01Canvas').evaluate(c=>({
   touchAction:getComputedStyle(c).touchAction,tabIndex:c.tabIndex,
   label:c.getAttribute('aria-label')
  }));
  assert.equal(a.touchAction,'pan-y','vertical scrolling must not be trapped over avatar');
  assert.equal(a.tabIndex,0,'actual 3D canvas remains keyboard focusable');
  assert.match(a.label||'',/Drag to rotate/);
 };
 await verifyCanvas();
 for(const figure of ['female','male']){
  await page.selectOption('#outfit3D01Model',figure);
  await page.waitForFunction(()=>window.native3D05Bridge.state().modelReady,null,{timeout:120000});
  await page.locator('#outfit3D01Reset90').click();await settle();
  const before=await camera();
  await page.locator('#outfit3D01Right90').click();await settle();
  const after=await camera();assert.ok(Math.abs(after.angle-before.angle)>5);
  await page.locator('#outfit3D01Canvas').focus();await page.keyboard.press('Home');await settle();
  const resetAngle=(await camera()).angle;assert.ok(Math.min(resetAngle,360-resetAngle)<1);
  await page.locator('#outfit3D01ZoomIn90').click();await settle();
  assert.ok((await camera()).distance<before.distance);
  await page.locator('#outfit3D01Reset90').click();await settle();
  const box=await page.locator('#outfit3D01Canvas').boundingBox();
  await page.mouse.move(box.x+box.width*.4,box.y+box.height*.5);
  await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.5,{steps:12});await page.mouse.up();await settle();
  assert.ok(Math.abs((await camera()).angle)>5,'actual pointer drag changes camera');
  // Repeated camera work must neither rebuild textures nor deform skeletons.
  const baseline=await state();const durations=[];
  for(let i=0;i<16;i++){
   const t=Date.now();await page.locator('#outfit3D01Right90').click();await settle();durations.push(Date.now()-t);
  }
  const final=await state();assert.equal(final.bones,163);
  assert.equal(final.resources90.geometries,baseline.resources90.geometries);
  assert.equal(final.resources90.textures,baseline.resources90.textures);
  // Camera work does not load new garments or textures (renderer metrics
  // are captured through the existing authenticated read-only panel).
  samples.push({figure,width,engine,before,after,finalCamera:final.camera90,buttonRoundTripMs:durations,baselineBones:baseline.bones,finalBones:final.bones,baselineResources:baseline.resources90,finalResources:final.resources90});
 }
 // Browser-emulated phone landscape; physical finger/hardware remains NOT TESTED.
 // Keep the exact already admitted rig and garment while resizing the viewer.
 const originalViewport=page.viewportSize();
 let landscape=null;
 try{
  await page.setViewportSize({width:780,height:390});
  await settle();
  await verifyCanvas();
  landscape=await page.evaluate(()=>{
   const canvas=document.getElementById('outfit3D01Canvas');
   const button=document.getElementById('outfit3D01Right90');
   const rect=button.getBoundingClientRect();
   return {viewport:[innerWidth,innerHeight],canvas:[canvas.clientWidth,canvas.clientHeight],
    rotateButton:[rect.width,rect.height],touchAction:getComputedStyle(canvas).touchAction};
  });
  assert.ok(landscape.canvas[0]>0&&landscape.canvas[1]>=200,'landscape must retain usable 3D canvas');
  assert.ok(landscape.rotateButton.every(v=>v>=43),'landscape rotate control must remain touch-sized');
  await page.locator('#outfit3D01Reset90').click();await settle();
  const a=(await camera()).angle;
  await page.locator('#outfit3D01Right90').click();await settle();
  const b=(await camera()).angle;
  assert.ok(Math.abs(((b-a+540)%360)-180)>5,'landscape rotation changes real camera');
  assert.equal((await state()).bones,163);
 }finally{
  await page.setViewportSize(originalViewport);await settle();
 }
 await page.locator('#outfit3D01Reset90').click();
 await mkdir('benchmark/parallel90/'+engine,{recursive:true});
 await page.screenshot({path:'benchmark/parallel90/'+engine+'/'+width+'-interactive.png'});
 // Lose the actual renderer context through the browser extension. This
 // remains a software-browser simulation, not a physical GPU fault.
 assert.equal(await page.evaluate(()=>{
  const gl=document.getElementById('outfit3D01Canvas').getContext('webgl2');
  const extension=gl?.getExtension('WEBGL_lose_context');
  if(!extension)return false;extension.loseContext();return true;
 }),true,'actual WebGL context-loss extension required');
 await page.waitForFunction(()=>!window.native3D05Bridge.state().active);
 assert.equal((await state()).renderStages90,null,'revoked original-photo 3D cannot expose stale render timings');
 assert.equal((await state()).sceneApplyStages90,null,'revoked viewer cannot expose stale WebGL apply-stage timings');
 assert.equal(await page.locator('#outfit3D01Photos img').count(),0);
 assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true);
 await writeFile('benchmark/parallel90/'+engine+'/'+width+'.json',JSON.stringify({samples,landscape,contextLossSimulation:'PASS_WEBGL_lose_context',physicalPhone:false,familyAlpha:'HOLD'},null,2));
 // Reopen requires actual owner/source re-attestation and a new renderer.
 await page.locator('#native3D05Preview').click();
 await page.waitForFunction(()=>window.native3D05Bridge.state().modelReady,null,{timeout:150000});
 await verifyCanvas();
 await page.locator('#outfit3D01Reset90').click();await settle();
 const beforeKey=(await camera()).angle;
 await page.locator('#outfit3D01Canvas').focus();
 await page.keyboard.press('ArrowRight');await settle();
 const afterKey=(await camera()).angle;
 assert.ok(Math.abs(((afterKey-beforeKey+540)%360)-180)>5,
  'reopened real WebGL canvas must retain working keyboard orbit');
}
