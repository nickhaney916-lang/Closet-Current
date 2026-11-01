/**
 * CC-PAR-02 — independent 108-frame real WebGL QA for exact PR #480 fixtures.
 * READ-ONLY: runs the existing 3D-69 demo; does not change geometry, shader,
 * camera, source loader, production routes, auth, or customer wardrobes.
 * This is desktop/headless Chromium SwiftShader, NOT physical Android/iPhone.
 *
 * 2 anatomical figures × 3 viewport widths × 2 verified photographed jeans
 * × 9 real camera headings (0,45,90,135,180,225,270,315,360) = 108 PNGs.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import sharp from 'sharp';

const root=resolve('.'),output='benchmark/three-d-69/qa-108';
const ANGLES=[0,45,90,135,180,225,270,315,360];
const WIDTHS=[320,390,430];
const FIGURES=['female','male'];
const DENIMS=['public','second'];
const SHIRT='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const JEANS=Object.freeze({
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
});
const entries=[],scenarios=[],warnings=[];
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(path)||
     path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('Restricted research source');
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/'))throw Error('No private path');
  const bytes=await readFile(file);
  const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html',
   '.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary'};
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Unavailable research asset');}
});
function digest(buf){return createHash('sha256').update(buf).digest('hex');}
async function pixelDifference(a,b,region=null){
 const ma=sharp(a),mb=sharp(b),info=await ma.metadata(),other=await mb.metadata();
 assert.equal(info.width,other.width);assert.equal(info.height,other.height);
 let bound={left:0,top:0,width:info.width,height:info.height};
 if(region){
  const [x0,y0,x1,y1]=region;
  const left=Math.floor(info.width*x0),top=Math.floor(info.height*y0);
  bound={left,top,width:Math.max(1,Math.floor(info.width*x1)-left),
   height:Math.max(1,Math.floor(info.height*y1)-top)};
 }
 const ra=await (region?ma.extract(bound):ma).removeAlpha().raw().toBuffer();
 const rb=await (region?mb.extract(bound):mb).removeAlpha().raw().toBuffer();
 let changes=0,sum=0;
 for(let i=0;i<ra.length;i+=3){
  const diff=Math.abs(ra[i]-rb[i])+Math.abs(ra[i+1]-rb[i+1])+Math.abs(ra[i+2]-rb[i+2]);
  sum+=diff;if(diff>30)changes++;
 }
 return {changedPixels:changes,meanAbsoluteChannelDifference:+(sum/ra.length).toFixed(5)};
}
function htmlEscape(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
function gallery(){
 const groups=FIGURES.flatMap(figure=>WIDTHS.flatMap(width=>DENIMS.map(denim=>{
  const cards=ANGLES.map(angle=>{
   const id=figure+'-'+width+'-'+denim+'-'+String(angle).padStart(3,'0')+'.png';
   return '<figure><a href="'+htmlEscape(id)+'"><img loading="lazy" alt="'+htmlEscape(figure+' '+width+'px '+denim+' '+angle+' degrees actual WebGL frame')+'" src="'+htmlEscape(id)+'"></a><figcaption>'+angle+'°</figcaption></figure>';
  }).join('');
  return '<section><h2>'+htmlEscape(figure+' | '+width+'px viewport | '+(denim==='public'?'Original public-domain denim':'Second CC BY-SA denim'))+'</h2><div class="strip">'+cards+'</div></section>';
 })));
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
 +'<title>Closet Current CC-PAR-02 — actual WebGL 108-frame independent visual review</title>'
 +'<style>body{margin:auto;max-width:1600px;padding:20px;font:16px system-ui;background:#f6f6f6;color:#171717}h1{font-size:1.65rem}h2{font-size:1.1rem}.strip{display:grid;grid-template-columns:repeat(9,minmax(100px,1fr));gap:8px;overflow-x:auto}figure{margin:0;background:white;border:1px solid #ccc;border-radius:7px;padding:4px}img{display:block;width:100%;height:auto}figcaption{text-align:center;font-size:13px}section{padding-bottom:18px;border-bottom:2px solid #ddd}aside{background:white;border:1px solid #ddd;padding:14px}a{color:#175a83}@media(max-width:1150px){.strip{grid-template-columns:repeat(9,130px)}}</style>'
 +'<h1>CC-PAR-02 · Independent genuine 108-frame WebGL visual review</h1>'
 +'<aside><p><strong>REVIEW — not human accepted.</strong> Genuine headless Chromium SwiftShader WebGL screenshots from a localhost-only, publicly licensed 3D research fixture. NOT a physical Android/iPhone test and NOT private wardrobe photos. 0° and 360° intentionally repeat the same camera direction. The rear and side photographic fabric source is not verified.</p>'
 +'<p>Inspect shoulders/collars/sleeves, waist, hip, knees, cuffs, continuity of photographed fabric, and whether each original-denim swap retains the same shirt. All images open at the original capture resolution. See <a href="report.json">report.json</a> for checks, provenance and statuses. Family Alpha HOLD.</p></aside>'
 +groups.join('')+'</html>';
}
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir(output,{recursive:true});
 for(const width of WIDTHS)for(const figure of FIGURES){
  const context=await browser.newContext({viewport:{width,height:900},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(String(e.message)));
  page.on('request',req=>{
   const url=req.url();
   if(!url.startsWith(origin)&&!url.startsWith('blob:'+origin)&&!url.startsWith('data:'))external.push(url);
  });
  await page.goto(origin+'/research/three-d-69/index.html');
  await page.waitForFunction(()=>window.cc69Diagnostics?.()?.rig?.bones===163&&window.cc69Diagnostics?.()?.figure==='female',null,{timeout:180000});
  if(figure==='male'){
   await page.locator('#model').selectOption('male');
   await page.waitForFunction(()=>window.cc69Diagnostics?.()?.figure==='male',null,{timeout:120000});
  }
  await page.locator('#review').check();
  await page.locator('#wear').click();
  await page.waitForFunction(()=>window.cc69Diagnostics?.()?.actual3DGarment?.status==='actual-separate-skinned-garments-displayed',null,{timeout:180000});
  const initial=await page.evaluate(()=>window.cc69Diagnostics());
  assert.equal(initial.figure,figure);assert.equal(initial.rig.bones,163);
  assert.ok(initial.actual3DGarment.real3DSkinnedGarmentMeshes>=2);
  assert.equal(initial.actual3DGarment.originalPhotoSHA256s.top,SHIRT);
  assert.equal(initial.actual3DGarment.originalPhotoSHA256s.bottom,JEANS.public);
  assert.equal(initial.production,false);assert.equal(initial.phoneTested,false);
  const scene={width,figure,sourceSHAs:{shirt:SHIRT,public:JEANS.public,second:JEANS.second},
   originalSourceVetted:true,meshes:initial.actual3DGarment.real3DSkinnedGarmentMeshes,
   webGLHardware:'Chromium headless SwiftShader software renderer',phoneAcceptance:'NOT TESTED',
   humanRealism:'REVIEW',screenshots:18,angles:ANGLES};
  const captures={};
  for(const denim of DENIMS){
   if(denim==='second'){
    await page.evaluate(()=>window.cc69SetView(0));
    await page.locator('#swap').click();
    await page.waitForFunction(()=>window.cc69Diagnostics?.()?.currentSelection==='second',null,{timeout:180000});
   }
   const d=await page.evaluate(()=>window.cc69Diagnostics());
   assert.equal(d.actual3DGarment.originalPhotoSHA256s.top,SHIRT);
   assert.equal(d.actual3DGarment.originalPhotoSHA256s.bottom,JEANS[denim]);
   assert.ok(d.actual3DGarment.real3DSkinnedGarmentMeshes>=2);
   assert.deepEqual(d.actual3DGarment.selectedIds,['licensed-shirt',denim==='public'?'licensed-jeans-1':'licensed-jeans-2']);
   captures[denim]={};
   for(const angle of ANGLES){
    const angleState=await page.evaluate(a=>window.cc69SetView(a),angle);
    assert.ok(Math.abs(angleState.camera-(angle===360?0:angle))<.01,'Actual camera heading');
    await page.waitForTimeout(90);
    const image=await page.locator('#avatar').screenshot();
    assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    const meta=await sharp(image).metadata();
    assert.ok(meta.width>100&&meta.height>200);
    const file=figure+'-'+width+'-'+denim+'-'+String(angle).padStart(3,'0')+'.png';
    await writeFile(output+'/'+file,image);
    const row={figure,width,denim,angle,file,sha256:digest(image),
     screenshotWidth:meta.width,screenshotHeight:meta.height,
     garmentSourceIdentity:'PASS',webGLCapture:'PASS',humanVisualRealism:'REVIEW',
     physicalPhone:'NOT TESTED'};
    entries.push(row);
    captures[denim][angle]=image;
   }
   const [quarter,back,returnToFront]=await Promise.all([
    pixelDifference(captures[denim][0],captures[denim][90]),
    pixelDifference(captures[denim][0],captures[denim][180]),
    pixelDifference(captures[denim][0],captures[denim][360])
   ]);
   assert.ok(quarter.changedPixels>900&&back.changedPixels>900,'True 3D orbit changes visible surfaces');
   assert.ok(returnToFront.changedPixels<=50,'360 camera returns to original view');
   scene[denim+'Orbit']={quarterChangedPixels:quarter.changedPixels,backChangedPixels:back.changedPixels,
    returnToFrontChangedPixels:returnToFront.changedPixels};
  }
  // 3D69 is deterministic and does not change shirt when swapping jeans.
  // Measure the shirt-only screen region; a large change is a regression,
  // not a claim that garment colors are perceptually photorealistic.
  const shirt=await pixelDifference(captures.public[0],captures.second[0],[.20,.28,.80,.43]);
  const denim=await pixelDifference(captures.public[0],captures.second[0],[.20,.51,.80,.82]);
  assert.ok(denim.changedPixels>250,'Actual photographed front jeans must change after swap');
  assert.ok(shirt.changedPixels<100,'Selected shirt front must stay unchanged when jeans swap');
  scene.swap={shirtChangedPixels:shirt.changedPixels,denimChangedPixels:denim.changedPixels,
   shirtPreserved:true,originalDenimSourceChanged:true};
  assert.deepEqual(errors,[],'No browser page errors');
  assert.deepEqual(external,[],'No outbound data/image requests');
  scenarios.push(scene);
  console.log('CC_PAR_02_GENUINE_WEBGL_QA',JSON.stringify({width,figure,swap:scene.swap,images:18}));
  await context.close();
 }
 assert.equal(entries.length,108);
 assert.equal(new Set(entries.map(x=>x.file)).size,108);
 assert.equal(scenarios.length,6);
 const report={assignment:'CC-PAR-02',startingPR:480,startingSHA:'d37a68faec58614f46896b50933bc6769a5977d7',
  sourceType:'exact public licensed verified shirt and two genuine denim photographs; no private wardrobe data',
  actualWebGL:true,softwareRenderer:true,realScreenshots:108,figures:FIGURES,widths:WIDTHS,
  denimSources:DENIMS,cameraPositionsDegrees:ANGLES,sourcePhotoRGBCheck:'source loader validates visible original pixels',
  screenshotColorAccuracy:'REVIEW',photorealism:'REVIEW',physicalAndroid:'NOT TESTED',physicalIPhone:'NOT TESTED',
  originalFrontPhotoSHA:'PASS',originalBackPhotoSource:'NOT TESTED',twoDenimSourceSwap:'PASS',
  familyAlpha:'HOLD',releaseAuthorized:false,scenarios,entries,warnings};
 await writeFile(output+'/report.json',JSON.stringify(report,null,2));
 await writeFile(output+'/gallery.html',gallery());
 console.log('CC_PAR_02_ALL_108_GENUINE_WEBGL_SCREENSHOTS_CAPTURED',JSON.stringify({
  actualScreenshots:entries.length,scenarios:scenarios.length,allSourceBindsPassed:true,
  photoRealism:'REVIEW',phones:'NOT TESTED',familyAlpha:'HOLD'}));
}finally{
 await browser?.close();
 await new Promise(ok=>server.close(ok));
}
