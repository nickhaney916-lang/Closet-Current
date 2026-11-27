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


const browser = await ({chromium, webkit}[engine]).launch();
try {
  for (const width of [320,390,430]) for (const saved of [false,true]) {
    const page = await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
    page.on('dialog',d=>d.accept());
    await page.setContent('<main>Photo results</main>');
    await page.evaluate(fixture);
    await page.addScriptTag({content:editor});
    await page.evaluate(saved=>{
      const photo=batch[0];
      if(saved){items=[photo];batch=[];}
      adjustPhoto(photo);
    },saved);
    const dialog=page.locator('dialog'), field=dialog.locator('input');
    const remove=dialog.getByRole('button',{name:'Remove photo'});
    await field.fill('Unsubmitted review');
    await remove.click();
    await page.waitForFunction(()=>removed===1);
    const focus=await field.evaluate(input=>{input.focus();return document.activeElement===input;});
    await dialog.evaluate(node=>{
      const button=[...node.querySelectorAll('button')].find(b=>b.textContent==='Remove photo');
      void button.onclick();
    });
    if(mode==='baseline'){
      assert.equal(focus,true);
      await page.waitForFunction(()=>removed===2);
      await page.keyboard.press('Escape');
      await dialog.waitFor({state:'detached'});
      console.log('REMOVE_PENDING_RED_REPRODUCED',engine,width,saved);
      await page.close();continue;
    }
    assert.equal(focus,false);
    assert.equal(await page.evaluate(()=>removed),1);
    await dialog.evaluate(node=>{
      [...node.querySelectorAll('button')].find(b=>b.textContent==='Cancel').click();
      void node.querySelector('form').onsubmit(new Event('submit',{cancelable:true}));
    });
    await page.keyboard.press('Escape');
    assert.equal(await dialog.evaluate(n=>n.open),true);
    assert.deepEqual(await page.evaluate(()=>[removed,submissions.length]),[1,0]);
    await page.evaluate(()=>failRemoval());
    await page.waitForFunction(()=>window.lastMessage?.includes('could not be removed'));
    assert.equal(await field.inputValue(),'Unsubmitted review');
    assert.equal(await dialog.locator('button.primary').isEnabled(),true);
    await remove.click();
    await page.waitForFunction(()=>removed===2);
    await page.evaluate(()=>completeRemoval());
    await dialog.waitFor({state:'detached'});
    assert.deepEqual(await page.evaluate(()=>[items.length,batch.length,submissions.length,removed]),[0,0,0,2]);
    await page.close();
    console.log('REMOVE_PENDING_GREEN',engine,width,saved);
  }
} finally {await browser.close();}
