// Synthetic classifier responses test customer state and actual IndexedDB/UI.
// No model inference, human labels, live accounts, or physical phones.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname,
   file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));
  if(!file.startsWith(root+'/'))throw Error('Unsafe path');
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));

try{
 for(const [name,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox']}:{})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
    "window.closetAuth={user:{id:'recognition-owner-a'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
   await context.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',body:
    "window.closetCloud={beforeWrite:async()=>{},changed(){},start(){}};"}));
   await context.route('https://**',route=>route.abort('internetdisconnected'));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.evaluate(()=>closetReady);
   await page.evaluate(()=>{
    queueAutomatic=()=>{};scheduleMemoryReview=()=>{};localReady=true;
    const image=document.createElement('canvas');image.width=3072;image.height=2304;
    const ctx=image.getContext('2d');ctx.fillStyle='#ddd';ctx.fillRect(0,0,3072,2304);
    ctx.fillStyle='#2483ab';ctx.fillRect(450,200,1800,1800);
    window.testOriginal=image.toDataURL('image/jpeg',.94);
    checkPhoto=async()=>({blank:false,signature:[2,4,6],aspect:1});
   });
   const cases=[['Shoes','Sneakers','Shoes','Ankle boots','Brown'],
    ['Shoes','Tall boots','Shoes','Sneakers','Multicolor'],
    ['Dresses','Casual dress','Bottoms','Skirt','Blue'],
    ['Bottoms','Skirt','Dresses','Casual dress','Red'],
    ['Bottoms','Shorts','Bottoms','Skirt','Green'],
    ['Bottoms','Skirt','Bottoms','Shorts','Black'],
    ['Tops','Button-down shirt','Outerwear','Jacket','Beige'],
    ['Outerwear','Jacket','Outerwear','Coat','Gray']];
   for(const [index,entry] of cases.entries()){
    const check=await page.evaluate(async({index,entry})=>{
     const [category,itemType,newCategory,newType]=entry;
     batch=[];items=[];window.target=normalizeClothing({id:'case-'+index,name:'',category,itemType,color:'',image:testOriginal});
     batch.push(target);localRequest=async(_,image)=>{
      if(image!==testOriginal)throw Error('Wrong recognition source');
      return {strong:true,choices:[{category:newCategory,itemType:newType,label:'a '+newType}],details:{color:'Purple'}};
     };
     await recognizeItem(target);await writes;
     const blocked=target.recognitionReviewRequired&&!canConfirmReviewedColor(target)&&!items.length;
     switchView('review');adjustPhoto(target);return {blocked,originalKept:target.image===testOriginal};
    },{index,entry});
    assert.deepEqual(check,{blocked:true,originalKept:true});
    const editor=page.locator('dialog.clothing-editor');
    await editor.getByLabel('Main category',{exact:true}).selectOption(entry[2]);
    await editor.getByLabel('Item type',{exact:true}).selectOption(entry[3]);
    await editor.getByLabel('Color',{exact:true}).fill(entry[4]);
    await editor.getByRole('button',{name:'Save changes',exact:true}).click();
    await editor.waitFor({state:'detached'});
    const saved=await page.evaluate(async id=>{
     await writes;const record=(await readAll()).find(x=>x.id===id);
     return {category:record.category,itemType:record.itemType,color:record.color,colorSource:record.colorSource,
      sourceKept:record.image===testOriginal,owner:db.name,reviewRequired:record.recognitionReviewRequired};
    },'case-'+index);
    assert.deepEqual(saved,{category:entry[2],itemType:entry[3],color:entry[4],colorSource:'user',
     sourceKept:true,owner:'closet-current-user-recognition-owner-a',reviewRequired:false});
   }
   const uncertain=await page.evaluate(async()=>{
    items=[];batch=[];target=normalizeClothing({id:'uncertain',name:'',category:'Shoes',itemType:'Sneakers',color:'',image:testOriginal});batch.push(target);
    localRequest=async()=>({strong:false,choices:[],reason:'views_disagree'});
    await recognizeItem(target);
    const held=target.recognitionReviewRequired&&!canConfirmReviewedColor(target)&&!(await confirmReviewedColor(target,'Brown'));
    localRequest=async()=>{throw Error('Recognition timed out. Your photos are kept.');};
    await recognizeItem(target);const timeoutKept=target.scanFailed&&target.image===testOriginal;
    recognitionUnavailable=false;localRequest=async()=>({strong:true,choices:[{category:'Shoes',itemType:'Sneakers',label:'a sneaker'}],details:{color:'Multicolor'}});
    await recognizeItem(target);await writes;
    const saved=(await readAll()).find(x=>x.id==='uncertain');
    return {held,timeoutKept,retried:saved?.itemType==='Sneakers'&&saved.color==='Multicolor',duplicateSkipped:candidate(testOriginal)===false};
   });
   assert.deepEqual(uncertain,{held:true,timeoutKept:true,retried:true,duplicateSkipped:true});
   await page.evaluate(()=>{
    target=items.find(x=>x.id==='uncertain');adjustPhoto(target);window.closetAuth.user.id='recognition-owner-b';
   });
   let editor=page.locator('dialog.clothing-editor');
   await editor.getByLabel('Color',{exact:true}).fill('Red');
   await editor.getByRole('button',{name:'Save changes',exact:true}).click();
   assert.equal(await editor.isVisible(),true);
   const isolation=await page.evaluate(async()=>{
    const old=(await readAll()).find(x=>x.id==='uncertain');
    let rejected=false;try{await savePiece({...old,color:'Red'},[]);}catch{rejected=true;}
    const kept=(await readAll()).find(x=>x.id==='uncertain');
    window.closetAuth.user.id='recognition-owner-a';
    return {rejected,oldColorKept:kept.color==='Multicolor'};
   });
   assert.deepEqual(isolation,{rejected:true,oldColorKept:true});
   await editor.getByRole('button',{name:'Cancel',exact:true}).click();
   await editor.waitFor({state:'detached'});
   await page.evaluate(()=>adjustPhoto(items.find(x=>x.id==='uncertain')));
   editor=page.locator('dialog.clothing-editor');await editor.getByLabel('Color',{exact:true}).fill('Blue');
   await editor.getByRole('button',{name:'Save changes',exact:true}).click();await editor.waitFor({state:'detached'});
   assert.equal(await page.evaluate(async()=>(await readAll()).find(x=>x.id==='uncertain').color),'Blue');
   assert.deepEqual(errors,[]);
   console.log(JSON.stringify({browser:name,syntheticCases:cases.length,staleTypesHeld:true,uncertainColorShortcutBlocked:true,
    correctedTypesAndColorsSaved:true,originalFullFramePreserved:true,failedRetryDuplicateRecovery:true,accountSwitchBlocked:true,
    originalOwnerRecovered:true,actualModelTested:false,physicalPhoneTested:false,humanAccuracy:null,pageErrors:0}));
   await context.close();
  }finally{await browser.close();}
 }
}finally{await new Promise(ok=>server.close(ok));}
