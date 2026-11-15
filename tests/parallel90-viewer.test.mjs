import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const source=readFileSync('scripts/install-parallel90-viewer.mjs','utf8');
test('P90 donor installer refuses another source HEAD before any write',()=>{
 const dir=mkdtempSync(join(tmpdir(),'p90-'));
 try{
  execFileSync('git',['init',dir]);
  assert.throws(()=>execFileSync(process.execPath,['scripts/install-parallel90-viewer.mjs',dir],{stdio:'pipe'}));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('P90 installer limits writes to disposable panel, showroom, source loader and exact controller only',()=>{
 const writes=[...source.matchAll(/writeFile\((\w+),s\)/g)].map(x=>x[1]);
 assert.deepEqual(writes,['panel','showroom','sourceViewer','sourceOutfitController','posedContact90']);
 assert.match(source,/assert.equal\(s.split\(a\).length,2/);
});
test('P90 context-loss listener is captured and removed on bridge disposal',()=>{
 const s=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.match(s,/addEventListener\('webglcontextlost',onContextLost90,true\)/);
 assert.match(s,/removeEventListener\('webglcontextlost',onContextLost90,true\)/);
 assert.match(s,/e.target\?\.id!=='outfit3D01Canvas'/);
});

test('P90 touch allows vertical page scrolling without disabling horizontal orbit',()=>{
 assert.match(source,/controls\.domElement\.style\.touchAction='pan-y'/);
 assert.match(source,/new OrbitControls\(camera,canvas\)/);
});
test('P90 a replacement WebGL canvas retains keyboard target and full instructions',()=>{
 assert.match(source,/fresh\.tabIndex=0;fresh\.setAttribute\('aria-label'/);
 assert.match(source,/canvas\.getAttribute\('aria-label'\)/);
});

test('P90 selected, freshly byte-attested top-source hint only removes unused public dress preparation',()=>{
 assert.ok(source.includes("nativeTopSource90===OUTFIT3D_PINNED_SOURCE_SHA.shirt"));
 assert.ok(source.includes("loadVettedOutfit3D01Sources({dressOnly90=false,shirtOnly90=false,singleShirtBundle90=false}"));
 assert.ok(source.includes("if(dressOnly90&&shirtOnly90)throw Error"));
 assert.ok(source.includes("if(!shirtOnly90){"));
 assert.ok(source.includes("if(!sources.dress||!dressPiece"));
 assert.ok(source.includes("(sources?.dress==null&&sources?.bundles?.length===0)"));
 // An absent dress must not be forged using a placeholder source capability.
 assert.equal(source.includes("sourceSHA256:DRESS_SHA"),false);
});

test('P90 selects one original shirt research source only for verified saved board without bottom',()=>{
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.match(bridge,/nativeBottomEmpty90:!Object\.hasOwn\(selected\.slots,'bottom'\)/);
 assert.ok(source.includes("nativeBottomEmpty90===true"));
 assert.ok(source.includes("if(singleShirtBundle90&&!shirtOnly90)throw Error"));
 assert.ok(source.includes("singleShirtBundle90?['public']:['public','second']"));
 assert.ok(source.includes("loadVettedOutfit3D01Sources({dressOnly90=false,shirtOnly90=false,singleShirtBundle90=false}"));
 // Never change the default licensed-source path for selected bottoms/legacy.
 assert.equal(source.includes("for(const denim of ['public']){"),false);
});

test('P90 research presentation profiling only reports admitted numeric stages',()=>{
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.ok(source.includes('renderStages90:rendered?.renderStages90||null'));
 assert.ok(source.includes("const prepareStart90=performance.now()"));
 assert.ok(source.includes("const applyStart90=performance.now()"));
 assert.ok(source.includes("kind:'dress',prepareMs:0,applyMs:applyMs90"));
 assert.ok(source.includes("kind:decision.mode,prepareMs:prepareMs90,applyMs:applyMs90"));
 assert.match(bridge,/renderStages90:active\?data\.renderStages90\|\|null:null/);
 assert.match(bridge,/revokeChangedSource89\(\)/);
});

test('P90 real mesh renderer has exhaustive numeric read-only apply-stage diagnostics',()=>{
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.ok(source.includes("getState:()=>({startup90,applyStages90,kind:current,"));
 assert.ok(source.includes("let applyStages90=null;"));
 assert.ok(source.includes("const s=outfit.setOutfit(mode,candidate,options);"));
 assert.ok(source.includes("const fitted90=performance.now()"));
 assert.ok(source.includes("const sampling90=performance.now()"));
 assert.ok(source.includes("const reclaimed90=performance.now()"));
 assert.ok(source.includes("const finished90=performance.now()"));
 assert.ok(source.includes("sceneApplyStages90:view.applyStages90||null"));
 assert.match(bridge,/sceneApplyStages90:active\?data\.sceneApplyStages90\|\|null:null/);
 assert.match(bridge,/revokeChangedSource89\(\)/);
});

test('P90 M9 profiles exact 20 genuine-shirt construction stages with no dropped source calls',()=>{
 assert.match(source,/const sourceOutfitController=donor\+'\/research\/dress-mobile-01\/dress-outfit-controller\.mjs'/);
 assert.match(source,/shirtBuildStages90=Object\.freeze\(\{\.\.\.shirtClock90\}\)/);
 assert.match(source,/const timeShirt90=\(stage,run\)=>/);
 const labels=["attach","shoulders","cuffClearance","innerCuffs","cuffBridge","continuousFit","neckSeams","torsoDrape","panelsAndSleeves","shoulderTailor","shoulderCaps","shoulderContour","upperArm","collarRoll","rearRelief","crest","sleeveHang","sideFlow","shoulderFall","shoulderTop"];
 for(const name of labels)assert.ok(source.includes('timeShirt90(\\"'+name+'\\",()=>')||
  source.includes('timeShirt90("'+name+'",()=>'), 'source stage present '+name);
 assert.equal(labels.length,20);
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.match(bridge,/sceneShirtStages90:active\?data\.sceneShirtStages90\|\|null:null/);
 assert.match(bridge,/revokeChangedSource89\(\)/);
});

test('P90 pinned donor restores all five sources before every variant and final reset',()=>{
 const benchmark=readFileSync('scripts/benchmark-parallel90-startup.mjs','utf8');
 const command="run('git',['-C',donor,'restore','--','research/outfit-3d-01/research-panel.mjs','research/dress-mobile-01/dress-mobile-showroom.mjs','research/outfit-3d-01/source-true-viewer.mjs','research/dress-mobile-01/dress-outfit-controller.mjs','research/three-d-42/posed-contact.mjs']);";
 assert.equal(benchmark.split(command).length-1,2,
  'each paired variant and final rebuild must restore all five pinned PR541 originals');
 assert.ok(benchmark.includes("for(const variant of ['baseline','candidate','restored'])"));
 assert.match(benchmark,/P90_COMPARE_ONLY/);
});

test('P90 M10 attributes previously untimed original rig/pose/contact/release work',()=>{
 assert.ok(source.includes('M10 no-functional-change timing of previously unaccounted original pose'));
 for(const name of ['detachPrevious','poseSource','skeletonValidate','contactCreate','contactPose','contactFit','poseRestore','previousRelease'])
  assert.ok(source.includes("'"+name+"'"),'unmodified source operation still profiled: '+name);
 assert.ok(source.includes("if(!next.includes('shirt'))return run();"),
  'dress cannot falsely record shirt-only construction operations');
 assert.ok(source.includes("const skeletons=new Set();root.traverse"));
 assert.ok(source.includes("builtContact.fit(pose)"));
 assert.ok(source.includes("contact?.dispose();Object.values(parts).forEach(g=>g.dispose())"));
 assert.ok(source.includes("setResearchPose(root,pose)"));
 assert.ok(source.includes("shirtBuildStages90=Object.freeze({...shirtClock90})"));
});

test('P90 M11 reuses only authentic original body BVH inside candidate pose-contact fit',()=>{
 assert.match(source,/if\(startupVariant90==='candidate'&&!bodyOriginalControl90\)\{/);
 assert.match(source,/const posedContact90=donor\+'\/research\/three-d-42\/posed-contact\.mjs'/);
 assert.ok(source.includes("bodyTree90||new MeshBVH(b)"));
 assert.ok(source.includes("bodyTree90=new MeshBVH(body.g)"));
 assert.ok(source.includes("triangleContacts(current.g,body.g,{collect:true,bodyTree90})"));
 assert.ok(source.includes("after=triangleContacts(current.g,body.g,{collect:true,bodyTree90})"));
 assert.match(source,/await writeFile\(posedContact90,s\)/);
 assert.ok(source.includes("const ba=new MeshBVH(a),bb=bodyTree90||new MeshBVH(b)"),
  'original garment BVH rebuilt per pass; body BVH reused only from unchanged pose');
 assert.ok(source.includes("for(let pass=0;pass<12;pass++)"),
  '12 original collision passes are NOT lowered');
 assert.ok(source.includes("if(!c.count)"),
  'real collision termination is NOT bypassed');
});

test('P90 M11 real collision scalar parity is owner gated and required by browser baseline',()=>{
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 const benchmark=readFileSync('scripts/benchmark-parallel90-startup.mjs','utf8');
 const switches=readFileSync('scripts/check-parallel90-saved-switch.mjs','utf8');
 const lifecycle=readFileSync('scripts/check-parallel90-interactions.mjs','utf8');
 assert.ok(source.includes("contactEvidence90:view.outfit?.shirt?.poseTriangleContact?{"));
 assert.match(bridge,/contactEvidence90:active\?data\.contactEvidence90\|\|null:null/);
 assert.ok(benchmark.includes("assert.deepEqual(rows[i].contactEvidence,original.contactEvidence"));
 for(const key of ['beforeCount','afterCount','steps','correctedVertices','maximumWorldCorrection'])
  assert.ok(switches.includes(key),'real source collision witness required: '+key);
 assert.ok(lifecycle.includes("contactEvidence90,null"));
});

test('P90 M11 compares independent original triangle crossings to cached body BVH in installed donor',()=>{
 const actual=readFileSync('scripts/check-parallel90-contact-bvh.mjs','utf8');
 assert.ok(source.includes("execFileSync(process.execPath,['scripts/check-parallel90-contact-bvh.mjs',donor],{stdio:'inherit'})"));
 assert.ok(source.includes("if(startupVariant90==='candidate'&&!bodyOriginalControl90)execFileSync"),
  'only candidate invokes the additional exact collision parity script');
 assert.ok(actual.includes("bodyTree90=new MeshBVH(body)"));
 assert.ok(actual.includes("triangleContacts(optimizedShirt,body,{collect:true,bodyTree90})"));
 assert.ok(actual.includes("assert.deepEqual(reused,original,"));
 assert.ok(actual.includes("assert.ok(results[0].count>0"));
 assert.ok(actual.includes("assert.equal(noCross.count,0"));
});

test('P90 M12 isolates same source-loader and original geometry while toggling only per-pose BVH reuse',()=>{
 const installer=readFileSync('scripts/install-parallel90-viewer.mjs','utf8');
 const tester=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 const switches=readFileSync('scripts/check-parallel90-saved-switch.mjs','utf8');
 const ab=readFileSync('scripts/benchmark-parallel90-bvh-ab.mjs','utf8');
 const workflow=readFileSync('.github/workflows/parallel90-viewer-no-deploy.yml','utf8');
 assert.ok(installer.includes("const bodyOriginalControl90=process.env.P90_BODY_BVH_CONTROL==='1'"));
 assert.ok(installer.includes("if(startupVariant90==='candidate'&&!bodyOriginalControl90){"));
 assert.ok(installer.includes("if(startupVariant90==='candidate'&&!bodyOriginalControl90)execFileSync"));
 for(const name of [tester,switches])assert.ok(name.includes("P90_PROFILE_OUTPUT"));
 assert.ok(ab.includes("P90_PROFILE_VARIANT:'candidate'"));
 assert.ok(ab.includes("P90_BODY_BVH_CONTROL:variant.control?'1':'0'"));
 assert.ok(ab.includes("assert.deepEqual(after[i][key],before[i][key]"));
 assert.ok(ab.includes("compareSourceFrames90(a,b)"));
 assert.ok(ab.includes("for(const figure of ['female','male'])"));
 assert.ok(workflow.includes("node scripts/benchmark-parallel90-bvh-ab.mjs"));
});

test('P90 M13 authentic research owner-photo mobile background/freeze revoke on both browser engines',()=>{
 const browser=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 const workflow=readFileSync('.github/workflows/parallel90-viewer-no-deploy.yml','utf8');
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.match(workflow,/NATIVE102: '1'/);
 assert.ok(workflow.includes('benchmark/native-3d-102-webkit/'));
 assert.ok(workflow.includes('benchmark/native-3d-102/'));
 assert.ok(browser.includes("sourceLifecycleOut102='benchmark/native-3d-102'+(engine90==='webkit'?'-webkit':'')"));
 assert.ok(browser.includes("browser:engine90,simulatedBrowserVisibility:true"));
 assert.ok(browser.includes("const sourceLifecycleReceipt102=engine90==='webkit'?'benchmark/native-3d-102-webkit/acceptance.json':'benchmark/native-3d-102/acceptance.json'"));
 assert.ok(browser.includes("await writeFile(sourceLifecycleReceipt102,"));
 assert.ok(browser.includes("sourceReopenPassedActualNATIVE92OriginalBytes:native92"));
 assert.ok(browser.includes("document.dispatchEvent(new Event('visibilitychange'))"));
 assert.ok(browser.includes("document.dispatchEvent(new Event('freeze'))"));
 assert.ok(browser.includes("assert.equal(hidden.photos,0"));
 assert.ok(browser.includes("assert.equal(frozen.photos,0"));
 assert.ok(browser.includes("assert.deepEqual(await readBoard(page),ownerOriginal)"));
 assert.ok(bridge.includes("doc.addEventListener('visibilitychange',onBackground102)"));
 assert.ok(bridge.includes("doc.addEventListener('freeze',onFreeze102)"));
 assert.ok(bridge.includes("cleanup('Browser backgrounded"));
 assert.ok(bridge.includes("cleanup('Browser frozen"));
});

test('P90 M14 mobile touchscreen buttons on actual original source 163-bone viewer in both engines',()=>{
 const live=readFileSync('scripts/check-parallel90-interactions.mjs','utf8');
 const flow=readFileSync('.github/workflows/parallel90-viewer-no-deploy.yml','utf8');
 const fixture=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 assert.ok(fixture.includes('isMobile:true,hasTouch:true'));
 assert.ok(flow.includes('matrix:'));
 assert.ok(flow.includes('engine: [chromium, webkit]'));
 assert.ok(live.includes("if(width===390){"));
 assert.ok(live.includes("await page.touchscreen.tap("));
 for(const action of ['Right90','ZoomIn90','Reset90'])
  assert.ok(live.includes("await tap90('#outfit3D01"+action+"')"),'actual touch event '+action);
 assert.ok(live.includes('afterReset.bones,163'));
 assert.ok(live.includes('afterReset.garmentSources90,touchBefore.garmentSources90'));
 assert.ok(live.includes('afterReset.resources90.geometries,touchBefore.resources90.geometries'));
 assert.ok(live.includes('afterReset.resources90.textures,touchBefore.resources90.textures'));
 assert.ok(live.includes('afterReset.resources90.frames>=touchBefore.resources90.frames'));
 assert.ok(live.includes('realTouchscreenTap:true'));
});


test('P90 M15 mid-pointer source revocation releases stale photographed WebGL and reattests fresh rig',()=>{
 const browser=readFileSync('scripts/check-parallel90-interactions.mjs','utf8');
 const workflow=readFileSync('.github/workflows/parallel90-viewer-no-deploy.yml','utf8');
 assert.ok(browser.includes('if(width===390){'), 'mobile width must exercise held-pointer source change');
 assert.ok(browser.includes('await page.mouse.down()'));
 assert.ok(browser.includes('window.nativeLossless04Bridge.selectSaved(1)'));
 assert.ok(browser.includes('await page.mouse.up()'));
 assert.ok(browser.includes("document.contains(window.__p90DragCanvas)),false"));
 assert.ok(browser.includes("window.nativeLossless04Bridge.status().active"));
 assert.ok(browser.includes("revoked.sceneShirtStages90,null"));
 assert.ok(browser.includes("staleOriginalPhotosCleared:true"));
 assert.ok(browser.includes("newSourceAttestedCanvas:true"));
 assert.ok(browser.includes("physicalFingerSwipeVerified:false"));
 assert.ok(browser.includes('midDragRevocation90,landscape'));
 assert.ok(workflow.includes('engine: [chromium, webkit]'));
});


test('P90 M16 continuous Chromium browser touch drag rotates pinned source rigs without source or GPU allocation change',()=>{
 const browser=readFileSync('scripts/check-parallel90-interactions.mjs','utf8');
 const fixture=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 const workflow=readFileSync('.github/workflows/parallel90-viewer-no-deploy.yml','utf8');
 assert.ok(browser.includes("if(width===390&&engine==='chromium'){"));
 assert.ok(fixture.includes('isMobile:true,hasTouch:true'));
 assert.ok(browser.includes("newCDPSession(page)"));
 for(const kind of ['touchStart','touchMove','touchEnd'])
  assert.ok(browser.includes("type:'"+kind+"'"),'original real browser touch event '+kind);
 assert.ok(browser.includes('angleChange>5'));
 assert.ok(browser.includes('swipeAfter.bones,163'));
 assert.ok(browser.includes('swipeAfter.garmentSources90,swipeBefore.garmentSources90'));
 assert.ok(browser.includes('swipeAfter.resources90.geometries,swipeBefore.resources90.geometries'));
 assert.ok(browser.includes('swipeAfter.resources90.textures,swipeBefore.resources90.textures'));
 assert.ok(browser.includes('Math.abs(scrollAfter-scrollBefore)<=2'));
 assert.match(browser,/samples\.push\(\{figure,width,engine,before,after,[^\n]*\btouchSwipe16\b/);
 assert.ok(browser.includes('webkitTouchSwipeVerified:false'));
 assert.ok(browser.includes('physicalPhone:false'));
 assert.ok(workflow.includes('engine: [chromium, webkit]'));
});


test('P90 M17 full 360-degree real-source orbit and visible rear provenance warning in both browsers',()=>{
 const installer=readFileSync('scripts/install-parallel90-viewer.mjs','utf8');
 const interactions=readFileSync('scripts/check-parallel90-interactions.mjs','utf8');
 const workflow=readFileSync('.github/workflows/parallel90-viewer-no-deploy.yml','utf8');
 assert.ok(installer.includes("const sourceNotice90=el('p','outfit3D01SourceNotice90')"));
 assert.ok(installer.includes("sourceNotice90.setAttribute('aria-label','3D original photograph limitations')"));
 assert.ok(installer.includes("Original front photographs are authoritative."));
 assert.ok(installer.includes("Side and rear garment details are not photograph-verified."));
 assert.ok(installer.includes("Unsupported outfit pieces remain original-photo-only."));
 assert.ok(interactions.includes("sourceNotice90.isVisible()"));
 assert.ok(interactions.includes("for(let step=0;step<24;step++)"));
 assert.ok(interactions.includes("await page.locator('#outfit3D01Right90').click()"));
 assert.ok(interactions.includes("angleDelta<3"));
 assert.ok(interactions.includes("wrapped.camera90.distance-original.camera90.distance"));
 assert.ok(interactions.includes("wrapped.garmentSources90,sourceSHA"));
 assert.ok(interactions.includes("wrapped.resources90.textures,original.resources90.textures"));
 assert.ok(interactions.includes("await page.locator('#outfit3D01Back').click()"));
 assert.ok(interactions.includes("await page.locator('#outfit3D01Front').click()"));
 assert.ok(interactions.includes("rearOriginalPhotoVerified:false"));
 assert.match(interactions,/samples\.push\(\{figure,width,engine,before,after,[^\n]*\bfullCycle17\b/);
 assert.ok(workflow.includes('engine: [chromium, webkit]'));
});

test('P90 M18 real owner original-photo evidence shortcut is focusable and read-only at mobile width',()=>{
 const installer=readFileSync('scripts/install-parallel90-viewer.mjs','utf8');
 const interactions=readFileSync('scripts/check-parallel90-interactions.mjs','utf8');
 const flow=readFileSync('.github/workflows/parallel90-viewer-no-deploy.yml','utf8');
 assert.ok(installer.includes("const originalPhotos90=el('button','outfit3D01Originals90','View original photos')"));
 assert.ok(installer.includes("originalPhotos90.setAttribute('aria-label','View original saved clothing photographs and photo-only fallback')"));
 assert.ok(installer.includes("current();"));
 assert.ok(installer.includes("if(!shown||!dialog.open)return"));
 assert.ok(installer.includes("cards.setAttribute('role','region')"));
 assert.ok(installer.includes("cards.setAttribute('aria-label','Original saved clothing photographs')"));
 assert.ok(installer.includes("cards.focus({preventScroll:true})"));
 assert.ok(installer.includes("cards.scrollIntoView({block:'start',behavior:'auto'})"));
 assert.ok(interactions.includes("await button.click()"));
 assert.ok(interactions.includes("document.activeElement===n"));
 assert.ok(interactions.includes("genuineFirstPhotoHash,previous.garmentSources90.dress"));
 assert.ok(interactions.includes("afterShortcut.garmentSources90,previous.garmentSources90"));
 assert.ok(interactions.includes("afterShortcut.resources90.geometries,previous.resources90.geometries"));
 assert.ok(interactions.includes("owner2DSessionRetained:true"));
 assert.match(interactions,/samples\.push\(\{figure,width,engine,before,after,[^\n]*\boriginalPhotosShortcut18\b/);
 assert.ok(flow.includes("engine: [chromium, webkit]"));
});

test('P90 M19 explicit auto-rotation pause retains native owner, source photos and original 163 bones',()=>{
 const installer=readFileSync('scripts/install-parallel90-viewer.mjs','utf8');
 const interactions=readFileSync('scripts/check-parallel90-interactions.mjs','utf8');
 const workflow=readFileSync('.github/workflows/parallel90-viewer-no-deploy.yml','utf8');
 assert.ok(installer.includes("['Rotate','Auto rotate'],['Stop90','Pause rotation']"));
 assert.ok(installer.includes("const pause90=views.querySelector('#outfit3D01Stop90')"));
 assert.ok(installer.includes("if(ready&&scene)scene.setSpin(false)"));
 assert.ok(installer.includes("pause90.setAttribute('aria-label','Pause automatic avatar rotation without changing clothing')"));
 assert.ok(interactions.includes("await page.locator('#outfit3D01Rotate').click()"));
 assert.ok(interactions.includes("await page.waitForFunction(start=>"));
 assert.ok(interactions.includes("now.camera90.angle-start"));
 assert.ok(interactions.includes("await pause.click()"));
 assert.ok(interactions.includes("drift<2"));
 assert.ok(interactions.includes("later.garmentSources90,originalSpin.garmentSources90"));
 assert.ok(interactions.includes("later.resources90.geometries,originalSpin.resources90.geometries"));
 assert.ok(interactions.includes("later.resources90.textures,originalSpin.resources90.textures"));
 assert.ok(interactions.includes("owner2DSessionPreserved:true"));
 assert.match(interactions,/samples\.push\(\{figure,width,engine,before,after,[^\n]*\bautoSpinPause19\b/);
 assert.ok(workflow.includes('engine: [chromium, webkit]'));
});

test('P90 M20 system reduced-motion stops real auto-spin without changing admitted 163-bone/source rig',()=>{
 const installer=readFileSync('scripts/install-parallel90-viewer.mjs','utf8');
 const browser=readFileSync('scripts/check-parallel90-interactions.mjs','utf8');
 const workflow=readFileSync('.github/workflows/parallel90-viewer-no-deploy.yml','utf8');
 assert.ok(installer.includes("const reducedMotion90=doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')||null"));
 assert.ok(installer.includes("reducedMotion90?.addEventListener?.('change',onReducedMotion90)"));
 assert.ok(installer.includes("reducedMotion90?.removeEventListener?.('change',onReducedMotion90)"));
 assert.ok(installer.includes("if(reducedMotion90?.matches){"));
 assert.ok(installer.includes("scene.setSpin(false)"));
 assert.ok(installer.includes("Manual 3D rotation is available."));
 assert.ok(installer.includes("const clearCameraInertia90=()=>"));
 assert.ok(installer.includes("controls.enableDamping=false"));
 assert.ok(installer.includes("controls.update()"));
 assert.ok(installer.includes("controls.enableDamping=savedDamping"));
 assert.ok(installer.includes("const front=()=>{clearCameraInertia90();spin=false"));
 assert.ok(installer.includes("const side=()=>{clearCameraInertia90();spin=false"));
 assert.ok(installer.includes("const back=()=>{clearCameraInertia90();spin=false"));
 assert.ok(installer.includes("const rotate=degrees=>{"));
 assert.ok(browser.includes("await page.emulateMedia({reducedMotion:'reduce'})"));
 assert.ok(browser.includes("await page.emulateMedia({reducedMotion:'no-preference'})"));
 assert.ok(browser.includes("unintendedDrift<2"));
 assert.ok(browser.includes("driftAfterChange<2"));
 assert.ok(browser.includes("restoring no-preference must not silently restart"));
 assert.ok(browser.includes("manual orbit must work independently"));
 assert.ok(browser.includes("final.garmentSources90,original.garmentSources90"));
 assert.ok(browser.includes("final.resources90.geometries,original.resources90.geometries"));
 assert.ok(browser.includes("final.resources90.textures,original.resources90.textures"));
 assert.match(browser,/samples\.push\(\{figure,width,engine,before,after,[^\n]*\breducedMotion20\b/);
 assert.ok(workflow.includes('engine: [chromium, webkit]'));
});

test('P90 M21 repeated real owner-sourced WebGL reopen forces actual context loss and removes stale canvases',()=>{
 const browser=readFileSync('scripts/check-parallel90-interactions.mjs','utf8');
 const fixture=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 const workflow=readFileSync('.github/workflows/parallel90-viewer-no-deploy.yml','utf8');
 assert.ok(browser.includes("for(let n=1;n<=4;n++){"));
 assert.ok(browser.includes("window.native3D05Bridge.close()"));
 assert.ok(browser.includes("window.__p90M21OldCanvas"));
 assert.ok(browser.includes("gl?.isContextLost()===true"));
 assert.ok(browser.includes("window.nativeLossless04Bridge.status().active"));
 assert.ok(browser.includes("oldDisconnected"));
 assert.ok(browser.includes("oldContextStillLost"));
 assert.ok(browser.includes("await page.locator('#native3D05Preview').click()"));
 assert.ok(browser.includes("window.native3D05Bridge.state().bones===163"));
 assert.ok(browser.includes("opened.garmentSources90,admittedSource"));
 assert.ok(browser.includes("opened.resources90.geometries,initial.resources90.geometries"));
 assert.ok(browser.includes("opened.resources90.textures,initial.resources90.textures"));
 assert.ok(browser.includes("retired.selected2D,ownerSelection.selected"));
 assert.ok(browser.includes("390-reopen-resource.json"));
 assert.ok(browser.includes("hardwareGPUBytesMeasured:false"));
 assert.ok(browser.includes("physicalPhone:false"));
 assert.ok(fixture.includes("NATIVE92"));
 assert.ok(workflow.includes('engine: [chromium, webkit]'));
});
