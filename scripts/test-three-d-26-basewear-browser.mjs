/**
 * 3D-26: compare actual original SHA-locked CC0 female/male WebGL render with
 * and without hide-green-at-real-dress-armholes treatment.
 * Original dress, original shirt, model, pose, and camera are identical.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/three\/)/.test(p)||
   p.includes('\0')||p.includes('\\'))throw Error('Outside local research');
  const name=resolve(root,'.'+p);
  if(!name.startsWith(root+'/'))throw Error('Path traversal');
  const bytes=await readFile(name);
  res.writeHead(200,{'content-type':{'.js':'text/javascript','.mjs':'text/javascript',
   '.html':'text/html','.png':'image/png','.jpg':'image/jpeg',
   '.glb':'model/gltf-binary','.json':'application/json'}[extname(name)]||
   'application/octet-stream','cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Unavailable verified local research source');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
const raw=async png=>sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});
function inspectChange(before,after){
 assert.deepEqual(before.info,after.info,'Screenshot source dimensions should match');
 let changed=0,oldGreen=0,newGreen=0;
 for(let i=0;i<before.data.length;i+=3){
  const x=[before.data[i],before.data[i+1],before.data[i+2]];
  const y=[after.data[i],after.data[i+1],after.data[i+2]];
  const shift=Math.max(...x.map((v,j)=>Math.abs(v-y[j])));
  if(shift<=7)continue;
  changed++;
  if(x[1]>x[0]+5&&x[1]>x[2]+2&&x[0]<180)oldGreen++;
  if(y[1]>y[0]+5&&y[1]>y[2]+2&&y[0]<180)newGreen++;
 }
 return {changed,oldGreen,newGreen};
}
async function review(page,mode){
 await page.locator('#outfit').selectOption(mode);
 await page.locator('#reviewDialog').waitFor({state:'visible'});
 assert.equal(await page.locator('#review').isChecked(),false);
 assert.equal(await page.locator('#dress').isDisabled(),true);
 await page.locator('#review').check();
 await page.locator('#dress').click();
 await page.waitForFunction(m=>window.work61Diagnostics()?.outfit?.mode===m,mode,{timeout:90000});
}
try{
 browser=await chromium.launch({headless:true,
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir('benchmark/three-d-26',{recursive:true});
 const evidence=[];
 for(const [width,kind] of [[320,'female'],[430,'female'],[430,'male']]){
  const comparisons=[];
  for(const variant of ['before','after']){
   const ctx=await browser.newContext({viewport:{width,height:932},deviceScaleFactor:2,
    hasTouch:true,isMobile:true});
   const page=await ctx.newPage(),errors=[],external=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{const u=r.url();
    if(!u.startsWith(origin)&&!u.startsWith('blob:'+origin)&&!u.startsWith('data:'))
     external.push(u.slice(0,150));
   });
   await page.goto(origin+'/research/three-d-15/index.html?dressBasewear='+variant);
   await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.ready==='true',
    null,{timeout:90000});
   if(kind==='male'){
    await page.locator('#model').selectOption('male');
    await page.waitForFunction(()=>document.querySelector('#avatar')?.dataset.model==='male'&&
     document.querySelector('#avatar')?.dataset.ready==='true',null,{timeout:90000});
   }
   assert.equal(await page.locator('#avatar').getAttribute('data-dress-skin-openings'),'false');
   await review(page,'dress');
   const state=await page.evaluate(()=>work61Diagnostics());
   assert.equal(state.outfit.dress.sourceId,'commons-0053');
   assert.equal(state.outfit.dress.anatomicalDress,true);
   assert.equal(state.dressSkinOpenings,variant==='after');
   assert.equal(state.outfit.dress.releaseAuthorized,false);
   assert.equal(state.outfit.dress.collisionValidated,false);
   assert.equal(await page.locator('#avatar').getAttribute('data-dress-skin-openings'),
    String(variant==='after'));
   const shots={};
   for(const pose of ['source','relaxed']){
    await page.locator('#pose').selectOption(pose);
    for(const angle of ['front','threequarter']){
     await page.locator('#'+angle).click();
     shots[pose+'-'+angle]=await page.locator('#avatar').screenshot({
      path:'benchmark/three-d-26/'+[kind,width,variant,pose,angle].join('-')+'-HOLD.png'
     });
    }
   }
   await review(page,'shirt-pants');
   assert.equal((await page.evaluate(()=>work61Diagnostics())).dressSkinOpenings,false,
    'Shirt and pants must not expose mannequin underlayer');
   await page.locator('#front').click();
   const shirt=await page.locator('#avatar').screenshot({
    path:'benchmark/three-d-26/'+[kind,width,variant,'shirt-control'].join('-')+'-HOLD.png'
   });
   await page.locator('#remove').click();
   const empty=await page.evaluate(()=>work61Diagnostics());
   assert.equal(empty.dressSkinOpenings,false);
   assert.equal(empty.outfit.mode,'none');
   assert.deepEqual(errors,[]);
   assert.deepEqual(external,[]);
   assert.deepEqual(await page.evaluate(()=>[Object.keys(localStorage),Object.keys(sessionStorage)]),[[],[]]);
   comparisons.push({variant,shots,shirt,sourceSHA256:state.outfit.dress.sourceSHA256,
    stats:{geometries:state.geometries,textures:state.textures},externalRequests:external.length});
   await ctx.close();
  }
  const old=comparisons[0],now=comparisons[1],changed={};
  assert.equal(old.sourceSHA256,now.sourceSHA256);
  assert.deepEqual(old.stats,now.stats,'Body-material uniform must not allocate new mesh/texture');
  for(const name of Object.keys(old.shots)){
   const diff=inspectChange(await raw(old.shots[name]),await raw(now.shots[name]));
   assert.ok(diff.changed>10,kind+'/'+width+'/'+name+' should visibly change mannequin armhole/neck skin');
   assert.ok(diff.oldGreen>diff.newGreen,JSON.stringify({kind,width,name,diff,
    issue:'Exposed green studio basewear should be reduced, not increased'}));
   changed[name]=diff;
  }
  const shirtDiff=inspectChange(await raw(old.shirt),await raw(now.shirt));
  assert.equal(shirtDiff.changed,0,'Existing photographed AJ shirt + pants must remain exactly pixel-identical');
  evidence.push({kind,width,dressSourceSHA256:now.sourceSHA256,changed,
   shirtControlChangedPixels:shirtDiff.changed,release:'HOLD',realPhone:false,
   collisionValidated:false,externalRequests:0});
  console.log('THREE_D_26_DRESS_UNDERLAYER_WEBGL_PASS',JSON.stringify(evidence.at(-1)));
 }
 await writeFile('benchmark/three-d-26/results.json',JSON.stringify({
  comparisons:evidence,sourceOriginalPhotoAndGLBUnchanged:true,
  ownerVisualApproval:false,releaseAuthorized:false
 },null,2));
}finally{await browser?.close();server.close();}
