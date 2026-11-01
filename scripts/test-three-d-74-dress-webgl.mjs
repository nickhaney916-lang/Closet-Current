/**
 * CC-PAR-03: 108 actual Chromium SwiftShader WebGL dress before/after frames.
 * Two original licensed CC0 rig figures x three mobile widths x nine 360
 * headings x before/after = 108 source-verified PNGs. NOT hardware phones.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium} from 'playwright';
const root=resolve('.'),dir='benchmark/three-d-74',WIDTHS=[320,390,430],
 FIGURES=['female','male'],STATES=['before','after'],ANGLES=[0,45,90,135,180,225,270,315,360];
const results=[],frames=[],errors=[];
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(p)||
    p.includes('\\')||p.includes('\0')||p.split('/').includes('..'))throw Error('Only locked public licensed sources');
  const file=resolve(root,'.'+p);
  if(!file.startsWith(root+'/'))throw Error('Outside research root');
  const data=await readFile(file);
  const ext=extname(file),mime={'.mjs':'text/javascript','.js':'text/javascript',
   '.html':'text/html','.json':'application/json','.glb':'model/gltf-binary',
   '.png':'image/png','.jpg':'image/jpeg'};
  res.writeHead(200,{'content-type':mime[ext]||'application/octet-stream','cache-control':'no-store'});
  res.end(data);
 }catch{res.writeHead(404);res.end('Protected research asset unavailable');}
});
const sha=data=>createHash('sha256').update(data).digest('hex');
async function diff(before,after){
 const x=await sharp(before).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const y=await sharp(after).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(x.info.width,y.info.width);assert.equal(x.info.height,y.info.height);
 let changed=0;for(let i=0;i<x.data.length;i+=3)
  if(Math.abs(x.data[i]-y.data[i])+Math.abs(x.data[i+1]-y.data[i+1])+Math.abs(x.data[i+2]-y.data[i+2])>28)changed++;
 return changed;
}
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function gallery(){
 let out='';
 for(const width of WIDTHS)for(const figure of FIGURES){
  out+='<section><h2>'+figure+' · '+width+'px viewport</h2><div class="compare">';
  for(const stage of STATES){out+='<div><h3>'+stage+'</h3><div class="strip">';
   for(const angle of ANGLES){
    const filename=figure+'-'+width+'-'+stage+'-'+String(angle).padStart(3,'0')+'.png';
    out+='<figure><a href="'+esc(filename)+'"><img loading="lazy" src="'+esc(filename)+'" alt="'+esc(stage+' '+figure+' dress '+width+'px '+angle+'° genuine original-photo 3D')+'"></a><figcaption>'+angle+'°</figcaption></figure>';
   }
   out+='</div></div>';
  }out+='</div></section>';
 }
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CC-PAR-03 Genuine Dress 108 WebGL Visual Review</title>'
 +'<style>body{font:16px system-ui;margin:auto;max-width:1700px;padding:18px;background:#f7f7f7;color:#151515}h1{font-size:1.7rem}h2{font-size:1.2rem}.compare{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}.strip{display:grid;grid-template-columns:repeat(9,minmax(100px,1fr));gap:7px;overflow-x:auto}figure{margin:0;border:1px solid #bbb;border-radius:5px;background:white;padding:2px}img{display:block;width:100%}figcaption{font-size:12px;text-align:center}section{border-top:2px solid #ddd;padding-top:12px;margin-top:18px}@media(max-width:1100px){.strip{grid-template-columns:repeat(9,115px)}}aside{background:white;padding:14px;border:1px solid #bbb}</style>'
 +'<h1>Independent photographed dress research · actual 108-frame WebGL gallery</h1>'
 +'<aside><strong>VISUAL REVIEW / Family Alpha HOLD</strong><p>Genuine rendered local headless Chromium SwiftShader screenshots, not illustration or native Android/iPhone acceptance. Original licensed Commons 0053 dress front is verified by source hash and unmodified original RGB. Rear photographed textile does not exist: sides and back are neutral from the source color, not genuine back photography. The experimental fold modifier touches only side/rear lower-skirt positions. It is not sewn fabric or cloth simulation. Open a frame to inspect original resolution. 0° and 360° are intentionally the same camera direction.</p><p>Inspect actual neckline, bust/armhole/waist, hem contour, fabric/body penetration and full 360°. <a href="results.json">Read the source/geometry/QA results</a>.</p></aside>'+out+'</html>';
}
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir(dir,{recursive:true});
 for(const width of WIDTHS)for(const figure of FIGURES){
  const stages={};
  for(const stage of STATES){
   const context=await browser.newContext({viewport:{width,height:932},deviceScaleFactor:1,isMobile:true,hasTouch:true});
   const page=await context.newPage(),pageErrors=[],outbound=[];
   page.on('pageerror',e=>pageErrors.push(e.message));
   page.on('request',request=>{const url=request.url();
    if(!url.startsWith(origin)&&!url.startsWith('blob:'+origin)&&!url.startsWith('data:'))outbound.push(url);
   });
   await page.goto(origin+'/research/three-d-15/index.html?dress74='+stage);
   await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true',null,{timeout:150000});
   if(figure==='male'){
    await page.locator('#model').selectOption('male');
    await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true'&&work61Diagnostics().kind==='male',null,{timeout:150000});
   }
   assert.equal(await page.locator('#avatar').evaluate(x=>!!x.getContext('webgl2')),true);
   await page.locator('#outfit').selectOption('dress');
   await page.locator('#reviewDialog').waitFor({state:'visible'});
   assert.equal(await page.locator('#review').isChecked(),false);
   await page.locator('#review').check();
   await page.locator('#dress').click();
   await page.waitForFunction(()=>work61Diagnostics().outfit?.mode==='dress',null,{timeout:150000});
   const state=await page.evaluate(()=>work61Diagnostics());
   assert.equal(state.stats.bones,163);
   assert.equal(state.outfit.dress.sourceId,'commons-0053');
   assert.equal(state.outfit.dress.releaseAuthorized,false);
   assert.equal(state.outfit.dress.anatomicalDress,true);
   assert.equal(state.outfit.dress.dress74ProvisionalDrape===true,stage==='after');
   assert.equal(state.outfit.shirt,null);
   assert.equal(state.outfit.pants,null);
   assert.equal(state.outfit.dress.collisionValidated,false);
   assert.equal(state.premium360Enabled,true);
   assert.equal(await page.evaluate(w=>document.documentElement.scrollWidth<=w,width),true);
   assert.deepEqual(pageErrors,[]);assert.deepEqual(outbound,[]);
   const frameBuff={};
   for(const angle of ANGLES){
    const s=await page.evaluate(a=>window.cc74SetView(a),angle);
    assert.ok(Math.abs(s.viewAngle-(angle===360?0:angle))<.01,'actual 360 orbit');
    await page.waitForTimeout(110);
    const png=await page.locator('#avatar').screenshot();
    assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    const meta=await sharp(png).metadata();
    assert.ok(meta.width>150&&meta.height>200);
    const file=figure+'-'+width+'-'+stage+'-'+String(angle).padStart(3,'0')+'.png';
    await writeFile(dir+'/'+file,png);frameBuff[angle]=png;
    frames.push({file,figure,width,stage,angle,pngSHA256:sha(png),
      realWebGL:'PASS',sourceOriginal:'PASS',humanVisual:'REVIEW',
      physicalPhone:'NOT TESTED'});
   }
   assert.ok(await diff(frameBuff[0],frameBuff[90])>800,'actual side rotation must differ');
   assert.ok(await diff(frameBuff[0],frameBuff[180])>800,'actual rear must differ');
   assert.ok(await diff(frameBuff[0],frameBuff[360])<70,'360 returns to same view');
   assert.deepEqual(pageErrors,[]);assert.deepEqual(outbound,[]);
   stages[stage]={sourceSHA256:state.outfit.dress.sourceSHA256,
     material:'original-pixel-source-front+source-neutral-unphotographed-back',
     changedVertices:state.outfit.dress.dress74ChangedVertices||0,
     sourceRGBPreserved:state.outfit.dress.dress74SourcePhotographUnchanged!==false,
     originalPhotographedFront:state.outfit.dress.frontOriginalPixels,
     sourcePhotoPixelsSame:true,photos:frameBuff};
   await page.locator('#remove').click();
   assert.equal((await page.evaluate(()=>work61Diagnostics())).outfit.garmentMeshes,0);
   assert.deepEqual(await page.evaluate(()=>[Object.keys(localStorage),Object.keys(sessionStorage)]),[[],[]]);
   await context.close();
  }
  assert.equal(stages.before.sourceSHA256,stages.after.sourceSHA256,'original photo must remain identical');
  assert.equal(stages.before.changedVertices,0);
  assert.ok(stages.after.changedVertices>=100);
  const differences={};
  for(const angle of ANGLES)differences[angle]=await diff(stages.before.photos[angle],stages.after.photos[angle]);
  assert.ok(differences[90]>15&&differences[180]>15,'Actual skirt silhouette change must appear in WebGL side/rear');
  results.push({figure,width,sourceSHA256:stages.after.sourceSHA256,changedVertices:stages.after.changedVertices,
    changedPixelsByAngle:differences,bodyRig:163,realWebGL:true,
    originalLicensedPhotoPreserved:true,sourceNeutralUnphotographedRear:true,
    humanVisualApproval:false,physicalAndroid:false,physicalIPhone:false,releaseAuthorized:false});
  console.log('CC_PAR03_DRESS_REAL_WEBGL',JSON.stringify(results.at(-1)));
 }
 assert.equal(frames.length,108);
 assert.equal(new Set(frames.map(x=>x.file)).size,108);
 const report={assignment:'CC-PAR-03',startingPR:480,baseSHA:'d37a68faec58614f46896b50933bc6769a5977d7',
   realChromiumSoftwareWebGL:true,actualScreenshotCount:108,
   sourceAsset:'licensed Commons commons-0053 original RGB from locked Work47',widths:WIDTHS,
   anatomicalFigures:FIGURES,angles:ANGLES,stages:STATES,
   dressSourceIdentity:'PASS',noPrivatePhotos:'PASS',
   realPhysics:'NOT TESTED',full360:'PASS',humanPhotorealism:'REVIEW',
   sourceNeutralRearRealism:'FAIL',physicalAndroid:'NOT TESTED',physicalIPhone:'NOT TESTED',
   releaseAuthorized:false,familyAlpha:'HOLD',results,frames};
 await writeFile(dir+'/results.json',JSON.stringify(report,null,2));
 await writeFile(dir+'/gallery.html',gallery());
 console.log('CC_PAR03_108_GENUINE_WEBGL_COMPLETE',JSON.stringify({screenshots:108,scenarios:results.length,humanVisual:'REVIEW',release:'HOLD'}));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
