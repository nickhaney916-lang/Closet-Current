/**
 * M2 P89: independent real-photo original/3D mobile-size interactive viewer.
 * GENUINE museum JPEG + full decoded RGB + separately regenerated
 * conservative OpenCV mask -> source-verified photo-front neutral shell.
 * NO real user account, clothing classification, wearer fit or approval.
 * Strict locality and original 2D fallback on corrupt research 3D receipts.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {buildMetSourceFrontNeutralBackShell89 as build}
 from '../research/parallel89/met-source-front-neutral-shell89.mjs';

const id=2551406,sha=b=>createHash('sha256').update(b).digest('hex');
const sourceDir='benchmark/parallel89-met70759-four-photo-research';
const maskDir='benchmark/parallel89-met70759-full-alpha-proposals';
const out='benchmark/parallel89-interactive-source-2d-3d-HOLD';
const image=await readFile(sourceDir+'/met-70759-gallery-2551406.jpg');
const mask=await readFile(maskDir+'/met-70759-2551406-AUTO-UNREVIEWED-foreground-mask.png');
const receipts=JSON.parse(await readFile(maskDir+'/met-70759-four-photo-AUTO-UNREVIEWED-mask-receipts.json'));
assert.equal(receipts.allMasksMachineGeneratedAndUnreviewed,true);
assert.equal(receipts.humanOrCuratorialMaskAcceptanceReceived,false);
assert.equal(receipts.sourceObjectNumber,'1983.21a, b');
assert.equal(receipts.familyAlpha,'HOLD');
const rec=receipts.maskedOriginalPhotoPixels.find(x=>x.imageId===id);
assert.ok(rec);assert.equal(rec.outputMaskPngSHA256,sha(mask));
const shell=await build({imageId:id,originalJPEGBytes:image,conservativeMaskPNGBytes:mask});
assert.equal(shell.status,'EDGE_CLOSED_SOURCE_SILHOUETTE_SHELL_INFERRED_REAR_UNAPPROVED',shell.reason);
assert.equal(shell.imageId,id);
assert.equal(shell.originalMuseumExactCaption,'a) front');
assert.equal(shell.originalJPEGByteSHA256,sha(image));
assert.equal(shell.originalDecodedRGBSHA256,rec.originalFullDecodedRGBSHA256);
assert.equal(shell.originalSourceConservativeMaskSHA256,
 '757b7c16161de68151c98d514907a6a1004259ae43fcfb7c1a8aa1fa72febfd4');
assert.equal(shell.originalSourceMaskUncertainPixelsExcluded,13913);
assert.equal(shell.shellIndexedEdgeIncidenceExactlyTwo,true);
assert.equal(shell.neutralBackHasNoOriginalPhotographRGB,true);
assert.equal(shell.realPhysicalDepthMeasured,false);
assert.equal(shell.actualAnatomicalFitProved,false);
assert.equal(shell.approvedSourceMaskHumanReviewed,false);
assert.equal(shell.consumer3DAdmitted,false);
assert.equal(shell.sourcePhoto2DFallbackRequired,true);
assert.equal(shell.releaseAuthorized,false);
assert.equal(shell.familyAlpha,'HOLD');
const ranges=shell.drawRanges;
assert.equal(ranges.sourcePhotoFront.count/3,35262);
assert.equal(ranges.unobservedNeutralBack.count/3,35262);
assert.ok(ranges.inferredNeutralSideWalls.count>120);
const sourceIdentity=sha(image),maskIdentity=sha(mask);
const payload={
 schema:'M2-P89-true-original-source-2D-to-inferred-shell-interactive-RESEARCH/v1',
 imageId:id,originalJPEG_SHA256:sourceIdentity,
 sourceOriginalDecodedRGB_SHA256:shell.originalDecodedRGBSHA256,
 sourceMaskPNG_SHA256:maskIdentity,
 sourceRGBA_SHA256:shell.sourceMaskedOriginalRGBTexSHA256,
 exactMuseumCaption:'a) front',verifiedFrontOnly:true,
 unknownReverseNeutral:true,
 textureDimensions:shell.photoDimensions,
 positions:Array.from(shell.positions),uv:Array.from(shell.uv),
 indices:Array.from(shell.indices),sourceRGBA:Array.from(shell.originalRGBAFront),
 ranges,
 sourcePhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
};
assert.equal(payload.sourceRGBA_SHA256,sha(shell.originalRGBAFront));
assert.equal(payload.sourceRGBA_SHA256,'b8adb2fbd644203341051d6475788c69c1954868e5c2e8942f2fed0a3d8f116d');
assert.equal(payload.ranges.sourcePhotoFront.count+
 payload.ranges.unobservedNeutralBack.count+
 payload.ranges.inferredNeutralSideWalls.count,payload.indices.length);
await mkdir(out,{recursive:true});
await writeFile(out+'/source-attested-preview-manifest.json',
 JSON.stringify({schema:payload.schema,originalJPEG_SHA256:sourceIdentity,
 sourceMaskPNG_SHA256:maskIdentity,sourceRGBA_SHA256:payload.sourceRGBA_SHA256,
 geometryTriangles:payload.indices.length/3,
 photoFrontTriangles:shell.frontOriginalTriangles,
 neutralBackTriangles:shell.inferredRearTriangles,
 neutralWalls:shell.inferredSideTriangles,
 originalUnknownMaskPixelsExcluded:shell.originalSourceMaskUncertainPixelsExcluded,
 actualInstitutionalImageSource:true,
 sourceMaskHumanApproved:false,physicalAvatarFitApproved:false,
 consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'},null,2)+'\n');
console.log('M2_SOURCE_LOCKED_MOBILE_VIEWER_INPUT_PREPARED '+JSON.stringify({
 originalMuseumSource:'1983.21a, b',imageId:id,
 actualOriginalJPEG_SHA256:sourceIdentity,
 actualOriginalConservativeMaskPNG_SHA256:maskIdentity,
 originalRGB_SHA256:shell.originalDecodedRGBSHA256,
 frontTextureRGBA_SHA256:payload.sourceRGBA_SHA256,
 tri:payload.indices.length/3,sourcePhoto2DFallback:true,
 unreviewed3DOnly:true,consumer3DAdmitted:false,familyAlpha:'HOLD'
}));
if(!process.env.P89_BROWSER)process.exit(0);
assert.ok(['chromium','webkit'].includes(process.env.P89_BROWSER),'native browser required');
const {chromium,webkit}=await import('playwright');
const html=await readFile('research/parallel89/interactive-original-source-preview89.html');
const json=Buffer.from(JSON.stringify(payload));
const server=createServer((req,res)=>{
 const url=req.url||'';
 if(!['127.0.0.1','localhost'].includes((req.headers.host||'').split(':')[0])){
  res.writeHead(403);res.end('loopback only');return;
 }
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(url==='/viewer'){
  res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);return;
 }
 if(url==='/original-source.jpg'){
  res.setHeader('Content-Type','image/jpeg');
  if((req.headers.cookie||'').includes('corrupt-jpeg=1')){
   // Actual altered JPEG bytes must fail SHA before they reach the decoder.
   const changed=Buffer.from(image);changed[changed.length-17]^=0x02;
   res.end(changed);return;
  }
  if((req.headers.cookie||'').includes('oversize-jpeg=1')){
   // Actual chunked HTTP stream with no advertised Content-Length.
   // Never let a claimed original photograph allocate unlimited phone RAM.
   res.setHeader('Transfer-Encoding','chunked');
   const chunk=Buffer.alloc(1024*1024,0x20);
   for(let i=0;i<9;i++)res.write(chunk);
   res.end();return;
  }
  res.end(image);return;
 }
 if(url==='/source-locked-preview.json'){
  res.setHeader('Content-Type','application/json');
  if((req.headers.cookie||'').includes('oversize-3d=1')){
   // Chunked real HTTP body without Content-Length, beyond client cap.
   res.setHeader('Transfer-Encoding','chunked');
   const chunk=Buffer.alloc(1024*1024,0x20);
   for(let n=0;n<33;n++)res.write(chunk);
   res.end();return;
  }
  if((req.headers.cookie||'').includes('tamper=1')){
   const forged={...payload,sourceRGBA_SHA256:'0'.repeat(64)};
   res.end(Buffer.from(JSON.stringify(forged)));return;
  }
  if((req.headers.cookie||'').includes('bad-geometry=1')){
   const forged={...payload,indices:payload.indices.slice()};
   forged.indices[0]=payload.positions.length/3+7;
   res.end(Buffer.from(JSON.stringify(forged)));return;
  }
  if((req.headers.cookie||'').includes('bad-geometry=2')){
   const forged={...payload,positions:payload.positions.slice()};
   forged.positions[3]=null; // JSON representation of a non-finite coordinate
   res.end(Buffer.from(JSON.stringify(forged)));return;
  }
  res.end(json);return;
 }
 res.writeHead(404);res.end('not found');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const engine=process.env.P89_BROWSER;
const browser=await ({chromium,webkit})[engine].launch({
 headless:true,args:engine==='chromium'?['--no-sandbox']:[]
});
const widthResults=[],errors=[];
const snapshot=async page=>page.evaluate(()=>window.__m2PreviewEvidence.getSnapshot());
const counts=async page=>page.evaluate(()=>window.__m2PreviewEvidence.getPixelCounts());
try{
 for(const width of [320,390,430]){
  const page=await browser.newPage({viewport:{width,height:780},
   isMobile:false,hasTouchscreen:true,deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  const external=[];page.on('request',r=>{
   if(/^https?:/.test(r.url())&&!r.url().startsWith(origin))external.push(r.url());
  });
  const response=await page.goto(origin+'/viewer',{waitUntil:'load'});
  assert.equal(response?.status(),200);
  await page.waitForFunction(()=>window.__m2PreviewEvidence?.getSnapshot().verified===true,
   null,{timeout:45000});
  let s=await snapshot(page);
  assert.equal(s.mode,'photo');assert.equal(s.originalImageVisible,true);
  assert.equal(s.previewVisible,false);
  assert.equal(s.consumer3DAdmitted,false);
  assert.equal(await page.locator('#shell').isEnabled(),true);
  assert.equal(await page.locator('#rotation').isDisabled(),true);
  assert.equal(await page.locator('#photo').evaluate(e=>[e.naturalWidth,e.naturalHeight].join('x')),'1200x933');
  await page.screenshot({path:out+'/'+engine+'-'+width+'-SOURCE-ORIGINAL-2D.png'});
  await page.locator('#shell').click();
  s=await snapshot(page);
  assert.equal(s.mode,'shell');assert.equal(s.previewVisible,true);
  let px=await counts(page);assert.ok(px.originalPixels>12000,JSON.stringify(px));
  assert.equal(px.neutralBackPixels,0,'photographed front must not claim inferred back');
  assert.equal(px.gpuError,0);
  const frontPixels=px.originalPixels;
  await page.screenshot({path:out+'/'+engine+'-'+width+'-SOURCE-PHOTO-FRONT-0deg.png'});
  // Keyboard and accessible native range control; observed reverse is ALWAYS
  // cyan placeholder, NEVER a fabric photo or real camera assertion.
  await page.locator('#rotation').focus();
  await page.keyboard.press('End');
  s=await snapshot(page);assert.equal(s.angle,180);
  px=await counts(page);
  assert.ok(px.neutralBackPixels>12000,JSON.stringify(px));
  assert.equal(px.originalPixels,0,'fake photographed reverse forbidden');
  assert.equal(px.gpuError,0);
  assert.match(await page.locator('#view-status').textContent(),/REVERSE IS UNKNOWN/);
  const backPixels=px.neutralBackPixels;
  await page.screenshot({path:out+'/'+engine+'-'+width+'-INFERRED-NEUTRAL-BACK-180deg.png'});
  await page.keyboard.press('Home');
  s=await snapshot(page);assert.equal(s.angle,0);
  const box=await page.locator('#gl').boundingBox();assert.ok(box&&box.width>200);
  await page.mouse.move(box.x+box.width*.25,box.y+box.height*.50);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*.65,box.y+box.height*.50,{steps:9});
  await page.mouse.up();
  s=await snapshot(page);
  assert.ok(s.angle>=50&&s.angle<=160,'real pointer drag must change angle: '+s.angle);
  px=await counts(page);
  assert.ok(px.opaque>2000,JSON.stringify(px));
  assert.ok(px.inferredWallPixels>70,
   'rotated source silhouette must display its clearly INFERRED neutral wall');
  assert.equal(px.gpuError,0);
  await page.screenshot({path:out+'/'+engine+'-'+width+'-INFERRED-SIDE-POINTER-DRAG.png'});
  const sidePixels=px.inferredWallPixels,dragAngle=s.angle;
  await page.locator('#original').click();
  s=await snapshot(page);assert.equal(s.mode,'photo');
  assert.equal(s.originalImageVisible,true);
  assert.equal(await page.locator('#rotation').isDisabled(),true);
  // Important adversarial re-entry: losing WebGL context must instantly
  // restore authentic previously SHA-verified 2D, with 3D disabled.
  await page.locator('#shell').click();
  const loss=await page.locator('#gl').evaluate(c=>{
   const gl=c.getContext('webgl2');
   const ext=gl?.getExtension('WEBGL_lose_context');
   if(ext){ext.loseContext();return 'actual-native-WebGL-lose-context-extension';}
   c.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));
   return 'synthetic-contextlost-handler-only';
  });
  await page.waitForFunction(()=>window.__m2PreviewEvidence?.getSnapshot().contextFailed===true,
   null,{timeout:6000});
  s=await snapshot(page);
  assert.equal(s.mode,'photo');assert.equal(s.originalImageVisible,true);
  assert.equal(s.previewVisible,false);
  assert.equal(s.errorCode,'WebGL-context-lost');
  assert.equal(await page.locator('#shell').isDisabled(),true);
  assert.deepEqual(external,[]);
  widthResults.push({width,frontSourceRGBPixels:frontPixels,
   backNeutralOnlyPixels:backPixels,dragAngle,sideInferredWallPixels:sidePixels,
   fallbackOriginal2DAfterContextLoss:true,contextLossWitnessType:loss,
   externalNetworkRequests:external.length});
  await page.close();
 }
 // Forge the separate research mesh receipt while leaving the ORIGINAL jpeg
 // immutable. Must still display the real source image in 2D but refuse 3D.
 const badContext=await browser.newContext({viewport:{width:390,height:760}});
 await badContext.addCookies([{name:'tamper',value:'1',url:origin}]);
 const bad=await badContext.newPage();
 bad.on('pageerror',e=>errors.push(e.message));
 await bad.goto(origin+'/viewer');
 await bad.waitForFunction(()=>window.__m2PreviewEvidence?.getSnapshot().errorCode!==null,
  null,{timeout:30000});
 const refused=await snapshot(bad);
 assert.equal(refused.verified,false);
 assert.equal(refused.mode,'photo');
 assert.equal(refused.originalImageVisible,true,
  'changing unapproved 3D manifest must NOT hide authentic 2D original');
 assert.equal(refused.previewVisible,false);
 assert.equal(refused.errorCode,'original-source-RGBA-tampered');
 assert.equal(await bad.locator('#shell').isDisabled(),true);
 assert.equal(await bad.locator('#photo').evaluate(e=>e.naturalWidth),1200);
 await bad.screenshot({path:out+'/'+engine+'-390-CORRUPT-3D-EVIDENCE-FALLBACK-ORIGINAL-2D.png'});
 await badContext.close();
 // Authentic source photo must remain visible after invalid geometry payloads.
 // No new source/photo hash, consumer admission or browser WebGL permission.
 for(const [cookie,kind] of [['1','index-out-of-range'],['2','nonfinite-vertex']]){
  const context=await browser.newContext({viewport:{width:390,height:760}});
  await context.addCookies([{name:'bad-geometry',value:cookie,url:origin}]);
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/viewer');
  await page.waitForFunction(()=>window.__m2PreviewEvidence?.getSnapshot().errorCode!==null,
   null,{timeout:30000});
  const state=await snapshot(page);
  assert.equal(state.errorCode,'source-geometry-values-rejected',kind);
  assert.equal(state.mode,'photo',kind);
  assert.equal(state.originalImageVisible,true,kind);
  assert.equal(state.previewVisible,false,kind);
  assert.equal(state.consumer3DAdmitted,false,kind);
  assert.equal(await page.locator('#shell').isDisabled(),true,kind);
  await context.close();
 }
 // An actual network rejection (not HTTP 404) of the optional research
 // manifest used to reject Promise.all before the authentic JPEG could be
 // verified. The user must still see source-original 2D with no 3D option.
 const offline3D=await browser.newContext({viewport:{width:390,height:760}});
 await offline3D.route('**/source-locked-preview.json',route=>route.abort('failed'));
 const originalOnly=await offline3D.newPage();
 originalOnly.on('pageerror',e=>errors.push(e.message));
 await originalOnly.goto(origin+'/viewer');
 await originalOnly.waitForFunction(()=>window.__m2PreviewEvidence?.getSnapshot().errorCode!==null,
  null,{timeout:30000});
 const disconnected=await snapshot(originalOnly);
 assert.equal(disconnected.verified,false,'manifest network unavailable');
 assert.equal(disconnected.mode,'photo');
 assert.equal(disconnected.originalImageVisible,true,
  'aborted research manifest fetch must not hide independently verified source JPEG');
 assert.equal(disconnected.previewVisible,false);
 assert.equal(disconnected.consumer3DAdmitted,false);
 assert.equal(await originalOnly.locator('#shell').isDisabled(),true);
 assert.equal(await originalOnly.locator('#photo').evaluate(e=>[e.naturalWidth,e.naturalHeight].join('x')),
  '1200x933');
 await originalOnly.screenshot({path:out+'/'+engine+'-390-3D-NETWORK-ABORT-ORIGINAL-2D.png'});
 await offline3D.close();
 // Real streamed 33 MiB optional 3D must refuse before JSON parsing;
 // original source 2D remains visible and consumer 3D is still forbidden.
 const oversized3D=await browser.newContext({viewport:{width:390,height:760}});
 await oversized3D.addCookies([{name:'oversize-3d',value:'1',url:origin}]);
 const oversizedPage=await oversized3D.newPage();
 oversizedPage.on('pageerror',e=>errors.push(e.message));
 await oversizedPage.goto(origin+'/viewer',{waitUntil:'commit'});
 await oversizedPage.waitForFunction(()=>
  window.__m2PreviewEvidence?.getSnapshot().errorCode==='research-3D-manifest-too-large',
  null,{timeout:45000});
 const oversized=await snapshot(oversizedPage);
 assert.equal(oversized.verified,false);
 assert.equal(oversized.mode,'photo');
 assert.equal(oversized.originalImageVisible,true);
 assert.equal(oversized.previewVisible,false);
 assert.equal(oversized.consumer3DAdmitted,false);
 assert.equal(await oversizedPage.locator('#shell').isDisabled(),true);
 assert.equal(await oversizedPage.locator('#photo').evaluate(e=>
  [e.naturalWidth,e.naturalHeight].join('x')),'1200x933');
 await oversizedPage.screenshot({path:out+'/'+engine+'-390-OVERSIZE-3D-STREAM-ORIGINAL-2D.png'});
 await oversized3D.close();
 // A connection that never returns a 3D manifest is different from a rejected
 // request: the original photo must remain visible, the 3D control must be
 // disabled after the bounded deadline, and the UI must stop waiting.
 const stalled3D=await browser.newContext({viewport:{width:390,height:760}});
 await stalled3D.route('**/source-locked-preview.json',async()=>{
  // Deliberately leave the optional request unresolved until AbortController
  // cancels it; no fabricated HTTP failure or replacement JPEG is supplied.
  await new Promise(()=>{});
 });
 const stalledPage=await stalled3D.newPage();
 stalledPage.on('pageerror',e=>errors.push(e.message));
 await stalledPage.goto(origin+'/viewer',{waitUntil:'commit'});
 await stalledPage.waitForFunction(()=>{
  const s=window.__m2PreviewEvidence?.getSnapshot();
  return s?.originalImageVisible===true&&s.errorCode===null;
 },null,{timeout:15000});
 const pending=await snapshot(stalledPage);
 assert.equal(pending.mode,'photo');
 assert.equal(pending.previewVisible,false);
 assert.equal(await stalledPage.locator('#photo').evaluate(e=>e.naturalWidth),1200);
 await stalledPage.waitForFunction(()=>
  window.__m2PreviewEvidence?.getSnapshot().errorCode==='research-3D-manifest-timeout',
  null,{timeout:15000});
 const timedOut=await snapshot(stalledPage);
 assert.equal(timedOut.verified,false);
 assert.equal(timedOut.mode,'photo');
 assert.equal(timedOut.originalImageVisible,true);
 assert.equal(timedOut.previewVisible,false);
 assert.equal(timedOut.consumer3DAdmitted,false);
 assert.equal(await stalledPage.locator('#shell').isDisabled(),true);
 assert.equal(await stalledPage.locator('#photo').evaluate(e=>[e.naturalWidth,e.naturalHeight].join('x')),
  '1200x933');
 await stalledPage.screenshot({path:out+'/'+engine+'-390-3D-MANIFEST-STALL-TIMEOUT-ORIGINAL-2D.png'});
 await stalled3D.close();
 // Untrusted bytes on the REQUIRED original image endpoint are distinct
 // from optional 3D failures: with no SHA-approved JPEG, neither 2D nor 3D
 // is authorized. Exercise actual HTTP streaming without Content-Length.
 const oversizedJPEG=await browser.newContext({viewport:{width:390,height:760}});
 await oversizedJPEG.addCookies([{name:'oversize-jpeg',value:'1',url:origin}]);
 const oversizedJPEGPage=await oversizedJPEG.newPage();
 oversizedJPEGPage.on('pageerror',e=>errors.push(e.message));
 await oversizedJPEGPage.goto(origin+'/viewer',{waitUntil:'commit'});
 await oversizedJPEGPage.waitForFunction(()=>
  window.__m2PreviewEvidence?.getSnapshot().errorCode==='original-source-JPEG-too-large',
  null,{timeout:30000});
 const tooLarge=await snapshot(oversizedJPEGPage);
 assert.equal(tooLarge.mode,'photo');
 assert.equal(tooLarge.verified,false);
 assert.equal(tooLarge.sourceSHA256,null);
 assert.equal(tooLarge.originalImageVisible,false,'unverified huge bytes are not a 2D fallback');
 assert.equal(tooLarge.previewVisible,false);
 assert.equal(tooLarge.consumer3DAdmitted,false);
 assert.equal(await oversizedJPEGPage.locator('#shell').isDisabled(),true);
 assert.match(await oversizedJPEGPage.locator('#view-status').textContent(),/Original photograph unavailable/);
 await oversizedJPEG.close();
 // A required JPEG fetch that never sends headers must also settle. 3D is
 // forbidden; there is no source-authenticated photo to display or save.
 const stalledJPEG=await browser.newContext({viewport:{width:390,height:760}});
 await stalledJPEG.route('**/original-source.jpg',async()=>{
  await new Promise(()=>{});
 });
 const stalledJPEGPage=await stalledJPEG.newPage();
 stalledJPEGPage.on('pageerror',e=>errors.push(e.message));
 await stalledJPEGPage.goto(origin+'/viewer',{waitUntil:'commit'});
 // User can tap the 2D button while source bytes are still stalled. Before
 // this correction it asserted an institutional photograph despite no image.
 await stalledJPEGPage.waitForFunction(()=>Boolean(window.__m2PreviewEvidence),null,{timeout:15000});
 await stalledJPEGPage.locator('#original').click();
 assert.match(await stalledJPEGPage.locator('#view-status').textContent(),
  /Verifying original photograph/, 'pending JPEG cannot be presented as available');
 await stalledJPEGPage.waitForFunction(()=>
  window.__m2PreviewEvidence?.getSnapshot().errorCode==='original-source-JPEG-timeout',
  null,{timeout:15000});
 const stalledSource=await snapshot(stalledJPEGPage);
 assert.equal(stalledSource.mode,'photo');
 assert.equal(stalledSource.verified,false);
 assert.equal(stalledSource.sourceSHA256,null);
 assert.equal(stalledSource.originalImageVisible,false);
 assert.equal(stalledSource.previewVisible,false);
 assert.equal(stalledSource.consumer3DAdmitted,false);
 assert.equal(await stalledJPEGPage.locator('#shell').isDisabled(),true);
 await stalledJPEGPage.locator('#original').click();
 assert.match(await stalledJPEGPage.locator('#view-status').textContent(),
  /Original photograph unavailable/, '2D button cannot overwrite a verified source failure');
 await stalledJPEG.close();
 // Exact genuine original JPEG bytes with a purposely misbehaving decoder.
 // A cryptographically approved corrupt JPEG cannot be simulated without
 // changing the source allowlist, so these are controlled browser faults.
 async function assertUntrustedOriginalAfterDecode(context,reason){
  const page=await context.newPage();
  let optional3DRequests=0;
  page.on('request',r=>{
   if(r.url().includes('/source-locked-preview.json'))optional3DRequests++;
  });
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/viewer',{waitUntil:'commit'});
  await page.waitForFunction(expected=>
   window.__m2PreviewEvidence?.getSnapshot().errorCode===expected,
   reason,{timeout:20000});
  const state=await snapshot(page);
  assert.equal(state.errorCode,reason);
  assert.equal(state.mode,'photo');
  assert.equal(state.verified,false);
  assert.equal(state.sourceSHA256,null,'no promotion from hash alone');
  assert.equal(state.originalImageVisible,false,'failed decoded source is NOT usable 2D');
  assert.equal(state.previewVisible,false);
  assert.equal(state.consumer3DAdmitted,false);
  assert.equal(await page.locator('#photo').getAttribute('src'),null,
   'decoder rejection must revoke and detach provisional blob');
  assert.equal(await page.locator('#shell').isDisabled(),true);
  assert.match(await page.locator('#view-status').textContent(),/Original photograph unavailable/);
  assert.equal(optional3DRequests,0,'no optional 3D fetch before source decode');
  await context.close();
 }
 const rejectingDecoder=await browser.newContext({viewport:{width:390,height:760}});
 await rejectingDecoder.addInitScript(()=>{
  HTMLImageElement.prototype.decode=function(){
   return Promise.reject(new Error('TEST_ONLY_FORCED_DECODE_REJECTION'));
  };
 });
 await assertUntrustedOriginalAfterDecode(rejectingDecoder,'original-source-JPEG-decode-failed');
 const stalledDecoder=await browser.newContext({viewport:{width:390,height:760}});
 await stalledDecoder.addInitScript(()=>{
  HTMLImageElement.prototype.decode=function(){return new Promise(()=>{});};
 });
 await assertUntrustedOriginalAfterDecode(stalledDecoder,'original-source-JPEG-decode-timeout');
 const badHashJPEG=await browser.newContext({viewport:{width:390,height:760}});
 await badHashJPEG.addCookies([{name:'corrupt-jpeg',value:'1',url:origin}]);
 await assertUntrustedOriginalAfterDecode(badHashJPEG,'original-source-JPEG-byte-identity-invalid');
 // A SHA-approved JPEG can decode successfully and THEN its browser blob
 // resource can be lost during an optional 3D transition. Exercise an actual
 // revoked blob URL, not a synthetic image-error dispatch, and require a
 // complete fail-closed 2D/3D demotion.
 const revokedContext=await browser.newContext({viewport:{width:390,height:760}});
 const revokedPage=await revokedContext.newPage();
 revokedPage.on('pageerror',e=>errors.push(e.message));
 await revokedPage.goto(origin+'/viewer',{waitUntil:'commit'});
 await revokedPage.waitForFunction(()=>
  window.__m2PreviewEvidence?.getSnapshot().verified===true,
  null,{timeout:45000});
 await revokedPage.locator('#shell').click();
 assert.equal((await snapshot(revokedPage)).mode,'shell');
 await revokedPage.locator('#photo').evaluate(p=>{
  const old=p.src;
  URL.revokeObjectURL(old);
  p.removeAttribute('src');
  p.src=old+'#revoked-resource';
 });
 await revokedPage.waitForFunction(()=>
  window.__m2PreviewEvidence?.getSnapshot().errorCode==='original-source-resource-lost',
  null,{timeout:15000});
 const revoked=await snapshot(revokedPage);
 assert.equal(revoked.verified,false,'3D must lose authorization with original resource');
 assert.equal(revoked.mode,'photo');
 assert.equal(revoked.sourceSHA256,null);
 assert.equal(revoked.originalImageVisible,false,'never display revoked photo as 2D');
 assert.equal(revoked.previewVisible,false);
 assert.equal(revoked.consumer3DAdmitted,false);
 assert.equal(await revokedPage.locator('#shell').isDisabled(),true);
 assert.match(await revokedPage.locator('#view-status').textContent(),/Original photograph unavailable/);
 await revokedPage.locator('#original').click();
 assert.match(await revokedPage.locator('#view-status').textContent(),/Original photograph unavailable/);
 await revokedContext.close();
 // A late *valid* optional 3D manifest must not resurrect shell admission
 // after the source JPEG's postdecode blob URL disappears.
 const lateContext=await browser.newContext({viewport:{width:390,height:760}});
 let releaseManifest;
 const waitForRelease=new Promise(resolve=>{releaseManifest=resolve;});
 await lateContext.route('**/source-locked-preview.json',async route=>{
  await waitForRelease;
  await route.fulfill({status:200,contentType:'application/json',body:json});
 });
 const latePage=await lateContext.newPage();
 latePage.on('pageerror',e=>errors.push(e.message));
 await latePage.goto(origin+'/viewer',{waitUntil:'commit'});
 await latePage.waitForFunction(()=>
  window.__m2PreviewEvidence?.getSnapshot().originalImageVisible===true,
  null,{timeout:15000});
 await latePage.locator('#photo').evaluate(p=>{
  const old=p.src;
  URL.revokeObjectURL(old);
  p.removeAttribute('src');
  p.src=old+'#revoked-before-manifest';
 });
 await latePage.waitForFunction(()=>
  window.__m2PreviewEvidence?.getSnapshot().errorCode==='original-source-resource-lost',
  null,{timeout:15000});
 const responseReceived=latePage.waitForResponse(r=>r.url().includes('source-locked-preview.json'),
  {timeout:15000});
 releaseManifest();
 await responseReceived;
 await latePage.waitForTimeout(400);
 const late=await snapshot(latePage);
 assert.equal(late.errorCode,'original-source-resource-lost');
 assert.equal(late.verified,false);
 assert.equal(late.sourceSHA256,null);
 assert.equal(late.originalImageVisible,false);
 assert.equal(late.previewVisible,false);
 assert.equal(await latePage.locator('#shell').isDisabled(),true);
 await lateContext.close();
 assert.deepEqual(errors,[],'native browser page errors');
 console.log('M2_INTERACTIVE_ORIGINAL_SOURCE_MOBILE_BROWSER_RESEARCH_PASS '+JSON.stringify({
  engine,realNativeBrowser:true,devicePhysical:false,
  sourceOriginalPhotoRGBAndSHAIntact:true,sourceMaskUnreviewed:true,
  frontOriginalPhotoOnly:true,rearExplicitlyNeutralOnly:true,
  previewModeUserSelectionVerified:true,keyboardRotationVerified:true,
  pointerDragRotationVerified:true,contextLoss2DFallbackVerified:true,
  corrupt3DManifestPreservesGenuine2DVerified:true,
  stalled3DManifestTimeoutPreservesGenuine2DVerified:true,
  forcedDecoderRejectAndStallSafelyRefused:true,alteredSourceHashRefused:true,
  postdecodeSourceRevocationDemoted:true,lateManifestResurrectionRefused:true,
  pendingAndFailedOriginalReentryStaysHonest:true,
  testedMobileWidths:[320,390,430],widthResults,
  browserErrors:errors.length,consumer3DAdmitted:false,
  fittedAnatomy163Bone:false,photorealismHumanApproved:false,
  familyAlpha:'HOLD'
 }));
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
