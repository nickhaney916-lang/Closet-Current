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
 const sourceNotice90=page.locator('#outfit3D01SourceNotice90');
 assert.equal(await sourceNotice90.isVisible(),true,
  'source honesty must be visible beside original 3D controls at every mobile width');
 const sourceNoticeText90=await sourceNotice90.innerText();
 assert.match(sourceNoticeText90,/Original front photographs are authoritative/);
 assert.match(sourceNoticeText90,/Side and rear garment details are not photograph-verified/);
 assert.match(sourceNoticeText90,/Unsupported outfit pieces remain original-photo-only/);
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
  // M16: browser-generated continuous touchStart/move/end on the genuine
  // source-attested canvas. CDP provides this in Chromium; WebKit has no CDP.
  // This is real browser touch input in a simulated viewport, never hardware.
  let touchSwipe16=null;
  if(width===390&&engine==='chromium'){
   await page.locator('#outfit3D01Reset90').click();await settle();
   const swipeBefore=await state();
   const target=page.locator('#outfit3D01Canvas');
   await target.scrollIntoViewIfNeeded();
   const rect=await target.boundingBox();
   assert.ok(rect&&rect.width>=150&&rect.height>=180,
    'source-verified anatomical touch canvas must be visible');
   const x=rect.x+rect.width*.36,y=rect.y+rect.height*.52;
   const delta=Math.min(85,rect.width*.28);
   const scrollBefore=await page.evaluate(()=>window.scrollY);
   const session=await page.context().newCDPSession(page);
   let started=false,ended=false;
   try{
    await session.send('Input.dispatchTouchEvent',{
     type:'touchStart',touchPoints:[{x,y,radiusX:3,radiusY:3,force:1}]});
    started=true;
    for(let step=1;step<=12;step++){
     await session.send('Input.dispatchTouchEvent',{
      type:'touchMove',touchPoints:[{
       x:x+delta*step/12,y,radiusX:3,radiusY:3,force:1}]});
     await page.waitForTimeout(15);
    }
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    ended=true;
   }finally{
    if(started&&!ended)try{
     await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }catch{}
    await session.detach();
   }
   await settle();
   const swipeAfter=await state();
   const angleChange=Math.abs(((swipeAfter.camera90.angle-
    swipeBefore.camera90.angle+540)%360)-180);
   assert.ok(angleChange>5,'real Chromium touch-drag must rotate original avatar');
   assert.equal(swipeAfter.bones,163);
   assert.deepEqual(swipeAfter.garmentSources90,swipeBefore.garmentSources90,
    'touch drag may not change verified original source garment');
   assert.equal(swipeAfter.resources90.geometries,swipeBefore.resources90.geometries);
   assert.equal(swipeAfter.resources90.textures,swipeBefore.resources90.textures);
   const scrollAfter=await page.evaluate(()=>window.scrollY);
   assert.ok(Math.abs(scrollAfter-scrollBefore)<=2,
    'horizontal touch orbit must not inadvertently scroll the page vertically');
   touchSwipe16={figure,engine,cssWidth:width,browserGeneratedTouch:true,
    continuousTouchStartMoveEnd:true,angleChangeDegrees:angleChange,
    sourceIdentitySame:true,resourceCountsSame:true,
    horizontalPageScrollStable:true,physicalPhone:false,
    webkitTouchSwipeVerified:false};
  }
  // M14: REAL touch-generated button taps in a mobile+touch Playwright context
  // on both browsers. Do not substitute mouse click for this mobile input path.
  let touchButtons90=null;
  if(width===390){
   await page.locator('#outfit3D01Reset90').click();await settle();
   const touchBefore=await state();
   const tap90=async id=>{
    const button=page.locator(id);await button.scrollIntoViewIfNeeded();
    const bounds=await button.boundingBox();
    assert.ok(bounds&&bounds.width>=43&&bounds.height>=43,
     'touch target must be visible and at least 43 CSS pixels: '+id);
    await page.touchscreen.tap(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
    await settle();
   };
   await tap90('#outfit3D01Right90');
   const afterRight=await state();
   assert.ok(Math.abs(((afterRight.camera90.angle-touchBefore.camera90.angle+540)%360)-180)>5,
    'real mobile touchscreen rotate-right button changes original avatar camera');
   await tap90('#outfit3D01ZoomIn90');
   const afterZoom=await state();
   assert.ok(afterZoom.camera90.distance<afterRight.camera90.distance,
    'real touchscreen zoom-in changes original avatar camera distance');
   await tap90('#outfit3D01Reset90');
   const afterReset=await state();
   assert.ok(Math.min(afterReset.camera90.angle,360-afterReset.camera90.angle)<1,
    'real touchscreen reset returns original front view');
   assert.equal(afterReset.bones,163);
   assert.deepEqual(afterReset.garmentSources90,touchBefore.garmentSources90,
    'touch input must not change source-photograph outfit identity');
   assert.equal(afterReset.resources90.geometries,touchBefore.resources90.geometries,
    'touch input must not allocate additional garment geometry');
   assert.equal(afterReset.resources90.textures,touchBefore.resources90.textures,
    'touch input must not allocate additional image texture');
   assert.ok(afterReset.resources90.frames>=touchBefore.resources90.frames,
    'actual touch-driven WebGL rendering must not roll back frame receipts');
   touchButtons90={figure,cssWidth:width,rotate:true,zoom:true,reset:true,
    realTouchscreenTap:true,sourceIdentitySame:true,resourceCountsSame:true,
    physicalPhone:false};
  }
  // M18: Give small-screen owners an immediate, read-only route back to
  // the SAME authenticated original saved photos, never a recreated/faked mesh.
  let originalPhotosShortcut18=null;
  if(width===390){
   await page.locator('#outfit3D01Reset90').click();await settle();
   const previous=await state();
   // A manual Reset must flush residual OrbitControls drag inertia before
   // the user navigates to original photos. Keep the strict 0.01 degree
   // source-gallery camera invariant; diagnose any pre-existing drift.
   await page.waitForTimeout(220);
   const idling=await state();
   const idleDrift=Math.abs(((idling.camera90.angle-
    previous.camera90.angle+540)%360)-180);
   assert.ok(idleDrift<.01,
    'original camera reset still has residual inertial drift: '+idleDrift);
   const photoCount=await page.locator('#outfit3D01Photos img').count();
   assert.ok(photoCount>=1,'actual original saved photos must be present');
   const button=page.locator('#outfit3D01Originals90');
   const bounds=await button.boundingBox();
   assert.ok(bounds&&bounds.width>=43&&bounds.height>=43,
    'original-photo fallback shortcut must be accessible by touch');
   await button.click();
   const focus=await page.locator('#outfit3D01Photos').evaluate(n=>({
    focused:document.activeElement===n,
    role:n.getAttribute('role'),
    label:n.getAttribute('aria-label'),
    images:n.querySelectorAll('img').length
   }));
   assert.equal(focus.focused,true,'fallback button must focus real existing original photo gallery');
   assert.equal(focus.role,'region');
   assert.equal(focus.label,'Original saved clothing photographs');
   assert.equal(focus.images,photoCount,'shortcut must neither add nor remove original photos');
   const genuineFirstPhotoHash=await page.locator('#outfit3D01Photos img').first().evaluate(async img=>{
    const data=await (await fetch(img.src)).arrayBuffer();
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256',data))]
     .map(n=>n.toString(16).padStart(2,'0')).join('');
   });
   assert.equal(genuineFirstPhotoHash,previous.garmentSources90.dress,
    'focused original image must retain the attested selected source SHA');
   const afterShortcut=await state();
   assert.equal(afterShortcut.bones,163);
   assert.deepEqual(afterShortcut.garmentSources90,previous.garmentSources90);
   assert.deepEqual(afterShortcut.resources90.geometries,previous.resources90.geometries);
   assert.deepEqual(afterShortcut.resources90.textures,previous.resources90.textures);
   const originalGalleryDrift=Math.abs(((afterShortcut.camera90.angle-
    idling.camera90.angle+540)%360)-180);
   assert.ok(originalGalleryDrift<.01,
    'opening original saved photographs must not move 3D camera; measured '+originalGalleryDrift+' degrees');
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true);
   originalPhotosShortcut18={figure,engine,cssWidth:width,
    readOnlyOriginalGalleryFocused:true,originalPhotoSHAReattested:true,
    photoCountUnchanged:true,sourceAndResourcesUnchanged:true,
    owner2DSessionRetained:true,physicalPhone:false};
   await page.locator('#outfit3D01Canvas').scrollIntoViewIfNeeded();
  }
  // M17: 24 genuine 15-degree accessible controls complete one 360 turn.
  // Validate anatomical camera return, source-photo identity and GPU counts
  // in BOTH engines/rigs; a 360 claim cannot rest on a partial 16-click spin.
  let fullCycle17=null;
  if(width===390){
   await page.locator('#outfit3D01Reset90').click();await settle();
   const original=await state();
   assert.equal(original.bones,163);
   const sourceSHA=original.garmentSources90;
   for(let step=0;step<24;step++){
    await page.locator('#outfit3D01Right90').click();
    await page.waitForTimeout(65);
   }
   await settle();
   const wrapped=await state();
   const angleDelta=Math.abs(((wrapped.camera90.angle-original.camera90.angle+540)%360)-180);
   assert.ok(angleDelta<3,'24 original 15-degree camera commands must complete a full 360');
   assert.ok(Math.abs(wrapped.camera90.distance-original.camera90.distance)<.05,
    '360-degree camera rotation must preserve mobile fit/zoom distance');
   assert.equal(wrapped.bones,163,'full camera orbit must preserve original anatomical bones');
   assert.deepEqual(wrapped.garmentSources90,sourceSHA,
    'full 360-degree orbit must never exchange the original source photograph');
   assert.equal(wrapped.resources90.geometries,original.resources90.geometries);
   assert.equal(wrapped.resources90.textures,original.resources90.textures);
   await page.locator('#outfit3D01Back').click();await settle();
   const back=await state();
   assert.ok(Math.abs(back.camera90.angle-180)<3,'rear view must be a real anatomical camera angle');
   assert.match(await sourceNotice90.innerText(),/rear garment details are not photograph-verified/,
    'rear view must visibly warn that unobserved original photograph detail is not proven');
   await page.locator('#outfit3D01Front').click();await settle();
   const restored=await state();
   assert.ok(Math.min(restored.camera90.angle,360-restored.camera90.angle)<3);
   assert.deepEqual(restored.garmentSources90,sourceSHA);
   assert.equal(restored.resources90.geometries,original.resources90.geometries);
   assert.equal(restored.resources90.textures,original.resources90.textures);
   fullCycle17={figure,engine,cssWidth:width,steps:24,
    accumulatedCommandDegrees:360,returnedToFront:true,
    sameSourceSHA:true,same163BoneRig:true,sameResources:true,
    rearOriginalPhotoVerified:false,sourceNoticeVisible:true,physicalPhone:false};
  }
  // M19: automatic camera motion must actually run, then an accessible
  // pause control must stop it without changing the original photo or mesh.
  // This exercises real 163-bone WebGL in BOTH Chromium/WebKit engines.
  let autoSpinPause19=null;
  if(width===390){
   await page.locator('#outfit3D01Reset90').click();await settle();
   const originalSpin=await state();
   const originalPhotoCount=await page.locator('#outfit3D01Photos img').count();
   await page.locator('#outfit3D01Rotate').click();
   await page.waitForFunction(start=>{
    const now=window.native3D05Bridge.state();
    if(!now.modelReady||!Number.isFinite(now.camera90?.angle))return false;
    return Math.abs(((now.camera90.angle-start+540)%360)-180)>5;
   },originalSpin.camera90.angle,{timeout:8000});
   const rotating=await state();
   const moved=Math.abs(((rotating.camera90.angle-originalSpin.camera90.angle+540)%360)-180);
   assert.ok(moved>5,'original anatomical auto-rotation must visibly move real 3D camera');
   const pause=page.locator('#outfit3D01Stop90');
   const bounds=await pause.boundingBox();
   assert.ok(bounds&&bounds.width>=43&&bounds.height>=43,
    'pause automatic avatar rotation must be mobile touch-sized');
   assert.equal(await pause.getAttribute('aria-label'),
    'Pause automatic avatar rotation without changing clothing');
   await pause.click();
   const stopped=await state();
   await page.waitForTimeout(650);
   const later=await state();
   const drift=Math.abs(((later.camera90.angle-stopped.camera90.angle+540)%360)-180);
   assert.ok(drift<2,'manual pause must genuinely stop autonomous camera motion');
   assert.equal(later.bones,163);
   assert.deepEqual(later.garmentSources90,originalSpin.garmentSources90,
    'auto-spin and pause must not change authentic source photograph identity');
   assert.equal(later.resources90.geometries,originalSpin.resources90.geometries);
   assert.equal(later.resources90.textures,originalSpin.resources90.textures);
   assert.equal(await page.locator('#outfit3D01Photos img').count(),originalPhotoCount);
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true,
    'owner 2D wardrobe session remains signed in throughout auto-spin/pause');
   await page.locator('#outfit3D01Reset90').click();await settle();
   const restored=await state();
   assert.ok(Math.min(restored.camera90.angle,360-restored.camera90.angle)<3);
   autoSpinPause19={figure,engine,cssWidth:width,realCameraMoved:true,
    userPauseStopsMotion:true,measuredPauseDriftDegrees:drift,
    sourceAndResourcesUnchanged:true,photosUnchanged:true,
    owner2DSessionPreserved:true,physicalPhone:false};
  }
  // M20: respect system reduced-motion preference. Auto-spin remains an
  // opt-in manual operation, but must not run when the preference says reduce.
  // A preference changed during an active spin must immediately stop motion
  // while the real photograph, owner session, 163-bone rig and 2D stay intact.
  let reducedMotion20=null;
  if(width===390){
   await page.locator('#outfit3D01Reset90').click();await settle();
   const original=await state();
   await page.emulateMedia({reducedMotion:'reduce'});
   try{
    assert.equal(await page.evaluate(()=>
     matchMedia('(prefers-reduced-motion: reduce)').matches),true,
     'the browser must genuinely be in reduced-motion mode');
    await page.locator('#outfit3D01Rotate').click();
    const blocked=await state();
    await page.waitForTimeout(750);
    const afterBlock=await state();
    const unintendedDrift=Math.abs(((afterBlock.camera90.angle-
     blocked.camera90.angle+540)%360)-180);
    assert.ok(unintendedDrift<2,
     'OS reduced-motion must prevent automatic camera spin');
    assert.match(await page.locator('#outfit3D01Status').innerText(),
     /Reduced motion preference: automatic rotation paused/);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.locator('#outfit3D01Rotate').click();
    await page.waitForFunction(start=>{
     const now=window.native3D05Bridge.state();
     return !!now.modelReady&&Number.isFinite(now.camera90?.angle)&&
      Math.abs(((now.camera90.angle-start+540)%360)-180)>5;
    },afterBlock.camera90.angle,{timeout:8000});
    await page.emulateMedia({reducedMotion:'reduce'});
    await settle();
    const liveStopped=await state();
    await page.waitForTimeout(750);
    const afterPreferenceChanged=await state();
    const driftAfterChange=Math.abs(((afterPreferenceChanged.camera90.angle-
     liveStopped.camera90.angle+540)%360)-180);
    assert.ok(driftAfterChange<2,
     'changing OS to reduce motion must stop an already-spinning avatar');
    await page.emulateMedia({reducedMotion:'no-preference'});
    const notRestarted=await state();
    await page.waitForTimeout(600);
    const finalStopped=await state();
    assert.ok(Math.abs(((finalStopped.camera90.angle-
     notRestarted.camera90.angle+540)%360)-180)<2,
     'restoring no-preference must not silently restart automatic motion');
    await page.locator('#outfit3D01Reset90').click();await settle();
    const beforeManual=(await camera()).angle;
    await page.locator('#outfit3D01Right90').click();await settle();
    const afterManual=(await camera()).angle;
    assert.ok(Math.abs(((afterManual-beforeManual+540)%360)-180)>5,
     'manual orbit must work independently of system motion settings');
    const final=await state();
    assert.equal(final.bones,163);
    assert.deepEqual(final.garmentSources90,original.garmentSources90);
    assert.equal(final.resources90.geometries,original.resources90.geometries);
    assert.equal(final.resources90.textures,original.resources90.textures);
    assert.equal(await page.evaluate(()=>
     window.nativeLossless04Bridge.status().active),true);
    reducedMotion20={figure,engine,cssWidth:width,
     autoSpinBlockedDuringReducedMotion:true,
     activeSpinStoppedOnPreferenceChange:true,
     returningPreferenceDoesNotRestart:true,
     manualOrbitRetained:true,sourceAndResourcesUnchanged:true,
     owner2DSessionIntact:true,physicalPhone:false};
   }finally{
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.locator('#outfit3D01Reset90').click();await settle();
   }
  }
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
  samples.push({figure,width,engine,before,after,touchButtons90,touchSwipe16,fullCycle17,originalPhotosShortcut18,autoSpinPause19,reducedMotion20,finalCamera:final.camera90,buttonRoundTripMs:durations,baselineBones:baseline.bones,finalBones:final.bones,baselineResources:baseline.resources90,finalResources:final.resources90});
 }
 // M15: end the original, signed-in, source-attested WebGL session while
 // an ACTUAL browser pointer is held down on the anatomical viewer.
 // Releasing the gesture must never revive old-account/old-source imagery,
 // and reopening must re-attest the original photo and construct a NEW canvas.
 // This tests browser pointer input, NOT a physical-finger swipe.
 let midDragRevocation90=null;
 if(width===390){
  await page.locator('#outfit3D01Reset90').click();await settle();
  const sourceBefore=await state();
  assert.equal(sourceBefore.modelReady,true);
  assert.equal(sourceBefore.bones,163);
  const oldCanvas=page.locator('#outfit3D01Canvas');
  const rect=await oldCanvas.boundingBox();
  assert.ok(rect&&rect.width>80&&rect.height>180);
  const startX=rect.x+rect.width*.45,startY=rect.y+rect.height*.5;
  await page.mouse.move(startX,startY);
  await page.mouse.down();
  await page.mouse.move(startX+Math.min(rect.width*.18,65),startY,{steps:8});
  await settle();
  const dragged=await camera();
  assert.ok(Math.abs(((dragged.angle+540)%360)-180)>3,
   'live source-attested anatomical camera must move before revocation');
  // Existing native selection API is the only selection writer here.
  // The 3D preview is read-only; the saved wardrobe store is untouched.
  await page.evaluate(()=>{
   window.__p90DragCanvas=document.getElementById('outfit3D01Canvas');
   window.nativeLossless04Bridge.selectSaved(1);
  });
  await page.waitForFunction(()=>{
   const s=window.native3D05Bridge.state();
   return s.active===false&&document.querySelectorAll('#outfit3D01Photos img').length===0;
  },null,{timeout:30000});
  await page.mouse.up();
  const revoked=await state();
  assert.equal(revoked.active,false,'pointerup cannot reanimate revoked WebGL');
  assert.equal(revoked.contactEvidence90,null);
  assert.equal(revoked.sceneShirtStages90,null);
  assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),
   true,'revoking a 3D pointer gesture must retain the valid private 2D session');
  assert.equal(await page.evaluate(()=>document.contains(window.__p90DragCanvas)),false,
   'stale original 3D canvas must be disconnected from page after owner selection change');
  assert.equal(await page.locator('#outfit3D01Photos img').count(),0);
  await page.evaluate(()=>window.nativeLossless04Bridge.selectSaved(0));
  await page.locator('#native3D05Preview').click();
  await page.waitForFunction(()=>window.native3D05Bridge.state().modelReady&&
   window.native3D05Bridge.state().bones===163,null,{timeout:150000});
  await verifyCanvas();
  const reopened=await state();
  assert.deepEqual(reopened.garmentSources90,sourceBefore.garmentSources90,
   'explicit reopen must re-attest the original source-photographed garment');
  assert.equal(await page.locator('#outfit3D01Canvas').evaluate(c=>
   c===window.__p90DragCanvas),false,'reopened renderer must use a fresh canvas');
  await page.locator('#outfit3D01Reset90').click();await settle();
  const reopenAngle=(await camera()).angle;
  await page.locator('#outfit3D01Right90').click();await settle();
  const turnedAngle=(await camera()).angle;
  assert.ok(Math.abs(((turnedAngle-reopenAngle+540)%360)-180)>5,
   'new owner-reverified camera remains interactive after mid-drag cancellation');
  await page.evaluate(()=>{delete window.__p90DragCanvas;});
  midDragRevocation90={engine,cssWidth:width,bones:163,
   pointerHeldDuringNativeSelection:true,oldCanvasRemoved:true,
   staleOriginalPhotosCleared:true,private2DSessionKept:true,
   newSourceAttestedCanvas:true,mouseBrowserGesture:true,
   physicalFingerSwipeVerified:false};
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
 assert.equal((await state()).sceneShirtStages90,null,'revoked original source cannot retain stale private shirt fitting diagnostics');
 assert.equal((await state()).contactEvidence90,null,'revoked original source cannot expose stale cloth crossing witnesses');
 assert.equal(await page.locator('#outfit3D01Photos img').count(),0);
 assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true);
 await writeFile('benchmark/parallel90/'+engine+'/'+width+'.json',JSON.stringify({samples,midDragRevocation90,landscape,contextLossSimulation:'PASS_WEBGL_lose_context',physicalPhone:false,familyAlpha:'HOLD'},null,2));
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
 // M21: repeated real WebGL close/reopen on the same signed-in owner
 // (not merely outfit swapping) must force-lose each old GPU context,
 // disconnect old original-photo canvas, clear private photos and perform
 // independent NATIVE92 source-byte admission on every fresh open.
 // Measured in the actual 390px Chromium/WebKit simulated mobile browser;
 // GPU hardware RAM and phone thermal behavior remain unverified.
 if(width===390){
  const initial=await state();
  assert.equal(initial.bones,163);
  assert.equal(initial.modelReady,true);
  const admittedSource=initial.garmentSources90;
  const ownerSelection=await page.evaluate(()=>({
   active:window.nativeLossless04Bridge.status().active,
   selected:window.nativeLossless04Bridge.selected
  }));
  assert.equal(ownerSelection.active,true);
  const rounds=[];
  for(let n=1;n<=4;n++){
   const last=await state();
   assert.equal(last.modelReady,true);
   assert.deepEqual(last.garmentSources90,admittedSource);
   await page.evaluate(()=>{
    window.__p90M21OldCanvas=document.getElementById('outfit3D01Canvas');
    window.native3D05Bridge.close();
   });
   assert.equal((await state()).active,false,
    '3D preview must be revoked before any new owner source is loaded');
   assert.equal(await page.locator('#outfit3D01Photos img').count(),0,
    'closing the verified preview must synchronously clear old private photos');
   const retired=await page.evaluate(()=>{
    const old=window.__p90M21OldCanvas;
    const gl=old?.getContext('webgl2');
    return {oldDisconnected:!!old&&!document.contains(old),
     lost:gl?.isContextLost()===true,
     active2D:window.nativeLossless04Bridge.status().active,
     selected2D:window.nativeLossless04Bridge.selected};
   });
   assert.equal(retired.oldDisconnected,true,
    'closed scene cannot retain a DOM-attached old owner source canvas');
   assert.equal(retired.lost,true,
    'original renderer must force GPU context loss on every close');
   assert.equal(retired.active2D,true,
    '3D close must leave valid native owner 2D closet active');
   assert.equal(retired.selected2D,ownerSelection.selected,
    '3D reopening may not change selected saved wardrobe outfit');
   // Genuine user button triggers original native owner lease +
   // original JPEG byte re-attestation, never donor editor access.
   await page.locator('#native3D05Preview').click();
   await page.waitForFunction(()=>window.native3D05Bridge.state().modelReady&&
    window.native3D05Bridge.state().bones===163,
    null,{timeout:150000});
   await verifyCanvas();
   const opened=await state();
   assert.deepEqual(opened.garmentSources90,admittedSource,
    'reopened viewer must verify the SAME original photo SHA');
   assert.equal(opened.figure90,initial.figure90);
   assert.equal(opened.resources90.geometries,initial.resources90.geometries,
    'reopened outfit should not accumulate extra scene geometries');
   assert.equal(opened.resources90.textures,initial.resources90.textures,
    'reopened outfit should not accumulate extra scene textures');
   const fresh=await page.evaluate(()=>{
    const newCanvas=document.getElementById('outfit3D01Canvas');
    const old=window.__p90M21OldCanvas;
    const result={fresh:!!newCanvas&&newCanvas!==old,
     retiredStillGone:!document.contains(old),
     oldContextStillLost:old.getContext('webgl2')?.isContextLost()===true};
    delete window.__p90M21OldCanvas;
    return result;
   });
   assert.equal(fresh.fresh,true,
    'every new original-photo 3D session must create a NEW canvas');
   assert.equal(fresh.retiredStillGone,true);
   assert.equal(fresh.oldContextStillLost,true);
   const front=await camera();
   await page.locator('#outfit3D01Reset90').click();await settle();
   await page.locator('#outfit3D01Right90').click();await settle();
   const changed=await camera();
   assert.ok(Math.abs(((changed.angle-front.angle+540)%360)-180)>5 ||
    Math.abs(((changed.angle+540)%360)-180)>5,
    'reopened actual original 163-bone source must remain camera-interactive');
   rounds.push({round:n,oldContextLost:retired.lost,
    oldCanvasDisconnected:retired.oldDisconnected,
    newCanvas: fresh.fresh,owner2DActive:retired.active2D,
    originalSourceSHAReattested:true,
    geometryCount:opened.resources90.geometries,
    textureCount:opened.resources90.textures,
    original163Bones:true});
  }
  await writeFile('benchmark/parallel90/'+engine+'/390-reopen-resource.json',
   JSON.stringify({engine,cssWidth:width,
    actualSourcePinnedRigs:true,realWebGL:true,
    rounds,roundsPassed:4,sourceSHAStable:true,
    hardwareGPUBytesMeasured:false,physicalPhone:false,
    realHostedOwnerRLS:false,releaseAuthorized:false,familyAlpha:'HOLD'},null,2));
 }
}
