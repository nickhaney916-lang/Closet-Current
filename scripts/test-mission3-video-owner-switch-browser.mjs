// Mission 3 — signed owner changes during actual browser decoded video import; no stale UI or cross-owner photo.
// Real Chromium/WebKit browser, normal application code; neither physical camera
// nor hosted Supabase nor actual garment accuracy is claimed.
// Generated from a synthetic colored rectangle (no person/user footage).
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';

const media={webm:'GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAQ6EU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHWTbuMU6uEElTDZ1OsggEjTbuMU6uEHFO7a1OsggQk7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsCrXsYMPQkBNgIxMYXZmNjEuNy4xMDNXQYxMYXZmNjEuNy4xMDNEiYhAj0AAAAAAABZUrmvIrgEAAAAAAAA/14EBc8WIChy1/wjliiecgQAitZyDdW5kiIEAhoVWX1ZQOIOBASPjg4QL68IA4JCwgYC6gaCagQJVsIRVuYEBElTDZ/tzc59jwIBnyJlFo4dFTkNPREVSRIeMTGF2ZjYxLjcuMTAzc3PWY8CLY8WIChy1/wjliidnyKFFo4dFTkNPREVSRIeUTGF2YzYxLjE5LjEwMSBsaWJ2cHhnyKFFo4hEVVJBVElPTkSHkzAwOjAwOjAxLjAwMDAwMDAwMAAfQ7Z1QnvngQCjQXyBAACAkBAAnQEqgACgAABHCIWFiJmEiAIC8NB4rEHhK9B8AawXRXyIH2A74D/M/bR5wHgAekx/Yj9oPcN/tn//dgC5QH+A6oL+OfkB/QOkB/mfqgQaYYqMn0fGkxVPMK5p+KuyqEzHofa4Vn+7fALl3GWp8SHsAQlj6+BIKeBatT4kPYAhLH16BfOhxLK4i3yYQP7/BGMhiyY3dymZ31mQn49/inNWvAz0ftA2AG2NI2cvtAi62/Nhv4mamcI9+1VjZamsORAAJTTkMiiPH8qzv0A+wwqmyuXXF+capdxXZSf7G/coQ233HYJQW5O36ESxzmT+0sACsi/m7c+QgXIIBgCYtcyYsACVjBgA55lLZRxJ1JADbAACoAmMAAcPh56PzH/FOZVeBpYIaHWy2GW6d12uDWjaJOrilEpNQKSYAAASgnAAAiNI4AZPyP0KecNJqHscFQlVcWAiscUZPY3ou//V2F/7AABgJLa+SsDMYgcK3/8F8cj/wAAAAKOtgQDIALEDAAEQLAAYABiN//QAAAbRZaIaPaY6Y6Y6Y6Y6Y6YA/v1aqFgwKJgAo66BAZAAsQMAARAcABgAGI3/9AAABtFloho9pjpjpjpjpjpjpgD+/qpQAS3Li1wAo9+BAlgAsQQAARAQABgJvek/giHZ/wwADLElpxYrFle3wDVHE/D/EvfwDQhKAP7/BGQUTiTH7AqtSYAluzL9CAFqAFRACWAzbOF8wB6t3TWTgIXwAFQBMYABDiAJUvQAAKO3gQMgANEDAAEQEAAYABkd//QAABri7WBduMjx1fJOnAR1ytJjFP7/BGQUTiTH7AqediHOsAlAABxTu2uRu4+zgQC3iveBAfGCAaPwgQM=',mp4:'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'};
const root=resolve('public'),out=resolve(process.argv[2]||'benchmark/mission3-native-video-owner-switch-browser');
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const full=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!full.startsWith(root+'/')||path.includes('\\'))throw Error('Invalid path');
  const bytes=await readFile(full);
  res.writeHead(200,{'content-type':types[extname(full)]||'application/octet-stream','cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const results=[],errors=[];
async function run(engine,type,width){
 const owner=(engine==='chromium'?'a':'b')+String(width).padStart(3,'0')+'0000-0000-4000-8000-000000000000';
 const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const remote=[];
 try{
  await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
   `window.closetAuth={user:{id:'${owner}'},ready:Promise.resolve(),getAccessToken:async()=>'${owner}',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;`}));
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.protocol==='blob:'||url.protocol==='data:'||url.hostname==='127.0.0.1')return route.fallback();
   remote.push(url.pathname);
   // Even a mocked cloud response must be fully local and never reach host.
   if(url.pathname==='/rest/v1/closet_backups')return route.fulfill({contentType:'application/json',body:'[]'});
   return route.abort();
  });
  await context.addInitScript(()=>{
   class ReviewOnlyWorker{
    constructor(){this.terminated=false;this.onmessage=null;}
    postMessage(data){setTimeout(()=>{
     if(this.terminated)return;
     this.onmessage?.({data:{id:data.id,type:data.type==='load'?'ready':'result',strong:false,categoryConfirmed:false,choices:[],details:{}}});
    },0);}
    terminate(){this.terminated=true;}
   }
   Object.defineProperty(window,'Worker',{configurable:true,value:ReviewOnlyWorker});
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push({engine,width,error:String(error)}));
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>closetReady);
  const other='c'+String(width).padStart(3,'0')+'0000-0000-4000-8000-000000000000';
  const receipt=await page.evaluate(async({media,owner,other})=>{
   const video=document.getElementById('video');
   const format=video.canPlayType('video/webm; codecs="vp8"')?'webm':
    video.canPlayType('video/mp4; codecs="avc1.42E01E"')?'mp4':null;
   if(!format)throw Error('No synthetic video codec');
   const bytes=Uint8Array.from(atob(media[format]),c=>c.charCodeAt(0));
   const file=new File([bytes],'synthetic-owner-switch.'+format,{type:format==='webm'?'video/webm':'video/mp4'});
   // A one-second synthetic clip yields multiple actual native video seeks.
   // Trigger session revocation after the second candidate completion,
   // leaving one correctly committed original only in old owner's database.
   document.getElementById('interval').value='0.3';
   const originalCandidate=candidate,originalMessage=message,originalSwitch=switchView;
   const records={messages:[],views:[],postMessageStart:null,postViewStart:null,
    switched:false,candidateCalls:0};
   message=text=>{records.messages.push(String(text));originalMessage(text);};
   switchView=name=>{records.views.push(name);originalSwitch(name);};
   candidate=async (...args)=>{
    const result=await originalCandidate(...args);
    records.candidateCalls++;
    if(records.candidateCalls===2){
     window.dispatchEvent(new Event('closet:session-locked'));
     window.closetAuth.user={id:other};
     db=await openDB();
     records.switched=true;
     records.postMessageStart=records.messages.length;
     records.postViewStart=records.views.length;
    }
    return result;
   };
   try{await upload(file);}finally{
    candidate=originalCandidate;message=originalMessage;switchView=originalSwitch;
   }
   const readOwner=async id=>{
    const database=await new Promise((resolve,reject)=>{
     const request=indexedDB.open('closet-current-user-'+id);
     request.onsuccess=()=>resolve(request.result);
     request.onerror=()=>reject(request.error);
    });
    try{
     return await new Promise((resolve,reject)=>{
      const request=database.transaction('state','readonly').objectStore('state').get('draft');
      request.onsuccess=()=>resolve((request.result?.batch||[]).map(item=>({
       id:item.id,ownerId:item.ownerId,sha:item.sourceSHA256
      })));
      request.onerror=()=>reject(request.error);
     });
    }finally{database.close();}
   };
   return {format,mediaBytes:file.size,switched:records.switched,
    candidateCalls:records.candidateCalls,
    postRevocationMessages:records.messages.slice(records.postMessageStart??0),
    postRevocationViews:records.views.slice(records.postViewStart??0),
    nextOwner:window.closetAuth?.user?.id,
    liveDb:db?.name,liveBatch:batch.length,
    previousOwnerDraft:await readOwner(owner),nextOwnerDraft:await readOwner(other)};
  },{media,owner,other});
  assert.equal(receipt.switched,true,'native decoded video must reach owner switch');
  assert.equal(receipt.candidateCalls,2);
  assert.equal(receipt.nextOwner,other);
  assert.equal(receipt.liveDb,'closet-current-user-'+other);
  assert.equal(receipt.liveBatch,0);
  assert.equal(receipt.previousOwnerDraft.length,1,'committed original must stay in prior owner private database');
  assert.equal(receipt.previousOwnerDraft[0].ownerId,owner);
  assert.match(receipt.previousOwnerDraft[0].sha,/^[a-f0-9]{64}$/);
  assert.equal(receipt.nextOwnerDraft.length,0,'no old owner photo may appear in the new owner database');
  assert.equal(receipt.postRevocationViews.includes('review'),false,
   'old in-flight video must never navigate the newly signed in owner to Review');
  assert.equal(receipt.postRevocationMessages.some(m=>/video frame\(s\) saved|Video import was interrupted/i.test(m)),false,
   "old in-flight video must never show former owner's saved-frame count/error in new session");
  assert.ok(!remote.some(p=>/storage\/v1\/object/.test(p)),'no hosted storage request');
  const png=await page.screenshot({path:resolve(out,engine+'-'+width+'-owner-switch.png')});
  assert.equal((await sharp(png).metadata()).width,width);
  return {engine,width,codec:receipt.format,candidateCalls:receipt.candidateCalls,
   previousOwnerOriginalSHA:receipt.previousOwnerDraft[0].sha,
   previousOwnerCommittedOnlyInPreviousDB:true,nextOwnerDraftEmpty:true,
   noStaleOwnerNavigation:true,noStaleOwnerStatus:true,
   syntheticMedia:true,hostedSupabase:false,realDevice:false,
   screenshotSha256:createHash('sha256').update(png).digest('hex')};
 }finally{await context.close();await browser.close();}
}
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]])
  for(const width of [320,390,430])results.push(await run(engine,type,width));
 assert.deepEqual(errors,[]);
 await writeFile(resolve(out,'results.json'),JSON.stringify({mission:3,scenario:'actual browser decoded video owner switch after committed frame; old upload never navigates or leaks stale status into next owner',cases:results,errors,
  claims:{browserEngines:['chromium','webkit'],syntheticMediaOnly:true,physicalAndroid:false,physicalIPhone:false,
   hostedSupabase:false,familyAlphaHold:255}},null,2)+'\n');
 console.log(JSON.stringify({cases:results.length,errors:errors.length,path:resolve(out,'results.json')}));
}finally{await new Promise(done=>server.close(done));}
