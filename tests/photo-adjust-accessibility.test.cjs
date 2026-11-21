const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const adjustPhoto = app.slice(app.indexOf('function adjustPhoto('), app.indexOf('function renderRecognitionNotice('));

test('photo review announces its purpose and requires explicit save', () => {
 const element = (tag, text) => ({
  tag, text, children: [], attributes: {},
  append(...children) { this.children.push(...children); },
  setAttribute(name, value) { this.attributes[name] = value; },
  showModal() { this.open = true; },
  close() { this.open = false; this.onclose(); },
  remove() { this.removed = true; },
 });
 const body = element('body');
 const item = {id:'fixture', image:'synthetic-photo', name:'Blue shirt'};
 let saves = 0;
 const context = vm.createContext({
  stream:null, cameraOpening:false, document:{body, createElement:element},
  node:element, structuredClone, clothingFields:(_, draft)=>()=>draft,
  localPending:new Set(), batch:[item], savePiece:()=>{saves++;},
 });
 vm.runInContext(adjustPhoto + '\nadjustPhoto(batch[0]);', context);
 const [dialog] = body.children;
 assert.equal(dialog.open, true);
 assert.equal(dialog.attributes['aria-label'], 'Adjust clothing photo');
 assert.equal(saves, 0);
 const actions = dialog.children[0].children.at(-1);
 const cancel = actions.children.find(child=>child.text==='Cancel');
 assert.equal(cancel.type, 'button');
 cancel.onclick();
 assert.equal(dialog.removed, true);
 assert.equal(saves, 0);
 assert.equal(item.image, 'synthetic-photo');
});
