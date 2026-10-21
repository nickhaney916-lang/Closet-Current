// Verify native browser accessibility on real source snippets; simulated mobile input, not physical phones.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

const app=fs.readFileSync('public/app.js','utf8');
const html=fs.readFileSync('public/index.html','utf8');
const review=app.slice(app.indexOf('function adjustPhoto(item){'),app.indexOf('function renderRecognitionNotice(){'));
const editStart=app.indexOf("edit.onclick=()=>{const dialog=document.createElement('dialog')");
assert.ok(editStart>0,'Saved edit click handler not found');
const savedEditor=app.slice(editStart,app.indexOf(';del.onclick=async()=>',editStart)+1);
assert.ok(savedEditor.includes("dialog.setAttribute('aria-label','Adjust saved clothing details')"));
const bulk=html.match(/<select id="batchCategory"[^>]*>[\s\S]*?<\/select>/)?.[0];
const picker=html.match(/<dialog id="boardPicker"[\s\S]*?<\/dialog>/)?.[0];
assert.ok(bulk&&picker,'Verified real static controls not found');

const bootstrap=[
 "let stream=null,cameraOpening=false,batch=[],items=[],localPending=new Set();",
 "const sessionCapturedIds=new Set();",
 "function stopCamera(){}",
 "function message(){}",
 "function node(tag,text,style){const el=document.createElement(tag);if(text!=null)el.textContent=text;if(style)el.className=style;return el;}",
 "function clothingFields(form,item){const label=node('label','Item name');const input=node('input');input.value=item.name||'';label.append(input);form.append(label);return ()=>({name:input.value});}",
 "const item={id:'synthetic',name:'Example shoe',category:'Shoes',userAdjusted:false};",
 "const edit=document.createElement('button');edit.type='button';edit.textContent='Adjust details';document.body.append(edit);",
 "function render(){}function scheduleMemoryReview(){}",
 review,savedEditor
].join('\n');
const outcomes=[];
for(const [name,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('about:blank');
  await page.addScriptTag({content:bootstrap});
  await page.evaluate(({bulk,picker})=>{
   const box=document.createElement('div');box.innerHTML=bulk+picker;
   document.body.append(...box.childNodes);
  },{bulk,picker});
  assert.equal(await page.getByRole('combobox',{name:'Choose a category for unfinished photos'}).count(),1);
  const selectName=await page.getByRole('combobox',{name:'Choose a category for unfinished photos'}).getAttribute('aria-label');
  assert.equal(selectName,'Choose a category for unfinished photos');

  await page.evaluate(()=>adjustPhoto({...item}));
  const photoDialog=page.getByRole('dialog',{name:'Review clothing photo details'});
  assert.equal(await photoDialog.count(),1);
  assert.equal(await photoDialog.isVisible(),true);
  const hasFocus=await page.evaluate(()=>document.activeElement?.closest('dialog')?.classList.contains('photo-adjust')===true);
  assert.equal(hasFocus,true,'Native dialog must receive keyboard focus');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('dialog.photo-adjust'));
  assert.equal(await photoDialog.count(),0);

  await page.locator('button:has-text("Adjust details")').click();
  const savedDialog=page.getByRole('dialog',{name:'Adjust saved clothing details'});
  assert.equal(await savedDialog.count(),1);
  assert.equal(await savedDialog.isVisible(),true);
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('dialog.clothing-editor'));
  assert.equal(await savedDialog.count(),0);
  const returned=await page.evaluate(()=>document.activeElement?.textContent==='Adjust details');
  assert.equal(returned,true,'Closing should return focus to saved-item edit action');

  await page.evaluate(()=>document.getElementById('boardPicker').showModal());
  const board=page.getByRole('dialog',{name:'Choose from your closet'});
  assert.equal(await board.count(),1);
  assert.equal(await board.isVisible(),true);
  await page.keyboard.press('Escape');
  assert.equal(await board.isVisible(),false);
  assert.deepEqual(errors,[]);
  outcomes.push({browser:name,unnamedEditDialogs:0,unnamedOutfitPickers:0,
   categorizedSelectorHasAccessibleName:true,nativeEscapeClosePassed:true,
   modalFocusAndReturnPassed:true,customerWardrobeRead:false,
   physicalPhoneValidated:false});
  await context.close();
 }finally{await browser.close();}
}
console.log(JSON.stringify({status:'PASS',outcomes,realPhoneAccessibilityQA:false,realRecognitionAccuracy:null,productionApproved:false}));
