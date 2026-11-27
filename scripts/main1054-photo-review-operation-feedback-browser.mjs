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
  window.clothingFields = (form, draft) => {
    const label = node('label', 'Item name');
    const input = node('input');
    input.value = draft.name;
    input.oninput = () => { draft.name = input.value; };
    label.append(input);
    form.append(label);
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



const browser = await ({chromium,webkit}[engine]).launch();
try {
 for(const width of [320,390,430]) for(const operation of ['save','remove-draft','remove-saved']){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
  page.on('dialog',d=>d.accept());
  await page.setContent('<main>Photo results</main>');
  await page.evaluate(fixture);
  await page.addScriptTag({content:editor});
  await page.evaluate(operation=>{
   const photo=batch[0];if(operation==='remove-saved'){items=[photo];batch=[];}adjustPhoto(photo);
  },operation);
  const dialog=page.locator('dialog'),field=dialog.locator('input');
  const status=dialog.getByRole('status'),saving=operation==='save';
  const action=dialog.getByRole('button',{name:saving?'Save changes':'Remove photo'});
  await field.fill('Unsubmitted review');
  await action.click();
  await page.waitForFunction(saving=>saving?submissions.length===1:removed===1,saving);
  if(mode==='baseline'){
   assert.equal(await status.count(),0);
   console.log('PHOTO_OPERATION_FEEDBACK_RED',engine,width,operation);
   await page.close();continue;
  }
  assert.equal(await status.textContent(),saving?'Saving changes…':'Removing photo…');
  assert.equal(await status.isVisible(),true);
  assert.equal(await status.evaluate(n=>!!n.closest('[inert]')),false);
  assert.equal(await status.getAttribute('aria-live'),'polite');
  await page.evaluate(saving=>saving?failSave():failRemoval(),saving);
  await page.waitForFunction(()=>!!window.lastMessage);
  assert.equal(await status.textContent(),await page.evaluate(()=>lastMessage));
  assert.equal(await status.isVisible(),true);
  assert.equal(await field.inputValue(),'Unsubmitted review');
  await action.click();
  await page.waitForFunction(saving=>saving?submissions.length===2:removed===2,saving);
  assert.equal(await status.textContent(),saving?'Saving changes…':'Removing photo…');
  await page.evaluate(saving=>saving?completeSave():completeRemoval(),saving);
  await dialog.waitFor({state:'detached'});
  assert.deepEqual(await page.evaluate(()=>[items.length,batch.length]),saving?[1,0]:[0,0]);
  await page.close();
  console.log('PHOTO_OPERATION_FEEDBACK_GREEN',engine,width,operation);
 }
}finally{await browser.close();}
