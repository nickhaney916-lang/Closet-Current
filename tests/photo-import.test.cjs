'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');

function createPhotoImportFixture() {
  // Each independently awaited Node test owns all its mutable review state.
  // Do not share VM globals, batches, messages, or session IDs between cases.
  const ctx = {
    sessionCapturedIds: new Set(),
    crypto: { randomUUID },
    busy: false,
    localReady: false,
    session: 0,
    items: [],
    batch: [],
    queueAutomatic() {},
    view: 'scan',
    stopCamera() {},
    controls() {},
    message(text) { ctx.messageText = text; },
    switchView(view) { ctx.view = view; },
    persistDraft() {},
    $: () => ({}),
    photoToJPEG: async file => {
      if (file.name === 'bad.heic') throw Error('decode');
      return 'data:image/jpeg;base64,' + file.name;
    },
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('public/taxonomy.js', 'utf8'), ctx);
  vm.runInContext(
    fs.readFileSync('public/photo-import.js', 'utf8')
      .split('async function readPhotoBatch')[1]
      .replace(/^\(files/, 'async function readPhotoBatch(files'),
    ctx,
  );
  const source = fs.readFileSync('public/app.js', 'utf8');
  vm.runInContext(
    source.slice(source.indexOf('function candidate('),
      source.indexOf('function queueAutomatic(')),
    ctx,
  );
  vm.runInContext(
    source.slice(source.indexOf('async function importClothingPhotos('),
      source.indexOf("$('clothingPhotos').onchange")),
    ctx,
  );
  return ctx;
}

test('separate imported photos get independent review records', async () => {
  const ctx = createPhotoImportFixture();
  await ctx.importClothingPhotos([
    { name: 'one.jpg', type: 'image/jpeg', size: 100 },
    { name: 'two.png', type: 'image/png', size: 200 },
  ]);
  assert.equal(ctx.batch.length, 2);
  assert.notEqual(ctx.batch[0].id, ctx.batch[1].id);
  assert.equal(ctx.view, 'review');
  assert.equal(ctx.batch[0].category, 'Uncategorized');
  assert.equal(ctx.busy, false);
  ctx.batch[0].category = 'Tops';
  assert.equal(ctx.batch[1].category, 'Uncategorized');
});

test('partial import failures preserve prior review records and show file limits', async () => {
  const ctx = createPhotoImportFixture();
  await ctx.importClothingPhotos([
    { name: 'one.jpg', type: 'image/jpeg', size: 100 },
  ]);
  assert.equal(ctx.batch.length, 1);
  const savedId = ctx.batch[0].id;
  ctx.batch[0].category = 'Tops';
  await ctx.importClothingPhotos([
    { name: 'bad.heic', type: 'image/heic', size: 100 },
    { name: 'three.jpg', type: 'image/jpeg', size: 200 },
    { name: 'large.png', type: 'image/png', size: 11000000 },
  ]);
  assert.equal(ctx.batch.length, 2);
  assert.equal(ctx.batch[0].id, savedId);
  assert.equal(ctx.batch[0].category, 'Tops');
  assert.notEqual(ctx.batch[1].id, savedId);
  assert.match(ctx.messageText, /could not open/);
  assert.match(ctx.messageText, /larger than 10 MB/);
  assert.equal(ctx.busy, false);
});
