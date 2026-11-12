/**
 * P839 real browser DOM acceptance of ACTUAL app.js Adjust editor code with
 * synthetic in-memory fixtures. This does not represent real ML accuracy.
 */
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile('public/app.js','utf8');
const taxonomy=await readFile('public/taxonomy.js','utf8');
const details=await readFile('public/clothing-details.js','utf8');
const between=(start,end)=>{
 const i=app.indexOf(start),j=app.indexOf(end,i+1);
 if(i<0||j<=i)throw Error('P839 actual source boundary missing: '+start);
 return app.slice(i,j);
};
const source=between('function node(', 'function cropClothingPhoto(')+
 between('function adjustPhoto(', 'function renderRecognitionNotice(');
const harness="\nconst categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];\nlet items=[],batch=[],stream=null,cameraOpening=false;\nconst localPending=new Set(),sessionCapturedIds=new Set();\nwindow.savedCount=0;window.savedValue=null;window.lastMessage='';\nconst checkPhoto=async()=>({colorEstimate:null});\nconst savePiece=async(value,nextBatch)=>{window.savedCount++;window.savedValue=value;window.savedDraftCount=nextBatch.length;};\nconst removeItem=async()=>{};\nconst persistDraft=async()=>{};\nconst render=()=>{};\nconst scheduleMemoryReview=()=>{};\nconst stopCamera=()=>{};\nconst queueAutomatic=()=>{};\nconst message=text=>window.lastMessage=text;\nfunction fixture({category='Tops',color='Blue',itemType='Unknown',requiresOwnershipConfirmation=false,outfitSourceId=null,withRisk=false}={}){\n for(const old of document.querySelectorAll('dialog'))old.remove();\n const value={id:'fake-id',image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==',\n  name:'Review test piece',category,itemType,color,colorSource:'photo-estimate',\n  pattern:'Unknown',sleeveLength:'Unknown',fit:'Unknown',seasons:[],\n  userAdjusted:false,requiresOwnershipConfirmation,\n  ...(outfitSourceId?{outfitSourceId}:{}),\n  ...(withRisk?{recognitionDiagnostics:{mission1SubtypeSafety:{ownerSubtypeReviewRequired:true}}}:{})};\n batch=[value];items=[];window.savedCount=0;window.savedValue=null;window.lastMessage='';\n adjustPhoto(value);\n}\n";
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--no-sandbox']}:{})});
 try{
  for(const width of [320,390,430]){
   const page=await browser.newPage({viewport:{width,height:850},isMobile:true,hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.setContent('<!doctype html><html><body><main id="root"></main></body></html>');
   for(const input of [taxonomy,details,harness,source])await page.addScriptTag({content:input});
   await page.evaluate(()=>fixture({requiresOwnershipConfirmation:true}));
   const checkbox=page.getByRole('checkbox',{name:/I checked the clothing photo/});
   const save=page.getByRole('button',{name:'Save changes'});
   assert.equal(await checkbox.count(),1,name+' '+width+' risk acknowledgement');
   assert.equal(await save.isDisabled(),true);
   await page.locator('dialog form').evaluate(form=>form.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true})));
   assert.equal(await page.evaluate(()=>window.savedCount),0,'scripted submit bypass stopped');
   await checkbox.check();assert.equal(await save.isEnabled(),true);
   await page.getByLabel('Color',{exact:true}).fill('Green');
   assert.equal(await checkbox.isChecked(),false,'editing voids old approval');
   assert.equal(await save.isDisabled(),true);
   await checkbox.check();await save.click();
   await page.waitForFunction(()=>window.savedCount===1);
   assert.equal(await page.evaluate(()=>window.savedValue.color),'Green');
   assert.equal(await page.evaluate(()=>window.savedValue.requiresOwnershipConfirmation),false);
   assert.equal(await page.evaluate(()=>batch.length),0);

   await page.evaluate(()=>fixture({category:'Uncategorized',color:'',outfitSourceId:'whole-outfit'}));
   const splitBox=page.getByRole('checkbox',{name:/I checked the clothing photo/});
   assert.equal(await splitBox.count(),1,'outfit check');
   await splitBox.check();assert.equal(await save.isDisabled(),true,'missing category/color');
   await page.getByLabel('Main category').selectOption('Dresses');
   await page.getByLabel('Color',{exact:true}).fill('Purple');
   assert.equal(await splitBox.isChecked(),false);
   await splitBox.check();assert.equal(await save.isEnabled(),true);
   await save.click();await page.waitForFunction(()=>window.savedCount===1);
   assert.equal(await page.evaluate(()=>window.savedValue.category),'Dresses');
   assert.equal(await page.evaluate(()=>window.savedValue.color),'Purple');

   await page.evaluate(()=>fixture({withRisk:true}));
   assert.equal(await page.getByRole('checkbox',{name:/I checked the clothing photo/}).count(),1,
    'risk diagnostics mandate review even if item flag missing');
   await page.getByRole('button',{name:'Cancel'}).click();

   await page.evaluate(()=>fixture({itemType:'T-shirt'}));
   assert.equal(await page.getByRole('checkbox',{name:/I checked the clothing photo/}).count(),0,'legacy unchanged');
   assert.equal(await save.isEnabled(),true);
   await save.click();await page.waitForFunction(()=>window.savedCount===1);
   assert.deepEqual(errors,[],name+' '+width+' browser errors');
   console.log('M1_P839_BROWSER_EDITOR_CONFIRMED',JSON.stringify({
    browser:name,width,unapprovedSaveRejected:true,editRevokesApproval:true,
    outfitCategoryColorRequired:true,legacyUnchanged:true,pageErrors:0}));
   await page.close();
  }
 }finally{await browser.close();}
}
