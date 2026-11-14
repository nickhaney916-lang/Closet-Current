import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
export async function checkViewer90(page,width,engine){
 const state=()=>page.evaluate(()=>window.native3D05Bridge.state());
 const camera=async()=>{const s=await state();assert.equal(s.bones,163);assert.ok(s.camera90);return s.camera90;};
 const settle=()=>page.waitForTimeout(350);
 const samples=[];
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
 await page.locator('#outfit3D01Reset90').click();
 await mkdir('benchmark/parallel90/'+engine,{recursive:true});
 await page.screenshot({path:'benchmark/parallel90/'+engine+'/'+width+'-interactive.png'});
 // A synthetic event tests the lifecycle handler; hardware GPU loss remains
 // a distinct physical-device acceptance requirement.
 await page.evaluate(()=>document.getElementById('outfit3D01Canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
 await page.waitForFunction(()=>!window.native3D05Bridge.state().active);
 assert.equal(await page.locator('#outfit3D01Photos img').count(),0);
 assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true);
 await writeFile('benchmark/parallel90/'+engine+'/'+width+'.json',JSON.stringify({samples,contextLossSimulation:'PASS',physicalPhone:false,familyAlpha:'HOLD'},null,2));
 // Reopen requires actual owner/source re-attestation and a new renderer.
 await page.locator('#native3D05Preview').click();
 await page.waitForFunction(()=>window.native3D05Bridge.state().modelReady,null,{timeout:150000});
}
