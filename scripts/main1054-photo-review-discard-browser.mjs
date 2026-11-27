import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium, webkit} from 'playwright';

const [engine, appPath = 'public/app.js', mode = 'candidate'] = process.argv.slice(2);
assert.ok(engine === 'chromium' || engine === 'webkit');
const app = await readFile(appPath, 'utf8');
const start = app.indexOf('function adjustPhoto(');
const end = app.indexOf('\nfunction renderRecognitionNotice(', start);
assert.ok(start >= 0 && end > start);
const editor = app.slice(start, end);

const fixture = () => {
  const photo = {id: 'owner-photo', name: 'Original', image: 'original-jpeg-fixture'};
  Object.assign(window, {
    stream: null, cameraOpening: false, batch: [photo], items: [],
    reviewedSave120Active: false, localPending: new Map(), submissions: [], removed: 0,
    photoEditorSessionLease: () => ({assertCurrent() {}, current: () => true}),
    mountPendingIdentitySuggestion() {},
    render() {}, scheduleMemoryReview() {}, message(text) { window.lastMessage = text; },
    sessionCapturedIds: new Set(), failedDraftCaptures: new Set(),
    refreshOutfitsAfterGarmentDeletion: async () => {},
    persistDraft() { return window.beginRemoval(); },
    removeItem() { return window.beginRemoval(); },
    beginRemoval() {
      window.removed += 1;
      return new Promise((resolve,reject) => {
        window.completeRemoval=resolve;
        window.failRemoval=()=>reject(new Error('fixture removal rejected'));
      });
    }
  });
  window.node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text != null) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  window.clothingFields = (form, draft, onChange=()=>{}) => {
    const label = node('label', 'Item name');
    const input = node('input');
    input.value = draft.name;
    input.oninput = () => { draft.name = input.value; };
    label.append(input);
    form.append(label);
    const suggestion=node('button','Use suggested details');suggestion.type='button';
    suggestion.onclick=()=>{draft.name='Suggested review';input.value=draft.name;onChange();};
    form.append(suggestion);
    return () => ({...draft});
  };
  window.savePiece = (value) => {
    window.submissions.push(value);
    return new Promise((resolve, reject) => {
      window.completeSave = resolve;
      window.failSave = () => reject(new Error('fixture write rejected'));
    });
  };
};




const browser=await ({chromium,webkit}[engine]).launch();
try{
 for(const width of [320,390,430]) for(const saved of [false,true]) for(const action of ['cancel','escape','suggestion']){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
  let prompts=[],settlements=[],discard=false;
  page.on('dialog',d=>{
   prompts.push({type:d.type(),message:d.message()});
   const settlement=discard?d.accept():d.dismiss();
   settlements.push(settlement);
   // Surface rejection through the awaited close operation, not an
   // unhandled async event listener during browser teardown.
   void settlement.catch(()=>{});
  });
  await page.setContent('<main>Photo results</main>');
  await page.evaluate(fixture);
  await page.addScriptTag({content:editor});
  await page.evaluate(saved=>{if(saved){items=[batch[0]];batch=[];}},saved);
  const open=()=>page.evaluate(saved=>adjustPhoto(saved?items[0]:batch[0]),saved);
  const dialog=page.locator('dialog'),field=dialog.locator('input');
  const close=()=>action==='escape'?page.keyboard.press('Escape'):dialog.getByRole('button',{name:'Cancel',exact:true}).click();
  const closeDirty=async()=>{
   const seen=page.waitForEvent('dialog',{timeout:10000});
   await Promise.all([seen,close()]);
   await Promise.all(settlements);
   // Escape can return before WebKit completes the native cancel handler.
   await page.evaluate(()=>true);
  };
  await open();
  await close();
  await dialog.waitFor({state:'detached'});
  assert.equal(prompts.length,0,'untouched review must close without a prompt');
  await open();
  if(action==='suggestion')await dialog.getByRole('button',{name:'Use suggested details'}).click();
  else await field.fill('Unsubmitted review');
  const name=action==='suggestion'?'Suggested review':'Unsubmitted review';
  if(mode==='baseline')await close();else await closeDirty();
  if(mode==='baseline'){
   await dialog.waitFor({state:'detached'});
   assert.equal(prompts.length,0);
   assert.deepEqual(await page.evaluate(()=>[submissions.length,removed]),[0,0]);
   console.log('PHOTO_REVIEW_DISCARD_RED',engine,width,saved,action);
   await page.close();continue;
  }
  assert.deepEqual(prompts,[{type:'confirm',message:'Discard your unsaved clothing changes?'}]);
  assert.equal(await dialog.evaluate(n=>n.open),true);
  assert.equal(await field.inputValue(),name);
  assert.deepEqual(await page.evaluate(()=>[submissions.length,removed]),[0,0]);
  discard=true;
  await closeDirty();
  await dialog.waitFor({state:'detached'});
  assert.equal(prompts.length,2);
  assert.deepEqual(await page.evaluate(saved=>({name:(saved?items[0]:batch[0]).name,submissions:submissions.length,removed}),saved),{name:'Original',submissions:0,removed:0});
  await page.close();
  console.log('PHOTO_REVIEW_DISCARD_GREEN',engine,width,saved,action);
 }
}finally{await browser.close();}
