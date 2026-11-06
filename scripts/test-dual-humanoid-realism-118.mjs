import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';

const root=resolve('.'),out='benchmark/three-d-118';
const source={shirt:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
 jeans:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c'};
const views=[0,90,270,180,45,225],widths=[320,390,430],figures=['female','male'];
const hash=b=>createHash('sha256').update(b).digest('hex');
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(path)||path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))throw Error('blocked path');
  const file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))throw Error('path escape');
  const bytes=await readFile(file),mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.jpg':'image/jpeg','.png':'image/png','.json':'application/json','.glb':'model/gltf-binary'};
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await mkdir(out,{recursive:true});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const errors=[],external=[],crashes=[],screens=[],browserResults=[],comparison=[];
async function ready(page,figure,mode){
 const q='?denimDrape73=after&calf74=after&folds75=after&continuity76=after&contact77=on&knee78=on&knee103=on&knee104=on&knee105=on&knee106=on&realism118='+mode;
 await page.goto(origin+'/research/three-d-69/index.html'+q);
 await page.waitForFunction(()=>window.cc69Diagnostics?.()?.rig?.bones===163&&window.cc69Diagnostics().loaded===true,null,{timeout:180000});
 if(figure==='male'){
  await page.locator('#model').selectOption('male');
  await page.waitForFunction(()=>window.cc69Diagnostics?.()?.figure==='male'&&window.cc69Diagnostics().loaded===true,null,{timeout:120000});
 }
 await page.locator('#review').check();await page.locator('#wear').click();
 await page.waitForFunction(()=>window.cc69Diagnostics?.()?.actual3DGarment?.realPhotoApplied===true,null,{timeout:120000});
 const d=await page.evaluate(()=>window.cc69Diagnostics());
 assert.equal(d.rig.bones,163);
 assert.equal(d.actual3DGarment.originalPhotoSHA256s.top,source.shirt);
 assert.equal(d.actual3DGarment.originalPhotoSHA256s.bottom,source.jeans);
 if(mode==='after'){
  const overlay=await page.locator('#avatar').getAttribute('data-realism118');
  assert.ok(overlay,'P118 opt-in diagnostics missing');
  const p=JSON.parse(overlay);assert.equal(p.figure,figure);assert.equal(p.sourceGarmentGeometryChanged,false);
  assert.ok(p.bodyMaterials>=1&&p.hairMeshes>=8);assert.ok(p.headRegion.vertices>80);
 }
 return d;
}
function angleDelta(a,b){return Math.abs(((Number(a)-b+540)%360)-180);}
async function setView(page,deg){
 await page.evaluate(a=>window.cc69SetView(a),deg);
 await page.waitForFunction(t=>Math.abs(((Number(window.cc69Diagnostics()?.camera)-t+540)%360)-180)<.05,deg,{timeout:10000,polling:50});
 const d=await page.evaluate(()=>window.cc69Diagnostics());
 assert.ok(angleDelta(d.camera,deg)<.05,'camera did not reach '+deg);
 return d;
}
async function capture(page,figure,mode,width,deg,browserName,diagnostics){
 const png=await page.locator('#avatar').screenshot({animations:'disabled'});
 const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
 assert.equal(meta.format,'png');assert.ok(meta.width>=180&&meta.height>=280);
 assert.ok(stats.channels.some(c=>c.stdev>7),'blank WebGL frame');
 const file=`${browserName}-${figure}-${mode}-w${width}-a${deg}.png`;
 await writeFile(out+'/'+file,png);
 const row={file,sha256:hash(png),widthCSS:width,viewDegrees:deg,figure,mode,
  screenshotWidth:meta.width,screenshotHeight:meta.height,
  sourceHashes:diagnostics.actual3DGarment.originalPhotoSHA256s,rigBones:diagnostics.rig.bones};
 screens.push(row);return png;
}
async function runEngine(engine,name){
 let browser;
 try{browser=await engine.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});}
 catch(error){browserResults.push({browser:name,supported:false,reason:String(error.message).slice(0,220)});if(name==='chromium')throw error;return;}
 const probe=await browser.newPage();
 const webgl=await probe.evaluate(()=>{const c=document.createElement('canvas');const gl=c.getContext('webgl2')||c.getContext('webgl');return {available:!!gl,renderer:gl?gl.getParameter(gl.RENDERER):null};});
 await probe.close();
 if(!webgl.available){browserResults.push({browser:name,supported:false,reason:'WebGL context unavailable'});await browser.close();if(name==='chromium')throw Error('Chromium WebGL unavailable');return;}
 browserResults.push({browser:name,supported:true,webglRenderer:webgl.renderer});
 try{
  for(const figure of figures)for(const width of widths)for(const mode of ['before','after']){
   const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push({browser:name,message:String(e.message)}));
   page.on('crash',()=>crashes.push({browser:name,figure,width,mode}));
   page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'+origin))external.push(new URL(r.url()).origin);});
   const d=await ready(page,figure,mode);
   const sourceRig=JSON.stringify(d.actual3DGarment);
   for(const deg of views){
    const d2=await setView(page,deg);
    assert.equal(d2.rig.bones,163);
    assert.equal(JSON.stringify(d2.actual3DGarment),sourceRig,'P118 changed source-backed garment identity or selection');
    await capture(page,figure,mode,width,deg,name,d2);
   }
   await context.close();
  }
 }finally{await browser.close();}
}
await runEngine(chromium,'chromium');
await runEngine(webkit,'webkit');
// Pair actual WebGL before/after pixels at matching 390px camera views.
for(const figure of figures)for(const deg of views){
 const a=screens.find(x=>x.browser==='chromium'&&x.figure===figure&&x.mode==='before'&&x.widthCSS===390&&x.viewDegrees===deg);
 const b=screens.find(x=>x.browser==='chromium'&&x.figure===figure&&x.mode==='after'&&x.widthCSS===390&&x.viewDegrees===deg);
 const ai=await sharp(out+'/'+a.file).resize(220,300).raw().toBuffer();
 const bi=await sharp(out+'/'+b.file).resize(220,300).raw().toBuffer();
 let changed=0;for(let i=0;i<ai.length;i++)if(Math.abs(ai[i]-bi[i])>4)changed++;
 assert.ok(changed>500,'P118 did not create a measurable frame change');
 comparison.push({figure,viewDegrees:deg,before:a.file,after:b.file,changedChannelSamples:changed});
}
for(const figure of figures){
 const selected=[];
 for(const deg of views){
  for(const mode of ['before','after']){
   const row=screens.find(x=>x.browser==='chromium'&&x.figure===figure&&x.mode===mode&&x.widthCSS===390&&x.viewDegrees===deg);
   const tile=await sharp(out+'/'+row.file).resize(180,225).png().toBuffer();
   selected.push({input:tile,left:(mode==='before'?0:180),top:views.indexOf(deg)*225});
  }
 }
 await sharp({create:{width:360,height:views.length*225,channels:4,background:'#f4f3ef'}}).composite(selected).png().toFile(out+`/comparison-${figure}-before-after.png`);
}
assert.equal(errors.length,0,'browser JS errors: '+JSON.stringify(errors.slice(0,5)));
assert.equal(crashes.length,0,'browser crashes');
assert.equal(external.length,0,'unexpected external requests');
const result={schema:'dual-humanoid-photorealism-118-webgl/v1',baselineCommit:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
 figures:figures,viewDegrees:views,viewportWidthsCSS:widths,renderedScreenshots:screens.length,
 chromiumScreenshots:screens.filter(x=>x.browser==='chromium').length,
 sourcePhotoHashes:source,rigBones:163,baselineComparisonPairs:comparison.length,
 browserResults,screenshots:screens,comparison,errors,crashes,externalRequests:external,
 familyAlpha:'HOLD',releaseAuthorized:false};
await writeFile(out+'/acceptance.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({browserResults,renderedScreenshots:result.renderedScreenshots,
 chromiumScreenshots:result.chromiumScreenshots,baselineComparisonPairs:comparison.length,
 screenshotsSha256:hash(Buffer.from(JSON.stringify(screens)))}));
