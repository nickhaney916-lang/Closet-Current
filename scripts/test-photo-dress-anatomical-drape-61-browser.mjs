/** P61 isolated Chromium/WebGL audit of the real P541 photographed dress. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),out='benchmark/photo-dress-drape-61';
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1'),path=decodeURIComponent(url.pathname);
 if(!/^\/(?:research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(path)||path.includes('\\')||path.includes('\0'))throw Error('Blocked source');
 const file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))throw Error('Path escape');
 const bytes=await readFile(file),ext=extname(file);res.writeHead(200,{'content-type':({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary'})[ext]||'application/octet-stream','cache-control':'no-store'});res.end(bytes);
}catch{res.writeHead(404);res.end('Blocked or missing local P61 research asset');}});
await mkdir(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port,manifest=JSON.parse(await readFile('benchmark/work47/manifest.json','utf8'));
const expected=manifest.rows.find(x=>x.id==='commons-0053');assert.equal(expected.sourceSHA256,'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019');
let browser;const renders=[],states=[],imageSHA256={};
const views=['front','threequarter','side-right','side-left','back'];
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 for(const version of ['before','after'])for(const model of ['female','male'])for(const width of [320,390,430]){
  const height=width===320?568:width===390?844:932,context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2}),page=await context.newPage(),errors=[],outside=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{const u=r.url();if(u.startsWith('blob:'+origin)||u.startsWith('data:'))return;if(!u.startsWith(origin)||!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(new URL(u).pathname))outside.push(u);});
  await page.goto(origin+'/research/three-d-15/index.html?version=after'+(version==='after'?'&dressDrape61=true':''));
  await page.waitForFunction(()=>document.querySelector('#avatar').dataset.ready==='true',null,{timeout:40000});
  if(model==='male'){await page.locator('#model').selectOption('male');await page.waitForFunction(()=>document.querySelector('#avatar').dataset.model==='male'&&document.querySelector('#avatar').dataset.ready==='true');}
  assert.ok(await page.locator('#avatar').evaluate(c=>!!c.getContext('webgl2')));
  assert.ok(await page.evaluate(expected=>document.documentElement.scrollWidth<=expected,width),'No mobile horizontal overflow');
  const bounds=await page.evaluate(()=>['model','pose','outfit','remove','front','side','back','zoomIn','zoomOut'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.left>=0&&r.right<=visualViewport.width+.1&&r.top>=0&&r.bottom<=innerHeight;}));assert.ok(bounds,'Primary controls fit in mobile viewport');
  await page.locator('#outfit').selectOption('dress');await page.locator('#reviewDialog').waitFor({state:'visible'});assert.equal(await page.locator('#review').isChecked(),false);await page.locator('#review').check();await page.locator('#dress').click();
  await page.waitForFunction(()=>work61Diagnostics()?.outfit?.mode==='dress');
  const attached=await page.evaluate(()=>work61Diagnostics()),d=attached.outfit.dress;
  assert.equal(d.sourceSHA256,expected.sourceSHA256);assert.equal(d.photoAnatomicalFit60,true);assert.equal(d.photoAnatomicalFitReceipt60.common163BoneSkeletonChecked,true);assert.equal(d.photoAnatomicalFitReceipt60.originalSourceIdentityChecked,true);assert.equal(d.photoAnatomicalFitReceipt60.arbitraryOwnerPhoto3DApproved,false);
  if(version==='after'){
   assert.equal(d.photographedDressDrape61,true);assert.ok(d.torsoVertices61>=100);assert.ok(d.skirtVertices61>=100);
   assert.ok(d.maxTorsoMovementMeters61>.001&&d.maxTorsoMovementMeters61<=.013);assert.ok(d.maxSkirtMovementMeters61>.001&&d.maxSkirtMovementMeters61<.020);
   assert.equal(d.originalRestPhotoCoordinatesUnchanged61,true);assert.equal(d.skinIndicesAndWeightsPreserved61,true);assert.equal(d.sourceTextureAndMaterialPreserved61,true);
  }else assert.equal(d.photographedDressDrape61,undefined);
  assert.equal(attached.outfit.shirt,null);assert.equal(attached.outfit.pants,null);assert.equal(attached.stats.bones,163);
  const capture=async(pose,view)=>{
   await page.locator('#pose').selectOption(pose);
   if(view==='side-left')await page.evaluate(()=>work61ViewAt(-90));else if(view==='side-right')await page.evaluate(()=>work61ViewAt(90));else if(view==='threequarter')await page.evaluate(()=>work61ViewAt(30));else await page.locator('#'+view).click();
   await page.waitForTimeout(80);
   const canvas=page.locator('#avatar'),path=`${out}/${version}-${model}-${width}-${pose}-${view}-HOLD.png`;
   await canvas.screenshot({path});const bytes=await readFile(path);imageSHA256[path]=await import('node:crypto').then(({createHash})=>createHash('sha256').update(bytes).digest('hex'));
   renders.push({version,model,width,pose,view,path,bytes:bytes.length});
  };
  for(const pose of ['source','relaxed'])for(const view of views)await capture(pose,view);
  if(model==='male'&&width===390)await page.screenshot({path:`${out}/${version}-mobile-${model}-${width}-HOLD.png`,fullPage:true});
  const state=await page.evaluate(()=>work61Diagnostics());states.push({version,model,width,bones:state.stats.bones,renderMs:state.lastRenderMs,pixelRatio:state.pixelRatio,drawPixels:state.drawPixels,geometries:state.geometries,textures:state.textures,garmentMeshes:state.outfit.garmentMeshes,torsoVertices61:d.torsoVertices61||0,skirtVertices61:d.skirtVertices61||0,maxTorsoMovementMeters61:d.maxTorsoMovementMeters61||0,maxSkirtMovementMeters61:d.maxSkirtMovementMeters61||0});
  assert.ok(state.drawPixels<1200000&&state.pixelRatio<=1.5);assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);assert.deepEqual(await page.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage)})),{local:[],session:[]});
  // Reopen the same exact dress twice; geometry and textures must remain stable.
  await page.locator('#remove').click();const clear=await page.evaluate(()=>work61Diagnostics());assert.equal(clear.outfit.mode,'none');
  let cycle;for(let i=0;i<2;i++){await page.locator('#outfit').selectOption('dress');await page.locator('#reviewDialog').waitFor({state:'visible'});await page.locator('#review').check();await page.locator('#dress').click();await page.waitForFunction(()=>work61Diagnostics()?.outfit?.mode==='dress');const s=await page.evaluate(()=>work61Diagnostics()),r={geometries:s.geometries,textures:s.textures,meshes:s.outfit.garmentMeshes};if(cycle)assert.deepEqual(r,cycle,'Repeated dress open/close does not grow renderer resources');else cycle=r;await page.locator('#remove').click();}
  await context.close();
 }
 // Pixel-level comparison under matched model, CSS width, pose and camera.
 const comparisons=[];for(const model of ['female','male'])for(const width of [320,390,430])for(const pose of ['source','relaxed'])for(const view of views){
  const a=await sharp(`${out}/before-${model}-${width}-${pose}-${view}-HOLD.png`).removeAlpha().raw().toBuffer(),b=await sharp(`${out}/after-${model}-${width}-${pose}-${view}-HOLD.png`).removeAlpha().raw().toBuffer();assert.equal(a.length,b.length);let changed=0;for(let i=0;i<a.length;i+=3)if(Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))>6)changed++;const fraction=changed/(a.length/3);comparisons.push({model,width,pose,view,changedPixelFraction:fraction});}
 for(const model of ['female','male'])assert.ok(comparisons.some(x=>x.model===model&&x.changedPixelFraction>.00002),'P61 must visibly change genuine rendered dress pixels');
 const after=states.filter(x=>x.version==='after'),before=states.filter(x=>x.version==='before');for(let i=0;i<after.length;i++){assert.equal(after[i].geometries,before[i].geometries,'No added GPU geometry objects');assert.equal(after[i].textures,before[i].textures,'No added GPU textures');assert.equal(after[i].garmentMeshes,before[i].garmentMeshes);}
 const result={priority:61,sourceId:'commons-0053',sourceSHA256:expected.sourceSHA256,donorCommit:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',engine:'Chromium WebGL2 / SwiftShader',viewportWidths:[320,390,430],poses:['source','relaxed'],views,renderCount:renders.length,comparisons,states,renders,imageSHA256,externalRequests:0,ownerPhotos3DApproved:false,physicalPhone:false,webKit:false,collisionSimulation:false,releaseAuthorized:false,familyAlpha:'HOLD'};
 await writeFile(`${out}/results.json`,JSON.stringify(result,null,2));console.log('P61_WEBGL_AUDIT_PASS',JSON.stringify({renderCount:renders.length,comparisonCount:comparisons.length,sourceSHA256:expected.sourceSHA256,sourcePoseVertices:states.filter(x=>x.version==='after').map(x=>({torso:x.torsoVertices61,skirt:x.skirtVertices61,maxTorso:x.maxTorsoMovementMeters61,maxSkirt:x.maxSkirtMovementMeters61})),performance:states.map(x=>({model:x.model,width:x.width,renderMs:x.renderMs,pixelRatio:x.pixelRatio,geometries:x.geometries,textures:x.textures})),release:'HOLD'}));
}finally{await browser?.close();server.close();}
