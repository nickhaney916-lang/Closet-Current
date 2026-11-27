import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium, webkit} from 'playwright';

const [engine = 'chromium', appPath = 'public/app.js'] = process.argv.slice(2);
const app = await readFile(appPath, 'utf8');
const start = app.indexOf('function openSavedClothingEditor(');
const end = app.indexOf('\nfunction render(){', start);
assert.ok(start >= 0 && end > start);
const editor = app.slice(start, end);

// Keep the actual dialog and submit code. A delayed storage double makes
// both settlement paths controllable without a real account or network.
const fixture = () => {
  const item = {id: 'fixture', name: 'Original', category: 'Tops'};
  window.items = [item];
  window.ownerWardrobeMutationLease = () => ({assertLease() {}});
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
    const unavailable = node('button', 'Already unavailable');
    unavailable.type = 'button';
    unavailable.disabled = true;
    form.append(unavailable);
    return () => ({...draft});
  };
  window.nativeCorrection10Active = () => false;
  window.submissions = [];
  window.saveEditedGarment = (update) => {
    window.submissions.push(update);
    return new Promise((resolve, reject) => {
      window.finishSave = resolve;
      window.failSave = () => reject(new DOMException('fixture quota', 'QuotaExceededError'));
    });
  };
  window.render = window.message = window.scheduleMemoryReview = () => {};
};

const executablePath = process.env.CC_BROWSER_EXECUTABLE || undefined;
const browser = await ({chromium, webkit}[engine]).launch({headless: true, executablePath});
try {
  for (const width of [320, 390, 430]) {
    const page = await browser.newPage({viewport: {width, height: 844}, isMobile: true, hasTouch: true});
    await page.setContent('<button type="button">Edit garment</button>');
    await page.evaluate(fixture);
    await page.addScriptTag({content: editor});
    await page.evaluate(() => openSavedClothingEditor(items[0], {returnFocus: () => document.querySelector('body > button').focus()}));
    const dialog = page.locator('dialog');
    const save = page.getByRole('button', {name: 'Save changes'});
    const field = page.getByLabel('Item name');
    await field.fill('First edit');
    await save.click();
    await page.waitForFunction(() => submissions.length === 1);
    assert.equal(await dialog.getByRole('status').textContent(), 'Saving changes…');
    assert.equal(await field.evaluate(input => {
      input.focus();
      return document.activeElement === input;
    }), false, 'A pending save must prevent new typing into the already-submitted form');
    await page.keyboard.type('Unexpected');
    assert.equal(await field.inputValue(), 'First edit');
    await page.evaluate(() => failSave());
    await page.waitForFunction(() => !document.querySelector('dialog button.primary').disabled);
    assert.match(await dialog.getByRole('status').textContent(), /Storage is full/);
    assert.equal(await field.inputValue(), 'First edit');
    assert.equal(await page.getByRole('button', {name: 'Already unavailable'}).isDisabled(), true);
    await field.fill('Retried edit');
    await save.click();
    await page.waitForFunction(() => submissions.length === 2);
    await page.evaluate(() => finishSave());
    await dialog.waitFor({state: 'detached'});
    assert.deepEqual(await page.evaluate(() => submissions.map(update => update.name)), ['First edit', 'Retried edit']);
    assert.equal(await page.evaluate(() => items[0].name), 'Retried edit');
    await page.waitForFunction(() => document.activeElement === document.querySelector('body > button'));
    await page.close();
    console.log('SAVED_CLOTHING_PENDING_EDIT_PASS', engine, width);
  }
} finally {
  await browser.close();
}
