import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),out=resolve('benchmark/scene-class-guard-32');
await mkdir(out,{recursive:true});
const drawing=Buffer.from('<svg width="840" height="650" xmlns="http://www.w3.org/2000/svg"><rect width="840" height="650" fill="#dedede"/><path d="M120 60 L225 20 L430 20 L550 60 L480 210 L440 170 L450 400 L190 400 L190 170 L150 210Z" fill="#ae3040"/><path d="M240 420 L450 420 L480 620 L400 620 L340 480 L280 620 L190 620Z" fill="#355e9d"/></svg>');
const photo=await sharp(drawing).jpeg({quality:89}).toBuffer();
const source='data:image/jpeg;base64,'+photo.toString('base64');
const sourceSHA=createHash('sha256').update(photo).digest('hex');
const html='<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<style>body{font:15px system-ui;background:#f9f9f9;color:#222;margin:12px}main{max-width:800px;margin:auto}button{border:1px solid #aaa;border-radius:7px;padding:9px}</style>'+
 '</head><body><main><h2>Closet Current - Local garment review</h2>'+
 '<p>Research-only. Original retained; every region requires confirmation.</p>'+
 '<section id="wholeOutfitCapture"></section><input id="outfitCamera" type="file" hidden>'+
 '<input id="outfitUpload" type="file" hidden></main></body></html>';
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(req.method!=='GET')throw Error('request blocked');
  if(path==='/'){res.writeHead(200,{'content-type':'text/html'}).end(html);return;}
  if(!/^\/research\/multi-garment-capture-01\/(review-ui|atomic-group|review-triage-28|flatlay-contrast-29|scene-class-guard-32)\.mjs$/.test(path)&&
     path!=='/research/capture-proof-01/source-proof.mjs')throw Error('request blocked');
  res.writeHead(200,{'content-type':'text/javascript'}).end(await readFile(root+path));
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const cases=[],blocked=[],errors=[];
const digest=b=>createHash('sha256').update(b).digest('hex');
try{
 for(const [engine,launcher] of Object.entries({chromium,webkit})){
  const browser=await launcher.launch();
  try{
   for(const width of [320,390,430]){
    const ctx=await browser.newContext({viewport:{width,height:950},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    await ctx.route('**/*',route=>{
     const req=route.request();
     if(!req.url().startsWith(origin+'/')||!['GET','HEAD'].includes(req.method())){
      blocked.push({engine,width,method:req.method()});return route.abort();
     }
     return route.continue();
    });
    const page=await ctx.newPage();
    page.on('pageerror',e=>errors.push({engine,width,message:e.message.slice(0,150)}));
    await page.goto(origin,{waitUntil:'load'});
    const started=await page.evaluate(async({source,sourceSHA})=>{
     const audit={owner:'owner28',saved:0,queued:0};
     window.__audit28=audit;
     window.__reviewOriginal29=source;
     const piece=(key,conf,b,personDetected=false)=>({instanceKey:key,cropBounds:b,image:source,
      personDetected,colorEstimate:{color:'Blue'},
      hint:{categories:['Tops'],types:[],confidence:conf,clipped:false}});
     class FakeWorker {
      constructor(){this.closed=false;this.onmessage=null;}
      postMessage(req){
       const rows=[
        piece('seg-4-10-10-80-80-1',.985,{x:.1,y:.08,width:.5,height:.48}),
        piece('seg-4-10-10-80-80-2',.849,{x:.67,y:.45,width:.2,height:.27}),
        piece('seg-4-10-10-80-80-3',.972,{x:.72,y:.75,width:.15,height:.23},true)
       ];
       queueMicrotask(()=>{
        if(this.closed)return;
        for(const item of rows)this.onmessage?.({data:{id:req.id,type:'piece',piece:item}});
        this.onmessage?.({data:{id:req.id,type:'done',count:rows.length}});
       });
      }
      terminate(){this.closed=true;}
     }
     window.Worker=FakeWorker;
     const {mountMultiGarmentCapture24}=await import('/research/multi-garment-capture-01/review-ui.mjs');
     const module=mountMultiGarmentCapture24({
      doc:document,active:true,
      schema:{types:{Tops:['T-shirt'],Bottoms:['Jeans'],Dresses:['Dress'],Outerwear:['Jacket'],Shoes:['Sneakers']}},
      getOwner:()=>audit.owner,getDb:()=>({name:'closet-current-user-'+audit.owner}),
      makeProof:async()=>({image:source,sourceSHA256:sourceSHA,
       originalPhoto:{image:source,sha256:sourceSHA,width:840,height:650},sourceHashVerified:true}),
      queued:async fn=>{audit.queued++;return fn();},
      refreshNative:async()=>{},onSaved:async()=>{audit.saved++;}
     });
     if(!module.active)throw Error('real review module failed to mount');
     const input=document.getElementById('outfitUpload');
     const content=Uint8Array.from(atob(source.slice(source.indexOf(',')+1)),c=>c.charCodeAt(0));
     const f=new File([content],'synthetic-shirt.jpg',{type:'image/jpeg'});
     Object.defineProperty(input,'files',{configurable:true,value:[f]});
     input.dispatchEvent(new Event('change',{bubbles:true}));
     return true;
    },{source,sourceSHA});
    assert.equal(started,true);
    await page.waitForFunction(()=>{
     const root=document.getElementById('multi24Research');
     return root?.dataset.priorityCount==='1'&&root?.dataset.additionalCount==='2';
    },null,{timeout:15000});
    const safety=await page.evaluate(()=>{
     const cards=[...document.querySelectorAll('article.multi24-card')];
     return {categories:cards.map(c=>c.querySelector('select').value),
      colors:cards.map(c=>c.querySelector('input[type=text]').value),
      allUnconfirmed:cards.every(c=>!c.querySelector('input[type=checkbox]').checked),
      allConfirmationDisabled:cards.every(c=>c.querySelector('input[type=checkbox]').disabled),
      noPersonCaption:cards[0].textContent.includes('No person was verified'),
      noWrites:window.__audit28.saved===0&&window.__audit28.queued===0};
    });
    assert.deepEqual(safety.categories,['Uncategorized','Uncategorized','Tops']);
    assert.deepEqual(safety.colors,['','','Blue']);
    assert.equal(safety.allUnconfirmed,true);
    assert.equal(safety.allConfirmationDisabled,true);
    assert.equal(safety.noPersonCaption,true);
    assert.equal(safety.noWrites,true);
    const state=await page.evaluate(source=>{
     const root=document.getElementById('multi24Research');
     const originalUnchanged=root.querySelector('.multi24-source')?.src===source;
     const order=[...root.querySelectorAll('article.multi24-card')].map(x=>x.dataset.reviewTier);
     const headings=[...root.querySelectorAll('h4.multi28-heading')].map(x=>x.textContent);
     const add=[...root.querySelectorAll('button')].find(x=>x.textContent==='Add missed piece');
     const save=[...root.querySelectorAll('button')].find(x=>x.textContent==='Save confirmed pieces together');
     const disabled=save.disabled;
     add.click();
     return {originalUnchanged,order,headings,disabled,
      newOrder:[...root.querySelectorAll('article.multi24-card')].map(x=>x.dataset.reviewTier),
      manual:Number(root.dataset.manualCount),
      saves:window.__audit28.saved,queued:window.__audit28.queued};
    },source);
    assert.equal(state.originalUnchanged,true);
    assert.deepEqual(state.order,['priority','additional','additional']);
    assert.deepEqual(state.newOrder,['priority','manual','additional','additional']);
    assert.equal(state.manual,1);
    assert.equal(state.disabled,true);
    assert.equal(state.saves,0);
    assert.equal(state.queued,0);
    assert.ok(state.headings.some(x=>x.includes('still unverified')));
    assert.ok(state.headings.some(x=>x.includes('Other unverified')));
    // Invoke the new *actual* opt-in native plain-background fallback after
    // the inherited simulated SegFormer suggestions and human manual add.
    const fallback=await page.evaluate(()=>{
     const root=document.getElementById('multi24Research');
     const control=[...root.querySelectorAll('button')].find(x=>
      x.textContent==='Suggest missed regions on a plain backdrop');
     if(!control)throw Error('Flatlay fallback control missing');
     const before=root.querySelectorAll('article.multi24-card').length;
     control.click();
     const cards=[...root.querySelectorAll('article.multi24-card')];
     const fallbackCards=cards.filter(x=>x.textContent.includes('Contrast-only suggestion'));
     const source=root.querySelector('.multi24-source').src;
     const save=[...root.querySelectorAll('button')].find(x=>x.textContent==='Save confirmed pieces together');
     return {before,after:cards.length,manual:Number(root.dataset.manualCount),
      fallbackCount:fallbackCards.length,sourceUnchanged:source===window.__reviewOriginal29,
      saveDisabled:save.disabled,status:root.querySelector('.multi24-status').textContent,
      noAutoSaves:window.__audit28.saved===0};
    });
    const rawProbe=await page.evaluate(async()=>{
     const {detectFlatlayFromImage29}=await import('/research/multi-garment-capture-01/flatlay-contrast-29.mjs');
     const img=new Image();img.src=window.__reviewOriginal29;await img.decode();
     return detectFlatlayFromImage29(img);
    });
    assert.ok(fallback.fallbackCount>=1,
     'solid neutral synthetic image must yield at least one manual-only background suggestion: '+JSON.stringify({fallback,probe:rawProbe}));
    assert.ok(fallback.after>fallback.before);
    assert.ok(fallback.manual>=2);
    assert.equal(fallback.saveDisabled,true);
    assert.equal(fallback.noAutoSaves,true);
    assert.ok(fallback.status.includes('nothing was auto-saved'));
    const validated=await page.evaluate(()=>{
     const root=document.getElementById('multi24Research');
     const key='seg-4-10-10-80-80-1';
     const find=()=>[...root.querySelectorAll('article.multi24-card')].find(x=>x.dataset.pieceKey===key);
     const initial=find().querySelector('input[type=checkbox]').disabled;
     let card=find(),cat=card.querySelector('select');
     cat.value='Tops';cat.dispatchEvent(new Event('change',{bubbles:true}));
     card=find();const type=card.querySelectorAll('select')[1];
     type.value='T-shirt';type.dispatchEvent(new Event('change',{bubbles:true}));
     card=find();const color=card.querySelector('input[type=text]');
     color.value='Red';color.dispatchEvent(new Event('input',{bubbles:true}));
     card=find();const check=card.querySelector('input[type=checkbox]');
     const available=!check.disabled;
     check.checked=true;check.dispatchEvent(new Event('change',{bubbles:true}));
     const save=[...root.querySelectorAll('button')].find(x=>x.textContent==='Save confirmed pieces together');
     return {initial,available,confirmed:check.checked,saveEnabled:!save.disabled,
      otherRowsUncategorized:[...root.querySelectorAll('article.multi24-card')].some(x=>
       x.dataset.pieceKey==='seg-4-10-10-80-80-2'&&x.querySelector('select').value==='Uncategorized'),
      noWrites:window.__audit28.saved===0&&window.__audit28.queued===0};
    });
    assert.deepEqual(validated,{initial:true,available:true,confirmed:true,
     saveEnabled:true,otherRowsUncategorized:true,noWrites:true});
    const filename=engine+'-'+width+'.png';
    const img=await page.screenshot({path:out+'/'+filename,fullPage:true});
    const info=await sharp(img).metadata();
    assert.equal(info.format,'png');assert.equal(info.width,width);
    assert.ok(info.height>600&&img.length>9000);
    await page.evaluate(()=>{
     window.__audit28.owner='new-owner';
     window.dispatchEvent(new Event('closet:alpha-session-changed'));
    });
    assert.deepEqual(await page.evaluate(()=>{
     const root=document.getElementById('multi24Research');
     return [root.querySelectorAll('article.multi24-card').length,
      root.querySelector('.multi24-source').getAttribute('src')];
    }),[0,null]);
    cases.push({engine,width,filename,sha256:digest(img),
     flatlayManualFallbackCount:fallback.fallbackCount,
     initialSceneDefaultsVerified:true,explicitCategoryTypeColorRequired:true,
     sourceSHA256:sourceSHA,originalUnchanged:true,
     priority:1,manual:1,additional:2,
     allUnconfirmed:true,noAutosaves:true,ownerSwitchClears:true});
    await ctx.close();
   }
  }finally{await browser.close();}
 }
 assert.equal(blocked.length,0,'unexpected external upload/request');
 assert.equal(errors.length,0,'browser JS errors');
 assert.equal(cases.length,6);
 const report={priority:'SCENE-CLASS-TRUST-32',realBrowsers:2,actualUiCases:6,
  fixture:'synthetic JPEG, fake model proposals; separate real SegFormer frozen-score audit',
  sourceSHA256:sourceSHA,originalUnchanged:true,
  allProposalsRetained:true,noAutoSave:true,accountSwitchClears:true,
  noPersonModelClassAndColorNeverPrefilled:true,
  explicitHumanCategoryTypeColorEnabledConfirmation:true,
  browserErrors:errors,unexpectedRequests:blocked,segmentationModelActuallyRun:false,
  FamilyAlpha:'HOLD',cases};
 await writeFile(out+'/browser.json',JSON.stringify(report,null,2)+'\n');
 console.log('SCENE-CLASS-32 ACTUAL ORIGINAL REVIEW UI '+JSON.stringify({
  realBrowserCases:6,sourceHashVerified:true,
  priority:1,additional:2,manual:1,autoSaves:0,
  accountSwitchSafe:true,externalRequests:0,FamilyAlpha:'HOLD'}));
}finally{await new Promise(done=>server.close(done));}
