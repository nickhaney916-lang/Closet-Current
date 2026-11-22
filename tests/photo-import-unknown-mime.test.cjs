'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const code = fs.readFileSync(path.join(__dirname, '../public/photo-import.js'), 'utf8');
function photoBatch() {
 const sandbox = {};
 vm.createContext(sandbox);
 vm.runInContext(code, sandbox, {filename: 'public/photo-import.js'});
 return sandbox.readPhotoBatch;
}
const file = (name, type = '', size = 120) => ({name, type, size});

test('blank MIME uses a literal image-extension dot, including phone HEIC', async () => {
 const inputs = [file('shirt.JPG'), file('family.png'), file('coat.HEIC'),
                 file('gloves.HeIf'), file('fabric.webp'), file('shoes.avif'),
                 file('flower.jpeg')];
 const decoded = [];
 const saved = [];
 const result = await photoBatch()(inputs, async input => {
   decoded.push(input.name); return 'decoded:' + input.name;
 }, async (image, input) => { saved.push([image, input.name]); return true; });
 assert.equal(result.added, inputs.length);
 assert.deepEqual(Array.from(result.results, r => r.status), inputs.map(() => 'added'));
 assert.deepEqual(decoded, inputs.map(f => f.name));
 assert.equal(saved.length, inputs.length);
 assert.deepEqual(Array.from(result.errors), []);
});

test('empty MIME still rejects unrecognized or spoofed names before decoding', async () => {
 const files = [file('notes.txt'), file('fake.png.exe'), file('photo.jpg/'),
                file('shirt.jpg', '', 10 * 1024 * 1024 + 1)];
 let decoded = 0;
 const result = await photoBatch()(files, async () => { decoded++; return 'fake'; }, async () => true);
 assert.equal(decoded, 0);
 assert.equal(result.added, 0);
 assert.deepEqual(Array.from(result.results, r => r.status), ['rejected','rejected','rejected','rejected']);
 assert.match(result.results[3].reason, /larger than 10 MB/);
});

test('real image MIME types remain accepted when filenames have no extension', async () => {
 const result = await photoBatch()([file('camera-roll', 'image/jpeg')],
                                   async () => 'jpeg', async () => true);
 assert.equal(result.added, 1);
 assert.equal(result.results[0].status, 'added');
});

test('decoder errors and duplicates do not silently add wardrobe images', async () => {
 const result = await photoBatch()([file('unreadable.heic'), file('already.jpg')],
   async input => {if (input.name === 'unreadable.heic') throw Error('decode rejected'); return 'jpeg';},
   async () => false);
 assert.equal(result.added, 0);
 assert.deepEqual(Array.from(result.results, r => r.status), ['error','duplicate']);
 assert.equal(result.errors.length, 1);
});
