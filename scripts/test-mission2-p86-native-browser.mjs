import {createServer} from 'node:http';import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';import sharp from 'sharp';import {chromium,webkit} from 'playwright';
const root=resolve('.'),donor=resolve('.native05-donor-541'),engine=process.env.P86_ENGINE||'chromium',out='benchmark/mission2-p86/native-'+engine;
await mkdir(out,{recursive:true});const types={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://local').pathname);if(p.includes('..'))throw Error();
 const isDonor=p.startsWith('/donor/')||p.startsWith('/benchmark/'),base=isDonor?donor:root,target=resolve(base,'.'+(p.startsWith('/donor/')?p.slice(6):p));
 if(!target.startsWith(base+'/'))throw Error();const b=await readFile(target);res.setHeader('content-type',types[extname(target)]||'application/octet-stream');res.end(b);
}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const result={engine,scope:'licensed-source-static-radial-AB-only',figures:[],screens:[],differences:[],errors:[],external:[],physicalDevice:false,releaseAuthorized:false,familyAlpha:'HOLD'};let browser;
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true,...(process.env.P86_BROWSER_EXECUTABLE?{executablePath:process.env.P86_BROWSER_EXECUTABLE}:{}),...(engine==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})});
 const page=await browser.newPage({viewport:{width:390,height:820},deviceScaleFactor:1});page.on('pageerror',e=>result.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&/WebGLProgram|VALIDATE_STATUS|shader error|ERROR: 0:/i.test(m.text()))result.errors.push(m.text().slice(0,500));});
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='127.0.0.1'||['data:','blob:'].includes(u.protocol))return r.continue();result.external.push(u.hostname);return r.abort();});
 const flags=['photoDress175','photoDressContact52','photoDressDistance53','photoDressTopology54','photoDressEdges55','photoDressBoundaries56','photoDressLandmarks57','photoDressContact58','photoDressBodyBands59','photoDressTorsoTrial60','photoDressStrain61'];
 await page.goto('http://127.0.0.1:'+server.address().port+'/research/mission2-p86/native-review.html?'+flags.map(x=>x+'=research').join('&'));
 await page.waitForFunction(()=>window.review86?.ready===true||window.review86?.errors?.length>0,null,{timeout:90000});
 for(const figure of ['female','male']){
  if(figure==='male')await page.evaluate(()=>window.review86.load('male'));
  const source=await page.evaluate(()=>({state:window.review86.state,receipt:window.review86.receipt,errors:window.review86.errors,audit:window.review86.audit}));
  assert.deepEqual(source.errors,[],'source setup: '+JSON.stringify(source.errors));assert.equal(source.state.stats.bones,163);assert.equal(source.receipt.sampledPoseNumericalClearance,true);assert.equal(source.receipt.sourceBufferByteSnapshotsChecked,true);assert.deepEqual(source.errors,[]);result.figures.push({figure,...source});
  for(const [view,angle] of [['front',0],['side',90],['rear',180]]){
   const buffers=[];
   for(const mode of ['original','candidate','original']){
    await page.evaluate(({mode,angle})=>window.review86.show(mode,angle),{mode,angle});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const path=out+'/'+figure+'-'+view+'-'+mode+(buffers.length===2?'-restored':'')+'.png';const b=await page.locator('canvas').screenshot({path});
    buffers.push(b);result.screens.push({path,sha256:createHash('sha256').update(b).digest('hex')});
   }
   const raw=await Promise.all(buffers.map(b=>sharp(b).ensureAlpha().raw().toBuffer()));assert.equal(raw[0].length,raw[1].length);
   let changed=0,restored=0;for(let i=0;i<raw[0].length;i+=4){if([0,1,2].some(k=>Math.abs(raw[0][i+k]-raw[1][i+k])>8))changed++;if([0,1,2].some(k=>Math.abs(raw[0][i+k]-raw[2][i+k])>8))restored++;}
   assert.ok(changed>0,'candidate must be visibly rendered');assert.equal(restored,0,'original must restore exact visible RGB');result.differences.push({figure,view,changedRGBPixelsAbove8:changed,restoredRGBPixelsAbove8:restored});
  }
 }
 assert.deepEqual(result.errors,[]);assert.deepEqual(result.external,[]);await page.evaluate(()=>window.review86.dispose());result.status='PASS_STATIC_SOURCE_AB_ONLY';
}catch(e){result.status='BLOCKED';result.failure=e.message;process.exitCode=1;}
finally{await browser?.close();await new Promise(r=>server.close(r));await writeFile(out+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,figures:result.figures.length,screens:result.screens.length,failure:result.failure}));}
