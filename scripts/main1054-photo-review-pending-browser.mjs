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
    async persistDraft() { window.removed += 1; }
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
  for (const width of [320, 390, 430]) {
    const page = await browser.newPage({viewport: {width, height: 844}, isMobile: true, hasTouch: true});
    await page.setContent('<main>Photo results</main>');
    await page.evaluate(fixture);
    await page.addScriptTag({content: editor});
    await page.evaluate(() => adjustPhoto(batch[0]));
    const dialog = page.locator('dialog');
    const save = dialog.locator('button.primary');
    const field = dialog.locator('input');
    await field.fill('First review');
    await save.click();
    await page.waitForFunction(() => submissions.length === 1);
    const acceptsFocus = await field.evaluate(input => {
      input.focus();
      return document.activeElement === input;
    });
    await page.keyboard.press('Escape');
    if (mode === 'baseline') {
      assert.equal(acceptsFocus, true, 'accepted parent permits changes during the pending write');
      await dialog.waitFor({state: 'detached'});
      console.log('PHOTO_REVIEW_PENDING_BASELINE_REPRODUCED', engine, width);
      await page.close();
      continue;
    }
    assert.equal(acceptsFocus, false);
    assert.equal(await dialog.evaluate(node => node.open), true);
    await dialog.evaluate(async node => {
      const buttons = [...node.querySelectorAll('button')];
      buttons.find(button => button.textContent === 'Cancel').click();
      await buttons.find(button => button.textContent === 'Remove photo').onclick();
      await node.querySelector('form').onsubmit(new Event('submit', {cancelable: true}));
    });
    assert.equal(await dialog.evaluate(node => node.open), true);
    assert.deepEqual(await page.evaluate(() => [submissions.length, removed]), [1, 0]);
    assert.equal(await field.inputValue(), 'First review');
    await page.evaluate(() => failSave());
    await page.waitForFunction(() => window.lastMessage === 'Could not save changes. Try again.');
    assert.equal(await field.inputValue(), 'First review');
    await field.fill('Retried review');
    await save.click();
    await page.waitForFunction(() => submissions.length === 2);
    await page.evaluate(() => completeSave());
    await dialog.waitFor({state: 'detached'});
    assert.deepEqual(await page.evaluate(() => ({
      names: submissions.map(item => item.name), image: items[0].image,
      saved: items.length, drafts: batch.length, removed
    })), {names: ['First review', 'Retried review'], image: 'original-jpeg-fixture', saved: 1, drafts: 0, removed: 0});
    await page.close();
    console.log('PHOTO_REVIEW_PENDING_PASS', engine, width);
  }
} finally {
  await browser.close();
}
