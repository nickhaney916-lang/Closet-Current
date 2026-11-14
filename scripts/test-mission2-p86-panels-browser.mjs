import {createServer} from 'node:http';import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';import {createHash} from 'node:crypto';import {chromium,webkit} from 'playwright';
const root=resolve('.'),out='benchmark/mission2-p86',engine=process.env.P86_ENGINE||'chromium';
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname),target=resolve(root,'.'+path);
 if(!target.startsWith(root+'/'))throw Error();const b=await readFile(target);res.setHeader('content-type',({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.png':'image/png','.json':'application/json'})[extname(target)]||'application/octet-stream');res.end(b);
}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;const result={engine,scope:'front-panel-not-fitted-garment',screens:[],errors:[],physicalDevice:false,releaseAuthorized:false,familyAlpha:'HOLD'};
try{browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})});
 const page=await browser.newPage({viewport:{width:1120,height:650},deviceScaleFactor:1});page.on('pageerror',e=>result.errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/research/mission2-p86/panel-review.html');await page.waitForFunction(()=>window.review?.ready,{timeout:30000});
 result.render=await page.evaluate(()=>window.review);
 for(const [name,angle] of [['front',0],['oblique',Math.PI/4],['side',Math.PI/2],['rear-unobserved',Math.PI]]){
 await page.evaluate(a=>window.dispatchEvent(new CustomEvent('review-angle',{detail:a})),angle);
 const path=out+'/'+engine+'-'+name+'.png';const bytes=await page.screenshot({path});result.screens.push({path,sha256:createHash('sha256').update(bytes).digest('hex')});}
 if(result.errors.length)throw Error('browser errors');result.status='PASS_FRONT_PANEL_RENDER_ONLY';
}catch(e){result.status='BLOCKED';result.failure=e.message;process.exitCode=1;}
finally{await browser?.close();await new Promise(r=>server.close(r));await writeFile(out+'/'+engine+'-render.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));}
