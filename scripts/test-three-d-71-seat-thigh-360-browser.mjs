/** 3D71 real original CC0 male/female before/after mobile WebGL
 * screenshot evidence. Changes must be from actual 3D fabric vertex
 * positions, not fake JPEGs, GPU CSS filters, or generated images.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import sharp from 'sharp';
import {chromium} from 'playwright';
const base=resolve('.'),dir='benchmark/three-d-71',results=[];
const server=createServer(async(req,res)=>{
 try{
  const s=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(research\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(s)||
      s.includes('\\')||s.includes('\0')||s.split('/').includes('..'))
    throw Error('Research-only source paths');
  const file=resolve(base,'.'+s);if(!file.startsWith(base+'/'))throw Error('Unsafe file');
  const bytes=await readFile(file);
  const type={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.glb':'model/gltf-binary','.json':'application/json'};
  res.writeHead(200,{'content-type':type[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const host='http://127.0.0.1:'+server.address().port;
async function difference(a,b){
 const x=await sharp(a).ensureAlpha().raw().toBuffer(),y=await sharp(b).ensureAlpha().raw().toBuffer();
 assert.equal(x.length,y.length);let n=0;
 for(let i=0;i<x.length;i+=4)if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>28)n++;
 return {n,total:x.length/4};
}
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 await mkdir(dir,{recursive:true});
 for(const width of [320,390])for(const kind of ['female','male']){
  const records={},frames={},pageErrors={};
  for(const mode of ['before','after']){
   const ctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,hasTouch:true,isMobile:true});
   const page=await ctx.newPage(),errors=[],offsite=[];
   page.on('pageerror',e=>errors.push(String(e.message)));
   page.on('request',r=>{if(!r.url().startsWith(host)&&!r.url().startsWith('blob:'+host)&&!r.url().startsWith('data:'))offsite.push(r.url());});
   await page.goto(host+'/research/three-d-67/index.html?silhouette70=after&seat71='+mode);
   await page.waitForFunction(()=>window.cc67Diagnostics?.()?.loaded===true,null,{timeout:120000});
   if(kind==='male'){
    await page.locator('#model').selectOption('male');
    await page.waitForFunction(()=>window.cc67Diagnostics?.()?.loaded===true&&window.cc67Diagnostics().kind==='male',null,{timeout:120000});
   }
   const initial=await page.evaluate(()=>window.cc67Diagnostics());
   assert.equal(initial.stats.bones,163);
   assert.equal(initial.premium360Enabled,true);
   assert.equal(initial.releaseAuthorized,false);
   assert.equal(initial.outfit.mode,'pants');
   assert.equal(initial.outfit.pants.photoApplied,false,'Never synthesize a photographed neutral cloth photo');
   assert.equal(initial.premiumNeutralSilhouette70,true);
   assert.equal(initial.outfit.pants.naturalNeutralSilhouette70,true);
   if(mode==='after'){
    assert.equal(initial.premiumSeatThigh71,true);
    assert.equal(initial.outfit.pants.originalNeutralSeatThighFall71,true);
    assert.ok(initial.outfit.pants.seatThighMovedVertices>=100);
    assert.equal(initial.outfit.pants.seatThighOriginalRestAndSkinUnchanged,true);
    assert.equal(initial.outfit.pants.seatThighPhotoDenimUnchanged,true);
    records.after={moved:initial.outfit.pants.seatThighMovedVertices,
     maxMove:initial.outfit.pants.seatThighMaxMovement};
   }else{
    assert.equal(initial.premiumSeatThigh71,false);
    assert.equal(initial.outfit.pants.originalNeutralSeatThighFall71,undefined);
   }
   frames[mode]={};
   for(const angle of [0,45,90,135,180,225,270,315,360]){
    const v=await page.evaluate(a=>window.cc67View(a),angle);
    assert.ok(Math.abs(v.viewAngle-(angle===360?0:angle))<.01);
    assert.equal(v.mannequinBodyYaw,0);
    await page.waitForTimeout(75);
    const png=await page.locator('#avatar').screenshot();
    assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    frames[mode][angle]=png;
    await writeFile(dir+'/'+width+'-'+kind+'-'+mode+'-'+String(angle).padStart(3,'0')+'.png',png);
   }
   assert.deepEqual(offsite,[]);assert.deepEqual(errors,[]);
   const returnMatch=await difference(frames[mode][0],frames[mode][360]);
   assert.ok(returnMatch.n<Math.max(350,returnMatch.total*.025),'Actual 360 viewing loop must close: '+JSON.stringify(returnMatch));
   records[mode+'ReturnChanged']=returnMatch.n;
   await ctx.close();
  }
  const compare={};
  for(const angle of [0,45,90,135,180,225,270,315]){
   const d=await difference(frames.before[angle],frames.after[angle]);
   compare[angle]=d.n;
  }
  // No still fake render: original CC0 rig/pose/front AND independent
  // neutral cloth mesh can be compared at exactly equal camera angle.
  assert.ok(compare[0]>50||compare[90]>50||compare[180]>50,
   'Actual world-space 3D neutral hip-to-thigh fabric must visually change');
  const result={width,kind,angles:[0,45,90,135,180,225,270,315,360],neutralSeatThighPixelChanges:compare,
   originalCamera360True:true,originalBody163Bones:true,sourcePhotographsAdded:false,
   humanAestheticReviewed:false,releaseAuthorized:false,...records};
  results.push(result);
  console.log('THREE_D71_ACTUAL_NEUTRAL_3D_SILHOUETTE',JSON.stringify(result));
 }
 await writeFile(dir+'/browser-results.json',JSON.stringify({
  researchOnly:true,originalCC0MaleFemale:true,real163JointSkinnedHumanoids:true,
  photosNotGenerated:true,originalBodySourceUnchanged:true,trueCamera360:true,
  mobileWidths:[320,390],genuineWebGLImages:72,
  humanVisualAcceptance:false,phoneAndroidTested:false,phoneIphoneTested:false,
  familyAlpha:'HOLD',releaseAuthorized:false,results
 },null,2));
 assert.equal(results.length,4);
 console.log('THREE_D71_PREMIUM_HUMANOID_GENUINE_360_COMPARISONS_COMPLETE',JSON.stringify({cases:4,photos:72}));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
