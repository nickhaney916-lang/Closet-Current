const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const adjustPhoto = app.slice(app.indexOf('function adjustPhoto('), app.indexOf('function renderRecognitionNotice('));

function openEditor() {
  const item = { id: 'synthetic-photo', name: 'Blue shirt', requiresOwnershipConfirmation: true };
  const saved = [];
  function node(tag, text) {
    const attributes = new Map();
    return {
      tag, text, children: [],
      append(...children) { this.children.push(...children); },
      setAttribute(name, value) { attributes.set(name, value); },
      getAttribute(name) { return attributes.get(name); },
      showModal() { this.labelAtOpen = this.getAttribute('aria-label'); },
      close() { this.onclose(); },
      remove() {},
    };
  }
  const body = node('body');
  vm.runInNewContext(`${adjustPhoto}\nadjustPhoto(item)`, {
    document: { body, createElement: node },
    cameraOpening: false, stream: null, node, structuredClone,
    item, localPending: new Set(), batch: [item], items: [],
    clothingFields: (_form, draft) => () => draft,
    savePiece: async value => saved.push(value),
    persistDraft() {}, render() {}, scheduleMemoryReview() {},
  });
  const [dialog] = body.children;
  const [form] = dialog.children;
  return { dialog, form, item, saved };
}

test('Adjust opens a named photo review dialog', () => {
  const { dialog } = openEditor();
  assert.equal(dialog.tag, 'dialog');
  assert.equal(dialog.labelAtOpen, 'Adjust photo details');
});

test('opening and cancelling Adjust does not save the photo', () => {
  const { form, item, saved } = openEditor();
  const [, cancel] = form.children.at(-1).children;
  assert.equal(cancel.type, 'button');
  cancel.onclick();
  assert.equal(saved.length, 0);
  assert.equal(item.requiresOwnershipConfirmation, true);
});

test('submitting Adjust saves the reviewed photo', async () => {
  const { form, saved } = openEditor();
  await form.onsubmit({ preventDefault() {} });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].id, 'synthetic-photo');
  assert.equal(saved[0].requiresOwnershipConfirmation, false);
});
